import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import BaseModel from "./BaseModel";

export default new class extends BaseModel {
    constructor() {
        super("users");
    }
}
