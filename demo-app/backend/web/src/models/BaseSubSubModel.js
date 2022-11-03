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
    @observable secondResource;


    constructor(resource, secondResource, thirdResource) {
        this.resource = resource;
        this.secondResource = secondResource;
        this.thirdResource = thirdResource;
    }

    _getBaseLocation(parentParentId, parentId) {
        return `${this.resource}/${parentParentId}/${this.secondResource}/${parentId}/${this.thirdResource}`;
    }

    fetch(parentParentId, parentId) {
        this.fetching = true;

        axios.get(this._getBaseLocation(parentParentId, parentId)).then((res) => {
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

    add(parentParentId, parentId, data, config) {
        this.adding = true;

        return axios.post(this._getBaseLocation(parentParentId, parentId), data, config).then((response) => {
            this.adding = false;
            return response;
        }).catch((error) => {
            this.adding = false;
            throw error;
        });
    }

    delete(parentParentId, parentId, id) {
        this.deleting = true;

        return axios.delete(`${this._getBaseLocation(parentParentId, parentId)}/${id}`).then((response) => {
            this.deleting = false;
            return response;
        }).catch((error) => {
            this.deleting = false;
            throw error;
        });
    }

    update(parentParentId, parentId, id, toUpdate) {
        this.updating = true;

        return axios.patch(`${this._getBaseLocation(parentParentId, parentId)}/${id}`, toUpdate).then((response) => {
            this.updating = false;
            return response;
        }).catch((error) => {
            this.updating = false;
            throw error;
        });
    }
}
