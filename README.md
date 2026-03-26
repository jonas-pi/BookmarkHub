<br />

<p align="center">
  <a href="https://github.com/dudor/BookmarkHub">
    <img src="images/icon128.png" alt="Logo" width="96" height="96">
  </a>
</p>

<h1 align="center">BookmarkHub Extension (Derivative Fork)</h1>

<p align="center">
  <a href="README_cn.md">简体中文</a>
</p>

<p align="center">
  A modified browser extension <strong>based on</strong> <a href="https://github.com/dudor/BookmarkHub">dudor/BookmarkHub</a>. It still stores bookmarks in <strong>GitHub Gist</strong> and adds <strong>semi-automatic sync</strong> aligned with the companion HarmonyOS app (see <a href="#harmonyos-companion-app">HarmonyOS companion app</a> below).
  <br /><br />
  <strong>Important:</strong> This repository is <strong>not</strong> the official BookmarkHub package published by the original author on the Chrome / Firefox add-on stores. Please read <strong>Licensing and attribution</strong> before use or redistribution.
</p>

---

## Table of contents

- [Licensing and attribution](#licensing-and-attribution)
- [Features in this fork](#features-in-this-fork)
- [HarmonyOS companion app](#harmonyos-companion-app)
- [Changes from upstream BookmarkHub](#changes-from-upstream-bookmarkhub)
- [Permissions](#permissions)
- [Installation](#installation)
- [Build from source (reference)](#build-from-source-reference)
- [Usage](#usage)
- [Related links](#related-links)

---

## Licensing and attribution

### License

- Upstream code and documentation in this repository were originally released under the **Apache License, Version 2.0**. The full text is in [**`LICENSE`**](LICENSE) at the repository root.
- Unless stated otherwise in individual files, this derivative work **remains under Apache-2.0**. If you redistribute it, you must:
  - Provide recipients with a **copy of the Apache-2.0 license** (the included `LICENSE` file is sufficient);
  - **Retain** existing copyright and attribution notices from upstream and this repo;
  - Keep **prominent notice** that **you changed** any modified files (this README and your commit history can serve that purpose; if you maintain a further fork, file headers or a changelog are also appropriate);
  - If you ship your own builds, fill in the copyright line for your modifications in [**`NOTICE`**](NOTICE) (replace the `[…]` placeholder).

### Upstream and trademarks

- **Upstream project:** [BookmarkHub](https://github.com/dudor/BookmarkHub) (by [dudor](https://github.com/dudor) and contributors).
- This derivative is **not affiliated with or endorsed by** the upstream authors or the official store listing named “BookmarkHub”. Do not imply you are the official maintainer (Apache-2.0 has **separate limits on trademarks**; see `LICENSE` §6).

### Disclaimer

- The software is provided **“AS IS”**, **without warranties**; use is at your own risk. See `LICENSE` §§7–8.

*The sections below describe functionality and usage only; they are not legal advice. For commercial compliance questions, consult a qualified attorney.*

---

## Features in this fork

On top of upstream capabilities (one-click upload / download / clear local bookmarks, local vs remote counts, GitHub Gist storage), this fork adds:

| Feature | Description |
|--------|-------------|
| **Auto-upload after bookmark changes (optional)** | When enabled in options, bookmark create / edit / move / remove triggers a **debounced** upload to **GitHub Gist** after **~4.5s** idle; success clears the local “not aligned with Gist” flag. |
| **Periodic / startup pull from Gist (optional)** | Choose **15 / 30 / 60** minute intervals using the **`alarms`** API; also runs **once on browser startup** when enabled. |
| **Aligned with HarmonyOS client policy** | Uses `SyncDataInfo.createDate` in the Gist payload to decide if the remote side is newer. If there are **local edits not yet uploaded** (**dirty**), **auto-pull is skipped** to avoid overwriting unsynced local changes (same idea as the author’s HarmonyOS Gist sync strategy; client repo: [HarmonyOS companion app](#harmonyos-companion-app)). |
| **Quiet vs notifications** | Auto upload / auto pull **do not show success notifications** by default. Failures still respect the “Enable notifications” option. Manual upload / download behave like upstream (notifications per option). |

The storage backend is still **GitHub Gist** (not Gitee / WebDAV / etc.).

---

## HarmonyOS companion app

A lightweight bookmarks app for **HarmonyOS** maintained by the same author. It can be used alongside this extension in the same ecosystem (e.g. extension writes Gist on desktop; HarmonyOS app consumes or syncs—**see that repo for what is actually implemented**):

| Project | Description |
|--------|-------------|
| [**jonas-pi / webfolder**](https://github.com/jonas-pi/webfolder) | HarmonyOS NEXT lightweight bookmarks: import Edge / Chrome HTML bookmarks, quick open; multiple search engines and custom backgrounds. |

Repository: <https://github.com/jonas-pi/webfolder>

---

## Changes from upstream BookmarkHub

Summary of **substantive modifications** (for Apache-2.0 transparency; details in Git history):

- **`wxt.config.ts`:** added `alarms` permission (periodic pull).
- **`src/utils/optionsStorage.ts`, `src/utils/setting.ts`:** new options `autoUploadAfterChange`, `autoPullPeriodMinutes`.
- **`src/entrypoints/background.ts`:** debounced upload on bookmark events, `browser.alarms` / `runtime.onStartup` pull logic, `browser.storage.local` metadata for **dirty** / `lastSyncedCreateDate`, persistence after successful upload/download.
- **`src/entrypoints/options/options.tsx`:** UI for semi-automatic sync.
- **`src/public/_locales/`:** new strings.

Upstream roadmap item “Automatically sync bookmarks” is **partially** addressed here (semi-automatic; still requires user-configured Token / Gist).

---

## Permissions

In addition to upstream permissions, this fork declares:

- **`alarms`:** fires on the chosen interval to check whether Gist should be pulled. When “periodic pull” is off, no repeating alarm is created (keeping the permission in the manifest is still recommended so users can enable the feature without an update).

---

## Installation

**This derivative is not the same package as the official BookmarkHub listing on the Chrome Web Store / Firefox Add-ons** (see [Licensing and attribution](#licensing-and-attribution)). Unless you publish your own store listing, install by **Load unpacked** (Chromium) after either **downloading a Release archive** or **building from source**; Firefox uses **temporary load** from a built or released package.

### Option A — Install from GitHub Releases (no Node.js)

If maintainers attach a **pre-built Chromium extension** to [Releases](https://github.com/dudor/BookmarkHub/releases) (for example a `zip` produced by `npm run zip`, often named like `bookmarkhub-*-chrome.zip`; **use your fork’s Releases URL** if you do not use this upstream repo):

1. Open the repo’s **Releases** page and download the latest **extension zip** for Chrome / Chromium.
2. **Extract** the archive to a folder on your computer.  
   - The folder you select in the next step must **directly contain `manifest.json`**.  
   - If the zip has **one top-level folder** inside it, open that folder—that inner directory should be the extension root with `manifest.json`.
3. Open `chrome://extensions` or `edge://extensions` (or `brave://extensions`, etc.).
4. Turn on **Developer mode**.
5. Click **Load unpacked** and choose the folder from step 2 (the one that contains **`manifest.json`**).
6. Open **Options**, set GitHub **Token**, **Gist ID**, and **filename**; grant **optional** site access if the browser asks (floating button / in-page toast on arbitrary sites).

**Updating:** Download a newer Release zip, extract to a new folder (or replace the old folder’s contents), then on `chrome://extensions` click **Reload** on this extension.

### Option B — Build from source

#### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended, e.g. 18+)
- Git, and npm / pnpm / yarn
- Clone this repository and install dependencies at the repo root:

  ```bash
  npm install
  ```

  If you hit peer-dependency errors, try: `npm install --legacy-peer-deps`.

#### Chromium (Chrome, Edge, Brave, Arc, etc.)

1. From the repository root, run:

   ```bash
   npm run build
   ```

2. Open the extensions page: `chrome://extensions` or `edge://extensions` (other Chromium browsers use the same pattern, e.g. `brave://extensions`).

3. Enable **Developer mode** (usually a toggle in the top-right or sidebar).

4. Click **Load unpacked** (Chrome) or **Load unpacked extension** (Edge).

5. Select the folder that **directly contains `manifest.json`**. After a production build this is typically:

   **`BookmarkHub/.output/chrome-mv3`**

   Do **not** select the repository root or the parent `.output` folder unless that folder itself contains `manifest.json`.

6. Pin the extension if you want toolbar access; open **Options** (toolbar menu or right-click the icon → Options) and set GitHub **Token**, **Gist ID**, and **filename**.

7. **Optional site access:** this fork may declare **optional** access to `*://*/*` for features such as the floating sync button or in-page toast on arbitrary websites. If prompted, grant access for those sites or “all sites” as you prefer.

### Firefox

1. Use a **Firefox build** from Releases (if provided) **or** build locally:

   ```bash
   npm run build:firefox
   ```

2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on…**.

3. Pick **`manifest.json`** inside the Firefox extension root (either the folder extracted from a Release zip, or the Firefox output directory under **`.output/`** from WXT).

Temporary add-ons are removed when Firefox fully restarts; for daily use you would sign and distribute an `.xpi` or use Firefox’s other distribution paths.

### Optional: install from a zip you built locally

1. Run `npm run zip` (or `npm run zip:firefox` for Firefox).

2. Extract the generated archive to a folder and use **Load unpacked** on the extracted folder that contains **`manifest.json`** at its root (Chromium)—same idea as [Option A](#option-a--install-from-github-releases-no-nodejs).

### Updating after code changes (source build)

Run `npm run build` (or `npm run build:firefox`) again, then on `chrome://extensions` / `edge://extensions` click **Reload** on this extension’s card. For Firefox temporary add-ons, load the manifest again.

---

## Build from source (reference)

| Command | Purpose |
|--------|---------|
| `npm run dev` | WXT dev mode with reload (Chromium default browser target). |
| `npm run dev:firefox` | Same for Firefox. |
| `npm run build` | Production build → `.output/chrome-mv3` (typical). |
| `npm run build:firefox` | Production build for Firefox under `.output/…`. |
| `npm run zip` / `npm run zip:firefox` | Produce a zip you can attach to **Releases** or install via **Load unpacked** after extract (see [Installation](#optional-install-from-a-zip-you-built-locally)). |

---

## Usage

1. Use a GitHub account and create a [Personal Access Token](https://github.com/settings/tokens/new) with **gist** scope.
2. Create a **secret Gist** and note the **Gist ID** and file name (same as upstream).
3. Fill Token, Gist ID, and file name in the extension options.
4. Optionally enable:
   - **Auto-upload after bookmark changes**
   - **Periodic pull from Gist** (and understand that **pull is skipped while local has pending uploads**)

Before first use or when combining with HarmonyOS (e.g. [webfolder](https://github.com/jonas-pi/webfolder)), remember: **upload overwrites the Gist file; download clears and rebuilds local bookmarks**—back up first.

---

## Related links

- Upstream: <https://github.com/dudor/BookmarkHub>
- **HarmonyOS app (webfolder):** <https://github.com/jonas-pi/webfolder>
- Full license: [`LICENSE`](LICENSE)
- Redistribution notice template: [`NOTICE`](NOTICE)
