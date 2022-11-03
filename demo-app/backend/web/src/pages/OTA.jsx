import React, { Component } from "react";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { MDCTextFieldHelperText } from '@material/textfield/helper-text';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import {MDCFormField} from '@material/form-field';
import {MDCCheckbox} from '@material/checkbox';
import OTAModel from "../models/OTA";
import AuthModel from "../models/AuthModel";
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import FormModel from "../models/FormModel";
import {Container, Row, Col} from 'reactstrap';
import OTA from "../models/OTA";

@observer
export default class extends React.Component {
  @observable adding = false;
  @observable checkDevices = []
  @observable buttonDisable = true;
  constructor(props)
  {
    super(props);

    this.state = {
      back: false,
      filenameErr: "",
      selectedFile: "No file selected...",
      activeCollapse: "",
      subactiveCollapse: ""
    }

    this.form = new FormModel();
  }

  fetchData() {
    OTA.fetch(AuthModel.userInfo.get("id")).then((response) => {
      OTA.data = response.data.result;
      OTA.devices = response.data.devices;
      if(OTA.data.length > 0) {
        OTA.data = OTA.data.reverse();
      }
      OTA.fetching = false;
      OTA.fetched = true;
      this.checkDevices = [];
    }).catch(err => {
      OTA.fetched = false;
      OTA.fetching = false;
      Snackbar.show(new RestError(err).getMessage);
    });
  }

  componentDidMount()
  {
    this.fetchData()

    document.querySelectorAll('.mdc-text-field').forEach((node) => {
      MDCTextField.attachTo(node);
    });
    document.querySelectorAll('.mdc-select').forEach((node) => {
        MDCSelect.attachTo(node);
    });
    document.querySelectorAll('.mdc-text-field-helper-text').forEach((node) => {
        MDCTextFieldHelperText.attachTo(node);
    });

    let checkboxes = [];
    let forms = [];
    document.querySelectorAll('.mdc-checkbox').forEach((node) => {
      MDCCheckbox.attachTo(node);
      checkboxes.push(node);
    });
    document.querySelectorAll('.mdc-form-field').forEach((node) => {
      MDCFormField.attachTo(node);
      forms.push(node);
    });

    for(let i = 0; i < checkboxes.length; ++i)
    {
      forms[i].input = checkboxes[i];
    }
  }

  add(e)
  {
    if(e){
      e.preventDefault();
    }

    let devicesToAdd = [];
    for(let i = 0; i < OTA.devices.length; i++) {
      if(this.checkDevices[i][`checkbox-${OTA.devices[i]['id']}`].checked) {
        devicesToAdd.push({
          "device_id": this.checkDevices[i]['device_id']
        });
      }
    }

    if(devicesToAdd.length <= 0) {
      Snackbar.show('You just added a OTA for no device', 'warning');
    }

    this.adding = true;
    let firmware = document.getElementById('firmwareFile').files[0];
    let firmName = document.getElementById('firmwareName').value;
    let fileName = firmware.name;
    let filesize = firmware.size;
    let firmChange = document.getElementById('firmwareChanges').value;
    
    let sendData = new FormData();
    sendData.append('firmware', firmware);
    sendData.append('name', firmName);
    sendData.append('filename', fileName);
    sendData.append('filesize', filesize);
    sendData.append('changes', firmChange);
    sendData.append('associatedDevices', JSON.stringify(devicesToAdd));
    sendData.append('date', new Date().toISOString());
    console.dir(devicesToAdd);

    OTAModel.uploadFile(AuthModel.userInfo.get('id'), sendData).then((response) => {
      document.getElementById('firmwareFile').value = null;
      document.getElementById("alertFileName").className = "filename-text-normal";
      this.setState({ selectedFile: "No file selected..." });
      document.getElementById('firmwareChanges').value = "";
      this.fetchData();
      Snackbar.show("The new Firmware was successfully uploaded!", "success");
    }).catch((err) => {
      Snackbar.show(new RestError(err).getMessage());
    });
    this.adding = false;
  }

  handleName(input)
  {
    var url = undefined;
    if(typeof input.value === 'undefined')
    {
      input = document.getElementById('firmwareFile')
    }

    var url = input.value;
    var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();

    if(input.files && input.files[0] && ext === "bin")
    {
      document.getElementById("alertFileName").className = "filename-text-normal"
      this.setState({
        selectedFile: input.files[0].name
      });
      this.buttonDisable = false;
    } else {
      document.getElementById("alertFileName").className = "filename-text-normal text-danger"
      this.setState({
        selectedFile: "You can only provide one file"
      })
    }
  }

  handleExpandCollaps = (e,name) => {
    if(e.target.className === 'sidebar-nav-menu-item-head container-center-align' ||
       e.target.className === 'sidebar-nav-menu-item-head-title')
       {
        if (this.state.activeCollapse === name) {
          //If collapsiable is already visible and clicked on same then this will hide it
            this.setState({ activeCollapse: '' })
        } else {
            this.setState({ activeCollapse: name })
        }
       }
  }

  handleSubExpandCollaps = (parent, name) => {
    if (this.state.subactiveCollapse === name) {
      //If collapsiable is already visible and clicked on same then this will hide it
        this.setState({ subactiveCollapse: '' })
    } else {
        this.setState({ subactiveCollapse: name })
    }
  }

  download = (e, id) => {
    e.stopPropagation();
    console.log("Called from ", id);
    OTA.downloadBinary(AuthModel.userInfo.get('id'), id).then(res => {
      let firmwareName = res.headers["content-disposition"].split("filename=")[1];
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute('download', firmwareName);
      document.body.appendChild(link);
      link.click();
    })
    .catch(err => {
      Snackbar.show(new RestError(err).getMessage());
    });
  }

  formatBytes(bytes, decimals=2) {
    if(bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes)/Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  handleCheckbox = (e) => {
    console.log('From checkbox:')
    console.dir(e.target.id)
    this.setCheckboxValue(e.target.id);
  }


  setCheckboxValue(id) {
    if(this.checkDevices.length === 0) {
      if(OTA.devices) {
        OTA.devices.map(object => {
          this.checkDevices.push({
            [`checkbox-${object.id}`]: {
              checked: false,
            },
            "device_id": object.id
          })
        })
      }
    }

    for(var i = 0; i < this.checkDevices.length; i++) {
      if(this.checkDevices[i].hasOwnProperty(id)) {
        this.checkDevices[i][id].checked = !this.checkDevices[i][id].checked;
      }
    }
  }

  render()
  {
    return (
      <div>
        <h3 className="mdc-typography--headline3">
          Over The Air (OTA) Updates
        </h3>
        <br />
        <Row className="mb-1">
          <Col md="3">
            <Row className="mb-1">
              <div className="mdc-text-field input-text-width">
                <input type="text" id="firmwareName" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                <label htmlFor="firmwareName" className="mdc-floating-label input-text-width">Filename (Optional)</label>
                <div className="mdc-line-ripple"></div>
              </div>
              <span className="text-danger">{this.state.filenameErr}</span>
            </Row>
            <Row>
              <Col md="11">
                <button className="mdc-button mdc-button--raised mdc-button--icon-leading" type="button">
                  <span className="mdc-button__ripple"></span>
                  <i className="material-icons mdc-button__icon" aria-hidden="true">upload_file</i>
                  <label htmlFor="firmwareFile" className="mdc-button__label">Select Firmware</label>
                  <input type="file" accept=".bin" id="firmwareFile" onChange={this.handleName.bind(this)} className="hide-button"/>
                </button>
                <span id="alertFileName" className="filename-text-normal">{this.state.selectedFile}</span>
              </Col>
            </Row>
          </Col>
          <Col md="2">
            <Row>
              <div className="mdc-text-field--with-leading-icon label-text-align container-center-align input-text-width">
                <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>manage_history</i>
                <span className="mdc-typography--overline" style={{display: "inline%"}}>Changes</span>
              </div>
            </Row>
            <Row>
              <div className="input-text-width">
                <label className="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea">
                  <span className="mdc-notched-outline">
                    <span className="mdc-notched-outline__leading"></span>
                    <span className="mdc-notched-outline__trailing"></span>
                  </span>
                  <span className="mdc-text-field__resizer">
                    <textarea className="mdc-text-field__input text-area-mod__input" rows="4" cols="40" aria-label="Label" id="firmwareChanges" maxLength="255"></textarea>
                  </span>
                </label>
              </div>
            </Row>
            <Row>
              <div className="mdc-text-field--with-leading-icon label-text-align container-center-align input-text-width">
                <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>devices_other</i>
                <span className="mdc-typography--overline" style={{display: "inline%"}}>Devices</span>
              </div>
            </Row>
            {
              OTA.fetching ? (
                <Row>
                  <div className="mdc-text-field--with-leading-icon label-text-align container-center-align input-text-width">
                    <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>hourglass_empty</i>
                    <span className="mdc-typography--overline" style={{display: "inline%"}}>Loading your devices...</span>
                  </div>
                </Row>
              ):(
                OTA.fetched && OTA.devices && OTA.devices.length > 0 ? ((
                  <Row>
                    {
                      OTA.devices.map(device => (
                        <div key={`checkbox-device-${device.id}`} className="mdc-form-field">
                        <div className="mdc-checkbox">
                          <input type="checkbox"
                                className="mdc-checkbox__native-control"
                                id={`checkbox-${device.id}`}
                                onChange={this.handleCheckbox.bind(this)}/>
                          <div className="mdc-checkbox__background">
                            <svg className="mdc-checkbox__checkmark"
                                viewBox="0 0 24 24">
                              <path className="mdc-checkbox__checkmark-path"
                                    fill="none"
                                    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                            </svg>
                            <div className="mdc-checkbox__mixedmark"></div>
                          </div>
                          <div className="mdc-checkbox__ripple"></div>
                        </div>
                        <label htmlFor={`checkbox-${device.id}`}>{device.name}</label>
                      </div>
                      ))
                    }
                  </Row>
                  )
                ) : (
                  <Row>
                    <div className="mdc-text-field--with-leading-icon label-text-align container-center-align input-text-width">
                      <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>warning</i>
                      <span className="mdc-typography--overline" style={{display: "inline%"}}>Please create a device first!</span>
                    </div>
                  </Row>
                )
              )
            }
          </Col>
        </Row>
        <div className="mt-5">
        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (this.buttonDisable || OTA.devices.length <= 0 ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
        </div>
        <br/>
        <div className="mt-5">
          <div className="mdc-text-field--with-leading-icon label-text-align container-center-align">
            <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>web_stories</i>
            <span className="mdc-typography--overline" style={{display: "inline%"}}>Older Versions</span>
          </div>
          <div className="sidebar-nav">
            <div className="sidebar-nav-menu">
              {
                OTA.fetching ? (
                  <div className="sidebar-nav-menu-item item-active">
                    <div className="sidebar-nav-menu-item-head">
                      <span className="sidebar-nav-menu-item-head-title">We are fetching your other OTA firmwares...</span>
                    </div>
                  </div>
                ) : (
                  OTA.fetched && OTA.data !== undefined ? (
                    OTA.data.length > 0 ? (
                      OTA.data.map((object) => (
                        <div key={object.device_name} className={`sidebar-nav-menu-item ${this.state.activeCollapse === object.device_name ? 'item-active' : ''}`} onClick={(e) => this.handleExpandCollaps(e, object.device_name)} data-id={object.device_name} style={{cursor: 'pointer'}}>
                          <div className="sidebar-nav-menu-item-head container-center-align">
                            <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>device_hub</i>
                            <span className="sidebar-nav-menu-item-head-title">{object.device_name}</span>
                          </div>
                          <div className="sidebar-nav-menu-item-body input-text-width">
                          {
                            object.otas.length > 0 ? (
                              object.otas.map((otaObject) => (
                                <div key={otaObject.id} className={`sidebar-nav-menu-subitem ${this.state.subactiveCollapse === otaObject.filename ? 'item-active' : ''}`} onClick={() => this.handleSubExpandCollaps(object.device_name, otaObject.filename)} data-id={otaObject.filename} style={{cursor: 'pointer'}}>
                                  <div className="sidebar-nav-menu-subitem-head container-center-align">
                                    <i className="material-icons small-material-icon mdc-button__icon icon-padding-right" aria-hidden="true" style={{display: "inline%"}}>source</i>
                                    <span className="sidebar-nav-menu-subitem-head-title">{otaObject.filename}</span>
                                    <span className="sidebar-nav-menu-subitem-head-help">
                                      <button type="button" className="mdc-button mdc-button--raised mdc-button--icon-leading" onClick={(e) => this.download(e, otaObject.id)}>
                                        <span className="mdc-button__ripple"></span>
                                        <i className="material-icons mdc-button__icon" aria-hidden="true" style={{ marginLeft: "0px", marginRight: "0px"}}>file_download</i>
                                      </button>
                                    </span>
                                  </div>
                                  <div className="sidebar-nav-menu-subitem-body input-text-width">
                                    <p><strong>Firmware Version: </strong>{otaObject.firmVersion}</p>
                                    <p><strong>ESP-IDF: </strong>{otaObject.espIDFVer}</p>
                                    <p><strong>Size: </strong>{this.formatBytes(otaObject.size)}</p>
                                    <p><strong>Date: </strong>{otaObject.date}</p>
                                    <p><strong>Changes: </strong>{otaObject.changes}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="sidebar-nav-menu-item item-active">
                                <div className="sidebar-nav-menu-item-head">
                                  <span className="sidebar-nav-menu-item-head-title">This device does not have OTA files...</span>
                                </div>
                              </div>
                            )
                          }
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="sidebar-nav-menu-item item-active">
                        <div className="sidebar-nav-menu-item-head">
                          <span className="sidebar-nav-menu-item-head-title">We could not find older versions...</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="sidebar-nav-menu-item item-active">
                      <div className="sidebar-nav-menu-item-head">
                        <span className="sidebar-nav-menu-item-head-title text-danger">There was an error fetching your older versions</span>
                      </div>
                    </div>
                  )
                )
              }
            </div>
          </div> 
        </div>
        <br/><br/><br/><br/>
      </div>
    )
  }
}