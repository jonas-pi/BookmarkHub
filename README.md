<br />

<p align="center">
  <a href="https://github.com/jonas-pi/BookmarkHub">
    <img src="images/icon128.png" alt="Logo" width="96" height="96">
  </a>
</p>

<h1 align="center">BookmarkHub Extension (Derivative Fork)</h1>

<p align="center">
  <a href="README_cn.md">简体中文</a>
  &nbsp;·&nbsp;
  <a href="https://gitee.com/Jonas-yews/BookmarkHub">Gitee mirror</a>
</p>

<p align="center">
  Fork of open-source BookmarkHub: sync bookmarks via <strong>GitHub Gist</strong> or <strong>Gitee snippets</strong>, with optional semi-automatic upload/pull aligned with the <a href="#harmonyos-companion-app">HarmonyOS app</a>.
  <br /><br />
  <strong>Repos:</strong> <a href="https://github.com/jonas-pi/BookmarkHub">GitHub</a> (issues, <a href="https://github.com/jonas-pi/BookmarkHub/releases">Releases</a>) · <a href="https://gitee.com/Jonas-yews/BookmarkHub">Gitee</a> (<a href="https://gitee.com/Jonas-yews/BookmarkHub/releases">发行版</a> — use this site’s Releases when browsing on Gitee).
  <br /><br />
  <strong>Not</strong> the official store “BookmarkHub” from the original authors. See <a href="#license">License</a> before redistributing.
</p>

---

## License

Apache-2.0 (see [`LICENSE`](LICENSE)). Redistribution: keep license and notices; mark your changes; fill [`NOTICE`](NOTICE) if you ship builds. Upstream: open-source BookmarkHub — this project is **not** affiliated with upstream or their store listing. Disclaimer: AS IS — [`LICENSE`](LICENSE) §§7–8.

---

## What this fork adds

Upstream: manual sync, counts, Gist storage. **Plus:**

- Optional **auto-upload** after bookmark changes (~4.5s debounce).
- Optional **periodic / startup pull** (15 / 30 / 60 min via `alarms`).
- **Gitee** backend option in settings.
- **Dirty guard:** auto-pull skipped while local changes aren’t uploaded yet (`SyncDataInfo.createDate` / same idea as the HarmonyOS client).
- Auto sync paths stay **quiet** on success unless you enable notifications.

Extra permission vs upstream: **`alarms`** (for periodic pull).

---

## HarmonyOS companion app

**Install:** [Huawei AppGallery — com.jonas.webbookmarks](https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare)  
**Source:** [jonas-pi/webfolder](https://github.com/jonas-pi/webfolder)

---

## Install

**A — Pre-built zip (no Node)**  
Download from the **same** site you use: [GitHub Releases](https://github.com/jonas-pi/BookmarkHub/releases) or [Gitee 发行版](https://gitee.com/Jonas-yews/BookmarkHub/releases) → file like `bookmarkhub-*-chrome.zip`. Extract so the folder you load **contains `manifest.json` at its root**. Chromium: `chrome://extensions` / `edge://extensions` → Developer mode → **Load unpacked** → pick that folder → in **Options**, choose **GitHub Gist** or **Gitee** and fill token, snippet ID, and filename. Update: new zip from the same Releases site → **Reload** the extension.

**B — Build:** `npm install` (try `--legacy-peer-deps` if needed) → `npm run build` → **Load unpacked** → `.output/chrome-mv3`. **Firefox:** `npm run build:firefox` → `about:debugging` → temporary load `manifest.json` (clears on full browser restart). **Zip:** `npm run zip` / `npm run zip:firefox`. **Dev:** `npm run dev` / `npm run dev:firefox`.

---

## Usage

**Sync backends (pick one in extension options — tokens and IDs are not interchangeable):**

- **GitHub Gist:** [Personal access token](https://github.com/settings/tokens/new) with **gist** scope → create a **secret Gist** → paste **Token**, **Gist ID**, and **filename** in Options.
- **Gitee 代码片段:** [私人令牌](https://gitee.com/personal_access_tokens) with **snippet / gists** permission → create a **private** snippet → paste **Token**, **snippet ID**, and **filename** (same fields in the UI; labels match the selected provider).

Optional: **auto-upload** / **periodic pull** (pull is skipped while local changes are **dirty** / not yet uploaded).

**Warning:** upload overwrites remote file; download replaces local bookmarks — **back up** first (also when using the [HarmonyOS app](https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare)).

---

## Related links

| | |
|--|--|
| GitHub | https://github.com/jonas-pi/BookmarkHub · [Releases](https://github.com/jonas-pi/BookmarkHub/releases) |
| Gitee | https://gitee.com/Jonas-yews/BookmarkHub · [发行版](https://gitee.com/Jonas-yews/BookmarkHub/releases) |
| AppGallery | https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare |
| HarmonyOS source | https://github.com/jonas-pi/webfolder |

[`LICENSE`](LICENSE) · [`NOTICE`](NOTICE)
