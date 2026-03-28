import { Setting } from './setting'
import { fetchSnippetJson, fetchSnippetRawUrl, patchSnippet, listSnippets } from './gistClient'

class BookmarkService {
  async get() {
    const setting = await Setting.build()
    const resp = (await fetchSnippetJson(setting)) as {
      files?: Record<string, { truncated?: boolean; content?: string; raw_url?: string }>
    }
    if (resp?.files) {
      const filenames = Object.keys(resp.files)
      if (filenames.indexOf(setting.gistFileName) !== -1) {
        const gistFile = resp.files[setting.gistFileName]
        if (gistFile.truncated && gistFile.raw_url) {
          return fetchSnippetRawUrl(setting, gistFile.raw_url)
        }
        if (gistFile.content != null) {
          return gistFile.content
        }
      }
    }
    return null
  }

  async getAllGist() {
    const setting = await Setting.build()
    return listSnippets(setting)
  }

  async update(data: Record<string, unknown>) {
    const setting = await Setting.build()
    return patchSnippet(setting, data)
  }
}

export default new BookmarkService()
