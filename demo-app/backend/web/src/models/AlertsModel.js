import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import BaseModel from "./BaseModel";


export default new class extends BaseModel {
	@observable sensor = 'SENSOR';
	@observable forecast = 'FORECAST';
    constructor() {
        super("alerts");
    }
}