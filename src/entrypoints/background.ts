import BookmarkService from '../utils/services'
import { Setting } from '../utils/setting'
import iconLogo from '../assets/icon.png'
import { OperType, BookmarkInfo, SyncDataInfo, RootBookmarksType, BrowserType } from '../utils/models'
import { Bookmarks } from 'wxt/browser'

/**
 * 与 HM 端约定一致：本地是否存在「尚未成功推到 Gist」的书签变更。
 * 存 browser.storage.local，用于自动拉取时若 dirty 则跳过，避免覆盖本地未上传的修改。
 */
const STORAGE_GIST_DIRTY = 'bookmarkHubGistDirty'

/**
 * 上次成功上传/下载后记录的 SyncDataInfo.createDate（毫秒），用于与远端比对是否需要拉取。
 */
const STORAGE_LAST_SYNCED_CREATE_DATE = 'bookmarkHubLastSyncedCreateDate'

/** 书签变更后自动上传的防抖间隔（毫秒），与 HM 端思路一致 */
const AUTO_UPLOAD_DEBOUNCE_MS = 4500

/** 周期检查 Gist 是否需要拉取的 alarm 名称 */
const ALARM_AUTO_PULL = 'bookmarkhub-auto-pull'

export default defineBackground(() => {
  let curOperType = OperType.NONE
  let curBrowserType = BrowserType.CHROME

  /** 防抖定时器：仅在 service worker 存活期间有效；唤醒后用户可再触发书签事件重新调度 */
  let autoUploadDebounceTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * 成功同步（上传或下载）后写入：清除 dirty、记录 createDate。
   */
  async function persistSyncMetaAfterSuccess(createDate: number): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_GIST_DIRTY]: false,
      [STORAGE_LAST_SYNCED_CREATE_DATE]: createDate,
    })
  }

  async function markGistDirty(): Promise<void> {
    await browser.storage.local.set({ [STORAGE_GIST_DIRTY]: true })
  }

  async function isGistDirty(): Promise<boolean> {
    const v = await browser.storage.local.get(STORAGE_GIST_DIRTY)
    return v[STORAGE_GIST_DIRTY] === true
  }

  async function getLastSyncedCreateDate(): Promise<number> {
    const v = await browser.storage.local.get(STORAGE_LAST_SYNCED_CREATE_DATE)
    const n = Number(v[STORAGE_LAST_SYNCED_CREATE_DATE])
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  function cancelDebouncedAutoUpload(): void {
    if (autoUploadDebounceTimer !== undefined) {
      clearTimeout(autoUploadDebounceTimer)
      autoUploadDebounceTimer = undefined
    }
  }

  type BookmarkChangeKind = 'created' | 'changed' | 'moved' | 'removed'

  /**
   * 在当前活动窗口的 http(s) 标签页右上角显示轻提示（由 content script 渲染，支持深浅色）。
   */
  async function maybeBroadcastInPageSyncToast(kind: 'upload' | 'download' | 'synced'): Promise<void> {
    const setting = await Setting.build()
    if (!setting.showInPageSyncToast) {
      return
    }
    /* WXT 类型里 getURL 仅列出部分路径，运行时常为 dist 根下 icons/ */
    const iconUrl = browser.runtime.getURL('icons/48.png' as Parameters<typeof browser.runtime.getURL>[0])
    try {
      let tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true })
      if (tabs.length === 0) {
        tabs = await browser.tabs.query({ active: true, currentWindow: true })
      }
      for (const t of tabs) {
        if (t.id == null) {
          continue
        }
        const u = t.url ?? ''
        if (!/^https?:\/\//i.test(u)) {
          continue
        }
        await browser.tabs.sendMessage(t.id, { type: 'hmShowSyncToast', kind, iconUrl }).catch(() => {
          /* 该页未注入 content 或不可达则忽略 */
        })
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * 防抖上传：autoUploadAfterChange 时任意书签变更都会排队；
   * syncOnNewBookmark 时仅「新增收藏」也会排队（可与上一项叠加）。
   */
  async function scheduleDebouncedUploadForLocalEdit(kind: BookmarkChangeKind): Promise<void> {
    const setting = await Setting.build()
    const allow =
      setting.autoUploadAfterChange || (kind === 'created' && setting.syncOnNewBookmark)
    if (!allow) {
      return
    }
    if (!setting.githubToken || !setting.gistID || !setting.gistFileName) {
      return
    }
    cancelDebouncedAutoUpload()
    autoUploadDebounceTimer = setTimeout(() => {
      autoUploadDebounceTimer = undefined
      void uploadBookmarks({ quiet: true })
    }, AUTO_UPLOAD_DEBOUNCE_MS)
  }

  /**
   * 用户本地编辑书签：标记 dirty，并按选项排队防抖上传。
   */
  function onLocalBookmarksMaybeDirty(kind: BookmarkChangeKind): void {
    void (async () => {
      await markGistDirty()
      await scheduleDebouncedUploadForLocalEdit(kind)
    })()
  }

  /** 清空本地书签等批量操作后：仅在 autoUploadAfterChange 时排队上传（与旧行为一致） */
  async function scheduleDebouncedUploadAfterBulkLocalRemove(): Promise<void> {
    const setting = await Setting.build()
    if (!setting.autoUploadAfterChange) {
      return
    }
    if (!setting.githubToken || !setting.gistID || !setting.gistFileName) {
      return
    }
    cancelDebouncedAutoUpload()
    autoUploadDebounceTimer = setTimeout(() => {
      autoUploadDebounceTimer = undefined
      void uploadBookmarks({ quiet: true })
    }, AUTO_UPLOAD_DEBOUNCE_MS)
  }

  /**
   * 根据 Gist 文件头中的 createDate 判断远端是否比上次同步更新；若是且本地非 dirty，则执行下载（与 HM 拉取策略对齐）。
   */
  async function tryAutoPullIfEligible(): Promise<void> {
    const setting = await Setting.build()
    if (setting.autoPullPeriodMinutes <= 0) {
      return
    }
    if (!setting.githubToken || !setting.gistID || !setting.gistFileName) {
      return
    }
    let gist: string | null = null
    try {
      gist = await BookmarkService.get()
    } catch (e) {
      console.error('[BookmarkHub] auto pull: fetch gist failed', e)
      return
    }
    if (!gist) {
      return
    }
    let syncdata: SyncDataInfo
    try {
      syncdata = JSON.parse(gist) as SyncDataInfo
    } catch {
      return
    }
    const remoteTs = Number(syncdata.createDate) || 0
    if (remoteTs <= 0) {
      return
    }
    if (await isGistDirty()) {
      return
    }
    const localTs = await getLastSyncedCreateDate()
    if (remoteTs <= localTs) {
      return
    }

    curOperType = OperType.SYNC
    try {
      await downloadBookmarks({ quiet: true })
    } finally {
      curOperType = OperType.NONE
      await refreshLocalCount()
      browser.action.setBadgeText({ text: '' })
    }
  }

  /**
   * 按选项注册/清除周期拉取 alarm；Chrome 要求 periodInMinutes ≥ 1。
   */
  async function rescheduleAutoPullAlarm(): Promise<void> {
    try {
      await browser.alarms.clear(ALARM_AUTO_PULL)
    } catch {
      /* ignore */
    }
    const setting = await Setting.build()
    const period = setting.autoPullPeriodMinutes
    if (period > 0) {
      const minutes = Math.max(1, Math.floor(period))
      await browser.alarms.create(ALARM_AUTO_PULL, { periodInMinutes: minutes })
    }
  }

  browser.runtime.onInstalled.addListener(() => {
    void rescheduleAutoPullAlarm()
  })

  browser.runtime.onStartup.addListener(() => {
    void tryAutoPullIfEligible()
  })

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_AUTO_PULL) {
      void tryAutoPullIfEligible()
    }
  })

  /** 选项保存在 sync 区，变更时重建 alarm */
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return
    }
    const keys = ['autoPullPeriodMinutes', 'autoUploadAfterChange', 'githubToken', 'gistID', 'gistFileName']
    if (keys.some((k) => Object.prototype.hasOwnProperty.call(changes, k))) {
      void rescheduleAutoPullAlarm()
    }
  })

  void rescheduleAutoPullAlarm()

  /**
   * 用户触发的手动同步（弹出页 / 网页悬浮钮 / 快捷键）：统一走 manualBidirectionalSync，与鸿蒙端顶栏逻辑一致。
   */
  function runManualSyncFromUser(sendResponse?: (ok: boolean) => void): void {
    cancelDebouncedAutoUpload()
    curOperType = OperType.SYNC
    manualBidirectionalSync()
      .finally(() => {
        curOperType = OperType.NONE
        browser.action.setBadgeText({ text: '' })
        void refreshLocalCount()
        sendResponse?.(true)
      })
  }

  /** 扩展快捷键：默认 Alt+Shift+G，可在浏览器的扩展快捷键设置里修改 */
  browser.commands.onCommand.addListener((command) => {
    if (command !== 'manual-sync') {
      return
    }
    void (async () => {
      const s = await Setting.build()
      if (!s.enableManualSyncHotkey) {
        return
      }
      runManualSyncFromUser()
    })()
  })

  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.name === 'manualSync') {
      runManualSyncFromUser(sendResponse)
    }
    if (msg.name === 'upload') {
      cancelDebouncedAutoUpload()
      curOperType = OperType.SYNC
      uploadBookmarks({ quiet: false }).then(() => {
        curOperType = OperType.NONE
        browser.action.setBadgeText({ text: '' })
        refreshLocalCount()
        sendResponse(true)
      })
    }
    if (msg.name === 'download') {
      cancelDebouncedAutoUpload()
      curOperType = OperType.SYNC
      downloadBookmarks({ quiet: false }).then(() => {
        curOperType = OperType.NONE
        browser.action.setBadgeText({ text: '' })
        refreshLocalCount()
        sendResponse(true)
      })
    }
    if (msg.name === 'removeAll') {
      cancelDebouncedAutoUpload()
      curOperType = OperType.REMOVE
      clearBookmarkTree().then(() => {
        curOperType = OperType.NONE
        browser.action.setBadgeText({ text: '' })
        refreshLocalCount()
        void markGistDirty()
        void scheduleDebouncedUploadAfterBulkLocalRemove()
        sendResponse(true)
      })
    }
    if (msg.name === 'setting') {
      browser.runtime.openOptionsPage().then(() => {
        sendResponse(true)
      })
    }
    return true
  })

  browser.bookmarks.onCreated.addListener((_id, _info) => {
    if (curOperType === OperType.NONE) {
      browser.action.setBadgeText({ text: '!' })
      browser.action.setBadgeBackgroundColor({ color: '#F00' })
      refreshLocalCount()
      onLocalBookmarksMaybeDirty('created')
    }
  })
  browser.bookmarks.onChanged.addListener((_id, _info) => {
    if (curOperType === OperType.NONE) {
      browser.action.setBadgeText({ text: '!' })
      browser.action.setBadgeBackgroundColor({ color: '#F00' })
      onLocalBookmarksMaybeDirty('changed')
    }
  })
  browser.bookmarks.onMoved.addListener((_id, _info) => {
    if (curOperType === OperType.NONE) {
      browser.action.setBadgeText({ text: '!' })
      browser.action.setBadgeBackgroundColor({ color: '#F00' })
      onLocalBookmarksMaybeDirty('moved')
    }
  })
  browser.bookmarks.onRemoved.addListener((_id, _info) => {
    if (curOperType === OperType.NONE) {
      browser.action.setBadgeText({ text: '!' })
      browser.action.setBadgeBackgroundColor({ color: '#F00' })
      refreshLocalCount()
      onLocalBookmarksMaybeDirty('removed')
    }
  })

  type UploadDownloadOptions = { quiet?: boolean }

  async function uploadBookmarks(options: UploadDownloadOptions = {}) {
    const quiet = options.quiet === true
    let setting = await Setting.build()
    try {
      if (setting.githubToken == '') {
        throw new Error('Gist Token Not Found')
      }
      if (setting.gistID == '') {
        throw new Error('Gist ID Not Found')
      }
      if (setting.gistFileName == '') {
        throw new Error('Gist File Not Found')
      }
      const bookmarks = await getBookmarks()
      const syncdata = new SyncDataInfo()
      syncdata.version = browser.runtime.getManifest().version
      syncdata.createDate = Date.now()
      syncdata.bookmarks = formatBookmarks(bookmarks)
      syncdata.browser = navigator.userAgent
      await BookmarkService.update({
        files: {
          [setting.gistFileName]: {
            content: JSON.stringify(syncdata),
          },
        },
        description: setting.gistFileName,
      })
      const count = getBookmarkCount(syncdata.bookmarks)
      await browser.storage.local.set({ remoteCount: count })
      await persistSyncMetaAfterSuccess(syncdata.createDate)
      await refreshLocalCount()
      browser.action.setBadgeText({ text: '' })
      void maybeBroadcastInPageSyncToast('upload')
      if (!quiet && setting.enableNotify) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('uploadBookmarks'),
          message: browser.i18n.getMessage('success'),
        })
      }
    } catch (error: any) {
      console.error(error)
      setting = await Setting.build()
      if (!quiet || setting.enableNotify) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('uploadBookmarks'),
          message: `${browser.i18n.getMessage('error')}：${error.message}`,
        })
      }
    }
  }

  async function downloadBookmarks(options: UploadDownloadOptions = {}) {
    const quiet = options.quiet === true
    let setting = await Setting.build()
    try {
      const gist = await BookmarkService.get()
      if (gist) {
        const syncdata: SyncDataInfo = JSON.parse(gist)
        if (syncdata.bookmarks == undefined || syncdata.bookmarks.length == 0) {
          if (!quiet && setting.enableNotify) {
            await browser.notifications.create({
              type: 'basic',
              iconUrl: iconLogo,
              title: browser.i18n.getMessage('downloadBookmarks'),
              message: `${browser.i18n.getMessage('error')}：Gist File ${setting.gistFileName} is NULL`,
            })
          }
          return
        }
        await clearBookmarkTree()
        await createBookmarkTree(syncdata.bookmarks)
        const count = getBookmarkCount(syncdata.bookmarks)
        await browser.storage.local.set({ remoteCount: count })
        const remoteCreateDate = Number(syncdata.createDate) || Date.now()
        await persistSyncMetaAfterSuccess(remoteCreateDate)
        void maybeBroadcastInPageSyncToast('download')
        if (!quiet && setting.enableNotify) {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: iconLogo,
            title: browser.i18n.getMessage('downloadBookmarks'),
            message: browser.i18n.getMessage('success'),
          })
        }
      } else {
        if (!quiet || setting.enableNotify) {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: iconLogo,
            title: browser.i18n.getMessage('downloadBookmarks'),
            message: `${browser.i18n.getMessage('error')}：Gist File ${setting.gistFileName} Not Found`,
          })
        }
      }
    } catch (error: any) {
      console.error(error)
      setting = await Setting.build()
      if (!quiet || setting.enableNotify) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('downloadBookmarks'),
          message: `${browser.i18n.getMessage('error')}：${error.message}`,
        })
      }
    }
  }

  /**
   * 手动双向同步（与 HM 顶栏逻辑一致）：本地 dirty 则优先上传；否则拉取 Gist 比对 createDate，
   * 远端更新则下载，本地 lastSynced 更新则上传，时间一致则提示已同步。
   */
  async function manualBidirectionalSync(): Promise<void> {
    cancelDebouncedAutoUpload()
    const setting = await Setting.build()
    if (!setting.githubToken || !setting.gistID || !setting.gistFileName) {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('manualSyncBookmarks'),
        message: browser.i18n.getMessage('gistConfigIncomplete'),
      })
      return
    }

    if (await isGistDirty()) {
      await uploadBookmarks({ quiet: false })
      return
    }

    let gist: string | null = null
    try {
      gist = await BookmarkService.get()
    } catch (e: any) {
      console.error('[BookmarkHub] manual sync: fetch gist failed', e)
      await browser.notifications.create({
        type: 'basic',
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('manualSyncBookmarks'),
        message: `${browser.i18n.getMessage('error')}：${e?.message ?? String(e)}`,
      })
      return
    }

    if (!gist) {
      await uploadBookmarks({ quiet: false })
      return
    }

    let syncdata: SyncDataInfo
    try {
      syncdata = JSON.parse(gist) as SyncDataInfo
    } catch {
      await uploadBookmarks({ quiet: false })
      return
    }

    const remoteTs = Number(syncdata.createDate) || 0
    const localTs = await getLastSyncedCreateDate()

    if (remoteTs > localTs) {
      await downloadBookmarks({ quiet: false })
    } else if (remoteTs < localTs) {
      await uploadBookmarks({ quiet: false })
    } else {
      if (setting.enableNotify) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('manualSyncBookmarks'),
          message: browser.i18n.getMessage('manualSyncUpToDate'),
        })
      }
      void maybeBroadcastInPageSyncToast('synced')
    }
  }

  async function getBookmarks() {
    const bookmarkTree: BookmarkInfo[] = await browser.bookmarks.getTree()
    if (bookmarkTree && bookmarkTree[0].id === 'root________') {
      curBrowserType = BrowserType.FIREFOX
    } else {
      curBrowserType = BrowserType.CHROME
    }
    return bookmarkTree
  }

  async function clearBookmarkTree() {
    try {
      const setting = await Setting.build()
      if (setting.githubToken == '') {
        throw new Error('Gist Token Not Found')
      }
      if (setting.gistID == '') {
        throw new Error('Gist ID Not Found')
      }
      if (setting.gistFileName == '') {
        throw new Error('Gist File Not Found')
      }
      const bookmarks = await getBookmarks()
      const tempNodes: BookmarkInfo[] = []
      bookmarks[0].children?.forEach((c) => {
        c.children?.forEach((d) => {
          tempNodes.push(d)
        })
      })
      if (tempNodes.length > 0) {
        for (const node of tempNodes) {
          if (node.id) {
            await browser.bookmarks.removeTree(node.id)
          }
        }
      }
      if (curOperType === OperType.REMOVE && setting.enableNotify) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('removeAllBookmarks'),
          message: browser.i18n.getMessage('success'),
        })
      }
    } catch (error: any) {
      console.error(error)
      await browser.notifications.create({
        type: 'basic',
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('removeAllBookmarks'),
        message: `${browser.i18n.getMessage('error')}：${error.message}`,
      })
    }
  }

  async function createBookmarkTree(bookmarkList: BookmarkInfo[] | undefined) {
    if (bookmarkList == null) {
      return
    }
    for (let i = 0; i < bookmarkList.length; i++) {
      const node = bookmarkList[i]
      if (
        node.title == RootBookmarksType.MenuFolder ||
        node.title == RootBookmarksType.MobileFolder ||
        node.title == RootBookmarksType.ToolbarFolder ||
        node.title == RootBookmarksType.UnfiledFolder
      ) {
        if (curBrowserType == BrowserType.FIREFOX) {
          switch (node.title) {
            case RootBookmarksType.MenuFolder:
              node.children?.forEach((c) => (c.parentId = 'menu________'))
              break
            case RootBookmarksType.MobileFolder:
              node.children?.forEach((c) => (c.parentId = 'mobile______'))
              break
            case RootBookmarksType.ToolbarFolder:
              node.children?.forEach((c) => (c.parentId = 'toolbar_____'))
              break
            case RootBookmarksType.UnfiledFolder:
              node.children?.forEach((c) => (c.parentId = 'unfiled_____'))
              break
            default:
              node.children?.forEach((c) => (c.parentId = 'unfiled_____'))
              break
          }
        } else {
          switch (node.title) {
            case RootBookmarksType.MobileFolder:
              node.children?.forEach((c) => (c.parentId = '3'))
              break
            case RootBookmarksType.ToolbarFolder:
              node.children?.forEach((c) => (c.parentId = '1'))
              break
            case RootBookmarksType.UnfiledFolder:
            case RootBookmarksType.MenuFolder:
              node.children?.forEach((c) => (c.parentId = '2'))
              break
            default:
              node.children?.forEach((c) => (c.parentId = '2'))
              break
          }
        }
        await createBookmarkTree(node.children)
        continue
      }

      let res: Bookmarks.BookmarkTreeNode = { id: '', title: '' }
      try {
        /* 处理firefox中创建 chrome://chrome-urls/ 格式的书签会报错的问题 */
        res = await browser.bookmarks.create({
          parentId: node.parentId,
          title: node.title,
          url: node.url,
        })
      } catch (err) {
        console.error(res, err)
      }
      if (res.id && node.children && node.children.length > 0) {
        node.children.forEach((c) => (c.parentId = res.id))
        await createBookmarkTree(node.children)
      }
    }
  }

  function getBookmarkCount(bookmarkList: BookmarkInfo[] | undefined) {
    let count = 0
    if (bookmarkList) {
      bookmarkList.forEach((c) => {
        if (c.url) {
          count = count + 1
        } else {
          count = count + getBookmarkCount(c.children)
        }
      })
    }
    return count
  }

  async function refreshLocalCount() {
    const bookmarkList = await getBookmarks()
    const count = getBookmarkCount(bookmarkList)
    await browser.storage.local.set({ localCount: count })
  }

  function formatBookmarks(bookmarks: BookmarkInfo[]): BookmarkInfo[] | undefined {
    if (bookmarks[0].children) {
      for (const a of bookmarks[0].children) {
        switch (a.id) {
          case '1':
          case 'toolbar_____':
            a.title = RootBookmarksType.ToolbarFolder
            break
          case 'menu________':
            a.title = RootBookmarksType.MenuFolder
            break
          case '2':
          case 'unfiled_____':
            a.title = RootBookmarksType.UnfiledFolder
            break
          case '3':
          case 'mobile______':
            a.title = RootBookmarksType.MobileFolder
            break
        }
      }
    }

    const a = format(bookmarks[0])
    return a.children
  }

  function format(b: BookmarkInfo): BookmarkInfo {
    b.dateAdded = undefined
    b.dateGroupModified = undefined
    b.id = undefined
    b.index = undefined
    b.parentId = undefined
    b.type = undefined
    b.unmodifiable = undefined
    if (b.children && b.children.length > 0) {
      b.children?.map((c) => format(c))
    }
    return b
  }
})
