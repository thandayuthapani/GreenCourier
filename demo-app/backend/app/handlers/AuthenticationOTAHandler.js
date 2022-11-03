const { DEVICE_PUBLIC, ROOT_USERNAME } = require('../secrets');
const jwt = require('jsonwebtoken');
const Users = require('../models/UsersModel');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


module.exports = function (req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        if (bearer.length != 2) {
            return next();
        }
        const bearerToken = bearer[1];

        jwt.verify(bearerToken, DEVICE_PUBLIC, { algorithms: ['RS256'], issuer: 'iotplatform' }, (err, authData) => {
            if (!err) {
                if (authData.sub == '-1') {
                    req.authenticated_as = { id: -1, name: '<root>', username: ROOT_USERNAME, role: 'SUPER_USER' };
                    return next();
                } else {
                    let userDevice = authData.sub.split("/")
                    Users.findOne({ exclude: ["password"], where: { id: { [Op.eq]:  userDevice[0] } } }).then(data => {
                        if(data) {
                            req.authenticated_as = data;
                            if(userDevice.length > 1) {
                                req.authenticated_device = userDevice[1];
                            }
                            return next();
                        } else {
                            return next();
                        }
                    });
                }
            } else {
                return next();
            }
        })
    } else {
        return next();
    }
}