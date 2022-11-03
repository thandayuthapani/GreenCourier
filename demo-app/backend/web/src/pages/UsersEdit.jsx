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
import UsersModel from '../models/UsersModel';
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

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
            this.failedFetching = !UsersModel.fetching && !UsersModel.fetched;
            var notFound = false;
            var object;
            if (UsersModel.fetched) {
                const objects = UsersModel.data.filter((object) => (object.id == this.props.match.params.id));
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
                this.form.ref.elements["username"].value = object.username;
                this.form.ref.elements["role"].value = object.role;
                document.querySelectorAll('.mdc-text-field').forEach((node) => {
                    MDCTextField.attachTo(node);
                });
            }
        });
    }

    update(e) {
        if (e) {
            e.preventDefault();
        }
        var toUpdate = {
            name: this.form.values.name,
            role: this.form.values.role,
        }
        if (this.form.values.password) {
            toUpdate.password = this.form.values.password;
        }
        UsersModel.update(this.props.match.params.id, toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            Snackbar.show("Update user", "success");
            
            console.log(typeof this.props.match.params.id)
            console.log(typeof AuthModel.userInfo.get("id"))
            if(parseInt(this.props.match.params.id) === parseInt(AuthModel.userInfo.get("id"))) {
                AuthModel.signOut();
            }
        }).catch((error) => {
            this.setState({ back: true });
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    componentWillMount(){
        UsersModel.fetch();
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
            return <Redirect to='/users' />
        }
        
        return (
            <div>
                <h3 className="mdc-typography--headline3">Edit User</h3>
                <br />

                {
                    (this.failedFetching || !UsersModel.fetched || this.notFound) && (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting user info' : (!UsersModel.fetched ? 'Fetching user info' : 'User not found')}</h5>
                        </div>
                    )
                }
                <form onSubmit={this.update.bind(this)} ref={this.form.setRef}>
                    <div style={{ display: (this.failedFetching || !UsersModel.fetched || this.notFound) ? 'none' : undefined }}>
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="user-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="user-update-name" className="mdc-floating-label">Name</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col >
                        </Row >
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input disabled type="text" id="user-update-username" name="username" onChange={this.form.handleChange} className="mdc-text-field__input mdc-text-field--disabled" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="user-update-username" className="mdc-floating-label">Username (not editable)</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col>
                        </Row>
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="password" id="user-update-password" name="password" onChange={this.form.handleChange}className="mdc-text-field__input" autoComplete="new-password" data-lpignore="true" minLength="6"/>
                                    <label htmlFor="user-update-password" className="mdc-floating-label">New Password</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col>
                        </Row>
                        <Row className="mb-1">
                            <Col md="3">
                                <div className="mdc-select" style={{ width: "100%", marginTop: "16px", marginBottom: "8px" }}>
                                    <select id="user-role" name="role" onChange={this.form.handleChange} className="mdc-select__native-control" name="role" onChange={this.form.handleChange} autoComplete="off" data-lpignore="true">
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
                    </div>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to="/users" className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        {
                            !(this.failedFetching || !UsersModel.fetched || this.notFound) && (
                                <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (UsersModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                            )
                        }
                    </div>
                </form>
            </div>
        )
    }
}
