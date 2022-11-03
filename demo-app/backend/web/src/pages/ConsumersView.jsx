import React, { Component } from "react";
import { observable, action, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import { MDCSelect } from '@material/select';
import { Container, Row, Col } from 'reactstrap';
import ConsumersModel from '../models/ConsumersModel';
import DevicesModel from '../models/DevicesModel';
import FormModel from '../models/FormModel';
import axios from "axios";
import Download from "../utils/Download";
import Snackbar from "../utils/Snackbar";
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

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
            this.failedFetching = !ConsumersModel.fetching && !ConsumersModel.fetched;
            var notFound = false;
            var object;
            if (ConsumersModel.fetched) {
                console.log(ConsumersModel.data);
                const objects = ConsumersModel.data.filter((object) => (object.id == this.props.match.params.id));
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

    downloadKey() {
        if(AuthModel.userInfo.get('id') === -1){
            Snackbar.show('This feature includes the ID of the user associated with the Consumer', 'warning');
        }
        axios.get(`/consumers/${this.props.match.params.id}/key`).then(response => {
            Download(JSON.stringify(response.data), `consumer_${this.props.match.params.id}_key.json`, 'application/json');
        }).catch(error => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    componentWillMount() {
        ConsumersModel.fetch();
        DevicesModel.fetch(AuthModel.userInfo.get("id"));
    }

    componentDidUpdate() {
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    add(e) {
        if (e) {
            e.preventDefault();
        }
        console.log(this.form.values);
        axios.post(`/consumers/${this.props.match.params.id}/sensors`, { sensor_id: this.form.values.sensor_id }).then((response) => {
            this.form.clearForm();
            ConsumersModel.fetch();
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    componentDidMount() {
        this.dialog = new MDCDialog(document.querySelector('#my-mdc-dialog'));

        this.dialog.listen('MDCDialog:accept', () => {
            const { id, name } = this.to_delete;
            this.deleting = true;
            axios.delete(`/consumers/${this.props.match.params.id}/sensors/${id}`).then((response) => {
                this.deleting = false;
                Snackbar.show("Revoked sensor " + name, "success");
                ConsumersModel.fetch();
            }).catch((error) => {
                this.deleting = false;
                Snackbar.show(new RestError(error).getMessage());
            });
            this.to_delete = null;
        });

        this.dialog.listen('MDCDialog:cancel', () => {
            this.to_delete = null;
        });
    }

    deleteClick(object) {
        this.to_delete = object;
        this.dialog.show();
    }

    render() {

        var sensorIds = [];
        if (this.object && this.object.sensors) {
            sensorIds = this.object.sensors.map(sensor => sensor.id);
        }
        return (
            <div>
                <div className="p-1" style={{ display: "flex", alignItems: "center", backgroundColor: "#e9ecef", borderRadius: ".25rem"}}>
                    <Link to="/consumers" className="plain-link">
                        <div className="mdc-button mdc-button--dense" style={{ textTransform: "none", fontSize: "1rem", fontWeight: "300", letterSpacing: "unset" }}>
                            Consumers
                        </div>
                    </Link>
                    <i className="text-secondary material-icons">keyboard_arrow_right</i>
                    <div className="disabled mdc-button mdc-button--dense" style={{ textTransform: "none", fontSize: "1rem", fontWeight: "300", letterSpacing: "unset" }}>
                        View Consumer{this.object && ` (${this.object.name})`}
                    </div>
                </div>

                <aside id="my-mdc-dialog"
                    className="mdc-dialog"
                    role="alertdialog"
                    aria-labelledby="my-mdc-dialog-label"
                    aria-describedby="my-mdc-dialog-description">
                    <div className="mdc-dialog__surface" style={{ width: "unset" }}>
                        <header className="mdc-dialog__header">
                            <h2 id="my-mdc-dialog-label" className="mdc-dialog__header__title">
                                Revoke sensor permission
                            </h2>
                        </header>
                        <section id="my-mdc-dialog-description" className="mdc-dialog__body">
                            Are you sure you want to revoke sensor permission of device "{this.to_delete && this.to_delete.device.name}" and sensor "{this.to_delete && this.to_delete.name}"?
                        </section>
                        <footer className="mdc-dialog__footer">
                            <button type="button" className="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel">Cancel</button>
                            <button type="button" className="danger-button mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept">Revoke</button>
                        </footer>
                    </div>
                    <div className="mdc-dialog__backdrop"></div>
                </aside>

                {
                    (this.failedFetching || !ConsumersModel.fetched || this.notFound) ? (
                        <div>
                            <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting consumer info' : (!ConsumersModel.fetched ? 'Fetching consumer info' : 'Consumer not found')}</h5>
                        </div>
                    ) : (
                        <div>
                            <h3 className="mt-3 mdc-typography--headline3">
                                {this.object.name}
                                <Link to={"/consumers/" + this.props.match.params.id + "/edit"} className="plain-link"><Ripple className="ml-3 mdc-button mdc-button--outlined" style={{ textTransform: "none" }}>Edit Consumer</Ripple></Link>
                                <Ripple onClick={this.downloadKey.bind(this)} className="ml-3 secondary-button mdc-button mdc-button--outlined" style={{ textTransform: "none" }}>Download Consumer Key</Ripple>
                            </h3>
                            <br />

                            <div className="mb-4">
                                <h5 className="mdc-typography--headline5">Description</h5>
                                <span className="mdc-typography--body1">{this.object.description}</span>
                            </div>

                            <div className="mb-4">
                                <h5 className="mdc-typography--headline5">Granted Sensors</h5>

                                {
                                    ((!DevicesModel.fetching && !DevicesModel.fetched) || !DevicesModel.fetched) ? (
                                        <span className="mdc-typography--body1">
                                            {(!DevicesModel.fetching && !DevicesModel.fetched) ? 'Failed getting consumer info' : (!DevicesModel.fetched ? 'Fetching consumer info' : 'Consumer not found')}
                                        </span>
                                    ) : (
                                            <span className="mdc-typography--body1">
                                                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                                                    <div className="mdc-select">
                                                        <select name="sensor_id" defaultValue="" onChange={this.form.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                                                            <option disabled value="" />
                                                            {
                                                                DevicesModel.data.map(device =>
                                                                    device.sensors.filter((sensor) => sensorIds.indexOf(sensor.id) < 0).map(sensor => {
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

                                                    <Ripple className="mdc-button" style={{ textTransform: "none" }} onClick={this.add.bind(this)}>Grant Sensor</Ripple>
                                                </form>
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
                                            this.object.sensors.length > 0 ? (
                                                this.object.sensors.map((sensor) => (
                                                    <tr key={sensor.id}>
                                                        <td className="mdl-data-table__cell--non-numeric font-weight-bold">{sensor.device.name}</td>
                                                        <td className="mdl-data-table__cell--non-numeric">{sensor.name}</td>
                                                        <td className="mdl-data-table__cell--non-numeric">{sensor.id}</td>
                                                        <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                            <Ripple onClick={this.deleteClick.bind(this, sensor)} className={"text-danger mdc-button mdc-card__action mdc-card__action--button" + (this.deleting ? " disabled" : "")}>Revoke</Ripple>
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
