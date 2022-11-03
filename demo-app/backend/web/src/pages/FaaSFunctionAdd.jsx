import React, {Component} from "react";
import {observable, action} from "mobx";
import {observer} from "mobx-react";
import Ripple from "../utils/Ripple";
import {BrowserRouter as Router, Route, Link, Redirect} from "react-router-dom";
import {MDCTextField} from '@material/textfield';
import {MDCSelect} from '@material/select';
import {Container, Row, Col} from 'reactstrap';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";
import AceEditor from 'react-ace';
import FaasFunctionsModel from "../models/FaaSModel";


import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/mode-python';
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";

@observer
export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            back: false,
            functNameErr: "",
            dockerURLErr: "",
            memConfigErr: ""
        };

        this.form = new FormModel();
        this.onChange = this.onChange.bind(this);
        this.code_form = null;
    }

    onChange(newValue) {
        this.code_form = newValue;
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
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

    add(e) {
        if (e) {
            e.preventDefault();
        }
        if(this.validate(this.form.values))
        {
        //   this.form.values["code"] = this.refs.aceEditor.editor.getSession().getValue();
          FaasFunctionsModel.add(AuthModel.userInfo.get("id"), this.form.values).then((response) => {
              this.form.clearForm();
              this.setState({ back: true })
          }).catch((error) => {
              Snackbar.show(new RestError(error).getMessage());
          });
        }
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to={'/faas'}/>
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Create FaaS Function</h3>
                <br/>
                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="functions-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" style={{display: "inline%"}} />
                                <label htmlFor="functions-add-name" className="mdc-floating-label">Function Name</label>
                                <div className="mdc-line-ripple"></div>
                                
                            </div>
                            <span className="text-danger">{this.state.functNameErr}</span>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="functions-add-image" name="docker_image" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" style={{display: "inline%"}} />
                                <label htmlFor="functions-add-image" className="mdc-floating-label">Docker Image URL</label>
                                <div className="mdc-line-ripple"></div>
                                
                            </div>
                            <span className="text-danger">{this.state.dockerURLErr}</span>
                        </Col>
                    </Row>
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
                    <div className="mt-5">
                        <Link to={'/faas'}  className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (FaasFunctionsModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                    </div>

                </form>
                <br/><br/><br/><br/>
            </div>
        )
    }
}
