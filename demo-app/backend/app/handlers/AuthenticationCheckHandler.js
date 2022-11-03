const { AUTHENTICATION_PUBLIC, ROOT_USERNAME } = require('../secrets');
const jwt = require('jsonwebtoken');
const Users = require('../models/UsersModel');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


module.exports = function (req, res, next) {
    
    let bearerHeader = req.header('authorization');
    if (!bearerHeader) {
        let cookieHeader = req.header('cookie');
        if (!cookieHeader) {
            return next();
        }
        let cookies = cookieHeader.split(';').map(cookie => cookie.split('=').map(x => x.trim()));
        const authCookie = cookies.find(x => x[0] === 'auth_token');
        if (!authCookie) {
            return next();
        }
        bearerHeader = 'Barear ' + authCookie[1];
    }
    const bearer = bearerHeader.split(' ');
    if (bearer.length != 2) {
        return next();
    }
    const bearerToken = bearer[1];

    jwt.verify(bearerToken, AUTHENTICATION_PUBLIC, { algorithms: ['RS256'], issuer: 'iotplatform' }, (err, authData) => {
        if (!err) {
            if (authData.sub == '-1') {
                req.authenticated_as = { id: -1, name: '<root>', username: ROOT_USERNAME, role: 'SUPER_USER' };
                return next();
            } else {
                Users.findOne({ where: { id: { [Op.eq]: authData.sub } } }).then(data => {
                    if (data) {
                        req.authenticated_as = data;
                        return next();
                    } else {
                        return next();
                    }
                });
            }
        } else {
            return next();
        }
    });
}
