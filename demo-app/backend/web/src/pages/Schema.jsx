import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import SensorSchemaModel from "../models/SensorSchemaModel";

import AuthModel from "../models/AuthModel";
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';

@observer
export default class extends React.Component {
    @observable to_delete;

    componentWillMount() {
        SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
    }

    componentDidMount() {
        this.dialog = new MDCDialog(document.querySelector('#my-mdc-dialog'));

        this.dialog.listen('MDCDialog:accept', () => {
            const { id, name } = this.to_delete;
            SensorSchemaModel.delete(AuthModel.userInfo.get("id"), id).then((response) => {
                Snackbar.show("Deleted schema " + name, "success");
                SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
            }).catch((error) => {
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
        return (
            <div>
                <h3 className="mdc-typography--headline3">
                    Sensor Schemas
                    <Link to={"/users/" + AuthModel.userInfo.get("id") + "/schemas/new"} className="plain-link"><Ripple className="ml-4 mdc-button mdc-button--outlined" style={{ textTransform: "none" }}>Add Sensor Schema</Ripple></Link>
                    <Ripple onClick={SensorSchemaModel.fetch.bind(SensorSchemaModel)} className={"secondary-button ml-4 mdc-button mdc-button--outlined" + (SensorSchemaModel.fetching ? " disabled" : "")} style={{ textTransform: "none" }}>Refresh</Ripple>
                </h3>
                <br />

                <aside id="my-mdc-dialog"
                    className="mdc-dialog"
                    role="alertdialog"
                    aria-labelledby="my-mdc-dialog-label"
                    aria-describedby="my-mdc-dialog-description">
                    <div className="mdc-dialog__surface" style={{ width: "unset" }}>
                        <header className="mdc-dialog__header">
                            <h2 id="my-mdc-dialog-label" className="mdc-dialog__header__title">
                                Delete sensor schema "{this.to_delete && this.to_delete.name}"
                            </h2>
                        </header>
                        <section id="my-mdc-dialog-description" className="mdc-dialog__body">
                            Are you sure you want to delete this sensor schema?
                        </section>
                        <footer className="mdc-dialog__footer">
                            <button type="button" className="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel">Cancel</button>
                            <button type="button" className="danger-button mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept">Delete</button>
                        </footer>
                    </div>
                    <div className="mdc-dialog__backdrop"></div>
                </aside>

                <table className="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdc-elevation--z1" style={{ minWidth: "90%" }}>
                    <thead>
                        <tr>
                            <th className="mdl-data-table__cell--non-numeric">Name</th>
                            <th className="mdl-data-table__cell--non-numeric">Description</th>
                            <th className="mdl-data-table__cell--non-numeric">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            SensorSchemaModel.fetching ? (
                                <tr>
                                    <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>Fetching</td>
                                </tr>
                            ): (
                                    SensorSchemaModel.fetched ? (
                                    SensorSchemaModel.data.length > 0 ? (
                                        SensorSchemaModel.data.map((object) => (
                                            <tr key={object.id}>
                                                <td className="mdl-data-table__cell--non-numeric font-weight-bold">{object.name}</td>
                                                <td className="mdl-data-table__cell--non-numeric">{object.description}</td>
                                                <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                    <Link to={"/users/" + AuthModel.userInfo.get("id") + "/schemas/" + object.id} className="plain-link"><Ripple className="secondary-button mdc-button mdc-card__action mdc-card__action--button">View</Ripple></Link>
                                                    <Ripple onClick={this.deleteClick.bind(this, object)} className={"text-danger mdc-button mdc-card__action mdc-card__action--button" + (SensorSchemaModel.deleting ? " disabled" : "") }>Delete</Ripple>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>No entries yet</td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="mdl-data-table__cell--non-numeric text-danger">Can not fetch data</td>
                                    </tr>
                                )
                            )
                        }
                        {
                            !SensorSchemaModel.fetching && SensorSchemaModel.fetched && SensorSchemaModel.data.length > 0 && (
                                <tr>
                                    <td colSpan="4" className="mdl-data-table__cell--non-numeric">Total of {SensorSchemaModel.data.length} {SensorSchemaModel.data.length > 1 ? "schemas" : "schema"}</td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}
