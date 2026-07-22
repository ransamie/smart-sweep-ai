import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
export const SYSTEM_CATEGORIES = [
    {
        id: 'windows_temp',
        name: 'Windows Temporary Files',
        description: 'Temporary files created by the Windows operating system.',
        paths: [
            path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp')
        ]
    },
    {
        id: 'app_temp',
        name: 'Application Temporary Files',
        description: 'Temporary files created by applications you use.',
        paths: [
            os.tmpdir() // Typically %LOCALAPPDATA%\Temp
        ]
    },
    {
        id: 'windows_logs',
        name: 'Windows Log Files',
        description: 'System log files that can safely be removed.',
        paths: [
            path.join(process.env.SystemRoot || 'C:\\Windows', 'Logs'),
            path.join(process.env.SystemRoot || 'C:\\Windows', 'SoftwareDistribution', 'DataStore', 'Logs')
        ]
    },
    {
        id: 'crash_dumps',
        name: 'Windows Memory Dumps',
        description: 'Error reporting and crash dump files.',
        paths: [
            path.join(process.env.SystemRoot || 'C:\\Windows', 'Minidump'),
            path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'CrashDumps')
        ]
    }
];
// Helper to get size of directory recursively (safely)
async function getDirStats(dirPath) {
    let size = 0;
    let count = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    const sub = await getDirStats(fullPath);
                    size += sub.size;
                    count += sub.count;
                }
                else {
                    const stats = await fs.stat(fullPath);
                    size += stats.size;
                    count += 1;
                }
            }
            catch (e) {
                // Skip locked/unreadable files
            }
        }
    }
    catch (e) {
        // Skip unreadable directories
    }
    return { size, count };
}
export async function scanSystemJunk() {
    const results = [];
    for (const cat of SYSTEM_CATEGORIES) {
        let totalSize = 0;
        let fileCount = 0;
        for (const targetPath of cat.paths) {
            const stats = await getDirStats(targetPath);
            totalSize += stats.size;
            fileCount += stats.count;
        }
        results.push({
            categoryId: cat.id,
            fileCount,
            totalSize
        });
    }
    return results;
}
// Helper to safely delete contents of a directory without deleting the directory itself
async function deleteDirContents(dirPath) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    await fs.rm(fullPath, { recursive: true, force: true });
                }
                else {
                    await fs.unlink(fullPath);
                }
            }
            catch (e) {
                // Skip locked files (e.g. files currently in use)
            }
        }
    }
    catch (e) {
        // Ignore if directory doesn't exist or is unreadable
    }
}
export async function cleanSystemJunk(categoryIds) {
    const selectedCats = SYSTEM_CATEGORIES.filter(c => categoryIds.includes(c.id));
    for (const cat of selectedCats) {
        for (const targetPath of cat.paths) {
            await deleteDirContents(targetPath);
        }
    }
}
