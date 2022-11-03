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
import SensorsModel from '../models/SensorsModel';
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";
import SensorSchemaModel from "../models/SensorSchemaModel";

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
            this.failedFetching = !SensorsModel.fetching && !SensorsModel.fetched;
            var notFound = false;
            var object;
            if (SensorsModel.fetched) {
                const objects = SensorsModel.data.filter((object) => (object.id == this.props.match.params.id));
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
                this.form.ref.elements["schemaId"].value = object.schemaId;
                this.form.ref.elements["path"].value = object.path;
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
            schemaId: this.form.values.schemaId,
        }
        SensorsModel.update(AuthModel.userInfo.get("id"), this.props.match.params.device_id, this.props.match.params.id, toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            SensorsModel.fetch(AuthModel.userInfo.get("id"), this.props.match.params.device_id);
            Snackbar.show("Updated sensor", "success");
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    componentWillMount() {
        SensorsModel.fetch(AuthModel.userInfo.get("id"), this.props.match.params.device_id);
        SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
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
            return <Redirect to={'/users/' + AuthModel.userInfo.get("id") + "/devices/" + this.props.match.params.device_id} />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Edit Sensor</h3>
                <br />

                {
                    (this.failedFetching || !SensorsModel.fetched || this.notFound) && (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting sensor info' : (!SensorsModel.fetched ? 'Fetching sensor info' : 'Sensor not found')}</h5>
                        </div>
                    )
                }
                <form onSubmit={this.update.bind(this)} ref={this.form.setRef}>
                    <div style={{ display: (this.failedFetching || !SensorsModel.fetched || this.notFound) ? 'none' : undefined }}>
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="sensor-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="sensor-update-name" className="mdc-floating-label">Name (You can use "/" to specify path)</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col >
                        </Row >
                        <Row className="mb-1">
                            <Col md="6">
                                <div className="mdc-text-field" style={{ width: "100%" }}>
                                    <input type="text" id="sensor-update-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                    <label htmlFor="sensor-update-description" className="mdc-floating-label">[Optional] Description</label>
                                    <div className="mdc-line-ripple"></div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <Row className="mb-1">
                        <Col md="6">
                            {
                                SensorSchemaModel.fetching ? (
                                    <div>loading</div>
                                ) :
                                    (!SensorSchemaModel.fetched) ? (
                                        <div>error loading schemas</div>
                                    ) :
                                        (SensorSchemaModel.data.length === 0) ? (
                                            <div>No Sensor schemas Defined</div>
                                        ) :
                                            (
                                                <div>
                                                    <label className="mdc-floating-label">Schema:</label>
                                                    <select name="schemaId" onChange={this.form.handleChange}>
                                                        {
                                                            SensorSchemaModel.data.map(el => <option value={el.id} key={el.ed}> {el.name} </option>)
                                                        }
                                                    </select>
                                                </div>
                                            )
                            }
                        </Col>
                    </Row>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/users/' + AuthModel.userInfo.get("id") + '/devices/' + this.props.match.params.device_id} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        {
                            !(this.failedFetching || !SensorsModel.fetched || this.notFound) && (
                                <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (SensorsModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                            )
                        }
                    </div>
                </form>
            </div>
        )
    }
}
