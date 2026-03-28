import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client';
import { Dropdown, Badge, Button, Spinner } from 'react-bootstrap';
import { IconContext } from 'react-icons'
import {
    AiOutlineCloudUpload, AiOutlineCloudDownload,
    AiOutlineCloudSync, AiOutlineSetting, AiOutlineClear,
    AiOutlineInfoCircle, AiOutlineGithub
} from 'react-icons/ai'
import 'bootstrap/dist/css/bootstrap.min.css';
import './popup.css'

const Popup: React.FC = () => {
    const [count, setCount] = useState({ local: "0", remote: "0" })
    const [manualBusy, setManualBusy] = useState(false)

    const refreshCounts = useCallback(async () => {
        const data = await browser.storage.local.get(["localCount", "remoteCount"]);
        setCount({ local: String(data["localCount"] ?? '0'), remote: String(data["remoteCount"] ?? '0') });
    }, [])

    useEffect(() => {
        document.addEventListener('click', (e: MouseEvent) => {
            let elem = e.target as HTMLInputElement;
            if (elem != null && elem.className === 'dropdown-item') {
                elem.setAttribute('disabled', 'disabled');
                browser.runtime.sendMessage({ name: elem.name })
                    .then(() => {
                        elem.removeAttribute('disabled');
                        void refreshCounts();
                    })
                    .catch(() => {
                        elem.removeAttribute('disabled');
                    });
            }
        });
    }, [refreshCounts])

    useEffect(() => {
        void refreshCounts();
    }, [refreshCounts])

    /** 手动同步：走 background 与 HM 一致的比对逻辑 */
    const onManualSync = async () => {
        if (manualBusy) return
        setManualBusy(true)
        try {
            await browser.runtime.sendMessage({ name: 'manualSync' })
            await refreshCounts()
        } catch (e) {
            console.error(e)
        } finally {
            setManualBusy(false)
        }
    }

    return (
        <IconContext.Provider value={{ className: 'dropdown-item-icon' }}>
            <div className="hm-popup-toolbar-hint">{browser.i18n.getMessage('syncViaToolbarHint')}</div>
            <Button
                variant="primary"
                size="sm"
                className="hm-manual-sync-btn w-100 d-flex align-items-center justify-content-center"
                onClick={() => void onManualSync()}
                disabled={manualBusy}
                title={browser.i18n.getMessage('manualSyncBookmarksDesc')}
            >
                {manualBusy ? (
                    <Spinner animation="border" size="sm" className="mr-2" />
                ) : (
                    <AiOutlineCloudSync className="dropdown-item-icon mr-1" />
                )}
                {browser.i18n.getMessage('manualSyncBookmarks')}
            </Button>
            <Dropdown.Menu show>
                <Dropdown.Item name='upload' as="button" title={browser.i18n.getMessage('uploadBookmarksDesc')}><AiOutlineCloudUpload />{browser.i18n.getMessage('uploadBookmarks')}</Dropdown.Item>
                <Dropdown.Item name='download' as="button" title={browser.i18n.getMessage('downloadBookmarksDesc')}><AiOutlineCloudDownload />{browser.i18n.getMessage('downloadBookmarks')}</Dropdown.Item>
                <Dropdown.Item name='removeAll' as="button" title={browser.i18n.getMessage('removeAllBookmarksDesc')}><AiOutlineClear />{browser.i18n.getMessage('removeAllBookmarks')}</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item name='setting' as="button"><AiOutlineSetting />{browser.i18n.getMessage('settings')}</Dropdown.Item>
                <Dropdown.ItemText>
                    <AiOutlineInfoCircle /><a href="https://github.com/jonas-pi/BookmarkHub" target="_blank" rel="noreferrer">{browser.i18n.getMessage('help')}</a>|
                    <Badge id="localCount" variant="light" title={browser.i18n.getMessage('localCount')}>{count["local"]}</Badge>/<Badge id="remoteCount" variant="light" title={browser.i18n.getMessage('remoteCount')}>{count["remote"]}</Badge>|
                    <a href="https://github.com/jonas-pi" target="_blank" rel="noreferrer" title={browser.i18n.getMessage('author')}><AiOutlineGithub /></a>
                </Dropdown.ItemText>
            </Dropdown.Menu >
        </IconContext.Provider>
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
);

