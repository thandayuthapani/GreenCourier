import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { Container, Row, Col } from 'reactstrap';
import PredictionsModel from '../models/PredictionsModel';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import DevicesModel from "../models/DevicesModel";
import {MDCSelect} from "@material/select";
import axios from "axios";

@observer
export default class extends React.Component {
    @observable adding = false;
    @observable uploadPercent = 0;

    constructor(props) {
        super(props);

        this.state = {
            back: false,
            sensorIds: [],
            sensor_id: "",
            seconds: '*',
            minutes: '*',
            hours: '*',
            dayMonth: '*',
            month: '*',
            dayWeek: '*'

        };

        this.form = new FormModel();

        this.handleChange = this.handleChange.bind(this);
        this.addSensor = this.addSensor.bind(this);
        this.deleteSensor = this.deleteSensor.bind(this);
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    componentDidUpdate() {
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    handleChange(event) {
        const target = event.target;
        this.setState({[target.name]: target.value});
    }

    add(e) {
        if (e) {
            e.preventDefault();
        }
        if(this.state.sensorIds.length > 0){
            this.adding = true;
            this.form.values.crontab = this.state.seconds +
                ' ' + this.state.minutes +
                ' ' + this.state.hours +
                ' ' + this.state.dayMonth +
                ' ' + this.state.month +
                ' ' + this.state.dayWeek;
            PredictionsModel.add(this.form.values).then((response) => {
                axios.post(`/predictions/${response.data.result.id}/sensors`, { sensor_id: this.state.sensorIds[0]}).then((response) => {
                    this.adding = false;
                    this.form.clearForm();
                    this.setState({ back: true })
                }).catch((error) => {
                    this.adding = false;
                    Snackbar.show(new RestError(error).getMessage());
                });
            }).catch((error) => {
                this.adding = false;
                Snackbar.show(new RestError(error).getMessage());
            });
        } else Snackbar.show("A sensor must be associated");
    }

    addSensor(e) {
        if(this.state.sensor_id !== ""){
            var auxArray = this.state.sensorIds;
            auxArray.push(this.state.sensor_id);
            this.setState({
                sensorIds : auxArray,
                sensor_id: ""
            });
        }
    }
    deleteSensor(sensorId) {
        var auxArray = this.state.sensorIds;
        for(var i=0; i<auxArray.length; i++) {
            if(auxArray[i]===sensorId) {
                auxArray.splice(i, 1);
                this.setState({sensorIds: auxArray});
                return;
            }
        }
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to={'/predictions'} />
        }
        return (
            <div>
                <h3 className="mdc-typography--headline3">Add Prediction</h3>
                <br />

                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="predictions-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-name" className="mdc-floating-label">Name</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-description" className="mdc-floating-label">[Optional] Description</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-select" style={{ width: "100%" }}>
                                <select id="predictions-add-algorithm" defaultValue="" name="algorithm"  onChange={this.form.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                                    <option disabled value="" />
                                    <option value='LINEAR_REGRESSION'>
                                        Linear Regression
                                    </option>
                                </select>
                                <label htmlFor="predictions-add-algorithm" className="mdc-floating-label">Algorithm</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-executors" name="executors" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-executors" className="mdc-floating-label">Executors</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <br />
                    <Row className="mb-1">
                        <h5 className="mdc-typography--headline5">Crontab</h5>
                    </Row>
                    <Row className="mb-1">
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-seconds" name="seconds" value={this.state.seconds} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-seconds" className="mdc-floating-label">Seconds</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-minutes" name="minutes" value={this.state.minutes} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-minutes" className="mdc-floating-label">Minutes</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-hours" name="hours" value={this.state.hours} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-hours" className="mdc-floating-label">Hours</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-dayMonth" name="dayMonth" value={this.state.dayMonth} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-dayMonth" className="mdc-floating-label">Day of Month</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-month" name="month" value={this.state.month} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-month" className="mdc-floating-label">Month</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="1">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-dayWeek" name="dayWeek" value={this.state.dayWeek} onChange={this.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-dayWeek" className="mdc-floating-label">Day of Week</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <span>You can see crontab information <a href="https://www.npmjs.com/package/node-cron" target="_blank">here</a></span>
                    </Row>
                    <Row className="mb-1">
                        <Col md="3">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-predictionPeriod" name="predictionPeriod" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-predictionPeriod" className="mdc-floating-label">Predicted Period (Hours)</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="predictions-add-dataPeriod" name="dataPeriod" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="predictions-add-dataPeriod" className="mdc-floating-label">Data Period (Hours)</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <br />
                    <div className="mb-4">
                        <h5 className="mdc-typography--headline5">Sensors Associated</h5>

                        {
                            ((!DevicesModel.fetching && !DevicesModel.fetched) || !DevicesModel.fetched) ? (
                                <span className="mdc-typography--body1">
                                                {(!DevicesModel.fetching && !DevicesModel.fetched) ? 'Failed getting consumer info' : (!DevicesModel.fetched ? 'Fetching consumer info' : 'Consumer not found')}
                                            </span>
                            ) : (
                                <span className="mdc-typography--body1">
                                    <div className="mdc-select">
                                        <select name="sensor_id" defaultValue="" onChange={this.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                                            <option disabled value="" />
                                            {
                                                DevicesModel.data.map(device =>
                                                    device.sensors.filter((sensor) =>
                                                        this.state.sensorIds.indexOf(sensor.id+"") < 0
                                                    ).map(sensor => {
                                                        return (
                                                            <option value={sensor.id} key={`${device.id}_${sensor.id}`}>
                                                                {`${device.name}: ${sensor.name}`}
                                                            </option>
                                                        )
                                                    })
                                                )
                                            }
                                        </select>
                                        <label className="mdc-floating-label">Pick a sensor</label>
                                        <div className="mdc-line-ripple" />
                                    </div>

                                    <Ripple className="mdc-button" style={{ textTransform: "none" }} onClick={this.addSensor.bind(this)}>Associate Sensor</Ripple>
                                </span>
                            )
                        }

                        <table className="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdc-elevation--z1" style={{ minWidth: "90%" }}>
                            <thead>
                            <tr>
                                <th className="mdl-data-table__cell--non-numeric">Device</th>
                                <th className="mdl-data-table__cell--non-numeric">Sensor</th>
                                <th className="mdl-data-table__cell--non-numeric">Sensor ID</th>
                                <th className="mdl-data-table__cell--non-numeric">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                this.state.sensorIds.length > 0 ? (
                                    DevicesModel.data.map(device =>
                                        device.sensors.filter((sensor) =>
                                            this.state.sensorIds.indexOf(sensor.id+"") >= 0
                                        ).map((sensor) => (
                                            <tr key={sensor.id}>
                                                <td className="mdl-data-table__cell--non-numeric font-weight-bold">{device.name}</td>
                                                <td className="mdl-data-table__cell--non-numeric">{sensor.name}</td>
                                                <td className="mdl-data-table__cell--non-numeric">{sensor.id}</td>
                                                <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                    <Ripple onClick={this.deleteSensor.bind(this, sensor.id+'')} className={"text-danger mdc-button mdc-card__action mdc-card__action--button" + (this.deleting ? " disabled" : "")}>Revoke</Ripple>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>No entries yet</td>
                                    </tr>
                                )
                            }
                            {
                                this.state.sensorIds.length > 0 && (
                                    <tr>
                                        <td colSpan="4" className="mdl-data-table__cell--non-numeric">Total of {this.state.sensorIds.length} {this.state.sensorIds.length > 1 ? "sensors" : "sensor"}</td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </table>
                    </div>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={"/predictions"} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (PredictionsModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                        {
                            this.adding && (
                                <span> Uploading... {this.uploadPercent}%</span>
                            )
                        }
                    </div>
                </form>
                <br/><br/><br/><br/><br/>
            </div>
        )
    }
}
