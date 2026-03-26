<br />

<p align="center">
  <a href="https://github.com/dudor/BookmarkHub">
    <img src="images/icon128.png" alt="Logo" width="96" height="96">
  </a>
</p>

<h1 align="center">BookmarkHub 扩展（衍生版）</h1>

<p align="center">
  <a href="README.md">English README</a>（便于上游作者与国际读者阅读）
</p>

<p align="center">
  在 <a href="https://github.com/dudor/BookmarkHub">dudor/BookmarkHub</a> 开源项目基础上的修改版浏览器扩展：<strong>仍使用 GitHub Gist</strong> 存储书签，并增加<strong>半自动同步</strong>等与鸿蒙端配套应用（见下文 <a href="#鸿蒙端配套应用">鸿蒙端配套应用</a>）在数据与策略上对齐的能力。
  <br /><br />
  <strong>重要：</strong>本仓库<strong>并非</strong> Chrome / Firefox 应用商店中由原作者上架的「官方 BookmarkHub」安装包；使用、分发前请阅读下文<strong>许可与归属</strong>。
</p>

---

## 目录

- [许可与归属（对外分发必读）](#许可与归属对外分发必读)
- [本版功能说明](#本版功能说明)
- [鸿蒙端配套应用](#鸿蒙端配套应用)
- [与上游 BookmarkHub 的差异](#与上游-bookmarkhub-的差异)
- [权限说明](#权限说明)
- [安装方式](#安装方式)
- [构建命令速查](#构建命令速查)
- [使用说明](#使用说明)
- [相关链接](#相关链接)

---

## 许可与归属（对外分发必读）

### 许可证

- 本仓库中的上游代码与文档原以 **Apache License, Version 2.0** 发布，完整条款见根目录 [**`LICENSE`**](LICENSE)。
- 本衍生版在未另行声明的文件上，**继续适用 Apache-2.0**。对外再分发时，你须：
  - 向接收者提供 **Apache-2.0 许可证副本**（本仓库中的 `LICENSE` 即可）；
  - **保留**上游及本仓库中已有的版权与归属说明；
  - 对**你修改过的文件**保留「已被修改」的显著说明（本 README 与提交记录可作为说明之一；若你继续 fork，建议在变更文件头或变更日志中注明）；
  - 若你发布衍生版本，建议在 [**`NOTICE`**](NOTICE) 中填写你对「修改部分」的著作权声明（模板内 `[请填写…]` 处）。

### 上游与商标

- **上游项目：** [BookmarkHub](https://github.com/dudor/BookmarkHub)（作者 [dudor](https://github.com/dudor) 等贡献者）。
- 本衍生版**与上游作者及「BookmarkHub」在应用商店的官方发行**无隶属或背书关系；除合理说明作品来源外，请勿使他人误认为你是官方或原项目维护者（Apache-2.0 对**商标**另有单独限制，见 `LICENSE` 第 6 条）。

### 免责声明

- 软件按 **「现状」**提供，**不附带任何明示或默示担保**；使用风险由使用者自行承担。详见 `LICENSE` 第 7、8 条。

*以下为功能与使用说明，不构成法律意见；重要商业用途请咨询专业律师。*

---

## 本版功能说明

在保留上游「一键上传 / 下载 / 清空本地书签、本地与远程数量展示、GitHub Gist 存储」等能力的前提下，本衍生版额外实现：

| 能力 | 说明 |
|------|------|
| **书签变更后自动上传（可关闭）** | 在扩展选项中开启后，对书签的增删改移会在**约 4.5 秒防抖**后自动向 **GitHub Gist** 上传；成功后可清除本地「未与 Gist 对齐」标记。 |
| **定时 / 启动时从 Gist 拉取（可关闭）** | 可设置 **15 / 30 / 60 分钟** 周期，通过系统 **alarms** 检查远端；**浏览器启动时**也会尝试检查一次。 |
| **与鸿蒙端约定对齐** | 使用 Gist 内 `SyncDataInfo.createDate` 判断远端是否更新；若本地存在**未成功上传的修改**（dirty），则**不自动拉取**，避免覆盖本地未同步的变更（与同作者鸿蒙端在 Gist 同步上的策略一致；客户端见 [鸿蒙端配套应用](#鸿蒙端配套应用)）。 |
| **静默与通知** | 自动上传 / 自动拉取默认**成功不弹系统通知**；失败时是否通知仍受选项「使用消息通知」约束。手动上传 / 下载行为与上游一致（可按选项提示）。 |

数据载体仍为 **GitHub Gist**，未改为 Gitee / WebDAV 等。

---

## 鸿蒙端配套应用

作者在 **HarmonyOS（鸿蒙）** 上维护的轻量网址收藏应用，可与本扩展在同一生态内配合使用（例如 PC 浏览器侧用扩展写 Gist、移动端在鸿蒙应用中消费或同步书签，具体能力以该仓库说明为准）：

| 项目 | 说明 |
|------|------|
| [**jonas-pi / webfolder**](https://github.com/jonas-pi/webfolder) | 鸿蒙 HarmonyOS NEXT 轻量网址收藏夹：导入 Edge / Chrome HTML 书签，一触即达；支持多搜索引擎与自定义背景。 |

仓库地址：<https://github.com/jonas-pi/webfolder>

---

## 与上游 BookmarkHub 的差异

以下为**实质性修改**的概要，便于满足 Apache-2.0 对「修改说明」的透明度要求（详细以 Git 历史为准）：

- **`wxt.config.ts`：** 增加 `alarms` 权限（用于周期拉取）。
- **`src/utils/optionsStorage.ts`、`src/utils/setting.ts`：** 新增选项项 `autoUploadAfterChange`、`autoPullPeriodMinutes`。
- **`src/entrypoints/background.ts`：** 书签事件防抖上传、`browser.alarms` / `runtime.onStartup` 拉取逻辑、`browser.storage.local` 中的 dirty / `lastSyncedCreateDate` 元数据，以及上传 / 下载成功后的元数据回写。
- **`src/entrypoints/options/options.tsx`：** 半自动同步相关设置 UI。
- **`src/public/_locales/`：** 新增对应文案。

上游路线图中的「Automatically sync bookmarks」在本衍生版中已**部分实现**（半自动 + 仍依赖用户配置 Token/Gist）。

---

## 权限说明

在上游所需权限之外，本衍生版额外声明：

- **`alarms`：** 用于按设定间隔触发「检查 Gist 是否需要拉取」；关闭「定时从 Gist 拉取」时可不再创建周期闹钟（仍建议在清单中保留权限以便用户随时开启）。

---

## 安装方式

### 方式一：从 Releases 下载（无需安装 Node.js）

本仓库维护者发布的 **Chromium 预构建包** 见：**[GitHub Releases — jonas-pi/BookmarkHub](https://github.com/jonas-pi/BookmarkHub/releases)**。附件一般为 **`bookmarkhub-*-chrome.zip`**（由 `npm run zip` 生成，内容与 `.output/chrome-mv3` 一致）。

1. 打开上述 **Releases** 页面，下载所需版本的 **扩展 zip**。  
2. 将 zip **解压**到本地任意目录。  
   - 在下一步里选中的文件夹**根目录下必须直接有 `manifest.json`**。  
   - 若解压后只有**一层子文件夹**，请进入该子文件夹确认其中有 `manifest.json`，加载时选这一层（有清单的目录）。  
3. 浏览器打开 `chrome://extensions` 或 `edge://extensions`（Brave 等为 `brave://extensions`）。  
4. 打开 **开发者模式**。  
5. 点击 **加载已解压的扩展程序**，选中第 2 步中**含有 `manifest.json` 的那一层文件夹**。  
6. 进入 **扩展选项**，填写 **Token、Gist ID、文件名**；若提示 **可选主机权限**，按需授权（悬浮钮、页内提示等可能依赖 `*://*/*`）。

**更新：** 下载新版 Release 的 zip，解压到新目录（或覆盖原目录文件），在扩展管理页对该扩展点击 **重新加载**。

### 方式二：从源码构建

#### 环境准备

- 安装 [Node.js](https://nodejs.org/)（建议 LTS，如 18+）
- 安装 Git，以及 npm / pnpm / yarn 之一
- 克隆本仓库，在**仓库根目录**安装依赖：

  ```bash
  npm install
  ```

  若出现 peer 依赖冲突，可尝试：`npm install --legacy-peer-deps`。

#### Chromium 系（Chrome、Edge、Brave、Arc 等）

1. 在仓库根目录执行：

   ```bash
   npm run build
   ```

2. 打开扩展管理页：Chrome 使用 `chrome://extensions`，Edge 使用 `edge://extensions`；其他 Chromium 内核浏览器类似（如 Brave 为 `brave://extensions`）。

3. 打开 **开发者模式**（一般在页面右上角或侧栏开关）。

4. 点击 **加载已解压的扩展程序**（或 **Load unpacked**）。

5. 选择 **文件夹时，必须选「该文件夹根目录下就有 `manifest.json`」的那一层**。生产构建完成后一般为：

   **`BookmarkHub/.output/chrome-mv3`**

   **不要**选仓库根目录，也不要选只包含子目录、但自身没有 `manifest.json` 的 `.output` 父级（除非该父级里就有清单文件）。

6. 将扩展固定到工具栏（可选）；点击 **扩展选项**，填写 GitHub **Token**、**Gist ID**、**文件名**，并按需开启半自动同步等选项。

7. **可选主机权限：** 本衍生版可能声明对 `*://*/*` 的**可选**访问，用于悬浮同步按钮、页内同步提示等。若浏览器提示授权，可按需在指定站点或「所有网站」上授予。

### Firefox

1. 使用 Release 中提供的 **Firefox 扩展包**（若有），**或**在仓库根目录执行：

   ```bash
   npm run build:firefox
   ```

2. 打开 `about:debugging` → **此 Firefox** → **临时加载附加组件…**。

3. 选中 **扩展根目录**里的 **`manifest.json`**（Release 解压后的目录，或 **`.output/`** 下 WXT 生成的 Firefox 产物目录）。

说明：临时加载的附加组件在 **Firefox 完全退出重启后** 会失效；若要长期日常使用，需自行签名分发 `.xpi` 或使用 Firefox 规定的其他分发方式。

### 可选：本地自行打 zip 再加载

1. 执行 `npm run zip`（Firefox 用 `npm run zip:firefox`）。

2. 解压后按上文 **方式一** 同样操作：**加载已解压的扩展程序**，所选目录根目录须有 **`manifest.json`**（Chromium）。

### 更新扩展（源码构建时）

修改代码后重新执行 `npm run build`（或 `npm run build:firefox`），在 `chrome://extensions` / `edge://extensions` 中对该扩展点击 **重新加载**。Firefox 临时附加组件需重新选择 `manifest.json` 加载一次。

---

## 构建命令速查

| 命令 | 作用 |
|------|------|
| `npm run dev` | WXT 开发模式（默认 Chromium，热重载）。 |
| `npm run dev:firefox` | 开发模式，目标 Firefox。 |
| `npm run build` | 生产构建，产物常见为 `.output/chrome-mv3`。 |
| `npm run build:firefox` | 生产构建，Firefox 产物在 `.output/` 下对应子目录。 |
| `npm run zip` / `npm run zip:firefox` | 打 zip 包；可附到 Release 供他人下载，或解压后按上文 **方式一** 加载已解压扩展。 |

---

## 使用说明

1. 准备 GitHub 账号，创建具备 **gist** 权限的 [Personal Access Token](https://github.com/settings/tokens/new)。  
2. 创建 **Secret Gist**，记下 **Gist ID** 与文件名（与上游一致）。  
3. 在扩展选项中填写 Token、Gist ID、文件名。  
4. 按需开启：  
   - **书签变更后自动上传**  
   - **定时从 Gist 拉取**（并了解「本地有未上传修改时不拉取」的策略）

首次使用或与鸿蒙端（例如 [webfolder](https://github.com/jonas-pi/webfolder)）配合时，建议先理解「上传会覆盖 Gist、下载会清空并重建本地书签」的上游行为，并做好备份。

---

## 相关链接

- 上游项目：<https://github.com/dudor/BookmarkHub>  
- **鸿蒙端应用（网址收藏夹）：** <https://github.com/jonas-pi/webfolder>  
- 许可证全文：[`LICENSE`](LICENSE)  
- 再分发归属模板：[`NOTICE`](NOTICE)  
