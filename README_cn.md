<br />

<p align="center">
  <a href="https://github.com/jonas-pi/BookmarkHub">
    <img src="images/icon128.png" alt="Logo" width="96" height="96">
  </a>
</p>

<h1 align="center">BookmarkHub 扩展（衍生版）</h1>

<p align="center">
  <a href="README.md">English README</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/jonas-pi/BookmarkHub">GitHub 主仓库</a>
</p>

<p align="center">
  基于开源 BookmarkHub 的衍生版：书签同步至 <strong>GitHub Gist</strong> 或 <strong>Gitee 代码片段</strong>，可选半自动上传/拉取，并与 <a href="#鸿蒙端配套应用">鸿蒙端配套应用</a> 策略对齐。
  <br /><br />
  <strong>仓库：</strong><a href="https://github.com/jonas-pi/BookmarkHub">GitHub</a>（Issue、<a href="https://github.com/jonas-pi/BookmarkHub/releases">发行版</a>）· <a href="https://gitee.com/Jonas-yews/BookmarkHub">Gitee</a>（<a href="https://gitee.com/Jonas-yews/BookmarkHub/releases">发行版</a> — 在 Gitee 浏览时请从 Gitee 发行版下载）。
  <br /><br />
  <strong>并非</strong> 原作者在 Chrome/Firefox 商店上架的「官方 BookmarkHub」。再分发前请阅读 <a href="#许可">许可</a> 一节。
</p>

---

## 许可

Apache-2.0，全文见 [`LICENSE`](LICENSE)。再分发须保留许可证与归属、标明修改，自行发行时建议填写 [`NOTICE`](NOTICE)。本衍生版与上游及应用商店「BookmarkHub」**无隶属关系**。软件按「现状」提供，详见 `LICENSE` 第 7、8 条。

---

## 本版相对上游的增量

在上游「手动同步、数量展示、Gist」基础上增加：

- 可选 **书签变更后自动上传**（约 4.5 秒防抖）。
- 可选 **定时 / 启动时拉取**（15 / 30 / 60 分钟，依赖 `alarms`）。
- 设置中可选 **Gitee** 作为同步源。
- **脏数据保护**：本地有未上传修改时不自动拉取（与鸿蒙端 Gist 策略一致，`SyncDataInfo.createDate`）。
- 自动同步成功默认 **不弹成功通知**（失败等仍受选项控制）。

相对上游多声明权限：**`alarms`**。

---

## 鸿蒙端配套应用

**安装：** [华为应用市场 — com.jonas.webbookmarks](https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare)  
**源码：** [jonas-pi/webfolder](https://github.com/jonas-pi/webfolder)

---

## 安装

**方式一 — 预构建 zip（无需 Node）**  
在常用站点下载：**[GitHub 发行版](https://github.com/jonas-pi/BookmarkHub/releases)** 或 **[Gitee 发行版](https://gitee.com/Jonas-yews/BookmarkHub/releases)**（勿混用站点），附件一般为 `bookmarkhub-*-chrome.zip`。解压后，加载的目录**根下须有 `manifest.json`**。打开 `chrome://extensions` 或 `edge://extensions` → 开发者模式 → **加载已解压的扩展程序** → 选该目录 → 在 **选项** 中填写 Token、片段 ID、文件名。更新：仍在**同一站点**发行版下载新 zip → 扩展页 **重新加载**。

**方式二 — 源码：** 仓库根目录 `npm install`（冲突可试 `--legacy-peer-deps`）→ `npm run build` → **加载已解压** → 选 `.output/chrome-mv3`。**Firefox：** `npm run build:firefox` → `about:debugging` 临时加载 `manifest.json`（完全退出浏览器后需重载）。**打包：** `npm run zip` / `npm run zip:firefox`。**开发：** `npm run dev` / `npm run dev:firefox`。

---

## 使用说明

1. 创建带 **gist** 权限的 [GitHub Token](https://github.com/settings/tokens/new)（或 Gitee 私人令牌 + 代码片段，见选项说明）。
2. 新建私密 Gist/片段，记下 **片段 ID** 与 **文件名** 并填入扩展。
3. 按需开启自动上传、定时拉取（本地有未上传修改时 **不拉取**）。

**注意：** 上传会覆盖远端文件，下载会清空并重建本地书签；与 [鸿蒙端应用](https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare) 联用前请 **先备份**。

---

## 相关链接

| | |
|--|--|
| GitHub | https://github.com/jonas-pi/BookmarkHub · [发行版](https://github.com/jonas-pi/BookmarkHub/releases) |
| Gitee | https://gitee.com/Jonas-yews/BookmarkHub · [发行版](https://gitee.com/Jonas-yews/BookmarkHub/releases) |
| 应用市场 | https://appgallery.huawei.com/app/detail?id=com.jonas.webbookmarks&channelId=SHARE&source=appshare |
| 鸿蒙源码 | https://github.com/jonas-pi/webfolder |

[`LICENSE`](LICENSE) · [`NOTICE`](NOTICE)
