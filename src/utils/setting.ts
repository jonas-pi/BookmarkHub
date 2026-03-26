import { Options } from 'webext-options-sync';
import optionsStorage from './optionsStorage'
export class SettingBase implements Options {
    constructor() { }
    [key: string]: string | number | boolean;
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
        let options = await optionsStorage.getAll();
        let setting = new Setting();
        setting.gistID = options.gistID;
        setting.gistFileName = options.gistFileName;
        setting.githubToken = options.githubToken;
        setting.enableNotify = options.enableNotify;
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
