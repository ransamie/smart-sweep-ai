import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
const QUARANTINE_DIR = path.join(os.homedir(), '.smartsweep_quarantine');
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
function getQuarantinePath(originalPath) {
    const hash = crypto.createHash('sha256').update(originalPath).digest('hex');
    return path.join(QUARANTINE_DIR, hash);
}
async function getItemSize(targetPath) {
    try {
        const stat = await fs.lstat(targetPath);
        if (!stat.isDirectory()) {
            return { size: stat.size, isDirectory: false };
        }
        let total = 0;
        const queue = [targetPath];
        while (queue.length > 0) {
            const current = queue.shift();
            try {
                const entries = await fs.readdir(current, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isSymbolicLink())
                        continue;
                    const full = path.join(current, entry.name);
                    if (entry.isDirectory()) {
                        queue.push(full);
                    }
                    else {
                        try {
                            const fStat = await fs.stat(full);
                            total += fStat.size;
                        }
                        catch {
                            // ignore inaccessible
                        }
                    }
                }
            }
            catch {
                // ignore unreadable dir
            }
        }
        return { size: total, isDirectory: true };
    }
    catch {
        return { size: 0, isDirectory: false };
    }
}
async function moveCrossDevice(src, dest) {
    try {
        await fs.rename(src, dest);
    }
    catch (err) {
        if (err?.code === 'EXDEV' || err?.code === 'EPERM') {
            const stat = await fs.lstat(src);
            if (stat.isDirectory()) {
                await fs.cp(src, dest, { recursive: true, force: true });
                await fs.rm(src, { recursive: true, force: true });
            }
            else {
                await fs.copyFile(src, dest);
                await fs.unlink(src);
            }
        }
        else {
            throw err;
        }
    }
}
export async function deleteFiles(paths) {
    await fs.mkdir(QUARANTINE_DIR, { recursive: true });
    let quarantined = 0;
    let failed = 0;
    const errors = [];
    for (const p of paths) {
        try {
            const qPath = getQuarantinePath(p);
            // Clear any previous stale entry with the same hash before moving
            await fs.rm(qPath, { recursive: true, force: true }).catch(() => { });
            const { size, isDirectory } = await getItemSize(p);
            await moveCrossDevice(p, qPath);
            const metaPath = qPath + '.meta.json';
            const meta = {
                originalPath: p,
                fileName: path.basename(p),
                size,
                isDirectory,
                quarantinedAt: Date.now(),
            };
            await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
            quarantined++;
        }
        catch (e) {
            failed++;
            errors.push({ path: p, error: e?.message || 'Failed to quarantine item' });
            console.error(`Failed to quarantine ${p}:`, e);
        }
    }
    return { quarantined, failed, errors };
}
export async function restoreFile(originalPath) {
    const qPath = getQuarantinePath(originalPath);
    try {
        await fs.mkdir(path.dirname(originalPath), { recursive: true });
        await moveCrossDevice(qPath, originalPath);
        try {
            await fs.unlink(qPath + '.meta.json');
        }
        catch {
            // ignore missing meta cleanup
        }
        return { success: true };
    }
    catch (e) {
        console.error(`Failed to restore ${originalPath}:`, e);
        return { success: false, error: e?.message || 'Failed to restore item from quarantine.' };
    }
}
export async function listQuarantinedFiles() {
    try {
        const entries = await fs.readdir(QUARANTINE_DIR, { withFileTypes: true });
        const now = Date.now();
        const items = [];
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith('.meta.json'))
                continue;
            const metaPath = path.join(QUARANTINE_DIR, entry.name);
            const id = entry.name.slice(0, -'.meta.json'.length);
            const qPath = path.join(QUARANTINE_DIR, id);
            try {
                await fs.access(qPath);
                const content = await fs.readFile(metaPath, 'utf-8');
                const meta = JSON.parse(content);
                if (!meta?.originalPath || !meta?.quarantinedAt)
                    continue;
                let size = typeof meta.size === 'number' ? meta.size : 0;
                let isDirectory = Boolean(meta.isDirectory);
                if (typeof meta.size !== 'number') {
                    const stats = await getItemSize(qPath);
                    size = stats.size;
                    isDirectory = stats.isDirectory;
                }
                const expiresAt = meta.quarantinedAt + FOURTEEN_DAYS_MS;
                const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));
                items.push({
                    id,
                    originalPath: meta.originalPath,
                    fileName: meta.fileName || path.basename(meta.originalPath),
                    size,
                    isDirectory,
                    quarantinedAt: meta.quarantinedAt,
                    expiresAt,
                    daysRemaining,
                });
            }
            catch {
                // Missing quarantined payload or corrupt metadata
            }
        }
        return items.sort((a, b) => b.quarantinedAt - a.quarantinedAt);
    }
    catch {
        return [];
    }
}
export async function deleteQuarantinedFile(originalPath) {
    const qPath = getQuarantinePath(originalPath);
    try {
        await fs.rm(qPath, { recursive: true, force: true });
        await fs.unlink(qPath + '.meta.json').catch(() => { });
        return { success: true };
    }
    catch (e) {
        console.error(`Failed to permanently delete quarantined item ${originalPath}:`, e);
        return { success: false, error: e?.message || 'Failed to delete quarantined item.' };
    }
}
export async function emptyQuarantine() {
    try {
        const entries = await fs.readdir(QUARANTINE_DIR, { withFileTypes: true });
        let deletedCount = 0;
        for (const entry of entries) {
            if (!entry.name.endsWith('.meta.json')) {
                deletedCount++;
            }
            await fs.rm(path.join(QUARANTINE_DIR, entry.name), { recursive: true, force: true });
        }
        return { success: true, deletedCount };
    }
    catch (err) {
        if (err?.code === 'ENOENT') {
            return { success: true, deletedCount: 0 };
        }
        return { success: false, deletedCount: 0, error: err?.message || 'Failed to empty quarantine.' };
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
        const fileEntries = entries.filter(e => !e.isDirectory() && !e.isSymbolicLink());
        const dirEntries = entries.filter(e => e.isDirectory() && !e.isSymbolicLink());
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
