const express = require('express');
const router = express.Router()
const ventasController = require('../controllers/venta');

router.get('/getInformationSale', ventasController.getdetailSale);
router.get('/getDetailsOrder/:idPedido',ventasController.getDetailsOrder);
router.get('/shippingDetail/:idPedido', ventasController.getShippingDetail);

module.exports = router;