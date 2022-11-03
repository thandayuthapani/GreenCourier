import React, { Component } from "react";
import { observable, action, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { MDCTextFieldHelperText } from '@material/textfield/helper-text';
import { MDCSnackbar } from '@material/snackbar';
import { Container, Row, Col } from 'reactstrap';
import Snackbar from "../utils/Snackbar";
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";
import AceEditor from 'react-ace';
import FaasFunctionsModel from "../models/FaaSModel";
import styles from '../styles/app.scss';


import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/mode-json';
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-min-noconflict/ext-language_tools";

@observer
export default class extends React.Component {
  @observable logsDownloadEnabled = false;
  @observable resultsDownloadEnabled = false;
  constructor(props) {
    super(props);

    this.state = {
      back: false,
    }

    autorun(() =>{
      if(FaasFunctionsModel.gotResults && 
        (FaasFunctionsModel.results !== undefined) && this.refs.aceEditorLogs !== undefined && this.refs.aceEditorResults !== undefined){
        
        //FaasFunctionsModel.getLogs(AuthModel.userInfo.get('id'), this.props.match.params.function_id);

        if(FaasFunctionsModel.results.hasOwnProperty('results')){
          if(FaasFunctionsModel.results.results === ""){
            this.refs.aceEditorResults.editor.getSession().setValue("The action pod didn't create any results");
          }else{
            this.refs.aceEditorResults.editor.getSession().setValue(FaasFunctionsModel.results.results);
            this.resultsDownloadEnabled = true
          }
        }
        if(FaasFunctionsModel.results.hasOwnProperty('logs')){
          if(FaasFunctionsModel.results.logs === ""){
            this.refs.aceEditorLogs.editor.getSession().setValue("The action pod didn't create any logs");
          }else{
            this.refs.aceEditorLogs.editor.getSession().setValue(FaasFunctionsModel.results.logs);
            this.logsDownloadEnabled = true;
          }
          
        }
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
      } else if(FaasFunctionsModel.failedResults){
        Snackbar.show(new RestError(FaasFunctionsModel.error).getMessage());
        FaasFunctionsModel.failedResults = false;
        this.refs.aceEditorResults.editor.getSession().setValue("The results could not be retrieved");
        this.refs.aceEditorLogs.editor.getSession().setValue("The logs could not be retrieved");
      }
    });
  }

  componentDidMount(){
    FaasFunctionsModel.getResults(AuthModel.userInfo.get('id'), this.props.match.params.function_id)
  }

  downloadLogs(){
    FaasFunctionsModel.downloadLogs(AuthModel.userInfo.get('id'), this.props.match.params.function_id)
                      .then(res =>{
                        let fileName = res.headers["content-disposition"].split("filename=")[1];
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute('download', fileName);
                        document.body.appendChild(link);
                        link.click();
                      })
                      .catch(err => {
                        Snackbar.show(new RestError(err).getMessage());
                      })
  }

  downloadResults(){
    let fileName = 'results.log'
    const url = window.URL.createObjectURL(new Blob([FaasFunctionsModel.results.results]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  }
  
  render(){
    if(this.state.back === true) {
      return <Redirect to={'/faas'} />
    }

    return (
      <div>
        <div>
          <h3 className="mdc-typography--headline3">Action Pod Results</h3>
        </div>
        <Row>
          <Col>
            <Row>
              <div style={{ padding: '10px 10px 4px', fontFamily: 'monospace'}}>
                <strong>Results</strong>
                <Ripple onClick={this.downloadResults.bind(this)} className={"secondary-button ml-4 mdc-button mdc-button--outlined" + (this.logsDownloadEnabled ? "": " disabled")} style={{ textTransform: "none" }}>Download</Ripple>
              </div>
            </Row>
            <Row>
              <AceEditor
                style={{
                    height: '80vh',
                    width: '95%',
                }}
                placeholder='There is no results'
                mode="json"
                ref="aceEditorResults"
                theme="monokai"
                orientation="beside"
                name="blah2"
                readOnly={true}
                wrapEnable={true}
                onLoad={this.onLoad}
                onChange={this.onChange}
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                value={this.code_form}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    useWorker: false,
                    showLineNumbers: true,
                    tabSize: 2,
                }}/>
            </Row>
          </Col>
          
          <Col>
            <Row>
              <div style={{ padding: '10px 10px 4px', fontFamily: 'monospace'}}>
                <strong>Logs</strong>
                <Ripple onClick={this.downloadLogs.bind(this)} className={"secondary-button ml-4 mdc-button mdc-button--outlined" + (this.logsDownloadEnabled ? "": " disabled")} style={{ textTransform: "none" }}>Download</Ripple>
              </div>
            </Row>
            <Row>
              <AceEditor
                style={{
                    height: '80vh',
                    width: '95%',
                }}
                placeholder='Everything worked perfectly!'
                mode="text"
                ref="aceEditorLogs"
                theme="monokai"
                orientation="beside"
                name="blah2"
                readOnly={true}
                wrapEnable={true}
                fontSize={14}
                onLoad={this.onLoad}
                onChange={this.onChange}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                value={this.code_form}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    useWorker: false,
                    showLineNumbers: true,
                    tabSize: 2,
                }}/>
            </Row>
          </Col>
        </Row>
        <Row>
          <div className="mt-5">
            <Link to={'/faas'} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Done</Ripple></Link>
          </div>
        </Row>
        <br/><br/><br/><br/>
      </div>
    )
  }
}