const express = require('express');
const router = express.Router();
const customersControllers = require('../controllers/clientes');

//Rutas para las endpoints
router.get('/allCustomers/', customersControllers.allCustomers);
router.post('/addCustomer/', customersControllers.addCustomer);
router.put('/loginCustomer/', customersControllers.login);

module.exports = router;