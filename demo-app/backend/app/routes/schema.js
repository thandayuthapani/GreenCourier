// @ts-check
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const SensorSchemaController = require('../controllers/SensorSchemaController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, SensorSchemaController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, SensorSchemaController.add);
router.patch('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, SensorSchemaController.update);
router.delete('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, SensorSchemaController.delete);


module.exports = router;