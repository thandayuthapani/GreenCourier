import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { Container, Row, Col } from 'reactstrap';
import SensorsModel from '../models/SensorsModel';
import FormModel from '../models/FormModel';
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

@observer
export default class extends React.Component {
    @observable adding = false;
    @observable uploadPercent = 0;
    
    constructor(props) {
        super(props);

        this.state = {
            back: false,
        }

        this.form = new FormModel();
        this.form.values.mapping = '{ "type": "double" }';
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
    }

    add(e) {
        if (e) {
            e.preventDefault();
        }

        var file = document.getElementById('sensors-add-jar').files[0];

        if (!!file) {
            var fileReader = new FileReader();
            fileReader.onloadend = (e) => {
                var arrayBuffer = e.target.result;

                var blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'application/java-archive' });
                
                const data = new FormData();

                if (this.form.values.name) {
                    data.append('name', this.form.values.name);
                }
                if (this.form.values.description) {
                    data.append('description', this.form.values.description);
                }
                data.append('jar', blob);

                SensorsModel.add(AuthModel.userInfo.get("id"), this.props.match.params.device_id, data).then((response) => {
                    this.form.clearForm();
                    this.setState({ back: true })
                }).catch((error) => {
                    Snackbar.show(new RestError(error).getMessage());
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            this.adding = true;
            SensorsModel.add(AuthModel.userInfo.get("id"), this.props.match.params.device_id, this.form.values, {
                onUploadProgress: progressEvent => {
                    this.uploadPercent = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                }
            }).then((response) => {
                this.adding = false;
                this.form.clearForm();
                this.setState({ back: true })
            }).catch((error) => {
                this.adding = false;
                Snackbar.show(new RestError(error).getMessage());
            });
        }
    }

    render() {
        if (this.state.back === true) {
            return <Redirect to={'/users/' + AuthModel.userInfo.get("id") + '/devices/' + this.props.match.params.device_id} />
        }

        return (
            <div>
                <h3 className="mdc-typography--headline3">Add Sensor</h3>
                <br />

                <form onSubmit={this.add.bind(this)} ref={this.form.setRef}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{width: "100%"}}>
                                <input type="text" id="sensors-add-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="sensors-add-name" className="mdc-floating-label">Name of the sensor</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="sensors-add-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="sensors-add-description" className="mdc-floating-label">[Optional] Description</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="mb-1">
                        <Col md="6">
                            <div style={{ width: "100%" }}>
                                <label style={{color: "rgba(0, 0, 0, 0.6)", paddingBottom: "8px", marginTop: "16px"}}>[Optional] Data Processing Script (Jar file)</label>
                                <br/>
                                <input type="file" id="sensors-add-jar" name="jar" accept=".jar" />
                            </div>
                        </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field mdc-text-field--textarea" style={{ width: "100%" }}>
                                <textarea defaultValue='{ "type": "double" }' rows="4" id="sensors-add-mapping" name="mapping" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true"></textarea>
                                <label htmlFor="sensors-add-mapping" className="mdc-floating-label">Elasticsearch Value Mapping</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                            <span>You can see mapping document <a href="https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html" target="_blank">here</a></span>
                        </Col>
                    </Row>


                    <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                    <div className="mt-5">
                        <Link to={'/users/' + AuthModel.userInfo.get("id") + "/devices/" + this.props.match.params.device_id} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                        <Ripple onClick={this.add.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (SensorsModel.adding ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                        {
                            this.adding && (
                                <span> Uploading... {this.uploadPercent}%</span>
                            )
                        }
                    </div>
                </form>
            </div>
        )
    }
}
