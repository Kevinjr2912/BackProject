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

//
//Loguearse
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

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
    const token = jwt.sign(
      { id: customer.id_cliente },
      process.env.JWT_SECRET,
      {
        expiresIn: "10h",
      });

      console.log(token)

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

    if(newCustomer.segundoNombre == ""){
      newCustomer.segundoNombre = 'NA';
    }

    db.query("INSERT INTO Cliente (primer_nombre, segundo_nombre,apellido_paterno,apellido_materno) VALUES (?,?,?,?)",[newCustomer.primerNombre,newCustomer.segundoNombre,newCustomer.apellidoPaterno,newCustomer.apellidoMaterno],(err, result) => {
      if (err) {
        return res.status(500).send("Error al agregar los datos de un cliente");
      }

      const idCliente = result.insertId;

      db.query("INSERT INTO CredencialAccesoCliente (email,password,id_cliente) VALUES (?,?,?)",[newCustomer.email, newCustomer.password, idCliente],(err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error al agregar las credenciales de acceso" });
        }

        return res.status(200).json({ message:"Datos del cliente y sus credenciales de acceso agregados exitosamente"});
      });
      }
    );
  });
};

exports.getClienteComprobante = async (req, res) => {
  const { id_cliente } = req.params;
  console.log("ID del cliente:", id_cliente);

  try {
    db.query(
      `SELECT 
          ca.email,
          p.fecha AS fechaCompra,
          p.total AS precioTotal,
          cp.Comprobante_pago
        FROM 
          Cliente c
        INNER JOIN 
          Pedido p ON c.id_cliente = p.idCliente
        INNER JOIN 
          ComprobantePago cp ON p.idPedido = cp.id_Pedido
        INNER JOIN 
          CredencialAccesoCliente ca ON c.id_credencial_cliente = ca.id_credencial_cliente
        WHERE 
          c.id_cliente = ?`,
      [id_cliente],
      (error, result) => {
        if (error) {
          console.error("Error en la consulta SQL:", error);
          return res.status(500).json({ error: "Error en la consulta SQL" });
        }

        console.log("Resultado de la consulta:", result);

        if (result.length > 0) {
          const { email, fechaCompra, precioTotal, Comprobante_pago } =
            result[0];

          console.log("Comprobante_pago BLOB:", Comprobante_pago);

          const base64Comprobante = Comprobante_pago.toString("base64");
          console.log("Base64 Comprobante:", base64Comprobante);

          const imageBase64 = `data:image/png;base64,${base64Comprobante}`;
          console.log("Image Base64 URL:", imageBase64);

          res.setHeader("Content-Type", "application/json");
          res.setHeader("Content-Disposition", "inline");
          res.status(200).json({
            email,
            fechaCompra,
            precioTotal,
            comprobantePagoUrl: imageBase64,
          });
        } else {
          console.warn(
            "No se encontró el comprobante para el cliente:",
            id_cliente
          );
          res.status(404).json({ error: "No se encontró el comprobante" });
        }
      }
    );
  } catch (error) {
    console.error("Error al obtener los comprobantes del cliente:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los comprobantes del cliente" });
  }
};
