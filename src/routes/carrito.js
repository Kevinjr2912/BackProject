const express = require('express');
const router = express.Router();
const controllersCar = require('../controllers/carrito');

//CRUD DE CARRITO
router.get('/getProductsCar/:idCustomer',controllersCar.getProductsCar);
router.get('/getPurchaseSummary/:idCustomer', controllersCar.gethPurchaseSummary);
router.post('/addProductToCar', controllersCar.addCar);
router.delete('/deleteProductCar/:idProducto',controllersCar.deleteProductCar);

module.exports = router;