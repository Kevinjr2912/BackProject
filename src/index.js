require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const customersRoutes = require('./routes/clientes');
const productsRoutes = require('./routes/productos');
const adminRoutes = require('./routes/administrador');
const dipomexRoutes = require('./routes/dipomex');
const shippingDataRoutes = require('./routes/datosEnvio');
const comprobantesPagoRoutes = require('./routes/comprobantes');
const carRoutes = require('./routes/carrito');

const app = express();
const port = process.env.DB_PORT || 3000;   


// Configurar CORS para permitir solicitudes desde cualquier origen
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware para analizar los cuerpos de las solicitudes
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))

// Usar las rutas de los items
app.use('/customers', customersRoutes);
app.use('/products', productsRoutes);
app.use('/admins',adminRoutes);
app.use('/api',dipomexRoutes);
app.use('/shippingData',shippingDataRoutes);
app.use('/comprobantes', comprobantesPagoRoutes);
app.use('/cars',carRoutes);

app.listen(port, () => {
    console.log(`Servidor Express en ejecución en http://localhost:${port}`);
});
