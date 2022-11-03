import React, { Component } from "react";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { MDCTextFieldHelperText } from '@material/textfield/helper-text';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCDialog } from '@material/dialog';
import {MDCFormField} from '@material/form-field';
import {MDCCheckbox} from '@material/checkbox';
import AuthModel from "../models/AuthModel";
import Snackbar from '../utils/Snackbar';
import RestError from '../utils/RestError';
import Config from "../models/Config";

import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-noconflict/mode-json';
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";

@observer
export default class extends React.Component 
{

  constructor(props)
  {
    super(props);
    this.data = {};
  }

  fetchSettings()
  {
    Config.fetch(AuthModel.userInfo.get('id')).then(response => {
      this.data = response.data;
      console.log(response)
      if (this.data.hasOwnProperty('results') && this.refs.userConfigJSON)
      {
        let settings = this.data.results.settings_json;
        console.log(typeof settings)
        if(typeof settings !== 'string')
        {
          settings = JSON.stringify(settings);
        }
        this.refs.userConfigJSON.editor.getSession().setValue(settings);
      }
    }).catch(err => {
      Snackbar.show(new RestError(err).getMessage());
    });
    Config.updating = false;
  }

  componentDidMount()
  {
    
    this.fetchSettings();
    document.querySelectorAll('.mdc-text-field').forEach((node) => {
      MDCTextField.attachTo(node);
    });
    document.querySelectorAll('.mdc-select').forEach((node) => {
        MDCSelect.attachTo(node);
    });
    document.querySelectorAll('.mdc-text-field-helper-text').forEach((node) => {
        MDCTextFieldHelperText.attachTo(node);
    });
  }

  update(e)
  {
    if(e)
    {
      e.preventDefault();
    }

    let toAdd = {
      config: JSON.stringify(this.refs.userConfigJSON.editor.getSession().getValue())
    }

    Config.update(AuthModel.userInfo.get('id'), 
                          this.data.hasOwnProperty('results') ? this.data.results.id : -1,
                          toAdd).then(response => {
      Snackbar.show("Settings were correctly updated!", "success");
      this.fetchSettings();
    }).catch(err => {
      Snackbar.show(new RestError(err).getMessage());
    });
  }

  render()
  {
    return (
      <div>
        <h3 className="mdc-typography--headline3">Your Settings:</h3>
        <br/>
        <div style={{marginLeft: "15px"}}>
          <AceEditor
            style={{
            height: '50vh',
            width: '45%',
            }}
            placeholder='{}'
            value={
            "{}"
            }
            mode='json'
            ref='userConfigJSON'
            theme='textmate'
            orientation='beside'
            name='userConfigJSONEditor'
            readOnly={false}
            fontSize={14}
            onLoad={this.onLoad}
            onChange={this.onChange}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                useWorker: false,
                showLineNumbers: true,
                tabSize: 2,
            }}
          />
        </div>
        <div className="mt-5">
          <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (Config.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
        </div>
        <br/><br/><br/><br/>
      </div>
    );
  }
}