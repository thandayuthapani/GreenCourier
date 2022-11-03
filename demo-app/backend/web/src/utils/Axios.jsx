import axios from 'axios';

axios.defaults.baseURL = 'http://' + window.location.host + '/api';
//axios.defaults.baseURL = 'http://127.0.0.1:3000/api';

export default axios;
