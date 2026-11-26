import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    console.error('API Key validation error:', error);
    throw error;
  }
}

interface CacheEntry {
  result: string;
  timestamp: number;
}

// Persistent disk cache setup
const cacheFilePath = path.join(os.homedir(), '.smartsweep_ai_cache.json');
let diskCache: Record<string, CacheEntry> = {};

function loadDiskCache(): void {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf-8');
      diskCache = JSON.parse(raw) || {};
    }
  } catch {
    diskCache = {};
  }
}

function saveDiskCache(): void {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(diskCache, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save AI disk cache', e);
  }
}

// Load cache on module initialization
loadDiskCache();

class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  private maxPerMinute: number = 5; // Cap at 5 requests / 60s (strictly 1 request per 12 seconds)

  async waitForSlot(): Promise<void> {
    while (true) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter(ts => now - ts < 60000);

      if (this.timestamps.length < this.maxPerMinute) {
        this.timestamps.push(now);
        return;
      }

      const oldest = this.timestamps[0];
      const waitTimeMs = Math.max(500, 60000 - (now - oldest) + 500);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
    }
  }
}

const rateLimiter = new SlidingWindowRateLimiter();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hour persistent cache

// Personal folder names whose child filenames/subfolders may contain PII
const PERSONAL_HOME_FOLDERS = new Set([
  'downloads',
  'documents',
  'desktop',
  'pictures',
  'videos',
  'music',
  'onedrive',
  'movies',
  'public',
  'favorites',
  'links',
  'saved games',
  'contacts',
  'searches',
  'dropbox',
  'google drive',
  'icloud drive',
]);

// Safe structural directories under home where app/vendor names should be preserved
const SAFE_HOME_APP_ROOTS = new Set([
  'appdata',
  'library',
  '.local',
  '.config',
  '.cache',
  'applications',
]);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactFileSegment(segment: string): string {
  const ext = path.posix.extname(segment);
  if (ext && /^\.[a-zA-Z0-9]{1,12}$/.test(ext)) {
    return `<file>${ext}`;
  }
  return '<file>';
}

/**
 * Sanitizes a local file or folder path before sending metadata to Gemini AI.
 * - Replaces OS home directory and user profile prefixes with `<USER_HOME>`
 * - Redacts personal filenames and private subfolder names inside Documents/Downloads/Desktop/etc.
 * - Preserves structural context such as `<USER_HOME>/Downloads/<file>.iso` or `AppData/Local/<Vendor>`
 */
export function sanitizePathForAI(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') return '';

  const trimmed = rawPath.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return '';

  // Normalize separators to forward slashes for uniform cross-platform processing
  let normalized = trimmed.replace(/\\/g, '/');

  // 1. Replace exact os.homedir() first (case-insensitive on Windows)
  const homeNorm = os.homedir().replace(/\\/g, '/').replace(/\/+$/, '');
  if (homeNorm) {
    const homeRegex = new RegExp(`^${escapeRegExp(homeNorm)}(?=/|$)`, process.platform === 'win32' ? 'i' : '');
    normalized = normalized.replace(homeRegex, '<USER_HOME>');
  }

  // 2. Replace common home directory patterns across Windows, macOS, and Linux
  normalized = normalized
    .replace(/^[A-Za-z]:\/Users\/[^/]+(?=\/|$)/i, '<USER_HOME>')
    .replace(/^\/Users\/[^/]+(?=\/|$)/, '<USER_HOME>')
    .replace(/^\/home\/[^/]+(?=\/|$)/, '<USER_HOME>');

  // 3. Also mask OS username if it appears as an isolated path segment elsewhere
  try {
    const username = os.userInfo().username;
    if (username && username.length >= 3) {
      const userSegRegex = new RegExp(`/(${escapeRegExp(username)})(?=/|$)`, 'gi');
      normalized = normalized.replace(userSegRegex, '/<USER>');
    }
  } catch {
    // ignore os.userInfo errors
  }

  // 4. Redact personal filenames & nested private folders under <USER_HOME>
  if (normalized.startsWith('<USER_HOME>/')) {
    const rest = normalized.slice('<USER_HOME>/'.length);
    const segments = rest.split('/').filter(Boolean);
    if (segments.length === 0) return '<USER_HOME>';

    const firstLower = segments[0].toLowerCase();

    // Handle cloud sync containers like OneDrive/Documents/...
    if (firstLower === 'onedrive' || firstLower === 'dropbox' || firstLower === 'google drive' || firstLower === 'icloud drive') {
      if (segments.length === 1) {
        return `<USER_HOME>/${segments[0]}`;
      }
      const secondLower = segments[1].toLowerCase();
      if (PERSONAL_HOME_FOLDERS.has(secondLower)) {
        if (segments.length === 2) {
          return `<USER_HOME>/${segments[0]}/${segments[1]}`;
        }
        const middleCount = segments.length - 3;
        const middle = middleCount > 0 ? Array(middleCount).fill('<folder>') : [];
        const lastRedacted = redactFileSegment(segments[segments.length - 1]);
        return ['<USER_HOME>', segments[0], segments[1], ...middle, lastRedacted].join('/');
      }
      const middleCount = segments.length - 2;
      const middle = middleCount > 0 ? Array(middleCount).fill('<folder>') : [];
      const lastRedacted = redactFileSegment(segments[segments.length - 1]);
      return ['<USER_HOME>', segments[0], ...middle, lastRedacted].join('/');
    }

    if (PERSONAL_HOME_FOLDERS.has(firstLower)) {
      if (segments.length === 1) {
        return `<USER_HOME>/${segments[0]}`;
      }
      const middleCount = segments.length - 2;
      const middle = middleCount > 0 ? Array(middleCount).fill('<folder>') : [];
      const lastRedacted = redactFileSegment(segments[segments.length - 1]);
      return ['<USER_HOME>', segments[0], ...middle, lastRedacted].join('/');
    }

    // If it's a personal file directly in <USER_HOME> (not AppData / Library / .config / .local / .cache)
    if (!SAFE_HOME_APP_ROOTS.has(firstLower)) {
      if (segments.length === 1) {
        return `<USER_HOME>/${redactFileSegment(segments[0])}`;
      }
      // Keep only top generic folder if non-app, redact deeper segments
      const middleCount = segments.length - 2;
      const middle = middleCount > 0 ? Array(middleCount).fill('<folder>') : [];
      const lastRedacted = redactFileSegment(segments[segments.length - 1]);
      return ['<USER_HOME>', '<folder>', ...middle, lastRedacted].join('/');
    }
  }

  return normalized;
}

/**
 * Sanitizes scan summary metadata before building cache keys and AI prompts.
 */
export function sanitizeScanSummaryForAI(scanSummary: any): any {
  if (!scanSummary || typeof scanSummary !== 'object') return scanSummary;

  const sanitized: Record<string, any> = {
    totalSpace: scanSummary.totalSpace,
    usedSpace: scanSummary.usedSpace,
    freeSpace: scanSummary.freeSpace,
  };

  if (Array.isArray(scanSummary.topFiles)) {
    sanitized.topFiles = scanSummary.topFiles.map((f: any) => {
      if (typeof f === 'string') {
        return { path: sanitizePathForAI(f) };
      }
      const rawPath = typeof f?.path === 'string' ? f.path : '';
      const ext = typeof f?.extension === 'string' ? f.extension : (rawPath ? path.extname(rawPath) : '');
      return {
        path: sanitizePathForAI(rawPath),
        sizeMB: f?.sizeMB,
        extension: ext || undefined,
      };
    });
  } else if (typeof scanSummary.topFiles === 'string') {
    sanitized.topFiles = scanSummary.topFiles;
  }

  return sanitized;
}

function extractExecutableName(rawCommand: string): string {
  if (!rawCommand || typeof rawCommand !== 'string') return '';
  const trimmed = rawCommand.trim();
  if (!trimmed) return '';

  let exePath = trimmed;
  if (trimmed.startsWith('"')) {
    const endQuote = trimmed.indexOf('"', 1);
    if (endQuote > 1) {
      exePath = trimmed.slice(1, endQuote);
    }
  } else {
    const match = trimmed.match(/^(.+?\.(?:exe|bat|cmd|msi|lnk|plist|desktop|app|sh))(?=\s|$)/i);
    if (match) {
      exePath = match[1];
    } else {
      exePath = trimmed.split(/\s+/)[0];
    }
  }

  const normalized = exePath.replace(/\\/g, '/');
  return path.posix.basename(normalized) || sanitizePathForAI(exePath);
}

/**
 * Sanitizes startup items so only safe structural metadata (name, location, enabled, executable)
 * is sent to Gemini AI.
 */
export function sanitizeStartupItemsForAI(items: any[]): Array<{
  name: string;
  location: string;
  enabled: boolean;
  executable: string;
}> {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    name: typeof item?.name === 'string' ? item.name : 'Unknown',
    location: typeof item?.location === 'string' ? item.location : '',
    enabled: Boolean(item?.enabled),
    executable: extractExecutableName(typeof item?.path === 'string' ? item.path : ''),
  }));
}

function hashApiKeyForCache(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 12);
}

async function callGeminiApi(apiKey: string, prompt: string, cacheKey?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key is required to get AI recommendations.');
  }

  if (cacheKey && diskCache[cacheKey]) {
    const cached = diskCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // List of models to try in order
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  let lastErrorMsg = '';

  for (let attempt = 0; attempt < models.length; attempt++) {
    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    const modelName = models[attempt % models.length];

    try {
      let response;
      for (let retry = 0; retry < 3; retry++) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        if (response.status === 429) {
          console.warn(`Gemini 429 Rate Limit for ${modelName} (Retry ${retry + 1}/3). Retrying in 8s...`);
          await new Promise(res => setTimeout(res, 8000));
          continue;
        }
        break; // If not 429, break the retry loop and handle the response
      }

      if (!response || !response.ok) {
        const err = await response?.json().catch(() => ({})) || {};
        lastErrorMsg = err.error?.message || response?.statusText || 'Failed to fetch AI response';
        if (response?.status === 404 || lastErrorMsg.toLowerCase().includes('not found') || lastErrorMsg.toLowerCase().includes('quota') || lastErrorMsg.toLowerCase().includes('resource_exhausted')) {
          await new Promise(res => setTimeout(res, 2000));
          continue;
        }
        throw new Error(lastErrorMsg);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated by AI.');
      }

      const text = data.candidates[0].content.parts[0].text;
      if (cacheKey) {
        diskCache[cacheKey] = { result: text, timestamp: Date.now() };
        saveDiskCache();
      }
      return text;
    } catch (error: any) {
      console.error(`AI API Attempt ${attempt + 1} Error:`, error);
      lastErrorMsg = error?.message || String(error) || 'Unknown network error';
      if (attempt < models.length - 1) {
        await new Promise(res => setTimeout(res, 4000));
      }
    }
  }

  if (lastErrorMsg.toLowerCase().includes('429') || lastErrorMsg.toLowerCase().includes('quota') || lastErrorMsg.toLowerCase().includes('resource_exhausted')) {
    throw new Error("⚠️ AI Rate Limit Reached: Your Gemini API key quota was reached. Please wait a minute or use a new key in Settings.");
  }

  throw new Error(lastErrorMsg && lastErrorMsg.trim() !== '' ? lastErrorMsg : 'Failed to communicate with AI service. Check your internet or API key.');
}

export function clearAiCache(): void {
  diskCache = {};
  saveDiskCache();
}

export async function generateCleanupAdvice(apiKey: string, scanSummary: any): Promise<string> {
  const sanitizedSummary = sanitizeScanSummaryForAI(scanSummary);
  const prompt = `You are a helpful IT assistant. I have scanned my current system. Here is an anonymized summary of my storage:
${JSON.stringify(sanitizedSummary, null, 2)}

Provide concise, plain-English advice on what I can safely delete. If top files are listed, specifically mention which of those file categories or locations might be taking up the most space and whether they seem safe to remove (e.g. installers, temp files).`;

  const cacheKey = `${hashApiKeyForCache(apiKey)}_cleanup_${JSON.stringify(sanitizedSummary)}`;
  return callGeminiApi(apiKey, prompt, cacheKey);
}

export async function explainPath(apiKey: string, targetPath: string): Promise<string> {
  const sanitizedTarget = sanitizePathForAI(targetPath);
  const prompt = `You are a helpful IT assistant. A user is looking at this anonymized path on their current system:
"${sanitizedTarget}"

Provide a concise, plain-English explanation (2-3 sentences) of what this folder or file type typically contains, what application it belongs to (if known), and whether it is generally safe to delete its contents to free up space. Format your response in markdown.`;

  const cacheKey = `${hashApiKeyForCache(apiKey)}_explain_${sanitizedTarget}`;
  return callGeminiApi(apiKey, prompt, cacheKey);
}

export async function analyzeStartup(apiKey: string, items: any[]): Promise<string> {
  const sanitizedItems = sanitizeStartupItemsForAI(items);
  const prompt = `You are a helpful IT assistant. Here is an anonymized list of my system startup items:
${JSON.stringify(sanitizedItems, null, 2)}

Provide a concise, plain-English recommendation on which items I should safely disable to improve my boot times.`;

  const cacheKey = `${hashApiKeyForCache(apiKey)}_startup_${JSON.stringify(sanitizedItems.map(i => ({ name: i.name, enabled: i.enabled, executable: i.executable })))}`;
  return callGeminiApi(apiKey, prompt, cacheKey);
}
