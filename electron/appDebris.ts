import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';
import { getInstalledApps, InstalledApp } from './registry.js';

export interface AppDebrisItem {
  id: string;
  folderName: string;
  folderPath: string;
  locationLabel: string;
  size: number;
  fileCount: number;
  lastModified: number;
}

// Strict protected OS / system / driver / runtime / core vendor allowlist.
// Folders matching these normalized names are NEVER flagged as orphaned debris.
const PROTECTED_FOLDERS = new Set([
  // Windows & Microsoft core
  'microsoft',
  'windows',
  'windowsapps',
  'windows defender',
  'windows defender advanced threat protection',
  'windows mail',
  'windows media player',
  'windows multimedia platform',
  'windows nt',
  'windows photo viewer',
  'windows powershell',
  'windows security',
  'windowsportabledevices',
  'windowssidebar',
  'common files',
  'internet explorer',
  'msbuild',
  'reference assemblies',
  'uninstall information',
  'modifiablewindowsapps',
  'packages',
  'package cache',
  'installshield installation information',
  'temp',
  'tmp',
  'system',
  'system32',
  'syswow64',
  'drivers',
  'driverstore',
  'assembly',
  'servicing',
  'winsxs',
  'connecteddevicesplatform',
  'd3dscache',
  'diagnostics',
  'elevateddiagnostics',
  'fontconfig',
  'history',
  'inetcache',
  'inetcookies',
  'netcache',
  'peernetworking',
  'publishers',
  'speech',
  'squirreltemp',
  'virtualstore',
  'webcache',
  'application data',
  'crashdumps',
  'dbg',
  'usoprivate',
  'usoshared',
  'deliveryoptimization',
  'cache',
  'caches',
  'logs',
  'fontcache',
  'iconcache',
  'thumbnails',
  'low',
  'local',
  'locallow',
  'roaming',
  'comms',
  'identitynexusintegration',
  'notifications',
  'programs',
  'start menu',
  'templates',
  'themes',
  // Hardware, GPU, Chipset & Peripheral drivers/runtimes
  'nvidia',
  'nvidia corporation',
  'amd',
  'ati',
  'ati technologies',
  'intel',
  'realtek',
  'qualcomm',
  'broadcom',
  'mediatek',
  'synaptics',
  'elan',
  'dell',
  'hp',
  'hewlett-packard',
  'lenovo',
  'asus',
  'acer',
  'msi',
  'gigabyte',
  'logitech',
  'razer',
  'corsair',
  'steelseries',
  'vulkan',
  'opengl',
  'directx',
  'khronos',
  'webview2',
  'edgewebview',
  // Runtimes & developer toolchains
  'dotnet',
  '.net',
  'oracle',
  'java',
  'python',
  'nodejs',
  'npm',
  'npm-cache',
  'yarn',
  'pnpm',
  'pip',
  'cargo',
  'rustup',
  'go',
  'nuget',
  'vite',
  // SmartSweep AI itself & Electron
  'smartsweep',
  'smartsweep ai',
  'smartsweep-ai',
  'smart-sweep-ai',
  'ransamie technologies',
  'electron',
  'squirrel',
  'crashpad',
  'updater',
  // macOS protected directories
  'apple',
  'com.apple',
  'cloudkit',
  'coreservices',
  'crashreporter',
  'diagnosticreports',
  'icloud',
  'knowledge',
  'safari',
  'siri',
  'spotlight',
  'utilities',
  'webkit',
  'addressbook',
  'appstore',
  'dock',
  'finder',
  'mobilesync',
  'calendars',
  'callhistorydb',
  'contacts',
  'mail',
  'messages',
  // Linux protected directories
  'gnome',
  'kde',
  'xfce',
  'xfce4',
  'gtk',
  'gtk-2.0',
  'gtk-3.0',
  'gtk-4.0',
  'dconf',
  'glib',
  'gvfs',
  'ibus',
  'pulse',
  'pipewire',
  'systemd',
  'dbus',
  'mesa',
  'mesa_shader_cache',
  'shader_cache',
  'trash',
  'applications',
  'icons',
  'mime',
  'keyrings',
  'flatpak',
  'snap',
  'xorg',
  'wayland',
  'session',
  'autostart',
  'menus',
  'desktop-directories',
  'evolution',
  'gsettings-data-convert',
  'nautilus',
  'gvfs-metadata',
  'recently-used.xbel',
]);

// Generic corporate/app noise tokens that should never cause false-positive matches on their own
const GENERIC_TOKENS = new Set([
  'app',
  'apps',
  'inc',
  'llc',
  'ltd',
  'corp',
  'corporation',
  'company',
  'co',
  'gmbh',
  'pty',
  'software',
  'technologies',
  'technology',
  'systems',
  'solutions',
  'interactive',
  'entertainment',
  'studio',
  'studios',
  'desktop',
  'client',
  'viewer',
  'player',
  'launcher',
  'updater',
  'helper',
  'service',
  'services',
  'tools',
  'pro',
  'free',
  'edition',
  'version',
  'windows',
  'win64',
  'win32',
  'x64',
  'x86',
  'arm64',
  'setup',
  'installer',
  'for',
  'the',
  'and',
]);

export function normalizeAppIdentifier(input: string): string {
  return input
    .toLowerCase()
    .replace(/\((x86|x64|64-bit|32-bit|arm64)\)/gi, ' ')
    .replace(/\bv?\d+(?:\.\d+){1,3}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactNormalize(input: string): string {
  return normalizeAppIdentifier(input).replace(/\s+/g, '');
}

function tokenizeMeaningful(input: string): string[] {
  return normalizeAppIdentifier(input)
    .split(/\s+/)
    .filter(t => t.length >= 3 && !GENERIC_TOKENS.has(t));
}

function isProtectedFolderName(folderName: string): boolean {
  const lower = folderName.toLowerCase().trim();
  if (!lower) return true;
  if (lower.startsWith('.') || lower.startsWith('$') || lower.startsWith('{') || lower.startsWith('~')) {
    return true;
  }
  if (lower.startsWith('com.apple.') || lower.startsWith('org.gnome.') || lower.startsWith('org.kde.') || lower.startsWith('regid.')) {
    return true;
  }
  if (PROTECTED_FOLDERS.has(lower)) {
    return true;
  }
  const normalized = normalizeAppIdentifier(folderName);
  if (PROTECTED_FOLDERS.has(normalized)) {
    return true;
  }
  return false;
}

interface NormalizedAppSignature {
  displayCompact: string;
  publisherCompact: string;
  installFolderCompact: string;
  installParentCompact: string;
  tokens: Set<string>;
}

function buildAppSignatures(apps: InstalledApp[]): NormalizedAppSignature[] {
  const signatures: NormalizedAppSignature[] = [];

  for (const installed of apps) {
    const displayName = installed.displayName || '';
    const publisher = installed.publisher || '';
    const installLoc = installed.installLocation || '';

    const displayCompact = compactNormalize(displayName);
    const publisherCompact = compactNormalize(publisher);
    const installBase = installLoc ? path.basename(installLoc.replace(/[\\/]+$/, '')) : '';
    const installParent = installLoc ? path.basename(path.dirname(installLoc.replace(/[\\/]+$/, ''))) : '';

    const installFolderCompact = compactNormalize(installBase);
    const installParentCompact = compactNormalize(installParent);

    const tokens = new Set<string>([
      ...tokenizeMeaningful(displayName),
      ...tokenizeMeaningful(publisher),
      ...tokenizeMeaningful(installBase),
    ]);

    if (displayCompact || publisherCompact || installFolderCompact) {
      signatures.push({
        displayCompact,
        publisherCompact,
        installFolderCompact,
        installParentCompact,
        tokens,
      });
    }
  }

  return signatures;
}

export function doesFolderMatchInstalledApp(folderName: string, signatures: NormalizedAppSignature[]): boolean {
  const folderCompact = compactNormalize(folderName);
  if (folderCompact.length < 2) return true; // avoid flagging cryptic 1-char system dirs

  const folderTokens = tokenizeMeaningful(folderName);

  for (const sig of signatures) {
    // 1. Direct or containment match against DisplayName
    if (sig.displayCompact.length >= 3 && folderCompact.length >= 3) {
      if (sig.displayCompact === folderCompact ||
          sig.displayCompact.includes(folderCompact) ||
          folderCompact.includes(sig.displayCompact)) {
        return true;
      }
    }

    // 2. Match against Publisher (e.g., "Adobe Inc." -> "Adobe", "JetBrains s.r.o." -> "JetBrains")
    if (sig.publisherCompact.length >= 3 && folderCompact.length >= 3) {
      if (sig.publisherCompact === folderCompact ||
          sig.publisherCompact.includes(folderCompact) ||
          folderCompact.includes(sig.publisherCompact)) {
        return true;
      }
    }

    // 3. Match against InstallLocation folder or parent vendor folder
    if (sig.installFolderCompact.length >= 3 && folderCompact.length >= 3) {
      if (sig.installFolderCompact === folderCompact ||
          sig.installFolderCompact.includes(folderCompact) ||
          folderCompact.includes(sig.installFolderCompact)) {
        return true;
      }
    }
    if (sig.installParentCompact.length >= 3 && folderCompact === sig.installParentCompact) {
      return true;
    }

    // 4. Meaningful multi-token / vendor token match (e.g., folder "Discord" vs app "Discord", "VSCode" / "Code")
    for (const ft of folderTokens) {
      if (ft.length >= 4 && sig.tokens.has(ft)) {
        return true;
      }
    }
  }

  return false;
}

async function computeDirectoryStats(dirPath: string): Promise<{ size: number; fileCount: number; lastModified: number }> {
  let size = 0;
  let fileCount = 0;
  let lastModified = 0;

  try {
    const rootStat = await fs.lstat(dirPath);
    if (rootStat.isSymbolicLink()) {
      return { size: 0, fileCount: 0, lastModified: 0 };
    }
    lastModified = rootStat.mtimeMs;
  } catch {
    return { size: 0, fileCount: 0, lastModified: 0 };
  }

  const queue: string[] = [dirPath];
  const CONCURRENCY = 8;

  async function worker() {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      let entries: import('fs').Dirent[];
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          queue.push(full);
        } else if (entry.isFile()) {
          try {
            const st = await fs.stat(full);
            size += st.size;
            fileCount += 1;
            if (st.mtimeMs > lastModified) {
              lastModified = st.mtimeMs;
            }
          } catch {
            // Skip locked or inaccessible files
          }
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return { size, fileCount, lastModified };
}

interface SearchTarget {
  dirPath: string;
  locationLabel: string;
}

function getAppDebrisSearchTargets(): SearchTarget[] {
  const platform = os.platform();
  const home = os.homedir();
  const rawTargets: SearchTarget[] = [];

  if (platform === 'win32') {
    const roaming = app.getPath('appData');
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const programData = process.env.ProgramData || 'C:\\ProgramData';
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    rawTargets.push(
      { dirPath: roaming, locationLabel: 'AppData\\Roaming' },
      { dirPath: local, locationLabel: 'AppData\\Local' },
      { dirPath: programData, locationLabel: 'ProgramData' },
      { dirPath: programFiles, locationLabel: 'Program Files' },
      { dirPath: programFilesX86, locationLabel: 'Program Files (x86)' },
    );
  } else if (platform === 'darwin') {
    rawTargets.push(
      { dirPath: path.join(home, 'Library', 'Application Support'), locationLabel: '~/Library/Application Support' },
      { dirPath: path.join(home, 'Library', 'Caches'), locationLabel: '~/Library/Caches' },
    );
  } else {
    rawTargets.push(
      { dirPath: path.join(home, '.local', 'share'), locationLabel: '~/.local/share' },
      { dirPath: path.join(home, '.config'), locationLabel: '~/.config' },
    );
  }

  // Deduplicate normalized directory paths
  const seen = new Set<string>();
  return rawTargets.filter((t) => {
    const key = path.resolve(t.dirPath).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scanAppDebris(): Promise<AppDebrisItem[]> {
  const targets = getAppDebrisSearchTargets();
  const installedApps = await getInstalledApps();
  const signatures = buildAppSignatures(installedApps);

  const candidates: Array<{ folderName: string; folderPath: string; locationLabel: string }> = [];

  for (const target of targets) {
    try {
      const entries = await fs.readdir(target.dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        if (isProtectedFolderName(entry.name)) continue;
        if (doesFolderMatchInstalledApp(entry.name, signatures)) continue;

        candidates.push({
          folderName: entry.name,
          folderPath: path.join(target.dirPath, entry.name),
          locationLabel: target.locationLabel,
        });
      }
    } catch {
      // Directory may not exist or lack read permission
    }
  }

  // Measure real directory sizes concurrently (bounded pool)
  const results: AppDebrisItem[] = [];
  const queue = [...candidates];
  const CONCURRENCY = 6;

  async function measureWorker() {
    while (queue.length > 0) {
      const candidate = queue.shift();
      if (!candidate) break;

      const stats = await computeDirectoryStats(candidate.folderPath);
      results.push({
        id: candidate.folderPath,
        folderName: candidate.folderName,
        folderPath: candidate.folderPath,
        locationLabel: candidate.locationLabel,
        size: stats.size,
        fileCount: stats.fileCount,
        lastModified: stats.lastModified,
      });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => measureWorker()));

  return results.sort((a, b) => b.size - a.size);
}

export async function findDebrisForAppNames(appNames: string[]): Promise<AppDebrisItem[]> {
  if (!appNames.length) return [];
  const allDebris = await scanAppDebris();
  const fakeApps: InstalledApp[] = appNames.map(name => ({
    displayName: name,
    displayVersion: '',
    publisher: '',
    installLocation: '',
  }));
  const sigs = buildAppSignatures(fakeApps);
  return allDebris.filter(d => doesFolderMatchInstalledApp(d.folderName, sigs));
}
