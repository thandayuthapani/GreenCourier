import React, { Component } from "react";
import { observable, action, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { Container, Row, Col } from 'reactstrap';
import PredictionsModel from '../models/PredictionsModel';
import FormModel from '../models/FormModel';

@observer
export default class extends React.Component {
    @observable failedFetching = false;
    @observable notFound = false;
    @observable object;
    @observable to_delete;
    @observable deleting = false;

    constructor(props) {
        super(props);

        this.state = {
            back: false,
        }

        this.form = new FormModel();

        autorun(() => {
            this.failedFetching = !PredictionsModel.fetching && !PredictionsModel.fetched;
            var notFound = false;
            var object;
            if (PredictionsModel.fetched) {
                console.log("Fetched Bitch");
                console.log(this.props.match);
                const objects = PredictionsModel.data.filter((object) => (object.id == this.props.match.params.id));
                if (objects.length >= 1) {
                    object = objects[0];
                } else {
                    notFound = true;
                }
            }
            this.notFound = notFound;
            this.object = object;
        });
    }

    render() {
        return (
            <div>
                <div className="p-1" style={{ display: "flex", alignItems: "center", backgroundColor: "#e9ecef", borderRadius: ".25rem"}}>
                    <Link to="/predictions" className="plain-link">
                        <div className="mdc-button mdc-button--dense" style={{ textTransform: "none", fontSize: "1rem", fontWeight: "300", letterSpacing: "unset" }}>
                            Predictions
                        </div>
                    </Link>
                    <i className="text-secondary material-icons">keyboard_arrow_right</i>
                    <div className="disabled mdc-button mdc-button--dense" style={{ textTransform: "none", fontSize: "1rem", fontWeight: "300", letterSpacing: "unset" }}>
                        View Prediction{this.object && ` (${this.object.name})`}
                    </div>
                </div>

                {
                    (this.failedFetching || !PredictionsModel.fetched || this.notFound) ? (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting consumer info' : (!PredictionsModel.fetched ? 'Fetching consumer info' : 'Prediction not found')}</h5>
                        </div>
                    ) : (
                        <div>
                            <Row className="mb-4">
                                <Col md="6">
                                    <h3 className="mt-3 mdc-typography--headline3">
                                        {this.object.name}
                                    </h3>
                                </Col>
                            </Row>
                            <br />
                            <Row className="mb-4">
                                <Col md="6">
                                        <h5 className="mdc-typography--headline5">Description</h5>
                                        <span className="mdc-typography--body1">{this.object.description}</span>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md="6">
                                        <h5 className="mdc-typography--headline5">Algorithm</h5>
                                        <span className="mdc-typography--body1">{this.object.algorithm}</span>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md="6">
                                        <h5 className="mdc-typography--headline5">Crontab</h5>
                                        <span className="mdc-typography--body1">{this.object.crontab}</span>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md="3">
                                        <h5 className="mdc-typography--headline5">Prediction Period</h5>
                                        <span className="mdc-typography--body1">{this.object.predictionPeriod}</span>
                                </Col>
                                <Col md="3">
                                        <h5 className="mdc-typography--headline5">Data Period</h5>
                                        <span className="mdc-typography--body1">{this.object.dataPeriod}</span>
                                </Col>
                            </Row>

                            <div className="mb-4">
                                <h5 className="mdc-typography--headline5">Sensors Associated</h5>

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
                                        this.object.sensors.length > 0 ? (
                                            this.object.sensors.map((sensor) => (
                                                <tr key={sensor.id}>
                                                    <td className="mdl-data-table__cell--non-numeric font-weight-bold">{sensor.device.name}</td>
                                                    <td className="mdl-data-table__cell--non-numeric">{sensor.name}</td>
                                                    <td className="mdl-data-table__cell--non-numeric">{sensor.id}</td>
                                                    <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>No entries yet</td>
                                            </tr>
                                        )
                                    }
                                    {
                                        this.object.sensors.length > 0 && (
                                            <tr>
                                                <td colSpan="4" className="mdl-data-table__cell--non-numeric">Total of {this.object.sensors.length} {this.object.sensors.length > 1 ? "sensors" : "sensor"}</td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

            </div>
        )
    }
}
