import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { Container, Row, Col } from 'reactstrap';
import { MDCTextField } from '@material/textfield';
import AuthModel from "../models/AuthModel";
import FormModel from "../models/FormModel";
import qs from "query-string";
import Snackbar from "../utils/Snackbar";
import RestError from '../utils/RestError';

@observer
export default class extends React.Component {

    constructor(props) {
        super(props);

        this.form = new FormModel();
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
    }

    signIn(e) {
        if (e) {
            e.preventDefault();
        }
        AuthModel.signIn(this.form.values.username, this.form.values.password).then((response) => {
            
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    render() {
        if(AuthModel.authenticated) {
            const addr = AuthModel.userInfo.get("role").localeCompare("USER") === 0 ? `/users/${AuthModel.userInfo.get("id")}/devices` : "/users";
            const redirectTo = qs.parse(this.props.location.search).redirect || addr;
            return <Redirect to={redirectTo}/>
        }
        return (
            <div style={{ width: "100%", height: "100%", backgroundColor: "#eee" }}>
                <div className="d-flex justify-content-center mb-3 pt-5">
                    <div className="flex-fill flex-md-grow-0 mdc-card">
                        <div className="p-5">
                            <form onSubmit={this.signIn.bind(this)} ref={this.form.setRef}>
                                <hgroup style={{ textAlign: "center" }}>
                                    <h3 className="pb-3 mdc-typography--headline3">Sign In</h3>
                                    <h4 className="mdc-typography--headline4">GreenCourier</h4>
                                </hgroup>
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="user-add-username" name="username" onChange={this.form.handleChange} className="mdc-text-field__input" />
                                    <label htmlFor="user-add-username" className="mdc-floating-label">Username</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="password" id="user-add-password" name="password" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="current-password"/>
                                    <label htmlFor="user-add-password" className="mdc-floating-label">Password</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                                <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                                <Ripple onClick={this.signIn.bind(this)} className={"mt-5 mdc-button mdc-button--raised" + (AuthModel.signingIn ? " disabled" : "")}>Sign In</Ripple>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
