
export default class {

    constructor(error) {
        this.error = error;
    }

    getMessage() {
        if (this.error && this.error.response && this.error.response.data) {
            if (this.error.response.data.errors && this.error.response.data.errors.length >= 1) {
                return this.error.response.data.errors[0].message;
            } else if (this.error.response.data.name) {
                return this.error.response.data.name;
            }
        }
        console.error(this.error);
        return "Something went wrong";
    }
}