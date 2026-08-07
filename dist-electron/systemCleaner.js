import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
/**
 * Returns system cleaner categories based on the current platform.
 */
export function getSystemCategories() {
    const platform = os.platform();
    const home = os.homedir();
    if (platform === 'darwin') {
        return [
            {
                id: 'recycle_bin',
                name: 'Trash',
                description: 'Files in your macOS Trash waiting to be emptied.',
                paths: [
                    path.join(home, '.Trash'),
                ],
            },
            {
                id: 'system_cache',
                name: 'System Cache Files',
                description: 'System-level cache files that can safely be removed.',
                paths: [
                    '/Library/Caches',
                ],
            },
            {
                id: 'user_cache',
                name: 'User Cache Files',
                description: 'Application cache files stored in your user directory.',
                paths: [
                    path.join(home, 'Library', 'Caches'),
                    path.join(home, 'Library', 'Logs'),
                ],
            },
            {
                id: 'app_temp',
                name: 'Application Temporary Files',
                description: 'Temporary files created by applications you use.',
                paths: [
                    os.tmpdir(),
                    path.join(home, 'Library', 'Application Support', 'tempo'),
                ],
            },
            {
                id: 'crash_dumps',
                name: 'Crash Reports & Dumps',
                description: 'Error reporting and crash dump files.',
                paths: [
                    path.join(home, 'Library', 'Application Support', 'CrashReporter'),
                    '/Library/Logs/DiagnosticReports',
                ],
            },
        ];
    }
    if (platform === 'linux') {
        return [
            {
                id: 'recycle_bin',
                name: 'Trash',
                description: 'Files in your Linux Trash waiting to be emptied.',
                paths: [
                    path.join(home, '.local', 'share', 'Trash', 'files'),
                ],
            },
            {
                id: 'system_cache',
                name: 'System Cache Files',
                description: 'System-level cache files that can safely be removed.',
                paths: [
                    '/var/cache',
                    '/var/tmp',
                ],
            },
            {
                id: 'user_cache',
                name: 'User Cache Files',
                description: 'Application cache files stored in your home directory.',
                paths: [
                    path.join(home, '.cache'),
                ],
            },
            {
                id: 'app_temp',
                name: 'Application Temporary Files',
                description: 'Temporary files created by applications you use.',
                paths: [
                    os.tmpdir(),
                ],
            },
            {
                id: 'system_logs',
                name: 'System Log Files',
                description: 'System log files that can safely be removed.',
                paths: [
                    '/var/log',
                ],
            },
        ];
    }
    // Windows (default)
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    const systemDrive = process.env.SystemDrive || 'C:';
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const programData = process.env.ProgramData || 'C:\\ProgramData';
    return [
        {
            id: 'recycle_bin',
            name: 'Recycle Bin',
            description: 'Files in your Recycle Bin waiting to be permanently deleted.',
            paths: [
                path.join(systemDrive, '$Recycle.Bin'),
            ],
        },
        {
            id: 'windows_update',
            name: 'Windows Update Cache',
            description: 'Downloaded installation files from past Windows updates.',
            paths: [
                path.join(systemRoot, 'SoftwareDistribution', 'Download'),
            ],
        },
        {
            id: 'system_temp',
            name: 'System Temporary Files',
            description: 'Temporary files created by Windows and system components.',
            paths: [
                path.join(systemRoot, 'Temp'),
                path.join(systemRoot, 'Prefetch'),
            ],
        },
        {
            id: 'app_temp',
            name: 'User & Application Temp Files',
            description: 'Temporary files created by installed apps and internet components.',
            paths: [
                os.tmpdir(), // Typically %LOCALAPPDATA%\Temp
                path.join(localAppData, 'Microsoft', 'Windows', 'INetCache'),
                path.join(localAppData, 'Microsoft', 'Windows', 'INetCookies'),
                path.join(localAppData, 'Microsoft', 'Windows', 'WebCache'),
            ],
        },
        {
            id: 'shader_cache',
            name: 'DirectX & GPU Shader Cache',
            description: 'Pre-compiled graphics shader caches for games and apps.',
            paths: [
                path.join(localAppData, 'D3DSCache'),
                path.join(localAppData, 'NVIDIA', 'DXCache'),
                path.join(localAppData, 'NVIDIA', 'GLCache'),
                path.join(localAppData, 'AMD', 'DxCache'),
                path.join(localAppData, 'Intel', 'ShaderCache'),
            ],
        },
        {
            id: 'system_logs',
            name: 'System Logs & Explorer Cache',
            description: 'Windows diagnostic logs and thumbnail caches.',
            paths: [
                path.join(systemRoot, 'Logs'),
                path.join(systemRoot, 'SoftwareDistribution', 'DataStore', 'Logs'),
                path.join(localAppData, 'Microsoft', 'Windows', 'Explorer'),
            ],
        },
        {
            id: 'crash_dumps',
            name: 'Crash Reports & Error Dumps',
            description: 'Windows error reports, minidumps, and crash data.',
            paths: [
                path.join(systemRoot, 'Minidump'),
                path.join(localAppData, 'CrashDumps'),
                path.join(programData, 'Microsoft', 'Windows', 'WER', 'ReportArchive'),
                path.join(programData, 'Microsoft', 'Windows', 'WER', 'ReportQueue'),
            ],
        },
    ];
}
// Re-export as const for backward compatibility with main.ts imports that reference it directly
export const SYSTEM_CATEGORIES = getSystemCategories();
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
                    try {
                        const stats = await fs.stat(fullPath);
                        size += stats.size;
                        count += 1;
                    }
                    catch (e) {
                        // File inaccessible, skip stats
                    }
                }
            }
            catch (e) {
                // Skip inaccessible entries
            }
        }
    }
    catch (e) {
        // Skip unreadable directories
    }
    return { size, count };
}
export async function scanSystemJunk() {
    const categories = getSystemCategories();
    const results = [];
    for (const cat of categories) {
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
    let deleted = 0;
    let failed = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                await fs.chmod(fullPath, 0o666).catch(() => { });
                if (entry.isDirectory()) {
                    await fs.rm(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
                }
                else {
                    await fs.unlink(fullPath);
                }
                deleted++;
            }
            catch (e) {
                try {
                    await fs.rm(fullPath, { recursive: true, force: true });
                    deleted++;
                }
                catch (err) {
                    failed++;
                }
            }
        }
    }
    catch (e) {
        // Ignore if directory doesn't exist or is unreadable
    }
    return { deleted, failed };
}
export async function cleanSystemJunk(categoryIds) {
    const categories = getSystemCategories();
    const selectedCats = categories.filter(c => categoryIds.includes(c.id));
    let totalDeleted = 0;
    let totalFailed = 0;
    for (const cat of selectedCats) {
        if (cat.id === 'recycle_bin' && os.platform() === 'win32') {
            try {
                await execFileAsync('powershell', ['-NoProfile', '-Command', 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue']);
            }
            catch (e) { }
        }
        for (const targetPath of cat.paths) {
            const res = await deleteDirContents(targetPath);
            totalDeleted += res.deleted;
            totalFailed += res.failed;
        }
    }
    return { totalDeleted, totalFailed };
}
