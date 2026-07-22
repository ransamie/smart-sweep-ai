# SmartSweep AI

SmartSweep AI is an intelligent, modern Windows desktop utility designed to securely scan your storage for temporary junk and orphaned application folders. Powered by a local-first philosophy and optional AI heuristics via the OpenAI API, it provides plain-English advice on what is safe to clean up.

## Key Features

- **Privacy-First AI Analysis:** Uses OpenAI to analyze your system metadata (extensions, totals sizes, orphaned software vendors) to give personalized recommendations. **Raw file contents and personal paths are strictly filtered and never sent to the cloud.**
- **Orphaned App Detection:** Scans the Windows Registry to cross-reference your `AppData` and `Program Files` against actively installed software, detecting leftover "App Debris".
- **Background Performance:** Runs completely silently in the system tray, freeing up Chromium RAM overhead when minimized.
- **Smart Notifications:** Throttled background CPU polling generates OS-level desktop notifications when junk thresholds are reached or uninstalled apps leave debris behind.
- **Modern Architecture:** Built with Electron, React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Windows**: The tool natively uses `registry-js` and targets Windows x64.

## Getting Started

To install dependencies and start the local development server:

```bash
# 1. Install all dependencies
npm install

# 2. Start the development server (Vite + Electron)
npm run dev
```

> **Note:** During development, the React frontend runs on `http://localhost:5173` while the Electron process manages system-level IPC calls in parallel.

## Building and Packaging for Production

SmartSweep AI is packaged using `electron-builder`. We have pre-configured it to build two installer types:
1. **NSIS (.exe):** Standard auto-updating windows installer.
2. **MSI (.msi):** System-level installer for enterprise deployment.

To compile the TypeScript frontend and backend, and bundle the final installers, run:

```bash
npm run dist
```

Once the build process completes, your final installers will be available in the `dist/` directory:
- `dist/SmartSweep AI Setup 1.0.0.exe`
- `dist/SmartSweep AI Setup 1.0.0.msi`

## Security & Admin Rights

Because SmartSweep AI needs to read the global `HKLM` Windows Registry keys and search deep within `AppData`, the installer is configured to prompt the user for elevated privileges (`requestedExecutionLevel: requireAdministrator`).

## Project Structure

```
smart-sweep-ai/
├── electron/                  # Node.js Main Process
│   ├── main.ts                # Application lifecycle, Tray, Notifications, Background polling
│   ├── preload.ts             # Secure IPC Bridge
│   ├── scanner.ts             # Recursive CPU-throttled file scanner
│   ├── registry.ts            # Windows Registry reader
│   └── ai.ts                  # OpenAI API integration
├── src/                       # React Renderer Process
│   ├── components/            # Reusable UI elements (Sidebar, Layout, SelectionFooter)
│   ├── context/               # Global state (AppContext)
│   ├── pages/                 # Main application views (Dashboard, Scan, Debris, Settings)
│   └── main.tsx               # React entry point
├── electron-builder.yml       # Production packaging config
├── tailwind.config.js         # Styling config
└── vite.config.ts             # Dev tooling config
```
