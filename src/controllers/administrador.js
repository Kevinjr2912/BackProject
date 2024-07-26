//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

exports.addAdmin = (req, res) => {
  const newAdmin = req.body;
  console.log(newAdmin);

  // Hashear la contraseña antes de guardarla (bcrypt)
  bcrypt.hash(newAdmin.password, 10, (err, hash) => { // 10 es el número de rondas de hashing
    if (err) {
      return res.status(500).send('Error al hashear la contraseña');
    }
    newAdmin.password = hash;
    console.log(newAdmin.password)
    

    // Insertar las credenciales del administrador
    db.query('INSERT INTO CredencialAccesoAdministrador (email,password) VALUES (?,?)', [newAdmin.email, newAdmin.password], (err, result) => {
      if (err) {
        return res.status(500).send('Error al agregar credenciales del administrador');
      }

      const idAdmin = result.insertId;
      console.log(idAdmin);

      // Insertar los detalles del administrador
      db.query('INSERT INTO Administrador (primerNombre,segundoNombre,apellidoPaterno,apellidoMaterno,correoPayPal,id_credencial_admin) VALUES (?,?,?,?,?,?)', 
        [newAdmin.primerNombre, newAdmin.segundoNombre, newAdmin.apellidoPaterno, newAdmin.apellidoMaterno, newAdmin.correoPayPal, idAdmin], (err, result) => {
        if (err) {
          return res.status(500).send('Error al agregar datos del administrador');
        }

        res.status(200).send("Administrador agregado exitosamente");
      });
    });
  });
};

//Loguearse
exports.login = async (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT CredencialAccesoAdministrador.email,CredencialAccesoAdministrador.password FROM CredencialAccesoAdministrador WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        res.status(500).send("Error en el servidor");
        throw err;
      }
      if (result.length === 0) {
        return res.status(401).send("Invalido");
      }
      const admin = result[0];

      //Verificar contraseña (con bcrypt)
      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciales invalidas" });
      }
      //generar JWT
      const token = jwt.sign(
        { id: admin.idAdministrador },
        process.env.JWT_SECRET,
        {
          expiresIn: "10h",
        }
      );
      return res.json({ token });
    }
  );
};
