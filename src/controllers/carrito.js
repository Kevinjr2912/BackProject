require("dotenv").config();

//Cargar las variables de entorno
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    throw err;
  }

  console.log("Conexión a la base de datos MySQL establecida");
});

// Middleware de autenticación
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

exports.addCar = (req, res) => {
  const { idCliente, idProducto, cantidad } = req.body;
  console.log(req.body);
  db.query(
    "SELECT idCarrito FROM Carrito WHERE idCliente = ? ",
    [idCliente],
    (err, result) => {
      if (err) {
        return res.json({ error: "Error al buscar dicho idCliente" });
      }

      if (result.length == 0) {
        console.log("No existe un idCliente con ese valor");
        db.query(
          "INSERT INTO Carrito (idCliente) VALUES (?)",
          [idCliente],
          (err, result) => {
            if (err) {
              return res.json({
                error: "Error al insertar el idCliente en el carrrito",
              });
            }

            const idCarNew = result.insertId;

            console.log("Este es el id del carrito insertado " + idCarNew);

            db.query(
              "INSERT INTO CarritoProducto (cantidad,idCarrito,idProductos) VALUES (?,?,?)",
              [cantidad, idCarNew, idProducto],
              (err, result) => {
                if (err) {
                  return res.json({
                    error: "Error al insertar ciertos datos en la tabla ",
                  });
                }

                return res.json({ message: "Producto agregado exitosamente" });
              }
            );
          }
        );
      } else {
        console.log("Ya existe un idCarrito para ese cliente");

        const idCarCustomer = result[0].idCarrito;

        console.log(
          "Id del carrito " +
            idCarCustomer +
            " del cliente con el id " +
            idCliente
        );

        db.query(
          "SELECT IdProductos,cantidad FROM CarritoProducto WHERE IdProductos = ? AND idCarrito = ?",
          [idProducto, idCarCustomer],
          (err, result) => {
            if (err) {
              return res.json({ error: "Error al buscar dicho idProducto" });
            }

            if (result.length == 0) {
              db.query(
                "INSERT INTO CarritoProducto (cantidad,idCarrito,idProductos) VALUES (?,?,?)",
                [cantidad, idCarCustomer, idProducto],
                (err, result) => {
                  if (err) {
                    return res.json({
                      error: "Error al insertar ciertos datos en la tabla ",
                    });
                  }

                  return res.json({
                    message: "Producto agregado exitosamente",
                  });
                }
              );
            } else {
              console.log(result[0].cantidad);
              const newAmount = cantidad + result[0].cantidad;
              console.log("nueva cantidad " + newAmount);

              db.query(
                "UPDATE CarritoProducto SET cantidad = ? WHERE idCarrito = ? AND idProductos = ?",
                [newAmount, idCarCustomer, idProducto],
                (err, result) => {
                  if (err) {
                    console.error(
                      "Error al actualizar la cantidad del producto:",
                      err
                    );
                    return res.json({
                      message: "Error al modificar la cantidad del producto",
                    });
                  }
                  console.log("Producto agregado exitosamente");
                  return res.json({
                    message: "Producto agregado exitosamente",
                  });
                }
              );
            }
          }
        );
      }
    }
  );
};

exports.getProductsCar = (req, res) => {
  const idCliente = req.params.idCustomer;
  console.log("Este es el id del cliente" + idCliente);
  let productCar = {};

  db.query(
    "SELECT idCarrito FROM Carrito WHERE idCliente = ?",
    [idCliente],
    (err, result) => {
      if (err) {
        return res.json({ error: "Error al buscar dicho idCarrito" });
      }

      const idCarrito = result[0].idCarrito;

      console.log(idCarrito);

      db.query(
        "SELECT CP.cantidad, P.idProductos, P.nombre, P.precio, IP.imagen FROM Productos P INNER JOIN CarritoProducto CP ON P.idProductos = CP.idProductos INNER JOIN (SELECT IP.imagen, IP.idProducto, IP.idImagenProducto FROM ImagenProducto IP INNER JOIN (SELECT MIN(idImagenProducto) AS idImagenProducto, idProducto FROM ImagenProducto GROUP BY idProducto) firstImage ON IP.idImagenProducto = firstImage.idImagenProducto) IP ON P.idProductos = IP.idProducto WHERE CP.idCarrito = ?",
        [idCarrito],
        (err, result) => {
          if (err) {
            return res.json({
              error:
                "Error al obtener los productos contenidos en el carrito de cierto cliente",
            });
          }

          const productsCar = result.map((productCar) => ({
            idProducto: productCar.idProductos,
            nombre: productCar.nombre,
            precio: productCar.precio,
            cantidad: productCar.cantidad,
            imagen: productCar.imagen.toString("base64"),
          }));

          console.log(productsCar);

          return res.json(productsCar);
        }
      );
    }
  );
};

exports.gethPurchaseSummary = (req, res) => {
  const idCustomer = req.params.idCustomer;
  console.log(req.params.idCustomer);
  console.log("Este es el id del cliente " + idCustomer);

  db.query('SELECT Carrito.idCarrito FROM Carrito WHERE Carrito.idCliente = ?',[idCustomer],(err,result)=>{
    if(err){
      return res.json({erro: "Error al obtener dicho elemento"})
    }

    const idCar = result[0].idCarrito;
    console.log(idCar)

    db.query(
      "SELECT SUM(cantidad) AS CantidadProductos, SUM(cantidad * precio) AS TotalPrecioProductos FROM CarritoProducto CP INNER JOIN Productos P ON CP.idProductos = P.idProductos WHERE CP.idCarrito = ?",
      [idCar],
      (err, result) => {
        if (err) {
          return res.json({ error: "Error al obtener el elemento" });
        }

        let purchaseSummary = {
          cantidad: result[0].CantidadProductos,
          precioTotal: result[0].TotalPrecioProductos,
        }

        console.log(purchaseSummary);
        return res.json(purchaseSummary);
      }
    );

  });

  
};
