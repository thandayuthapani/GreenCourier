import React from "react";
import {observable, action, autorun} from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { Container, Row, Col } from 'reactstrap';
import DevicesModel from '../models/DevicesModel';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AlertsModel from "../models/AlertsModel";
import PredictionsModel from "../models/PredictionsModel";
import ConsumersModel from "../models/ConsumersModel";
import axios from "axios";


@observer
export default class extends React.Component {
    @observable object

    constructor(props) {
        super(props);

        this.state = {
            back: false,
            alertSource: '',
        }

        this.handleChange = this.handleChange.bind(this);

        this.form = new FormModel();
        autorun(() => {
            this.failedFetching = !AlertsModel.fetching && !AlertsModel.fetched;
            var notFound = false;
            var object;
            if (AlertsModel.fetched) {
                const objects = AlertsModel.data.filter((object) => (object.id == this.props.match.params.id));
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
        this.form.values.alertSource = this.state.alertSource;
        if(this.state.alertSource == AlertsModel.sensor){
            this.form.values.prediction_id = null;
        }
        else if(this.state.alertSource == AlertsModel.forecast){
            this.form.values.source_id = null;
        }
        AlertsModel.add(this.form.values).then((response) => {
            this.form.clearForm();
            this.setState({ back: true })
            AlertsModel.fetch();
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    handleChange(event) {
        const target = event.target;
        this.setState({[target.name]: target.value});
    }

    render() {
        var sensorIds = [];
        if (this.object && this.object.sensor) {
            sensorIds = this.object.sensor.map(sensor => sensor.id);
        }
        if (this.state.back === true) {
            return <Redirect to='/alerts'/>
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Add Alert</h3>
                <br />

                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="alerts-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="alerts-add-name" className="mdc-floating-label">Name</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="3">
                            <div className="mdc-select" style={{ width: "100%" }}>
                                <select id="predictions-add-alertSource" defaultValue="" name="alertSource"  onChange={this.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                                    <option disabled value="" />
                                    <option value={AlertsModel.sensor}>
                                        Sensor
                                    </option>
                                    <option value={AlertsModel.forecast}>
                                        Forecast
                                    </option>
                                </select>
                                <label htmlFor="predictions-add-alertSource" className="mdc-floating-label">Alert Source</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                        <Col md="3">
                            <RelationshipChoice alertSource={this.state.alertSource} form={this.form}/>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-select" style={{ width: "100%" }}>
                                <select name="alertType" defaultValue="" onChange={this.form.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                                    <option disabled value="" />
                                    <option>Minimum</option>
                                    <option>Maximum</option>
                                </select>
                                {/*<input type="text" id="alerts-add-type" name="alertType" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />*/}
                                <label htmlFor="alerts-add-type" className="mdc-floating-label">Type</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="alerts-add-value" name="value" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="alerts-add-value" className="mdc-floating-label">Value</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="alerts-add-email" name="email" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="alerts-add-email" className="mdc-floating-label">E-mail</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
					<Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="alerts-add-frequency" name="frequency" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="alerts-add-frequency" className="mdc-floating-label">Alert on Change (Delta)</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to="/alerts" className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (AlertsModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Add</Ripple>
                    </div>
                </form>
            </div>
        )
    }
}
class RelationshipChoice extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
		if(this.props.alertSource == AlertsModel.sensor){
            return <SensorRelationship form={this.props.form}/>;
        }
        else if(this.props.alertSource == AlertsModel.forecast){
            return <PredictionRelationship form={this.props.form}/>;
        }
        else
            return null;
    }
}


class PredictionRelationship extends React.Component{

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    render(){
        return (
            <div className="mdc-select">
                <select id="alerts-add-prediction_id" name="prediction_id" defaultValue="" onChange={this.props.form.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                    <option disabled value="" />
                    {
                        PredictionsModel.data.map(prediction => {
                            return (
                                <option value={prediction.id} key={`${prediction.id}`}>
                                    {`${prediction.name}`}
                                </option>
                            )
                        })
                    }
                </select>
                <label htmlFor="alerts-add-prediction_id" className="mdc-floating-label">Pick a Prediction</label>
                <div className="mdc-line-ripple" />
            </div>
        );
    }
}

class SensorRelationship extends React.Component{

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
    }

    render(){
        return (
            <div className="mdc-select">
                <select id="alerts-add-sensor_id" name="sensor_id" defaultValue="" onChange={this.props.form.handleChange} className="mdc-select__native-control" style={{ minWidth: "200px" }}>
                    <option disabled value="" />
                    {
                        DevicesModel.data.map(device =>
                            device.sensors.map(sensor => {
                                return (
                                    <option value={sensor.id} key={`${device.id}_${sensor.id}`}>
                                        {`${device.name}: ${sensor.name}`}
                                    </option>
                                )
                            })
                        )
                    }
                </select>
                <label htmlFor="alerts-add-sensor_id" className="mdc-floating-label">Pick a sensor</label>
                <div className="mdc-line-ripple" />
            </div>
        );
    }
}