/**
 * 将 npm run zip 生成的 Chromium zip 上传到 Gitee 指定 Release 的附件。
 * 若该 tag 尚无发行版，会调用 API 先创建（需在仓库存在对应 tag 或提供 target 分支）。
 *
 * 令牌（二选一，勿提交到 Git）：
 *   1) 环境变量 GITEE_TOKEN
 *   2) 仓库根 .gitee-token.local（单行，已 .gitignore）
 *
 * 可选环境变量：
 *   GITEE_OWNER / GITEE_REPO
 *   RELEASE_TAG          默认 v{package.json version}
 *   GITEE_TARGET_BRANCH  创建发行版时指向的分支，默认 main（tag 尚不存在时 Gitee 会据此打标签）
 *   RELEASE_NAME / RELEASE_BODY  新建发行版的标题与说明
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;
const tag = process.env.RELEASE_TAG ?? `v${version}`;
const zipName = `bookmarkhub-${version}-chrome.zip`;
const zipPath = resolve(root, '.output', zipName);

const owner = process.env.GITEE_OWNER ?? 'Jonas-yews';
const repo = process.env.GITEE_REPO ?? 'BookmarkHub';
const targetBranch = process.env.GITEE_TARGET_BRANCH ?? 'main';

function resolveToken() {
  const fromEnv = process.env.GITEE_TOKEN?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const tokenFile = process.env.GITEE_TOKEN_FILE
    ? resolve(process.env.GITEE_TOKEN_FILE)
    : resolve(root, '.gitee-token.local');
  if (existsSync(tokenFile)) {
    return readFileSync(tokenFile, 'utf8').trim();
  }
  return '';
}

/**
 * @param {string} token
 * @returns {Promise<{ id: number; tag_name: string }>}
 */
function hasReleaseId(data) {
  return data != null && data.id != null && data.id !== '';
}

async function findOrCreateRelease(token) {
  const base = `https://gitee.com/api/v5/repos/${owner}/${repo}`;
  const tok = `access_token=${encodeURIComponent(token)}`;

  const byTagUrl = `${base}/releases/tags/${encodeURIComponent(tag)}?${tok}`;
  const byTagRes = await fetch(byTagUrl);
  if (byTagRes.ok) {
    const byTagData = await byTagRes.json();
    if (hasReleaseId(byTagData)) {
      return byTagData;
    }
    // 部分情况下接口返回 200 但 body 为 null 或无 id，继续走列表/创建
  }

  const listUrl = `${base}/releases?${tok}&page=1&per_page=100`;
  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    throw new Error(`列出发行版失败 ${listRes.status}: ${await listRes.text()}`);
  }
  const rawList = await listRes.json();
  const releases = Array.isArray(rawList) ? rawList : [];
  const found = releases.find((r) => r && r.tag_name === tag);
  if (found && hasReleaseId(found)) {
    return found;
  }

  const createUrl = `${base}/releases?${tok}`;
  const name = process.env.RELEASE_NAME ?? `${tag} 衍生版 (Chromium MV3)`;
  const body =
    process.env.RELEASE_BODY ??
    '浏览器扩展 Chromium MV3 安装包见附件 `bookmarkhub-*-chrome.zip`（解压后加载已解压扩展）。';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: tag,
      name,
      body,
      target_commitish: targetBranch
    })
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(
      `创建发行版失败 ${createRes.status}: ${errText}\n` +
        '若提示 tag 不存在，请先在本地 git tag 并 push 到 Gitee，或确认 GITEE_TARGET_BRANCH 默认分支名正确（如 main / master）。'
    );
  }
  const created = await createRes.json();
  if (!hasReleaseId(created)) {
    throw new Error(`创建发行版返回数据异常: ${JSON.stringify(created)}`);
  }
  console.log('已创建 Gitee 发行版:', tag, '(id:', created.id, ')');
  return created;
}

async function main() {
  const token = resolveToken();
  if (!token) {
    throw new Error(
      '缺少 Gitee 令牌：设置 GITEE_TOKEN 或在仓库根创建 .gitee-token.local，然后 npm run release:upload-gitee'
    );
  }
  if (!existsSync(zipPath)) {
    throw new Error(`找不到 ${zipPath}，请先运行 npm run zip`);
  }

  const rel = await findOrCreateRelease(token);
  if (!hasReleaseId(rel)) {
    throw new Error(`未获得有效发行版 id，解析结果: ${JSON.stringify(rel)}`);
  }
  const base = `https://gitee.com/api/v5/repos/${owner}/${repo}`;
  const tok = `access_token=${encodeURIComponent(token)}`;

  const uploadUrl = `${base}/releases/${rel.id}/attach_files?${tok}`;
  const buf = readFileSync(zipPath);
  const form = new FormData();
  form.append('file', new Blob([buf]), zipName);

  const up = await fetch(uploadUrl, { method: 'POST', body: form });
  if (!up.ok) {
    throw new Error(`上传附件失败 ${up.status}: ${await up.text()}`);
  }
  const webBase = `https://gitee.com/${owner}/${repo}`;
  console.log('Gitee 发行版附件已上传:', zipName);
  console.log('页面:', `${webBase}/releases/tag/${encodeURIComponent(tag)}`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error(e.message || e);
    process.exitCode = 1;
  });
