
module.exports = {
    SUPER_USER: function (req, res, next) {
        if (req.authenticated_as && ["SUPER_USER"].includes(req.authenticated_as.role)) {
            return next();
        } else {
            return res.sendStatus(401);
        }
    },
    ADMIN: function (req, res, next) {
        if (req.authenticated_as && ["SUPER_USER", "ADMIN"].includes(req.authenticated_as.role)) {
            return next();
        } else {
            return res.sendStatus(401);
        }
    },
    USER: function (req, res, next) {
        if (req.authenticated_as && ["SUPER_USER", "ADMIN", "USER"].includes(req.authenticated_as.role)) {
            return next();
        } else {
            return res.sendStatus(401);
        }
    },
}