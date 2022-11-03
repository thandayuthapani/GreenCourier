// @ts-check
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const PredictionsController = require('../controllers/PredictionsController');
const PredictionsSensorsController = require('../controllers/PredictionsSensorsController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

//Predictions
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, PredictionsController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, PredictionsController.add);
router.delete('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, PredictionsController.delete);

//PredictionsSensors
router.post('/:prediction_id/sensors', AuthenticationCheckHandler, AuthenticationRequireRole.USER, PredictionsSensorsController.addPredictedSensor);

module.exports = router;