const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const DevicesController = require('../controllers/DevicesController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

router.use('/:device_id/sensors', require('./sensors'));

// Devices
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DevicesController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DevicesController.add);
router.patch('/:device_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DevicesController.update);
router.delete('/:device_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DevicesController.delete);
router.get('/:device_id/key', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DevicesController.key);


module.exports = router;