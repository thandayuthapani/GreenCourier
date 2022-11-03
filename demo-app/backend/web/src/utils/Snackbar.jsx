import React, { Component } from "react";
import { MDCSnackbar } from '@material/snackbar';

export default new class {

    show(message, colorStyle="danger") {
        const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));

        snackbar.set
        const dataObj = {
            timeoutMs: 4000,
            actionText: "Dismiss",
            actionButtonText: "Dismiss",
            message: message,
            actionHandler: function () {

            }
        };

        document.querySelector('.mdc-snackbar').className = "mdc-snackbar mdc-snackbar--align-start bg-" + colorStyle;

        document.querySelector('.mdc-snackbar').style.marginBottom = "40px";

        snackbar.show(dataObj);
    }

    getElement() {
        return (
            <div className="mdc-snackbar mdc-snackbar--align-start"
                aria-live="assertive"
                aria-atomic="true"
                aria-hidden="true"
                style={{ marginBottom: "40px" }}>
                <div className="mdc-snackbar__text text-white"></div>
                <div className="mdc-snackbar__action-wrapper">
                    <button 
                        type="button" 
                        className="mdc-snackbar__action-button action-button-color-white">Dismiss</button>
                </div>
            </div>
        )
    }
}