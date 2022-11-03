import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { Container, Row, Col } from 'reactstrap';
import DevicesModel from '../models/DevicesModel';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-noconflict/mode-json';
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";

@observer
export default class extends React.Component {
    
    constructor(props) {
        super(props);

        this.state = {
            back: false,
        }

        this.form = new FormModel();
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
    }

    add(e) {
        if (e) {
            e.preventDefault();
        }

        let toAdd = {
          device_config: JSON.stringify(this.refs.deviceJSONConfig.editor.getSession().getValue()),
          ...this.form.values
        };

        console.log("Values to add");
        console.log(toAdd);
        DevicesModel.add(AuthModel.userInfo.get("id"), toAdd).then((response) => {
            this.form.clearForm();
            this.setState({ back: true })
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to={'/users/' + AuthModel.userInfo.get("id") + "/devices"}  />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Add Device</h3>
                <br />

                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" style={{display: "inline%"}} />
                                <label htmlFor="devices-add-name" className="mdc-floating-label">Name</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    Leave the below fields empty if you want to send the data to this device using IoT platform MQTT gateway!!

                   {/* <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                Select MQTT Gateway Type:

                                <select onChange="val()" id="select_id">
                                    <option value="0">TTN MQTT</option>
                                    <option value="1">IoT Platform MQTT</option>
                                </select>
                            </div>
                        </Col>
                    </Row>*/}

                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-clientId" name="clientId" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-clientId" className="mdc-floating-label">[Optional] MQTT ClientId</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-username" name="username" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-username" className="mdc-floating-label">[Optional] MQTT Username</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-password" name="password" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-password" className="mdc-floating-label">[Optional] MQTT Password</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-url" name="url" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true"  />
                                <label htmlFor="devices-add-url" className="mdc-floating-label">[Optional] MQTT URL</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="devices-add-url" name="ttn_topic_to_subscribe" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true"  />
                                <label htmlFor="devices-add-ttn_topic_to_subscribe" className="mdc-floating-label">[Optional] MQTT Topic to subscribe</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="devices-add-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-description" className="mdc-floating-label">[Optional] Description</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <div>
                      <h5 className="mdc-typography--headline5">Device's Configuration</h5>
                      <AceEditor
                        style={{
                        height: '40vh',
                        width: '30%',
                        }}

                        placeholder='{}'
                        value={
                        "{}"
                        }
                        mode='json'
                        ref='deviceJSONConfig'
                        theme='textmate'
                        orientation='beside'
                        name='deviceShowJSONConfig'
                        readOnly={false}
                        fontSize={14}
                        onLoad={this.onLoad}
                        onChange={this.onChange}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                            useWorker: false,
                            showLineNumbers: true,
                            tabSize: 2,
                        }}
                      />
                    </div>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/users/' + AuthModel.userInfo.get("id") + "/devices"}  className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (DevicesModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                    </div>
                </form>
                <br/><br/><br/><br/>
            </div>
        )
    }
}
