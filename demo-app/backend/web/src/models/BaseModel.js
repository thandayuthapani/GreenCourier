import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";

export default class {
    @observable fetching = false;
    @observable fetched = false;
    @observable adding = false;
    @observable deleting = false;
    @observable updating = false;
    @observable data = [];
    @observable resource;


    constructor(resource) {
        this.resource = resource;
    }

    fetch() {
        this.fetching = true;

        axios.get(this.resource).then((res) => {
            action(() => {
                this.fetching = false;
                this.fetched = true;
                this.data = res.data.result;
            })();
        }).catch((err) => {
            action(() => {
                this.fetching = false;
                this.fetched = false;
            })();
        })
    }

    add(data) {
        this.adding = true;

        return axios.post(this.resource, data).then((response) => {
            this.adding = false;
            return response;
        }).catch((error) => {
            this.adding = false;
            throw error;
        });
    }

    delete(id) {
        this.deleting = true;

        return axios.delete(`${this.resource}/${id}`).then((response) => {
            this.deleting = false;
            return response;
        }).catch((error) => {
            this.deleting = false;
            throw error;
        });
    }

    update(id, toUpdate) {
        this.updating = true;

        return axios.patch(`${this.resource}/${id}`, toUpdate).then((response) => {
            this.updating = false;
            return response;
        }).catch((error) => {
            this.updating = false;
            throw error;
        });
    }
}