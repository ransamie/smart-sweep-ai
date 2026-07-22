import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
const QUARANTINE_DIR = path.join(os.homedir(), '.smartsweep_quarantine');
function getQuarantinePath(originalPath) {
    const hash = crypto.createHash('sha256').update(originalPath).digest('hex');
    return path.join(QUARANTINE_DIR, hash);
}
export async function deleteFiles(paths) {
    await fs.mkdir(QUARANTINE_DIR, { recursive: true });
    for (const p of paths) {
        try {
            const qPath = getQuarantinePath(p);
            await fs.rename(p, qPath);
            // Save metadata to enable auto-delete and original path tracking
            const metaPath = qPath + '.meta.json';
            const meta = { originalPath: p, quarantinedAt: Date.now() };
            await fs.writeFile(metaPath, JSON.stringify(meta), 'utf-8');
        }
        catch (e) {
            console.error(`Failed to quarantine ${p}:`, e);
        }
    }
}
export async function restoreFile(originalPath) {
    const qPath = getQuarantinePath(originalPath);
    try {
        await fs.mkdir(path.dirname(originalPath), { recursive: true });
        await fs.rename(qPath, originalPath);
        // Clean up metadata
        try {
            await fs.unlink(qPath + '.meta.json');
        }
        catch (e) { }
    }
    catch (e) {
        console.error(`Failed to restore ${originalPath}:`, e);
    }
}
// Directories that waste time and contain no useful "user" files.
// Skipping these makes the scan dramatically faster.
const SKIP_DIRS = new Set([
    'windows',
    'system32',
    'syswow64',
    'winsxs',
    'servicing',
    'assembly',
    '$recycle.bin',
    '$windows.~bt',
    '$windows.~ws',
    'program files',
    'program files (x86)',
    'programdata',
    'node_modules',
    '.git',
    '.smartsweep_quarantine',
]);
export async function scanDirectory(dirPath, isBackground = false) {
    const results = [];
    // BFS queue of directories to visit
    const queue = [dirPath];
    // Max concurrency — number of directories explored simultaneously
    const CONCURRENCY = 16;
    async function processDir(currentPath) {
        let entries;
        try {
            entries = await fs.readdir(currentPath, { withFileTypes: true });
        }
        catch {
            return; // permission denied or other error — skip silently
        }
        // Separate files and dirs in this folder
        const fileEntries = entries.filter(e => !e.isDirectory());
        const dirEntries = entries.filter(e => e.isDirectory());
        // ── Stat all files in this folder concurrently ──────────────────────────
        const fileStats = await Promise.allSettled(fileEntries.map(async (entry) => {
            const fullPath = path.join(currentPath, entry.name);
            try {
                const stats = await fs.stat(fullPath);
                return {
                    path: fullPath,
                    name: entry.name,
                    size: stats.size,
                    isDirectory: false,
                    mtime: stats.mtime,
                    extension: path.extname(entry.name),
                };
            }
            catch {
                return null;
            }
        }));
        for (const r of fileStats) {
            if (r.status === 'fulfilled' && r.value) {
                results.push(r.value);
            }
        }
        // ── Add non-skipped subdirectories to the queue ──────────────────────────
        for (const dir of dirEntries) {
            if (SKIP_DIRS.has(dir.name.toLowerCase()))
                continue;
            queue.push(path.join(currentPath, dir.name));
        }
    }
    // ── Concurrent BFS worker pool ────────────────────────────────────────────
    async function worker() {
        while (queue.length > 0) {
            const dir = queue.shift();
            if (!dir)
                break;
            await processDir(dir);
            // Yield to event loop periodically in background mode
            if (isBackground) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    // Spin up CONCURRENCY workers and let them race through the BFS queue
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
    return results;
}
export function getFileSummary(files) {
    let totalSize = 0;
    const extensionCounts = {};
    for (const file of files) {
        if (!file.isDirectory) {
            totalSize += file.size;
            const ext = file.extension || 'none';
            extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
        }
    }
    return {
        totalFiles: files.length,
        totalSize,
        extensionCounts
    };
}
