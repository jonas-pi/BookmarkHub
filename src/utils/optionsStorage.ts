import OptionsSync from 'webext-options-sync';
/* global OptionsSync */

export default new OptionsSync({
    defaults: {
        /** github | gitee */
        gistProvider: 'github',
        githubToken: '',
        gistID: '',
        gistFileName: 'BookmarkHub',
        enableNotify: true,
        githubURL: 'https://api.github.com',
        /** 书签变更后防抖上传到 Gist（与 HM 端「编辑后自动上传」一致） */
        autoUploadAfterChange: false,
        /** 0=关闭；≥1 时注册 chrome.alarms 周期拉取，且浏览器启动时尝试拉取一次 */
        autoPullPeriodMinutes: 0,
        /** 是否响应扩展命令（快捷键）触发手动同步；关闭后仅不处理快捷键，仍可点弹窗/悬浮钮 */
        enableManualSyncHotkey: true,
        /** 在普通网页右下角注入可收起的悬浮同步按钮（http/https） */
        enableFloatingSyncButton: false,
        /**
         * 仅当「书签新增」时（onCreated）也走防抖上传；可与「任意书签变更后上传」叠加。
         * 关闭后仅依赖 autoUploadAfterChange 才会在编辑书签时上传。
         */
        syncOnNewBookmark: true,
        /** 同步成功后在当前网页右上角显示轻量提示（图标+已上传/已拉取），与系统通知独立 */
        showInPageSyncToast: true,
    },

    // List of functions that are called when the extension is updated
    migrations: [
        (savedOptions, currentDefaults) => {
            // Perhaps it was renamed
            // if (savedOptions.colour) {
            //     savedOptions.color = savedOptions.colour;
            //delete savedOptions.colour;
            // }
        },

        // Integrated utility that drops any properties that don't appear in the defaults
        OptionsSync.migrations.removeUnused
    ],
    logging: false
});