const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const DeviceSensorsController = require('../controllers/DeviceSensorsController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

// Sensors
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DeviceSensorsController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DeviceSensorsController.add);
router.patch('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DeviceSensorsController.update);
router.delete('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DeviceSensorsController.delete);
router.get('/:id/files/:fileFieldName/:fileId', AuthenticationCheckHandler, AuthenticationRequireRole.USER, DeviceSensorsController.getFile);

module.exports = router;