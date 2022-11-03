// @ts-check
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const ConsumersController = require('../controllers/ConsumersController');
const ConsumerSensorsController = require('../controllers/ConsumerSensorsController');
const ConsumerConsumeController = require('../controllers/ConsumerConsumeController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

// Consumer
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumersController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumersController.add);
router.patch('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumersController.update);
router.delete('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumersController.delete);
router.get('/:id/key', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumersController.key);

//ConsumersSensors
router.post('/:consumer_id/sensors', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumerSensorsController.enablePermission);
router.delete('/:consumer_id/sensors/:sensor_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, ConsumerSensorsController.disablePermission);

//ConsumerConsume
router.get('/consume/:sensor_id', ConsumerConsumeController.get);
router.get('/consume/:sensor_id/*', ConsumerConsumeController.get);
router.put('/consume/:sensor_id', ConsumerConsumeController.update);
router.put('/consume/:sensor_id/*', ConsumerConsumeController.update);
router.post('/consume/:sensor_id', ConsumerConsumeController.add);
router.post('/consume/:sensor_id/*', ConsumerConsumeController.add);
router.delete('/consume/:sensor_id', ConsumerConsumeController.delete);
router.delete('/consume/:sensor_id/*', ConsumerConsumeController.delete);


module.exports = router;