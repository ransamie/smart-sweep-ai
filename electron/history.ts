import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  scanType: string;
  bytesCleaned: number;
  details: string;
}

let historyPath = '';

function getHistoryPath() {
  if (!historyPath) {
    historyPath = path.join(app.getPath('userData'), 'smartsweep_history.json');
  }
  return historyPath;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await fs.readFile(getHistoryPath(), 'utf-8');
    return JSON.parse(data) as HistoryEntry[];
  } catch (error) {
    return [];
  }
}

export async function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<HistoryEntry> {
  const currentHistory = await getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  };
  
  // Keep only the last 100 entries to prevent the file from growing indefinitely
  const updatedHistory = [newEntry, ...currentHistory].slice(0, 100);
  
  try {
    await fs.writeFile(getHistoryPath(), JSON.stringify(updatedHistory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save history entry:', err);
  }
  return newEntry;
}

export async function clearHistory(): Promise<void> {
  try {
    await fs.writeFile(getHistoryPath(), '[]', 'utf-8');
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}
