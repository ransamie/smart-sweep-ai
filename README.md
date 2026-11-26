# SmartSweep AI

SmartSweep AI is a free, intelligent, cross-platform desktop utility for Windows, macOS, and Linux that securely scans your storage for temporary junk files, orphaned application folders, and browser cache. Powered by a local-first philosophy and optional AI analysis via the **Google Gemini API**, it provides plain-English advice on what is safe to clean up — without ever compromising your privacy.

## Key Features

- **Privacy-First Optional AI Analysis:** Works 100% locally out of the box without requiring an API key. Optionally connect a Google Gemini API key (stored encrypted locally via Electron `safeStorage`) to receive personalized cleanup recommendations. **User home directories (`<USER_HOME>`) and personal filenames are strictly masked/sanitized before any prompt leaves your machine.**
- **Space Analyzer (Treemap):** Recursively locates large files across any mounted drive, visualizes directory usage with an interactive Treemap, and moves selected files safely into 14-day Quarantine.
- **System & GPU Shader Cleaner:** Scans and removes temporary files, system cache, Windows Update staging files, crash dumps, logs, and DirectX/NVIDIA/AMD/Intel GPU shader caches manually or on a daily background schedule.
- **Orphaned App Detection (App Debris):** Cross-references `AppData`, `ProgramData`, `Program Files`, and macOS/Linux user app directories against installed applications (with strict OS/driver/runtime allowlist protections) to locate and quarantine leftover folders from uninstalled software.
- **Privacy Shield & App Caches:** Sweeps caches and site storage across **Chrome, Edge, Brave, Opera/Opera GX, Firefox**, and **Desktop App Caches (Discord, Spotify, VS Code, Teams, Slack)** on Windows, macOS, and Linux while preserving saved logins and bookmarks.
- **Startup Optimizer:** Manage which applications launch at startup, synced directly with Windows Task Manager (`StartupApproved`), macOS `LaunchAgents`, and Linux XDG autostart entries.
- **14-Day Quarantine Recovery & Exportable Logs:** Inspect quarantined files and app debris folders, restore them to their original paths, or export itemized cleanup logs in CSV (RFC-4180) and JSON formats.
- **Background Monitoring:** Runs silently in the system tray (honoring `--hidden` auto-start launches) and triggers OS-level desktop notifications when junk accumulates beyond 1 GB or newly uninstalled app debris is detected.
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
│   ├── preload.cts             # Secure IPC bridge (context isolation)
│   ├── scanner.ts              # Recursive file scanner & 14-day quarantine manager
│   ├── appDebris.ts            # Cross-platform orphaned app debris detector
│   ├── systemCleaner.ts        # System junk, temp & GPU shader cache removal logic
│   ├── registry.ts             # Installed apps reader (Windows Registry, macOS, Linux)
│   ├── browser.ts              # Browser & desktop app cache cleaner (Chrome, Edge, Brave, Opera, Firefox)
│   ├── startup.ts              # Startup program manager (Task Manager / LaunchAgents / XDG sync)
│   ├── history.ts              # Itemized deletion activity log
│   ├── settings.ts             # Persistent settings & safeStorage encrypted secrets
│   ├── ai.ts                   # Google Gemini API integration with strict path sanitization
│   └── splash.html             # Splash screen shown on launch
├── src/                        # React Renderer Process
│   ├── components/             # Reusable UI elements (Sidebar, Layout, etc.)
│   ├── context/                # Global state (AppContext)
│   ├── pages/                  # Application views:
│   │   ├── DashboardView.tsx   # Main overview with Health Score & storage stats
│   │   ├── SystemCleanerView.tsx
│   │   ├── DeepScanView.tsx    # Space Analyzer & interactive Treemap
│   │   ├── AppDebrisView.tsx   # Orphaned application folder scanner & cleaner
│   │   ├── PrivacyShieldView.tsx
│   │   ├── StartupOptimizerView.tsx
│   │   ├── HistoryView.tsx     # Activity logs (CSV/JSON export) & Quarantine Recovery
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

**IMPORTANT - READ CAREFULLY:** This End User License Agreement ("EULA") is a legal agreement between you (either an individual or a single entity) and Ransamie Technologies ("Developer") for the SmartSweep AI software product ("SOFTWARE PRODUCT").

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

© 2026 Ransamie Technologies. All rights reserved.

