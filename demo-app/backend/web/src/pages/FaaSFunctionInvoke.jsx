import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { Container, Row, Col } from 'reactstrap';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

import FaasFunctionsModel from "../models/FaaSModel";

@observer
export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            back: false,
        };

        this.form = new FormModel();
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
    }

    invoke(e) {
        if (e) {
            e.preventDefault();
        }
        // TODO: avoid coping code and move the set of params_fun to the if.
        FaasFunctionsModel.invoke(AuthModel.userInfo.get("id"), `${this.props.match.params.function_id}/invoke`, this.form.values).then((response) => {
          this.form.clearForm();
          this.setState({ back: true });
          console.log(response);
          if(response.data){
              Snackbar.show(JSON.stringify(response.data), "success");
          }else{
              Snackbar.show("Function Invoked", "success");
          }
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to={'/faas'}  />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Invoke Function</h3>
                <br />

                <form onSubmit={this.invoke.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="devices-add-description" name="params_fun" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-description" className="mdc-floating-label">[Optional, (in JSON format) ] Params</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="devices-add-description" name="blocking" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="devices-add-description" className="mdc-floating-label">[Optional, default true] Blocking (true/false)</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/faas'}  className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.invoke.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (FaasFunctionsModel.invoking ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                    </div>
                </form>
                <br/><br/><br/><br/>
            </div>
        )
    }
}
