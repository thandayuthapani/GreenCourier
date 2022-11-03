import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import BaseSubSubModel from "./BaseSubSubModel";

export default new class extends BaseSubSubModel {
    constructor() {
        super("users", "devices", "sensors");
    }
}
