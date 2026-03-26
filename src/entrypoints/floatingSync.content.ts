import { defineContentScript } from 'wxt/sandbox'
import optionsStorage from '../utils/optionsStorage'

/**
 * webext-options-sync 把整个表单打成一条写入 sync（默认键名为 `options`）。
 */
const OPTIONS_BLOB_KEY = 'options'

const KEY_COLLAPSED = 'hmFloatingSyncCollapsed'
/** 展开态拖动后的位置（像素） */
const KEY_POSITION = 'hmFloatingSyncPosition'
/** 贴边收起时竖条顶边距视口顶部的像素，与收起前展开条位置对齐 */
const KEY_DOCK_TOP = 'hmFloatingDockTopPx'

type SavedPos = { left: number; top: number }

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    void init()
  },
})

async function isFloatEnabled(): Promise<boolean> {
  const all = (await optionsStorage.getAll()) as Record<string, unknown>
  return all.enableFloatingSyncButton === true
}

async function isCollapsed(): Promise<boolean> {
  const r = await browser.storage.local.get(KEY_COLLAPSED)
  return r[KEY_COLLAPSED] === true
}

async function setCollapsed(v: boolean): Promise<void> {
  await browser.storage.local.set({ [KEY_COLLAPSED]: v })
}

async function loadSavedPosition(): Promise<SavedPos | null> {
  const r = await browser.storage.local.get(KEY_POSITION)
  const p = r[KEY_POSITION] as SavedPos | undefined
  if (p && typeof p.left === 'number' && typeof p.top === 'number') {
    return p
  }
  return null
}

async function savePosition(left: number, top: number): Promise<void> {
  await browser.storage.local.set({ [KEY_POSITION]: { left, top } })
}

/** 收起态竖条用的 top（像素）；无记录时返回 null，使用默认垂直居中 */
async function loadSavedDockTop(): Promise<number | null> {
  const r = await browser.storage.local.get(KEY_DOCK_TOP)
  const t = r[KEY_DOCK_TOP]
  if (typeof t === 'number' && Number.isFinite(t)) {
    return t
  }
  return null
}

async function saveDockTopPx(top: number): Promise<void> {
  await browser.storage.local.set({ [KEY_DOCK_TOP]: top })
}

function removeHost(): void {
  document.getElementById('hm-float-sync-host')?.remove()
}

/** 页内同步提示：与悬浮钮共用 content script，不依赖是否开启悬浮 */
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showSyncToast(kind: 'upload' | 'download' | 'synced', iconUrl: string): void {
  if (toastTimer !== undefined) {
    clearTimeout(toastTimer)
    toastTimer = undefined
  }
  document.getElementById('hm-bh-toast-host')?.remove()

  const host = document.createElement('div')
  host.id = 'hm-bh-toast-host'
  Object.assign(host.style, {
    all: 'initial',
    position: 'fixed',
    left: '0',
    top: '0',
    width: '0',
    height: '0',
    pointerEvents: 'none',
    zIndex: '2147483647',
  })

  const shadow = host.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = `
    * { box-sizing: border-box; }
    .toast {
      pointer-events: auto;
      position: fixed;
      top: 16px;
      right: 16px;
      max-width: min(360px, calc(100vw - 24px));
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      line-height: 1.35;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      background: #ffffff;
      color: #111827;
      border: 1px solid rgba(0,0,0,0.08);
    }
    /* object-fit：保持 PNG 宽高比，避免在固定方框内被压扁或拉伸 */
    .toast img { width: 28px; height: 28px; flex-shrink: 0; border-radius: 6px; object-fit: contain; }
    @media (prefers-color-scheme: dark) {
      .toast {
        background: #1f2937;
        color: #f3f4f6;
        border-color: rgba(255,255,255,0.12);
        box-shadow: 0 6px 28px rgba(0,0,0,0.45);
      }
    }
  `
  shadow.appendChild(style)

  const wrap = document.createElement('div')
  wrap.className = 'toast'
  const img = document.createElement('img')
  img.src = iconUrl
  img.alt = ''
  img.draggable = false
  // 若仍加载失败（例如旧版未含 web_accessible_resources），隐藏裂图以免占位难看
  img.addEventListener(
    'error',
    () => {
      img.style.display = 'none'
    },
    { once: true },
  )
  const text = document.createElement('span')
  if (kind === 'upload') {
    text.textContent = browser.i18n.getMessage('inPageToastUploaded')
  } else if (kind === 'download') {
    text.textContent = browser.i18n.getMessage('inPageToastPulled')
  } else {
    text.textContent = browser.i18n.getMessage('inPageToastSynced')
  }
  wrap.appendChild(img)
  wrap.appendChild(text)
  shadow.appendChild(wrap)
  document.documentElement.appendChild(host)

  toastTimer = setTimeout(() => {
    host.remove()
    toastTimer = undefined
  }, 3800)
}

/**
 * 始终注册消息监听（页内 Toast）；悬浮钮按选项挂载。
 */
async function init(): Promise<void> {
  browser.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as { type?: string; kind?: string; iconUrl?: string }
    if (m?.type === 'hmShowSyncToast' && m.kind && m.iconUrl) {
      const k = m.kind as 'upload' | 'download' | 'synced'
      if (k === 'upload' || k === 'download' || k === 'synced') {
        showSyncToast(k, m.iconUrl)
      }
    }
  })

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !(OPTIONS_BLOB_KEY in changes)) {
      return
    }
    void reapplyFloatVisibility()
  })

  if (await isFloatEnabled()) {
    void mountHost()
  }
}

async function reapplyFloatVisibility(): Promise<void> {
  if (await isFloatEnabled()) {
    void mountHost()
  } else {
    removeHost()
  }
}

let syncBusy = false

async function mountHost(): Promise<void> {
  if (document.getElementById('hm-float-sync-host')) {
    return
  }

  const collapsed = await isCollapsed()
  const savedPos = collapsed ? null : await loadSavedPosition()
  const savedDockTop = collapsed ? await loadSavedDockTop() : null

  const host = document.createElement('div')
  host.id = 'hm-float-sync-host'
  host.setAttribute('data-hm-bookmarkhub-floating', '1')
  Object.assign(host.style, {
    all: 'initial',
    position: 'fixed',
    left: '0',
    top: '0',
    width: '0',
    height: '0',
    pointerEvents: 'none',
    zIndex: '2147483646',
  })

  const shadow = host.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = `
    * { box-sizing: border-box; }
    .panel { pointer-events: auto; position: fixed; transition: opacity 0.2s ease; }
    .panel.expanded {
      display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
      bottom: 20px; right: 20px;
    }
    .panel.expanded.custom-pos { bottom: auto !important; right: auto !important; }
    .panel.collapsed { right: 0; position: fixed; }
    /* 无记忆位置：竖条垂直居中 */
    .panel.collapsed.dock-center { top: 50%; transform: translateY(-50%); }
    /* 有记忆位置：与收起前展开区域同一高度（top 由内联样式设置） */
    .panel.collapsed.dock-at-saved { transform: none; }
    .row { display: flex; flex-direction: row; align-items: center; gap: 8px; }
    .drag-handle {
      width: 22px; height: 40px; border-radius: 8px; cursor: grab;
      background: rgba(37, 99, 235, 0.25);
      border: 1px dashed rgba(37, 99, 235, 0.55);
      flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px; padding: 4px 0;
    }
    .drag-handle:active { cursor: grabbing; }
    .drag-dot { width: 4px; height: 4px; border-radius: 50%; background: #2563eb; opacity: 0.85; }
    .fab {
      width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(145deg, #2563eb, #1d4ed8); color: #fff;
      font-size: 22px; line-height: 1; box-shadow: 0 4px 14px rgba(37,99,235,0.45);
      display: flex; align-items: center; justify-content: center;
    }
    .fab:disabled { opacity: 0.55; cursor: wait; }
    .fab:hover:not(:disabled) { filter: brightness(1.07); }
    .dock {
      min-height: 80px; width: 14px; border-radius: 8px 0 0 8px; cursor: pointer;
      background: linear-gradient(180deg, #2563eb, #1e3a8a); color: #fff;
      writing-mode: vertical-rl; text-orientation: mixed; font-size: 10px; font-weight: 600;
      letter-spacing: 0.12em; padding: 8px 0; user-select: none;
      display: flex; align-items: center; justify-content: center;
      box-shadow: -2px 2px 10px rgba(0,0,0,0.18);
    }
    .dock:hover { filter: brightness(1.08); }
    .icon-btn {
      width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.35);
      background: rgba(30,58,138,0.92); color: #fff; cursor: pointer; font-size: 15px; line-height: 1;
    }
    .icon-btn:hover { background: rgba(30,58,138,1); }
    @media (prefers-color-scheme: dark) {
      .drag-handle {
        background: rgba(96, 165, 250, 0.2);
        border-color: rgba(96, 165, 250, 0.45);
      }
      .drag-dot { background: #93c5fd; }
      .fab {
        background: linear-gradient(145deg, #3b82f6, #2563eb);
        box-shadow: 0 4px 18px rgba(0,0,0,0.35);
      }
      .dock {
        background: linear-gradient(180deg, #3b82f6, #1e40af);
        box-shadow: -2px 2px 14px rgba(0,0,0,0.4);
      }
      .icon-btn {
        background: rgba(30, 64, 175, 0.95);
        border-color: rgba(255,255,255,0.2);
      }
    }
  `
  shadow.appendChild(style)

  const panel = document.createElement('div')
  panel.className = 'panel ' + (collapsed ? 'collapsed' : 'expanded')

  if (collapsed) {
    /** 竖条大致高度（与 .dock min-height + padding 一致，用于边界夹紧） */
    const dockBlockHeight = 96
    if (savedDockTop != null) {
      panel.classList.add('dock-at-saved')
      let t = Math.round(savedDockTop)
      t = Math.min(Math.max(8, t), Math.max(8, window.innerHeight - dockBlockHeight - 8))
      panel.style.top = `${t}px`
    } else {
      panel.classList.add('dock-center')
    }

    const dock = document.createElement('div')
    dock.className = 'dock'
    dock.textContent = browser.i18n.getMessage('floatingSyncPeek')
    dock.title = browser.i18n.getMessage('floatingSyncExpand')
    dock.addEventListener('click', async () => {
      await setCollapsed(false)
      removeHost()
      void mountHost()
    })
    panel.appendChild(dock)
  } else {
    if (savedPos) {
      panel.classList.add('custom-pos')
      panel.style.left = `${savedPos.left}px`
      panel.style.top = `${savedPos.top}px`
    }

    const row = document.createElement('div')
    row.className = 'row'

    const dragHandle = document.createElement('div')
    dragHandle.className = 'drag-handle'
    dragHandle.title = browser.i18n.getMessage('floatingSyncDragHint')
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div')
      d.className = 'drag-dot'
      dragHandle.appendChild(d)
    }

    let dragging = false
    let sx = 0
    let sy = 0
    let sl = 0
    let st = 0

    const onMove = (e: MouseEvent) => {
      if (!dragging) {
        return
      }
      e.preventDefault()
      let nl = sl + (e.clientX - sx)
      let nt = st + (e.clientY - sy)
      const rect = panel.getBoundingClientRect()
      const pw = rect.width || 120
      const ph = rect.height || 56
      const maxL = Math.max(8, window.innerWidth - pw - 8)
      const maxT = Math.max(8, window.innerHeight - ph - 8)
      nl = Math.min(Math.max(8, nl), maxL)
      nt = Math.min(Math.max(8, nt), maxT)
      panel.classList.add('custom-pos')
      panel.style.left = `${nl}px`
      panel.style.top = `${nt}px`
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
    }

    const onUp = () => {
      if (!dragging) {
        return
      }
      dragging = false
      const r = panel.getBoundingClientRect()
      void savePosition(r.left, r.top)
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('mouseup', onUp, true)
    }

    dragHandle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const r = panel.getBoundingClientRect()
      dragging = true
      sx = e.clientX
      sy = e.clientY
      sl = r.left
      st = r.top
      document.addEventListener('mousemove', onMove, true)
      document.addEventListener('mouseup', onUp, true)
    })

    const hideBtn = document.createElement('button')
    hideBtn.type = 'button'
    hideBtn.className = 'icon-btn'
    hideBtn.textContent = '»'
    hideBtn.title = browser.i18n.getMessage('floatingSyncHide')
    hideBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      /* 按当前展开条位置记录竖条 top，收起后贴边条出现在同一垂直区域 */
      const r = panel.getBoundingClientRect()
      const dockBlockHeight = 96
      let topPx = Math.round(r.top)
      topPx = Math.min(Math.max(8, topPx), Math.max(8, window.innerHeight - dockBlockHeight - 8))
      await saveDockTopPx(topPx)
      await setCollapsed(true)
      removeHost()
      void mountHost()
    })

    const fab = document.createElement('button')
    fab.type = 'button'
    fab.className = 'fab'
    fab.title = browser.i18n.getMessage('manualSyncBookmarksDesc')
    fab.textContent = '↻'
    fab.addEventListener('click', () => {
      void triggerSync(fab)
    })

    row.appendChild(dragHandle)
    row.appendChild(hideBtn)
    row.appendChild(fab)
    panel.appendChild(row)
  }

  shadow.appendChild(panel)
  document.documentElement.appendChild(host)
}

async function triggerSync(fab: HTMLButtonElement): Promise<void> {
  if (syncBusy) {
    return
  }
  syncBusy = true
  fab.disabled = true
  try {
    await browser.runtime.sendMessage({ name: 'manualSync' })
  } catch (e) {
    console.error('[HM-BookmarkHub] floating sync failed', e)
  } finally {
    syncBusy = false
    fab.disabled = false
  }
}
