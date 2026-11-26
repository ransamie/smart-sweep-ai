import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
let historyPath = '';
function getHistoryPath() {
    if (!historyPath) {
        historyPath = path.join(app.getPath('userData'), 'smartsweep_history.json');
    }
    return historyPath;
}
export async function getHistory() {
    try {
        const data = await fs.readFile(getHistoryPath(), 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export async function addHistoryEntry(entry) {
    const currentHistory = await getHistory();
    const cappedItems = Array.isArray(entry.items)
        ? entry.items.filter(Boolean).slice(0, 200)
        : undefined;
    const newEntry = {
        ...entry,
        ...(cappedItems && cappedItems.length > 0 ? { items: cappedItems } : {}),
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    };
    // Keep only the last 100 entries to prevent the file from growing indefinitely
    const updatedHistory = [newEntry, ...currentHistory].slice(0, 100);
    try {
        await fs.mkdir(path.dirname(getHistoryPath()), { recursive: true });
        await fs.writeFile(getHistoryPath(), JSON.stringify(updatedHistory, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed to save history entry:', err);
    }
    return newEntry;
}
export async function clearHistory() {
    try {
        await fs.mkdir(path.dirname(getHistoryPath()), { recursive: true });
        await fs.writeFile(getHistoryPath(), '[]', 'utf-8');
    }
    catch (err) {
        console.error('Failed to clear history:', err);
    }
}
