const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantes'); 

router.post('/addComprobante', comprobantesController.addComprobante);


module.exports = router;