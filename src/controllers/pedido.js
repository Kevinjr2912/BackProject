//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require("jsonwebtoken");

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

exports.addDetailsOrderCustomer = [authenticateJWT,(req, res) => {
  const { idCliente } = req.params;
  const { idPedido } = req.body;

  db.query(
    "SELECT idCarrito FROM Carrito WHERE idCliente = ?",
    [idCliente],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Error al buscar el idCarrito" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ error: "No se encontró un carrito para el cliente" });
      }

      const idCar = result[0].idCarrito;
      console.log(idCar);

      db.query(
        "SELECT CarritoProducto.idProductos, CarritoProducto.cantidad, Productos.precio FROM CarritoProducto INNER JOIN Productos ON CarritoProducto.idProductos = Productos.idProductos WHERE idCarrito = ?",
        [idCar],
        (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .json({
                error: "Error al seleccionar los elementos del carrito",
              });
          }

          if (result.length === 0) {
            return res
              .status(404)
              .json({ error: "No se encontraron productos en el carrito" });
          }

          const products = result.map((product) => [
            idPedido,
            product.idProductos,
            product.cantidad,
            product.precio,
          ]);

          console.log(products);

          db.query(
            "INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, precio) VALUES ?",
            [products],
            (err, result) => {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .json({ error: "Error al insertar los detalles del pedido" });
              }

              db.query(
                "SELECT SUM(precio * cantidad) AS total FROM DetallePedido WHERE id_pedido = ?",
                [idPedido],
                (err, result) => {
                  if (err) {
                    console.log(err);
                    return res
                      .status(500)
                      .json({ error: "Error al calcular el total del pedido" });
                  }

                  const total = result[0].total || 0;
                  const currentDate = new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ");

                  db.query(
                    "UPDATE Pedido SET total = ?, fecha = ? WHERE idPedido = ?",
                    [total, currentDate, idPedido],
                    (err, result) => {
                      if (err) {
                        console.log(err);
                        return res.status(500).json({ error: "Error al actualizar el pedido" });
                      }

                      db.query('DELETE FROM  CarritoProducto WHERE idCarrito = ?',[idCar],(err,result) => {
                        if(err){
                          console.log(err)
                          return res.status(500).json({error: "Error al eliminar los registros correspondientes "});
                        }

                        db.query('DELETE FROM Carrito WHERE idCarrito = ?',[idCar],(err,result) => {
                          if(err){
                            console.log(err)
                            return res.status(500).json({error: "Error al eliminar el id"});
                          }
  
                          return res.status(201).json({message:"Detalles del pedido insertados, total actualizado y fecha registrada exitosamente"});
                          
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}];
