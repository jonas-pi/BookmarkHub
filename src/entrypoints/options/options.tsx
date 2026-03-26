import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client';
import { Container, Form, Button, Col, Row, InputGroup } from 'react-bootstrap';
import { useForm } from "react-hook-form";
import 'bootstrap/dist/css/bootstrap.min.css';
import './options.css'
import optionsStorage from '../../utils/optionsStorage'
const Popup: React.FC = () => {
    const { register, setValue } = useForm();
    useEffect(() => {
        optionsStorage.syncForm('#formOptions');
    }, [])

    return (
        <Container fluid>
            <Form id='formOptions' name='formOptions'>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('githubToken')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <InputGroup size="sm">
                            <Form.Control name="githubToken" ref={register} type="text" placeholder="github token" size="sm" />
                            <InputGroup.Append>
                                <Button variant="outline-secondary" as="a" target="_blank" href="https://github.com/settings/tokens/new" size="sm">Get Token</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('gistID')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control name="gistID" ref={register} type="text" placeholder="gist ID" size="sm" />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('gistFileName')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control name="gistFileName" ref={register} type="text" placeholder="gist file name" size="sm" />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('enableNotifications')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableNotify"
                            name="enableNotify"
                            ref={register}
                            type="switch"
                        />
                    </Col>
                </Form.Group>
                {/* 半自动同步：仍使用 GitHub Gist，与 HM 端 createDate + dirty 语义对齐 */}
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('autoUploadAfterChange')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="autoUploadAfterChange"
                            name="autoUploadAfterChange"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">{browser.i18n.getMessage('autoUploadAfterChangeHint')}</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('autoPullInterval')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control as="select" name="autoPullPeriodMinutes" ref={register} size="sm">
                            <option value="0">{browser.i18n.getMessage('autoPullOff')}</option>
                            <option value="15">{browser.i18n.getMessage('autoPullEvery15')}</option>
                            <option value="30">{browser.i18n.getMessage('autoPullEvery30')}</option>
                            <option value="60">{browser.i18n.getMessage('autoPullEvery60')}</option>
                        </Form.Control>
                        <Form.Text className="text-muted">{browser.i18n.getMessage('autoPullIntervalHint')}</Form.Text>
                    </Col>
                </Form.Group>
                {/* 手动同步补充入口：快捷键与网页悬浮钮，逻辑与鸿蒙顶栏一致，用户可分别关闭 */}
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('enableManualSyncHotkey')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableManualSyncHotkey"
                            name="enableManualSyncHotkey"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">{browser.i18n.getMessage('enableManualSyncHotkeyHint')}</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('enableFloatingSyncButton')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableFloatingSyncButton"
                            name="enableFloatingSyncButton"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">{browser.i18n.getMessage('enableFloatingSyncButtonHint')}</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('syncOnNewBookmark')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="syncOnNewBookmark"
                            name="syncOnNewBookmark"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">{browser.i18n.getMessage('syncOnNewBookmarkHint')}</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('showInPageSyncToast')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="showInPageSyncToast"
                            name="showInPageSyncToast"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">{browser.i18n.getMessage('showInPageSyncToastHint')}</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}></Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <a href="https://github.com/dudor/BookmarkHub" target="_blank">{browser.i18n.getMessage('help')}</a>
                    </Col>
                </Form.Group>
            </Form>
        </Container >
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
  );
  