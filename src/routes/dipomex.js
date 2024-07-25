const express = require('express');
const router = express.Router();
const controllerDipomex = require('../controllers/dipomex');

router.get('/codigo_postal', controllerDipomex.getInformation);

module.exports = router;