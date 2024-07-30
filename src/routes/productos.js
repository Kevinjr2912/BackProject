const express = require('express');
const router = express.Router();
const productsControllers = require('../controllers/productos');

//Rutas para los endpoints
router.get('/getAllProducts', productsControllers.getAllProducts);
router.get('/getHelmets', productsControllers.getAllHelmets);
router.get('/getAllOveralls', productsControllers.getAllOveralls);
router.get('/getInformationProduct/:idProducto', productsControllers.getInformationProduct);
router.post('/addProduct', productsControllers.addProduct);
router.put('/updateProduct/:id', productsControllers.updateProduct);
router.delete('/deleteProduct/:id', productsControllers.deleteProduct);
//andre routes
router.get('/getOchoHelmets',productsControllers.getOchoHelmets)
router.get('/getOchoOveroles',productsControllers.getOchoOveroles)

module.exports = router;