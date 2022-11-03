import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import PredictionsModel from "../models/PredictionsModel";
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";

@observer
export default class extends React.Component {
    @observable to_delete;

    componentWillMount() {
        PredictionsModel.fetch();
    }

    componentDidMount() {
        this.dialog = new MDCDialog(document.querySelector('#my-mdc-dialog'));

        this.dialog.listen('MDCDialog:accept', () => {
            const { id, name } = this.to_delete;
            PredictionsModel.delete(id).then((response) => {
                Snackbar.show("Deleted Prediction " + name, "success");
                PredictionsModel.fetch();
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
                    Predictions
                    <Link to="/predictions/add" className="plain-link"><Ripple className="ml-4 mdc-button mdc-button--outlined" style={{ textTransform: "none" }}>Add Prediction</Ripple></Link>
                    <Ripple onClick={PredictionsModel.fetch.bind(PredictionsModel)} className={"secondary-button ml-4 mdc-button mdc-button--outlined" + (PredictionsModel.fetching ? " disabled" : "")} style={{ textTransform: "none" }}>Refresh</Ripple>
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
                                Delete prediction "{this.to_delete && this.to_delete.name}"
                            </h2>
                        </header>
                        <section id="my-mdc-dialog-description" className="mdc-dialog__body">
                            Are you sure you want to delete this prediction?
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
                        <th className="mdl-data-table__cell--non-numeric">Algorithm</th>
                        <th className="mdl-data-table__cell--non-numeric">Prediction Period</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        PredictionsModel.fetching ? (
                            <tr>
                                <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>Fetching</td>
                            </tr>
                        ): (
                            PredictionsModel.fetched ? (
                                PredictionsModel.data.length > 0 ? (
                                    PredictionsModel.data.map((object) => (
                                        <tr key={object.id}>
                                            <td className="mdl-data-table__cell--non-numeric font-weight-bold">{object.name}</td>
                                            <td className="mdl-data-table__cell--non-numeric">{object.description}</td>
                                            <td className="mdl-data-table__cell--non-numeric">{object.algorithm}</td>
                                            <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                <Link to={"/predictions/"+object.id} className="plain-link"><Ripple className="secondary-button mdc-button mdc-card__action mdc-card__action--button">View</Ripple></Link>
                                                <Ripple onClick={this.deleteClick.bind(this, object)} className={"text-danger mdc-button mdc-card__action mdc-card__action--button" + (PredictionsModel.deleting ? " disabled" : "") }>Delete</Ripple>
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
                        !PredictionsModel.fetching && PredictionsModel.fetched && PredictionsModel.data.length > 0 && (
                            <tr>
                                <td colSpan="4" className="mdl-data-table__cell--non-numeric">Total of {PredictionsModel.data.length} {PredictionsModel.data.length > 1 ? "predictions" : "prediction"}</td>
                            </tr>
                        )
                    }
                    </tbody>
                </table>
            </div>
        )
    }
}
