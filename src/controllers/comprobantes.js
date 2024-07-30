//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Middleware de autenticación
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  if (err) {
  return res.sendStatus(403); // Prohibido (token inválido)
  }
  req.user = user;
  next();
  });
  } else {
  res.sendStatus(401); // No autorizado (sin token)
  }
  };
  
  const storage = multer.memoryStorage();
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpg",
        "image/jpeg",
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "El archivo debe ser formato PDF o una imagen (PNG, JPG, JPEG)"
          )
        );
      }
    },
  }).single("comprobante");
  
  exports.addComprobante = [authenticateJWT,(req, res) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log(err);
        return res.status(500).json({ message: "Error al subir el comprobante" });
      } else if (err) {
        console.log(err);
        return res.status(500).json({ message: "Ocurrió un error" });
      }
  
      const { idCliente } = req.body;
      const archivo = req.file.buffer;
      console.log(idCliente)
      console.log(archivo)
  
      if (!req.file) {
        return res.status(404).json({ message: "Archivo no recibido" });
      }
  
      db.query('SELECT idPedido FROM Pedido WHERE idCliente = ?',[idCliente],(err,result)=>{
        if(err){
          console.log(err)
          return res.status(500).json({error: "Error al buscar dicho idPedido"});
        }
  
        if(result.length == 0){
          console.log("Entrando")
          db.query('INSERT INTO Pedido (idCliente) VALUES (?)',[idCliente],(err,result)=>{
            if(err){
              console.log(err)
              return res.status(500).json({error: "Error al insertar dicho idCliente en la tabla pedido"});
            }
    
            const idPedido = result.insertId;
    
            console.log('Este es el id de pedido ' + idPedido)
    
            db.query(
              "INSERT INTO ComprobantePago (comprobante_pago, id_Pedido) VALUES (?, ?)",
              [archivo, idPedido],
              (err, result) => {
                if (err) {
                  console.error("Error al insertar el comprobante de pago:", err);
                  return res
                    .status(500)
                    .json({ message: "Error al insertar el comprobante de pago" });
                }
        
                console.log("Éxito");
        
                return res.status(201).json({idPedido: idPedido});
              }
            );
          });
        }
  
      });
    });
  }];
  
  