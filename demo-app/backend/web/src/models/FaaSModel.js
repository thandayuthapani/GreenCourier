import {observable, action} from "mobx";
import BaseSubModel from "./BaseSubModel";
import axios from "../utils/Axios";

export default new class extends BaseSubModel {
  @observable getting = false;
  @observable got = false;
  @observable faas = "";

  @observable gettingResults = false;
  @observable gotResults = false;
  @observable results = {results: '', logs:''};
  @observable error = [];
  @observable failedResults = false;

  inputRegex = /^(?!(-|:|;|&)+)(?!.*--)[(-_+)A-Za-z0-9]+$/g;
  memoryOptions = ["512M", "1024M"];

  constructor(){
    super("users", "faas");
  }

  get(parentId, id) {
    this.getting = true;
    axios.get(`${this._getBaseLocation(parentId)}/${id}`).then((res) => {
        action(() => {
            this.getting = false;
            this.got = true;
            this.faas = res.data.result;
        })();
    }).catch((err) => {
        action(() => {
            this.fetching = false;
            this.fetched = false;
        })();
    })
  }

  getResults(parentId, id){
    this.gettingResults = true;
    this.failedResults = false;
    axios.get(`${this._getBaseLocation(parentId)}/${id}/results`).then(response => {
      action(() => {
        this.gettingResults = false;
        
        if(response.data.result !== undefined){
          this.results = response.data.result[0];
          this.getLogs(parentId, id);
        }else{
          this.gotResults = true;
        }
      })();
    }).catch(err => {
      action(() => {
        this.gettingResults = false;
        this.gotResults = false;
        this.error = err;
        this.failedResults = true;
      })();
    })
  }

  getLogs(parentId, id){
    this.failedResults = false;
    return axios.get(`${this._getBaseLocation(parentId)}/${id}/results/logs`).then(res =>{
      console.log("Result From file");
      this.results.logs = res.data;
      this.gotResults = true;
    }).catch(err => {
      console.error(err);
    });
  }

  downloadLogs(parentId, id){
    return axios.get(`${this._getBaseLocation(parentId)}/${id}/results/logs/download`)
                .then(res => {
                  return res;
                }).catch(err => {
                  console.error(err);
                  throw err;
                })
  }
}