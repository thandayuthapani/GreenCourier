// @ts-check
const express = require('express');
const multer = require("multer");
const router = express.Router({ mergeParams: true });
const AuthenticationCheckHandler = require('../handlers/AuthenticationCheckHandler');
const AuthenticationOTAHandler = require('../handlers/AuthenticationOTAHandler');
const AuthenticationRequireRole = require('../handlers/AuthenticationRequireRole');
const OTAController = require('../controllers/OTAController');

const upload = multer();

// OTA Updates
router.get('/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, OTAController.get);
router.post('/upload', upload.any(), AuthenticationCheckHandler, AuthenticationRequireRole.USER, OTAController.upload);
router.get('/download/binary/:otaId/', AuthenticationCheckHandler, AuthenticationRequireRole.USER, OTAController.download);
router.get('/download/firmware/:firmware/:app_version', AuthenticationOTAHandler, AuthenticationRequireRole.USER, OTAController.deviceDownload);

module.exports = router;
