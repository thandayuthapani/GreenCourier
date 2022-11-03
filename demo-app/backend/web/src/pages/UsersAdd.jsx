import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { Container, Row, Col } from 'reactstrap';
import UsersModel from '../models/UsersModel';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';

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
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    add(e) {
        if (e) {
            e.preventDefault();
        }
        UsersModel.add(this.form.values).then((response) => {
            this.form.clearForm();
            this.setState({ back: true })
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to='/users' />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Add User</h3>
                <br />

                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="user-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="user-add-name" className="mdc-floating-label">Name</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="user-add-username" name="username" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="user-add-username" className="mdc-floating-label">Username</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="password" id="user-add-password" name="password" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="new-password" data-lpignore="true" minLength="6"/>
                                <label htmlFor="user-add-password" className="mdc-floating-label">Password</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="3">
                            <div className="mdc-select" style={{ width: "100%", marginTop: "16px", marginBottom: "8px" }}>
                                <select id="user-role" name="role" onChange={this.form.handleChange} className="mdc-select__native-control" defaultValue="" autoComplete="off" data-lpignore="true">
                                    <option value="" disabled></option>
                                    <option value="ADMIN">
                                        Admin
                                    </option>
                                    <option value="USER">
                                        User
                                    </option>
                                </select>
                                <label className="mdc-floating-label">Pick a Role</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to="/users" className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (UsersModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                    </div>
                </form>
            </div>
        )
    }
}
