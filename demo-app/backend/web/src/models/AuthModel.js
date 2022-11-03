import { observable, action, autorun } from "mobx";
import axios from "../utils/Axios";
import Cookies from "../utils/Cookies";

export default new class {
    @observable checked = false;
    @observable checking = false;
    @observable signingIn = false;
    @observable authenticated = false;
    @observable authToken = typeof Cookies.get()["auth_token"] == "undefined" ? "" : Cookies.get()["auth_token"];
    @observable justSignedOut = false;
    @observable userInfo = observable.map({});

    constructor() {
        autorun(() => {
            Cookies.set("auth_token", this.authToken, {
                sameSite: 'strict'
            });
        })

        autorun(() => {
            axios.defaults.headers.common['authorization'] = `Bearer ${this.authToken}`;
        })

        axios.interceptors.response.use(response => response, error => {
            if (error.response && error.response.status === 401) {
                this.authenticated = false;
            }
            return Promise.reject(error);
        });
    }

    checkAuth() {
        if(!this.authToken)
        {
            action(() => {
                this.checked = true;
                this.authenticated = false;
            })();
            return;
        }

        this.checking = true;

        axios.get("users/self").then((res) => {
            action(() => {
                this.checked = true;
                this.checking = false;
                this.authenticated = true;
                this.userInfo.replace(res.data.result);
            })();
        }).catch((err) => {
            action(() => {
                this.checked = true;
                this.checking = false;
                this.authenticated = false;
                this.authToken = "";
            })();
        });
    }

    signIn(username, password) {
        action(() => {
            this.justSignedOut = false;
            this.signingIn = true;
        })();

        return axios.post("users/signin", { username, password }).then((response) => {
            action(() => {
                this.signingIn = false;
                this.authenticated = true;
                this.authToken = response.data.result.token;
                delete response.data.result.token;
                this.userInfo.replace((response.data.result))
            })();
            return response;
        }).catch((error) => {
            action(() => {
                this.signingIn = false;
                this.authenticated = false;
                this.authToken = "";
            })();
            throw error;
        });
    }

    signOut() {
        action(() => {
            this.authenticated = false;
            this.authToken = "";
            this.justSignedOut = true;
            this.userInfo.clear();
        })();
    }
}
