// @ts-check
const express = require('express');
const router = express.Router({ mergeParams: true });
const UsersController = require('../controllers/UsersController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const FunctionController = require('../controllers/FaaSController');


router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.add);
router.get('/:function_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.get);
// router.patch('/:function_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.edit);
router.post('/:function_id/invoke', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.invoke);
router.delete('/:function_id', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.delete);
router.get('/:function_id/results', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.results);
router.get('/:function_id/results/logs', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.logs);
router.get('/:function_id/results/logs/download', AuthenticationCheckHandler, AuthenticationRequireRole.USER, FunctionController.downloadLogs)

module.exports = router;