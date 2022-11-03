import {observable, action} from "mobx";
import BaseSubModel from "./BaseSubModel";
import axios from "../utils/Axios";

export default new class extends BaseSubModel {
  @observable devices = {}
  constructor()
  {
    super("users", "ota");
  }

  uploadFile(parentId, data)
  {
    return axios.post(`${this._getBaseLocation(parentId)}/upload`, data, {headers: {'Content-Type': 'multipart/form-data'}});
  }

  fetch(parentId) {
    this.fetching = true;
    return axios.get(this._getBaseLocation(parentId));
  }

  downloadBinary(parentId, otaId) {
    return axios.get(`${this._getBaseLocation(parentId)}/download/binary/${otaId}`);
  }
}