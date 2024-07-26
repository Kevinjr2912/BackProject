//Cargar las variables de entorno
const db = require('../database/conecction');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");


// Middleware de autenticación
//const authenticateJWT = (req, res, next) => {
  //const authHeader = req.headers.authorization;
  //if (authHeader) {
    //const token = authHeader.split(" ")[1];
    //jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      //if (err) {
        //return res.sendStatus(403); // Prohibido (token inválido)
      //}
      //req.user = user;
      //next();
    //});
  //} else {
   // res.sendStatus(401); // No autorizado (sin token)
  //}
//};

// Configuración de Multer para aceptar un solo archivo en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 }, // Limitar tamaño del archivo (opcional)
  fileFilter: (req, file, cb) => {
    // Filtrar solo archivos PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser formato PDF'));
    }
  }
}).single('comprobante'); // Solo se acepta un archivo llamado 'comprobante'

exports.addComprobante = (req, res) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log(err);
        return res.status(500).json({ message: 'Error al subir el comprobante' });
      } else if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Ocurrió un error' });
      }
  
      const idCliente = 11;
      const pdf = req.file.buffer;
      console.log(pdf);
  
      if (!req.file) {
        return res.status(404).json({ message: 'Archivo PDF no recibido' });
      }
  
      db.query(
        'INSERT INTO Venta (idCliente, comprobantePago) VALUES (?, ?)',
        [idCliente, pdf],
        (err, result) => {
          if (err) {
            console.error('Error al insertar el comprobante de pago:', err);
            return res.status(500).json({ message: 'Error al insertar el comprobante de pago' });
          }

          console.log("Exito");
  
          return res.status(201).json({ message: 'Comprobante de pago insertado exitosamente', idVenta: result.insertId });
        }
      );
    });
  };