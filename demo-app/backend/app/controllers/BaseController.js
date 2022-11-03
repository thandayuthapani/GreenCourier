const connection = require('../connections/mysql');
const { responseError, responseSystemError } = require('../utils/express_utils');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = class {

    constructor(model) {
        this.findAllOptions = {};
        this.model = model;
    }

    getAll(req, res) {
        this.model.findAll(this.findAllOptions).then(datas => {

            return res.status(200).json({ result: datas });
        }).catch(err => responseError(res, err));
    }

    getById(req, res) {

    }

    pre_add(req, res, callback) {
        callback(req.body);
    }

    post_add(data, callback) {
        callback(data);
    }

    add(req, res) {
        this.pre_add(req, res, toAdd => {
            this.model.create(toAdd).then(data => {
                if(res.hasOwnProperty('unsafePass')){
                    data.unsafePass = res.unsafePass;
                    delete res.unsafePass;
                }
                this.post_add(data, result_data => {
                    return res.status(200).json({ result: result_data });
                });
            }).catch(err => responseError(res, err));
        });
    }

    pre_update(data, callback) {
        callback(data);
    }

    update(req, res) {
        this.pre_update(req.body, toUpdate => {
            delete toUpdate.id;
            this.model.update(toUpdate, { where: { id: { [Op.eq]: req.params.id } } }).then(data => {
                return res.status(200).json({ result: data });
            }).catch(err => responseError(res, err));
        });
    }

    pre_delete(req, res, callback) {
        callback();
    }

    delete(req, res) {
        this.pre_delete(req, res, () => {
            this.model.destroy({ where: { id: { [Op.eq]: req.params.id } } }).then(data => {
                return res.status(200).json({ result: data });
            }).catch(err => responseError(res, err));
        });
    }
}
