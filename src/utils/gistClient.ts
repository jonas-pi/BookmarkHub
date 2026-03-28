import ky from 'ky'
import type { Setting } from './setting'

/** 与 HM 端 `gistProvider === 'gitee'` 对齐 */
export function isGitee(setting: Setting): boolean {
  return setting.gistProvider === 'gitee'
}

/** Gitee OpenAPI v5：私人令牌使用 query `access_token` */
function giteeApiUrl(path: string, token: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const sep = p.includes('?') ? '&' : '?'
  return `https://gitee.com/api/v5${p}${sep}access_token=${encodeURIComponent(token)}`
}

const kyTimeout = { timeout: 60_000, retry: 1 as const }

/** GET gists/{id}，返回 JSON */
export async function fetchSnippetJson(setting: Setting): Promise<unknown> {
  if (isGitee(setting)) {
    const url = giteeApiUrl(`/gists/${setting.gistID}`, setting.githubToken)
    return ky.get(url, {
      ...kyTimeout,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BookmarkHub/1.0',
        'cache-control': 'no-store',
      },
    }).json()
  }
  return ky.get(`https://api.github.com/gists/${setting.gistID}`, {
    ...kyTimeout,
    headers: {
      Authorization: `Bearer ${setting.githubToken}`,
      'Content-Type': 'application/json;charset=utf-8',
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
      'cache-control': 'no-store',
    },
  }).json()
}

/** 大文件截断时拉取 raw 正文 */
export async function fetchSnippetRawUrl(setting: Setting, rawUrl: string): Promise<string> {
  if (isGitee(setting)) {
    const u = new URL(rawUrl)
    u.searchParams.set('access_token', setting.githubToken)
    return ky.get(u.toString(), kyTimeout).text()
  }
  return ky.get(rawUrl, {
    prefixUrl: '',
    ...kyTimeout,
    headers: {
      Authorization: `Bearer ${setting.githubToken}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  }).text()
}

/** PATCH gists/{id}，请求体与 GitHub 一致（files + description） */
export async function patchSnippet(setting: Setting, body: Record<string, unknown>): Promise<unknown> {
  if (isGitee(setting)) {
    const url = giteeApiUrl(`/gists/${setting.gistID}`, setting.githubToken)
    return ky.patch(url, {
      ...kyTimeout,
      json: body,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json',
        'User-Agent': 'BookmarkHub/1.0',
      },
    }).json()
  }
  return ky.patch(`https://api.github.com/gists/${setting.gistID}`, {
    ...kyTimeout,
    json: body,
    headers: {
      Authorization: `Bearer ${setting.githubToken}`,
      'Content-Type': 'application/json;charset=utf-8',
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  }).json()
}

/** 列出当前用户的片段（若业务需要） */
export async function listSnippets(setting: Setting): Promise<unknown> {
  if (isGitee(setting)) {
    const url = giteeApiUrl('/gists', setting.githubToken)
    return ky.get(url, {
      ...kyTimeout,
      headers: { Accept: 'application/json', 'User-Agent': 'BookmarkHub/1.0' },
    }).json()
  }
  return ky.get('https://api.github.com/gists', {
    ...kyTimeout,
    headers: {
      Authorization: `Bearer ${setting.githubToken}`,
      Accept: 'application/vnd.github+json',
    },
  }).json()
}
