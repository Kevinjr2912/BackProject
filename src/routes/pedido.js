const express = require('express');
const router = express.Router();
const controllerOrder = require('../controllers/pedido');

router.post('/addDetailsOrderCustomer/:idCliente', controllerOrder.addDetailsOrderCustomer);

module.exports = router;