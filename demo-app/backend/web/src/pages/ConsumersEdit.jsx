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
import ConsumersModel from '../models/ConsumersModel';
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';

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
            this.failedFetching = !ConsumersModel.fetching && !ConsumersModel.fetched;
            var notFound = false;
            var object;
            if (ConsumersModel.fetched) {
                const objects = ConsumersModel.data.filter((object) => (object.id == this.props.match.params.id));
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
            description: this.form.values.description,
        }
        ConsumersModel.update(this.props.match.params.id, toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            ConsumersModel.fetch();
            Snackbar.show("Updated consumer", "success");
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    componentWillMount() {
        ConsumersModel.fetch();
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
            return <Redirect to={'/consumers/' + this.props.match.params.id} />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Edit Consumer</h3>
                <br />

                {
                    (this.failedFetching || !ConsumersModel.fetched || this.notFound) && (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting consumer info' : (!ConsumersModel.fetched ? 'Fetching consumer info' : 'Consumer not found')}</h5>
                        </div>
                    )
                }
                <form onSubmit={this.update.bind(this)} ref={this.form.setRef}>
                    <div style={{ display: (this.failedFetching || !ConsumersModel.fetched || this.notFound) ? 'none' : undefined }}>
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="consumer-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="consumer-update-name" className="mdc-floating-label">Name</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col >
                        </Row >
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="consumer-update-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="consumer-update-description" className="mdc-floating-label">[Optional] Description</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/consumers/' + this.props.match.params.id} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        {
                            !(this.failedFetching || !ConsumersModel.fetched || this.notFound) && (
                                <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (ConsumersModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                            )
                        }
                    </div>
                </form>
            </div>
        )
    }
}
