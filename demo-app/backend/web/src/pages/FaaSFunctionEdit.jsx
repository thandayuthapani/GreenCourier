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
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";
import FaasFunctionsModel from "../models/FaaSModel";
import AceEditor from 'react-ace';
import ace from 'ace-builds';


import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/mode-python';
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";

@observer
export default class extends React.Component {
    @observable failedGetting = false;
    @observable notFound = false;
    @observable object;

    constructor(props) {
        super(props);

        this.state = {
            back: false,
            functNameErr: "",
            dockerURLErr: "",
            memConfigErr: ""
        }

        this.form = new FormModel();
        this.onChange = this.onChange.bind(this);
        this.code_form = null;

        autorun(() => {
          this.failedGetting = !FaasFunctionsModel.getting && !FaasFunctionsModel.got;

          if(FaasFunctionsModel.got)
          {
            if(this.form.ref){
              this.form.ref.elements["name"].value = FaasFunctionsModel.faas.name;
              this.refs.aceEditor.editor.getSession().setValue(FaasFunctionsModel.faas.code);
              this.form.ref.elements["memory_config"].value = FaasFunctionsModel.faas.memory_config;
              this.form.ref.elements["docker_image"].value = FaasFunctionsModel.faas.docker_image;
              this.form.ref.elements["timeout"].value = FaasFunctionsModel.faas.timeout;
              document.querySelectorAll('.mdc-text-field').forEach((node) => {
                  MDCTextField.attachTo(node);
              });
            }
          }
        });
    }
    onChange(newValue) {
        this.code_form = newValue;
    }

    validate(values)
    {
      let nameErr = "";
      let dockerErr = ""
      let memErr = ""
      if(!values.name || values.name.match(FaasFunctionsModel.inputRegex) === null)
      {
        nameErr = "This function name contains invalid characters"
      }else{
        nameErr = "";
      }

      if(!values.docker_image || values.docker_image.match(FaasFunctionsModel.inputRegex)=== null)
      {
        dockerErr = "This Docker Image URL contains invalid characters";
      }else{
        dockerErr = "";
      }

      if(!values.memory_config || !FaasFunctionsModel.memoryOptions.includes(values.memory_config))
      {
        memErr = "This Memory Configuration is not valid";
      }else{
        memErr = "";
      }

      if( nameErr || dockerErr || memErr)
      {
        this.setState({
          functNameErr: nameErr,
          dockerURLErr: dockerErr,
          memConfigErr: memErr
        });
        return false;
      }

      return true;
    }

    update(e) {
        if (e) {
            e.preventDefault();
        }
        var toUpdate = {
            name: this.form.ref.elements["name"].value,
            code: this.refs.aceEditor.editor.getSession().getValue(),
            memory_config: this.form.ref.elements["memory_config"].value,
            docker_image: this.form.ref.elements["docker_image"].value,
            timeout: this.form.ref.elements["timeout"].value,
        };

        if(this.validate(toUpdate))
        {
          FaasFunctionsModel.update(AuthModel.userInfo.get("id"), this.props.match.params.function_id, toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            Snackbar.show("Updated FaaS Function", "success");
          }).catch((error) => {
              Snackbar.show(new RestError(error).getMessage());
          });
        }
    }

    componentWillMount() {
        FaasFunctionsModel.get(AuthModel.userInfo.get("id"), this.props.match.params.function_id);
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
            return <Redirect to={'/faas'} />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Edit Function</h3>
                <br />

                {
                    (this.failedGetting || !FaasFunctionsModel.got) && (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedGetting ? 'Failed getting function info' : (!FaasFunctionsModel.got ? 'Fetching Function info' : 'Function not found')}</h5>
                        </div>
                    )
                }
                <form onSubmit={this.update.bind(this)} ref={this.form.setRef}>
                    <div style={{ display: (this.failedGetting || !FaasFunctionsModel.got) ? 'none' : undefined }}>
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="device-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="device-update-name" className="mdc-floating-label">Name</label>
                                    <div className="mdc-line-ripple"></div>
                                    
                                </div>
                                <span className="text-danger">{this.state.functNameErr}</span>
                            </Col >
                        </Row >
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="device-update-image" name="docker_image" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="device-update-image" className="mdc-floating-label">Docker Image</label>
                                    <div className="mdc-line-ripple"></div>
                                    
                                </div>
                                <span className="text-danger">{this.state.dockerURLErr}</span>
                            </Col >
                        </Row >
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{width: "100%"}}>
                                    <label htmlFor="functions-add-memory" className="mdc-floating-label">Function Memory (MB)</label>
                                    <input list="memory_cofigs" id="functions-add-memory" name="memory_config" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <datalist id="memory_cofigs">
                                        <option value="512M"/>
                                        <option value="1024M"/>
                                    </datalist>
                                    <div className="mdc-line-ripple"></div>
                                    
                                </div>
                                <span className="text-danger">{this.state.memConfigErr}</span>
                            </Col>
                        </Row>
                    </div>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/faas'} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        {
                            !(this.failedGetting || !FaasFunctionsModel.got) && (
                                <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (FaasFunctionsModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                            )
                        }
                    </div>
                </form>
                <br/><br/><br/><br/>
            </div>
        )
    }
}
