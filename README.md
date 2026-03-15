# ⚡ BoardX PRO - Deep Logic Board Diagnostics

BoardX PRO is a premium desktop diagnostic suite built for advanced logic board micro-soldering technicians. It replaces messy physical schematic notebooks and untamed multimeter variance with a fully integrated, algorithmic technician toolkit.

## 🚀 Features

- **Smart Deviation Calculator:** Stop guessing if it's a short or thermal variance. Enter your multimeter reading to algorithmically determine if a component is truly failing.
- **MacBook Power Sequence Tracer:** Interactive, guided rail-by-rail sequence flows. Tells you the expected voltage, the source IC, and exactly what to check if it's missing.
- **Firmware vs Hardware Flowcharts:** Don't lift that Audio IC! Prevent unnecessary micro-soldering by running verified DFU/Recovery mode checks first.
- **Local Private Database:** Save your own proprietary diagnostic readouts perfectly indexed and searchable offline.

## 💻 Installation

BoardX PRO is distributed as a standalone desktop application.

### Windows

1. Download the latest **BoardX Pro Setup.exe** file.
2. Double click the installer.
3. Open the **BoardX Pro** application from your Start Menu.

### macOS

1. Download the latest **BoardX Pro.dmg** file.
2. Double click to mount the disk image.
3. Drag the **BoardX Pro** app into your `Applications` folder.
4. Open it from Launchpad.

### Linux

1. Download the latest **BoardX Pro.AppImage** file.
2. Make the file executable: `chmod +x "BoardX Pro.AppImage"`
3. Double click to run.

---

## 🔑 License Activation & Purchasing

BoardX PRO operates under a premium offline software license model.

When you download the app, you will have access to the Free Trainee features. To unlock **PRO** or **ELITE** smart tools:

1. Navigate to the **Pricing & Plans** tab inside the app.
2. Click **Purchase License Key Online**.
3. Complete the checkout process on our secure software portal.
4. You will be emailed a 16-character License Key (e.g. `PRO-A8X9-B2N4-PQ11`).
5. Open the app, click an locked feature, and paste your License Key into the Activation Portal.
6. Access granted offline!

## 🛠️ For Developers (Compiling from Source)

If you have source-code access and wish to compile the electron binaries locally:

```bash
# Install dependencies
npm install

# Run UI preview natively
npm run dev

# Compile Production Executables
npm run build:electron
```
