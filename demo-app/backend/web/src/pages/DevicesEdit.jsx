import React, { Component } from "react";
import { observable, action, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { MDCTextFieldHelperText } from '@material/textfield/helper-text';
import { MDCSnackbar } from '@material/snackbar';
import { Container, Row, Col } from 'reactstrap';
import Snackbar from "../utils/Snackbar";
import DevicesModel from '../models/DevicesModel';
import FormModel from '../models/FormModel';
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
  @observable failedFetching = false;
  @observable notFound = false;
  @observable object;

  constructor(props) {
    super(props);

    this.state = {
      back: false,
    }

    this.form = new FormModel();

    autorun(() => {
      this.failedFetching = !DevicesModel.fetching && !DevicesModel.fetched;
      var notFound = false;
      var object;
      if (DevicesModel.fetched) {
        const objects = DevicesModel.data.filter((object) => (object.id == this.props.match.params.device_id));
        if (objects.length >= 1) {
            object = objects[0];
        } else {
            notFound = true;
        }
      }
      this.notFound = notFound;
      this.object = object;
      if (object && this.form.ref) {
        this.form.ref.elements["name"].value = object.name;
        this.form.ref.elements["description"].value = object.description;
        this.form.ref.elements["clientId"].value = object.clientId;
        this.form.ref.elements["username"].value = object.username;
        this.form.ref.elements["password"].value = object.password;
        this.form.ref.elements["url"].value = object.url;
        this.form.ref.elements["ttn_topic_to_subscribe"].value = object.ttn_topic_to_subscribe;
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
      }

      if(this.refs.deviceJSONConfig && this.object.hasOwnProperty("device_config"))
      {
        if(this.object.device_config.length > 2)
        {
          let settings = this.object.device_config;
          if(typeof settings !== 'string')
          {
            settings = JSON.stringify(settings);
          }
          this.refs.deviceJSONConfig.editor.getSession().setValue(settings);
        }
      }
    });
  }

  update(e) {
    if (e) {
      e.preventDefault();
    }
    var toUpdate = {
      name: this.form.values.name,
      description: this.form.values.description,
      clientId: this.form.values.clientId,
      username: this.form.values.username,
      password: this.form.values.password,
      url: this.form.values.url,
      ttn_topic_to_subscribe: this.form.values.ttn_topic_to_subscribe,
      device_config: JSON.stringify(this.refs.deviceJSONConfig.editor.getSession().getValue())

    };

    console.log("Values to update");
    console.log(toUpdate);
    DevicesModel.update(AuthModel.userInfo.get("id"), this.props.match.params.device_id, toUpdate).then((response) => {
      console.log(response);
      this.form.clearForm();
      this.setState({ back: true });
      DevicesModel.fetch(AuthModel.userInfo.get("id"));
      Snackbar.show("Updated device", "success");
    }).catch((error) => {
      Snackbar.show(new RestError(error).getMessage());
    });
  }

  componentWillMount() {
    DevicesModel.fetch(AuthModel.userInfo.get("id"));
  }

  componentDidMount() {
    document.querySelectorAll('.mdc-text-field').forEach((node) => {
        MDCTextField.attachTo(node);
    });
    document.querySelectorAll('.mdc-select').forEach((node) => {
        MDCSelect.attachTo(node);
    });
    document.querySelectorAll('.mdc-text-field-helper-text').forEach((node) => {
        MDCTextFieldHelperText.attachTo(node);
    });
  }

  render() {
    if (this.state.back === true) {
      return <Redirect to={'/users/' + AuthModel.userInfo.get("id") + '/devices/' + this.props.match.params.device_id} />
    }

    return (
      <div>
        <h3 className="mdc-typography--headline3">Edit Device</h3>
        <br />

        {
          (this.failedFetching || !DevicesModel.fetched || this.notFound) && (
              <div>
                  <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting device info' : (!DevicesModel.fetched ? 'Fetching device info' : 'Device not found')}</h5>
              </div>
          )
        }
        <form onSubmit={this.update.bind(this)} ref={this.form.setRef}>
          <div style={{ display: (this.failedFetching || !DevicesModel.fetched || this.notFound) ? 'none' : undefined }}>
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-name" className="mdc-floating-label">Name</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-clientId" name="clientId" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-clientId" className="mdc-floating-label">MQTT ClientId</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-username" name="username" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-username" className="mdc-floating-label">MQTT Username</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-password" name="password" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-password" className="mdc-floating-label">MQTT Password</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-url" name="url" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-url" className="mdc-floating-label">MQTT URL</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-ttn_topic_to_subscribe" name="ttn_topic_to_subscribe" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-url" className="mdc-floating-label">MQTT Topic to subscribe</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col >
            </Row >
            <Row className="mb-1">
              <Col md="6">
                <div className="mdc-text-field" style={{ width: "100%" }}>
                  <input type="text" id="device-update-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                  <label htmlFor="device-update-description" className="mdc-floating-label">[Optional] Description</label>
                  <div className="mdc-line-ripple"></div>
                </div>
              </Col>
            </Row>
          </div>
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
            <Link to={'/users/' + AuthModel.userInfo.get("id") + '/devices/' + this.props.match.params.device_id} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
            {
              !(this.failedFetching || !DevicesModel.fetched || this.notFound) && (
                  <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (DevicesModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
              )
            }
          </div>
        </form>
        <br/><br/><br/><br/>
      </div>
    )
  }
}
