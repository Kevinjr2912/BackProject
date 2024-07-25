const express = require('express');
const router = express.Router();
const controllershippingData = require('../controllers/datosEnvio');

router.post('/addShippingInformation/:idCliente', controllershippingData.addShippingInformation);

module.exports = router;