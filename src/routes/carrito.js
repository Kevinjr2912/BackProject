const express = require('express');
const router = express.Router();
const controllersCar = require('../controllers/carrito');

router.post('/addProductToCar', controllersCar.addCar);
router.get('/getProductsCar/:idCustomer',controllersCar.getProductsCar);
router.get('/getPurchaseSummary/:idCustomer', controllersCar.gethPurchaseSummary);

module.exports = router;