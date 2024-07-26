//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

//Loguearse
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password)

  db.query("SELECT email,password FROM CredencialAccesoCliente WHERE email = ?",[email],async (err, result) => {
      if (err) {
        res.status(500).send("Error en el servidor");
        throw err;
      }
      if (result.length === 0) {
        return res.status(401).send("Invalido");
      }
      const customer = result[0];
      console.log(customer.password);
      //Verificar contraseña (con bcrypt)

      const validPassword = await bcrypt.compare(password, customer.password);
      if (!validPassword) {
        return res.status(401).send("Credenciales invalidas");
      }
      //generar JWT
      const token = jwt.sign({ id: customer.id_cliente }, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });
      res.json({ token });
    }
  );
};

//Agregar cliente como usuario al sistema
exports.addCustomer = (req, res) => {
  const newCustomer = req.body;
  console.log(newCustomer);
  
  // Hashear la contraseña antes de guardarla (bcrypt)
  bcrypt.hash(newCustomer.password, 10, (err, hash) => {
    // 10 es el número de rondas de hashing
    if (err) {
      res.status(500).send("Error al hashear la contraseña");
      throw err;
    }
  
    newCustomer.password = hash;

    console.log(newCustomer.password);

    db.query('INSERT INTO CredencialAccesoCliente (email,password) VALUES (?,?)', [newCustomer.email,newCustomer.password] ,
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error al agregar credenciales de acceso del cliente");
        }
  
        const idCredencialCliente = result.insertId;
        console.log(idCredencialCliente)

        db.query('INSERT INTO Cliente (primer_nombre, segundo_nombre,apellido_paterno,apellido_materno,id_credencial_cliente) VALUES (?,?,?,?,?)',[newCustomer.primerNombre,newCustomer.segundoNombre,newCustomer.apellidoPaterno,newCustomer.apellidoMaterno,idCredencialCliente],(err,result)=>{
          if(err){
            return res.status(500).json({message:"Error al insertar datos del cliente"})
          }

          return res.status(200).json({message: "Datos del cliente y sus credenciales de acceso agregados exitosamente"});
        }
      )}
    );
  });
};

//Obtener todos los clientes
exports.allCustomers = [authenticateJWT,(req, res) => {
  db.query('SELECT * FROM Cliente', (err, result) => {
    if (err) {
      res.status(500).send('Error al obtener los usuarios');
      throw err;
    }
    res.json(result);
  });
}];

