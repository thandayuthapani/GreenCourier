import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";

export default class {
    @observable values = {};
    @observable ref;

    constructor() {
        this.handleChange = this.handleChange.bind(this);
        this.setRef = this.setRef.bind(this);
    }

    handleChange(e) {
        this.values[e.target.name] = e.target.value;
    }

    setRef(ref) {
        this.ref = ref;
    }

    clearForm() {
        this.ref.reset();
    }
}
