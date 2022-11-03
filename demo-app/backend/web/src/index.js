import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.scss';
import './styles/mdl-data-table.css'

import React from "react";
import { render } from "react-dom";

import { BrowserRouter as Router, Route, Link, Redirect, Switch } from "react-router-dom";

import Devices from "./pages/Devices";
import DevicesAdd from "./pages/DevicesAdd";
import DevicesView from "./pages/DevicesView";
import DevicesEdit from "./pages/DevicesEdit";

import Users from "./pages/Users";
import UsersAdd from "./pages/UsersAdd";
import UsersEdit from "./pages/UsersEdit";
import SignIn from "./pages/SignIn";

import Ripple from "./utils/Ripple";

import AuthModel from "./models/AuthModel";
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import Snackbar from './utils/Snackbar';
import SensorsAdd from './pages/SensorsAdd';
import SensorsEdit from './pages/SensorsEdit';

import SchemaEdit from './pages/SchemaEdit';
import SchemaList from './pages/Schema';

import Consumers from './pages/Consumers';
import ConsumersAdd from './pages/ConsumersAdd';
import ConsumersView from './pages/ConsumersView';
import ConsumersEdit from './pages/ConsumersEdit';
import Alerts from './pages/Alerts';
import AlertsAdd from './pages/AlertsAdd'

import Predictions from './pages/Predictions';
import PredictionsAdd from './pages/PredictionsAdd';
import PredictionsView from './pages/PredictionsView';

import FaaSFunction from './pages/FaaSFunction';
import FaaSFunctionAdd from './pages/FaaSFunctionAdd';
import FaaSFunctionEdit from './pages/FaaSFunctionEdit'
import FaaSFunctionInvoke from './pages/FaaSFunctionInvoke'
import FaaSfunctionResults from './pages/FaaSFunctionResults'

import OTAUpdate from './pages/OTA'

import Config from './pages/Config'



console.disableYellowBox = true;
@observer
class Dashboard extends React.Component {
  
  rootRoles = ["SUPER_USER", "ADMIN"];

  signOut() {
    AuthModel.signOut();
  }
  
  render() {
    return (
      <div>
        <div className="full-height mdc-top-app-bar--fixed-adjust">
          <div className="drawer-container-flex">
            <aside className="mdc-drawer mdc-drawer--permanent">
              <nav className="mdc-drawer__drawer">
                <header className="name-drawer-header mdc-drawer__header">
                  <div className="mdc-drawer__header-content" style={{ display: "block" }}>
                    <div className="d-flex justify-content-center mb-3">
                      <i className="material-icons" style={{ fontSize: "70px", color: "#666" }}>account_circle</i>
                    </div>
                    <h5 className="mdc-typography--headline5" style={{ textAlign:"center" }}>{AuthModel.userInfo.has("name") && AuthModel.userInfo.get("name")}</h5>
                  </div>
                </header>
                <nav className="mdc-drawer__content mdc-list-group">
                  <hr className="mdc-list-divider" />
                  <div className="mdc-list">
                    <Route
                      path="/faas"
                      children={({ match }) => (
                        <Link to={"/faas"} className="plain-link">
                          <Ripple className={"drawer-list-item mdc-list-item" + (match ? " mdc-list-item--selected" : "")} data-mdc-tabindex-handled="true" tabIndex={-1}>
                            <i className="material-icons mdc-list-item__graphic" aria-hidden="true">functions</i>FaaS Functions
                          </Ripple>
                        </Link>
                    )}
                    />
                    {
                      this.rootRoles.includes(AuthModel.userInfo.get('role')) &&
                      <Route
                        path="/users"
                        children={({ match }) => (
                          <Link to="/users" className="plain-link">
                            <Ripple className={"drawer-list-item mdc-list-item" + (match ? " mdc-list-item--selected" : "")} data-mdc-tabindex-handled="true" tabIndex={-1}>
                              <i className="material-icons mdc-list-item__graphic" aria-hidden="true">supervisor_account</i>Users
                            </Ripple>
                          </Link>
                        )
                        }
                      />
                    }
                    
                  </div>
                  <hr className="mdc-list-divider" />
                  <div className="mdc-list">
                    <Ripple onClick={this.signOut.bind(this)} className="drawer-list-item mdc-list-item" data-mdc-tabindex-handled="true" tabIndex={-1}>
                      <i className="material-icons mdc-list-item__graphic" aria-hidden="true">arrow_forward</i>Sign out
                    </Ripple>
                  </div>
                </nav>
              </nav>
            </aside>
            <div style={{ padding: "2rem 4rem", flex: 1 }}>
              <Switch>
                <Route
                  path="/"
                  exact
                  children={({ match }) => (
                    match ? <Redirect to="/users"/> : null
                  )
                  }
                />
                {this.rootRoles.includes(AuthModel.userInfo.get('role')) && <Route exact path="/users" component={Users} />}
                <Route exact path="/users/add" component={UsersAdd} />
                <Route exact path="/users/:id/edit" component={UsersEdit} />
                <Route exact path="/faas" component={FaaSFunction} />
                <Route exact path="/faas/add" component={FaaSFunctionAdd} />
                <Route exact path="/faas/:function_id" component={FaaSFunctionEdit} />
                <Route exact path="/faas/:function_id/invoke" component={FaaSFunctionInvoke} />
                <Route exact path="/faas/:function_id/results" component={FaaSfunctionResults} />
                {AuthModel.userInfo.get("id") !== -1 && <Route exact path="/users/:user_id/config" component={Config}/>}
              </Switch>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

@observer
class AuthCheckIndex extends React.Component {

  componentWillMount() {
    AuthModel.checkAuth();
  }

  render() {
    if (!AuthModel.checked && AuthModel.checking) {
      // Checking for auth key validity
      return (
        <span>Checking authentication key for validity</span>
      );
    } else if (!AuthModel.checked && !AuthModel.checking) {
      // Checking failed
      return (
        <span>Authenticatiton failed, try again later</span>
      );
    } else if (AuthModel.authenticated) {
      // Auth key valid
      return (
        <Switch>
          <Route exact path="/signin" component={SignIn} />
          <Route component={Dashboard} />
        </Switch>
      );
    } else {
      // Auth key invalid
      return (
        <div>
          <Route
            path="/signin"
            exact
            children={({ match }) => (
              !match ? <Redirect to={"/signin" + ((!AuthModel.justSignedOut && this.props.location.pathname) ? ("?redirect=" + this.props.location.pathname) : "")} /> : null
            )
            }
          />
          <Route exact path="/signin" component={SignIn} />
        </div>
      );
    }
  }
}

@observer
class Index extends React.Component {

  render() {
    return (
      <Router onUpdate={() => window.scrollTo(0, 0)}>
        <div>
          <Route component={AuthCheckIndex} />
          { Snackbar.getElement() }
        </div>
      </Router>
    );
  }
}

render(
  <Index />,
  document.getElementById("root")
);
