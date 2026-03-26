import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: 'en',
    /** tabs：向当前活动 http(s) 标签页发送页内同步提示 */
    permissions: ['storage', 'bookmarks', 'notifications', 'alarms', 'tabs'],
    host_permissions: ["https://*.github.com/", "https://*.githubusercontent.com/"],
    optional_host_permissions: [
      "*://*/*",
    ],
    /** 手动同步快捷键（用户可在 chrome://extensions/shortcuts 中改键） */
    commands: {
      'manual-sync': {
        suggested_key: {
          default: 'Alt+Shift+G',
          mac: 'Alt+Shift+G',
        },
        description: '__MSG_commandManualSync__',
      },
    },
    /**
     * 页内 Toast 在 https 页面里用 <img src="chrome-extension://.../icons/48.png">。
     * MV3 默认扩展资源不对网页开放，不声明则图片请求被拒绝，表现为裂图或图标异常。
     */
    web_accessible_resources: [
      {
        resources: ['icons/16.png', 'icons/32.png', 'icons/48.png', 'icons/128.png'],
        matches: ['<all_urls>'],
      },
    ],
  }
});
