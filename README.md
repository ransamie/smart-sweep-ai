# SmartSweep AI

SmartSweep AI is a free, intelligent, cross-platform desktop utility for Windows, macOS, and Linux that securely scans your storage for temporary junk files, orphaned application folders, and browser cache. Powered by a local-first philosophy and optional AI analysis via the **Google Gemini API**, it provides plain-English advice on what is safe to clean up — without ever compromising your privacy.

## Key Features

- **Privacy-First AI Analysis:** Connects to the Google Gemini API to analyze your system metadata (file categories, total sizes, orphaned software vendors) and deliver personalized, context-aware cleanup recommendations. **Raw file contents and personal file paths are strictly filtered and never sent to the cloud.**
- **System Cleaner:** Recursively scans and removes temporary files, system cache, orphaned logs, and other junk that silently consumes your storage.
- **Orphaned App Detection (App Debris):** Scans the Windows Registry to cross-reference your `AppData` and `Program Files` directories against actively installed software, identifying leftover folders from uninstalled applications.
- **Privacy Shield:** Sweeps tracking files and browser cache from Chrome, Edge, and Firefox without removing active session cookies or logins.
- **Startup Optimizer:** Manage which applications launch at startup, synced directly with Windows Task Manager's Startup Apps registry keys.
- **Background Monitoring:** Runs silently in the system tray and triggers OS-level desktop notifications when junk accumulates beyond 1 GB or app debris is detected.
- **Activity History:** Maintains a complete, reviewable log of every file deleted during each cleanup session.
- **Modern Architecture:** Built with Electron, React, TypeScript, Vite, and Tailwind CSS.

## Platform Support

| Platform | Installer |
|---|---|
| 🪟 Windows | `.exe` (NSIS Installer) |
| 🍎 macOS | `.dmg` |
| 🐧 Linux | `.AppImage` · `.deb` |

## Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

## Getting Started

Install dependencies and start the local development server:

```bash
# 1. Install all dependencies
npm install

# 2. Start the development server (Vite + Electron)
npm run dev
```

> **Note:** During development, the React frontend runs on `http://localhost:5173` while the Electron main process manages system-level IPC calls in parallel.

## Building for Production

SmartSweep AI is packaged using `electron-builder` and supports the following installer targets:

**Windows**
- `NSIS (.exe)` — Standard installer with auto-update support

**macOS**
- `DMG (.dmg)` — Standard macOS disk image

**Linux**
- `AppImage` — Universal Linux binary
- `DEB (.deb)` — Debian/Ubuntu package

To compile the TypeScript source and bundle the final installers, run:

```bash
npm run dist
```

Built installers will be output to the `dist/` directory.

## Security & Admin Rights

On Windows, SmartSweep AI requests elevated privileges at install time (`requestedExecutionLevel: requireAdministrator`) because it needs access to:
- The global `HKLM` Windows Registry hive (for startup item management and orphaned app detection)
- System-level directories such as `C:\Windows\Temp` and `C:\ProgramData`

## Project Structure

```
smart-sweep-ai/
├── electron/                   # Node.js Main Process
│   ├── main.ts                 # App lifecycle, tray, notifications, background polling
│   ├── preload.cts              # Secure IPC bridge (context isolation)
│   ├── scanner.ts              # CPU-throttled recursive file scanner
│   ├── systemCleaner.ts        # System junk & temp file removal logic
│   ├── registry.ts             # Windows Registry reader (orphaned app detection)
│   ├── browser.ts              # Browser cache detection (Chrome, Edge, Firefox)
│   ├── startup.ts              # Startup program manager (Task Manager sync)
│   ├── history.ts              # Deletion activity log
│   ├── settings.ts             # Persistent user settings
│   ├── ai.ts                   # Google Gemini API integration
│   └── splash.html             # Splash screen shown on launch
├── src/                        # React Renderer Process
│   ├── components/             # Reusable UI elements (Sidebar, Layout, etc.)
│   ├── context/                # Global state (AppContext)
│   ├── pages/                  # Application views:
│   │   ├── DashboardView.tsx   # Main overview with storage stats
│   │   ├── SystemCleanerView.tsx
│   │   ├── DeepScanView.tsx    # App debris / orphaned folder scanner
│   │   ├── PrivacyShieldView.tsx
│   │   ├── StartupOptimizerView.tsx
│   │   ├── HistoryView.tsx
│   │   ├── SettingsView.tsx
│   │   └── OnboardingView.tsx
│   └── main.tsx                # React entry point
├── website/                    # Marketing website (separate Vite/React app)
├── electron-builder.yml        # Production packaging config
├── tailwind.config.js          # Tailwind CSS config
└── vite.config.ts              # Vite dev tooling config
```

## Download

Pre-built installers for all platforms are available on the [Releases page](https://github.com/ransamie/smart-sweep-ai/releases/latest) or at [smartsweep.ransamie.online](https://smartsweep.ransamie.online).

## End User License Agreement (EULA) & Terms of Service

**IMPORTANT - READ CAREFULLY:** This End User License Agreement ("EULA") is a legal agreement between you (either an individual or a single entity) and Ran Technologies ("Developer") for the SmartSweep AI software product ("SOFTWARE PRODUCT").

By installing, copying, or otherwise using the SOFTWARE PRODUCT, you agree to be bound by the terms of this EULA. If you do not agree to the terms of this EULA, do not install or use the SOFTWARE PRODUCT.

### 1. Grant of License
The Developer grants you a personal, non-exclusive, non-transferable license to install and use the SOFTWARE PRODUCT for your personal or internal business purposes, strictly in accordance with the terms of this EULA.

### 2. Description of Other Rights and Limitations
- **Limitations on Reverse Engineering, Decompilation, and Disassembly:** You may not reverse engineer, decompile, or disassemble the SOFTWARE PRODUCT, except and only to the extent that such activity is expressly permitted by applicable law notwithstanding this limitation.
- **Separation of Components:** The SOFTWARE PRODUCT is licensed as a single product. Its component parts may not be separated for use on more than one computer.
- **Software Updates:** The SOFTWARE PRODUCT may automatically download and install updates from time to time to improve and enhance performance. You agree to receive such updates as part of your use of the SOFTWARE PRODUCT.

### 3. Data Privacy and AI Processing
- **Anonymized Data Transmission:** SmartSweep AI utilizes an external Artificial Intelligence (AI) API to provide intelligent cleanup recommendations. To function, the SOFTWARE PRODUCT securely transmits anonymized metadata to this API. This metadata is strictly limited to: directory sizes, file extensions, and application vendor names.
- **Personal Data Protection:** Under no circumstances does the SOFTWARE PRODUCT transmit personal file names, document contents, deep path structures, or personally identifiable information (PII) over the network for AI processing.
- **Local Filtering:** All file identification and preliminary filtering is performed strictly locally on your machine.

### 4. User Responsibility and Acceptable Use
- **Review Before Deletion:** The SOFTWARE PRODUCT is a system optimization utility designed to permanently delete files and modify system configurations. YOU, the user, bear the sole and ultimate responsibility for reviewing the items selected for deletion before confirming any cleanup operation.
- **System Files:** Deletion of certain system files or application caches may affect the functionality of third-party software. The Developer is not responsible for any loss of functionality resulting from the use of the SOFTWARE PRODUCT.

### 5. Disclaimer of Warranties
THE SOFTWARE PRODUCT IS PROVIDED "AS IS" AND "AS AVAILABLE," WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE DEVELOPER DISCLAIMS ALL WARRANTIES, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.

### 6. Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE DEVELOPER BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF DATA, SYSTEM CORRUPTION, OR ANY OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE PRODUCT.

### 7. Termination
Without prejudice to any other rights, the Developer may terminate this EULA if you fail to comply with its terms and conditions. In such event, you must destroy all copies of the SOFTWARE PRODUCT.

### 8. Governing Law
This EULA is governed by the laws of the jurisdiction in which the Developer resides, without regard to conflict of law principles.

---

## License

© 2026 Ran Technologies. All rights reserved.

