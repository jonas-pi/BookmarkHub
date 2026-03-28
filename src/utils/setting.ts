import { Options } from 'webext-options-sync';
import optionsStorage from './optionsStorage'
export class SettingBase implements Options {
    constructor() { }
    [key: string]: string | number | boolean;
    /** `github` | `gitee`，与 HM 端 gistProvider 一致 */
    gistProvider: string = 'github';
    githubToken: string = '';
    gistID: string = '';
    gistFileName: string = 'BookmarkHub';
    enableNotify: boolean = true;
    githubURL: string = 'https://api.github.com';
    autoUploadAfterChange: boolean = false;
    autoPullPeriodMinutes: number = 0;
    enableManualSyncHotkey: boolean = true;
    enableFloatingSyncButton: boolean = false;
    syncOnNewBookmark: boolean = true;
    showInPageSyncToast: boolean = true;
}
export class Setting extends SettingBase {
    private constructor() { super() }
    static async build() {
        const options = await optionsStorage.getAll() as Record<string, string | number | boolean>;
        let setting = new Setting();
        setting.gistProvider = options.gistProvider === 'gitee' ? 'gitee' : 'github';
        setting.gistID = String(options.gistID ?? '');
        setting.gistFileName = String(options.gistFileName ?? '');
        setting.githubToken = String(options.githubToken ?? '');
        setting.enableNotify = options.enableNotify !== false;
        setting.autoUploadAfterChange = options.autoUploadAfterChange === true;
        const ap = Number(options.autoPullPeriodMinutes);
        setting.autoPullPeriodMinutes = Number.isFinite(ap) && ap >= 0 ? Math.floor(ap) : 0;
        setting.enableManualSyncHotkey = options.enableManualSyncHotkey !== false;
        setting.enableFloatingSyncButton = options.enableFloatingSyncButton === true;
        setting.syncOnNewBookmark = options.syncOnNewBookmark !== false;
        setting.showInPageSyncToast = options.showInPageSyncToast !== false;
        return setting;
    }
}
