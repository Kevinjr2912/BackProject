const express = require('express');
const router = express.Router();
const adminController = require('../controllers/administrador')

router.post('/login', adminController.login);
router.post('/addAdmin', adminController.addAdmin);
module.exports = router;