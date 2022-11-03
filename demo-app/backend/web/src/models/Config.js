import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import BaseSubModel from "./BaseSubModel";

export default new (class extends BaseSubModel {
  @observable updating = false;
  constructor() {
    super("users", "config");
  }

  fetch(parentId) {
    this.updating = true;
    return axios.get(this._getBaseLocation(parentId));
  }

  update(parentId, objectId, toUpdate)
  {
    this.updating = true;
    if(objectId > 0)
    {
      return axios.put(`${this._getBaseLocation(parentId)}?configId=${objectId}`, toUpdate);
    } 
    else
    {
      return axios.put(`${this._getBaseLocation(parentId)}`, toUpdate);
    }
    
  }
})();
