import React, { Component } from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import ConsumersModel from "../models/ConsumersModel";
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';

@observer
export default class extends React.Component {
    @observable to_delete;

    componentWillMount() {
        ConsumersModel.fetch();
    }

    componentDidMount() {
        this.dialog = new MDCDialog(document.querySelector('#my-mdc-dialog'));

        this.dialog.listen('MDCDialog:accept', () => {
            const { id, name } = this.to_delete;
            ConsumersModel.delete(id).then((response) => {
                Snackbar.show("Deleted consumer " + name, "success");
                ConsumersModel.fetch();
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
                    Consumers
                    <Link to="/consumers/add" className="plain-link"><Ripple className="ml-4 mdc-button mdc-button--outlined" style={{ textTransform: "none" }}>Add Consumer</Ripple></Link>
                    <Ripple onClick={ConsumersModel.fetch.bind(ConsumersModel)} className={"secondary-button ml-4 mdc-button mdc-button--outlined" + (ConsumersModel.fetching ? " disabled" : "")} style={{ textTransform: "none" }}>Refresh</Ripple>
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
                                Delete consumer "{this.to_delete && this.to_delete.name}"
                            </h2>
                        </header>
                        <section id="my-mdc-dialog-description" className="mdc-dialog__body">
                            Are you sure you want to delete this consumer?
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
                            ConsumersModel.fetching ? (
                                <tr>
                                    <td colSpan="4" className="mdl-data-table__cell--non-numeric" style={{ color: "#777" }}>Fetching</td>
                                </tr>
                            ): (
                                    ConsumersModel.fetched ? (
                                    ConsumersModel.data.length > 0 ? (
                                        ConsumersModel.data.map((object) => (
                                            <tr key={object.id}>
                                                <td className="mdl-data-table__cell--non-numeric font-weight-bold">{object.name}</td>
                                                <td className="mdl-data-table__cell--non-numeric">{object.description}</td>
                                                <td className="mdl-data-table__cell--non-numeric" style={{ width: "200px" }}>
                                                    <Link to={"/consumers/" + object.id} className="plain-link"><Ripple className="secondary-button mdc-button mdc-card__action mdc-card__action--button">View</Ripple></Link>
                                                    <Ripple onClick={this.deleteClick.bind(this, object)} className={"text-danger mdc-button mdc-card__action mdc-card__action--button" + (ConsumersModel.deleting ? " disabled" : "") }>Delete</Ripple>
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
                            !ConsumersModel.fetching && ConsumersModel.fetched && ConsumersModel.data.length > 0 && (
                                <tr>
                                    <td colSpan="4" className="mdl-data-table__cell--non-numeric">Total of {ConsumersModel.data.length} {ConsumersModel.data.length > 1 ? "consumers" : "consumer"}</td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}
