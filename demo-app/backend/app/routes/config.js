const express = require('express');
const router = express.Router({ mergeParams: true });
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');
const AuthenticationOTAHandler = require('../handlers/AuthenticationOTAHandler');
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const ConfigController = require('../controllers/ConfigController');


// User's Settings
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConfigController.get);
router.put('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConfigController.uiUpdate);
router.get('/fetch', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConfigController.fetch);
router.get('/update', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConfigController.apiUpdate);
router.get('/device/fetch', AuthenticationOTAHandler, AuthenticationRequireRole.USER, ConfigController.fetch);
router.get('/device/fetch', AuthenticationOTAHandler, AuthenticationRequireRole.USER, ConfigController.apiUpdate);

module.exports = router;