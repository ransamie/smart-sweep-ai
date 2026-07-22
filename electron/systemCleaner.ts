import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CleanerCategory {
  id: string;
  name: string;
  description: string;
  paths: string[];
}

export interface CleanerResult {
  categoryId: string;
  fileCount: number;
  totalSize: number;
}

/**
 * Returns system cleaner categories based on the current platform.
 */
export function getSystemCategories(): CleanerCategory[] {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'darwin') {
    return [
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
          '/var/log',  // only safe subdirectories are handled by the cleaner
        ],
      },
    ];
  }

  // Windows (default)
  return [
    {
      id: 'system_temp',
      name: 'System Temporary Files',
      description: 'Temporary files created by the operating system.',
      paths: [
        path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp'),
      ],
    },
    {
      id: 'app_temp',
      name: 'Application Temporary Files',
      description: 'Temporary files created by applications you use.',
      paths: [
        os.tmpdir(), // Typically %LOCALAPPDATA%\Temp
      ],
    },
    {
      id: 'system_logs',
      name: 'System Log Files',
      description: 'System log files that can safely be removed.',
      paths: [
        path.join(process.env.SystemRoot || 'C:\\Windows', 'Logs'),
        path.join(process.env.SystemRoot || 'C:\\Windows', 'SoftwareDistribution', 'DataStore', 'Logs'),
      ],
    },
    {
      id: 'crash_dumps',
      name: 'Crash Reports & Dumps',
      description: 'Error reporting and crash dump files.',
      paths: [
        path.join(process.env.SystemRoot || 'C:\\Windows', 'Minidump'),
        path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'CrashDumps'),
      ],
    },
  ];
}

// Re-export as const for backward compatibility with main.ts imports that reference it directly
export const SYSTEM_CATEGORIES: CleanerCategory[] = getSystemCategories();

// Helper to get size of directory recursively (safely)
async function getDirStats(dirPath: string): Promise<{ size: number, count: number }> {
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
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
          count += 1;
        }
      } catch (e) {
        // Skip locked/unreadable files
      }
    }
  } catch (e) {
    // Skip unreadable directories
  }
  return { size, count };
}

export async function scanSystemJunk(): Promise<CleanerResult[]> {
  const results: CleanerResult[] = [];

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
async function deleteDirContents(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      } catch (e) {
        // Skip locked files (e.g. files currently in use)
      }
    }
  } catch (e) {
    // Ignore if directory doesn't exist or is unreadable
  }
}

export async function cleanSystemJunk(categoryIds: string[]): Promise<void> {
  const selectedCats = SYSTEM_CATEGORIES.filter(c => categoryIds.includes(c.id));
  
  for (const cat of selectedCats) {
    for (const targetPath of cat.paths) {
      await deleteDirContents(targetPath);
    }
  }
}
