import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import BaseSubModel from "./BaseSubModel";

export default new class extends BaseSubModel {
    constructor() {
        super("users", "schema");
    }
}
