const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const express = require('express');
const router = express.Router({ mergeParams: true });
const UsersController = require('../controllers/UsersController');
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');

router.use('/:user_id/devices', require('./devices'));
router.use('/:user_id/schema', require('./schema'));
router.use('/:user_id/faas', require('./faas'));
router.use('/:user_id/ota', require('./ota'));
router.use('/:user_id/config', require('./config'));

router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, UsersController.getAll);
router.post('/', AuthenticationCheckHandler, AuthenticationRequireRole.ADMIN, UsersController.add);
router.patch('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.ADMIN, UsersController.update);
router.delete('/:id', AuthenticationCheckHandler, AuthenticationRequireRole.ADMIN, UsersController.delete);
router.post('/signin', AuthenticationCheckHandler, UsersController.signin);
router.get('/self', AuthenticationCheckHandler, AuthenticationRequireRole.USER, UsersController.self);
router.post('/dashboard', AuthenticationCheckHandler, UsersController.dashboard);

module.exports = router;