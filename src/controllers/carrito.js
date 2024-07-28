
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

        const idCarCustomer = result[0].idCarrito;

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
              const newAmount = cantidad + result[0].cantidad;

              db.query(
                "UPDATE CarritoProducto SET cantidad = ? WHERE idCarrito = ? AND idProductos = ?",
                [newAmount, idCarCustomer, idProducto],
                (err, result) => {
                  if (err) {
                    return res.json({
                      message: "Error al modificar la cantidad del producto",
                    });
                  }
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

  db.query(
    "SELECT idCarrito FROM Carrito WHERE idCliente = ?",
    [idCliente],
    (err, result) => {
      if (err) {
        return res.json({ error: "Error al buscar dicho idCarrito" });
      }

      const idCarrito = result[0].idCarrito;

      db.query(
        "SELECT CP.cantidad, P.idProductos, P.nombre, P.precio, IP.filename FROM Productos P INNER JOIN CarritoProducto CP ON P.idProductos = CP.idProductos INNER JOIN (SELECT IP.filename, IP.idProducto, IP.idImagenProducto FROM ImagenProducto IP INNER JOIN (SELECT MIN(idImagenProducto) AS idImagenProducto, idProducto FROM ImagenProducto GROUP BY idProducto) firstImage ON IP.idImagenProducto = firstImage.idImagenProducto) IP ON P.idProductos = IP.idProducto WHERE CP.idCarrito = ?",
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
            filenameImagen: productCar.filename,
          }));

          return res.json(productsCar);
        }
      );
    }
  );
};

exports.gethPurchaseSummary = (req, res) => {
  const idCustomer = req.params.idCustomer;

  db.query('SELECT Carrito.idCarrito FROM Carrito WHERE Carrito.idCliente = ?',[idCustomer],(err,result)=>{
    if(err){
      return res.json({erro: "Error al obtener dicho elemento"})
    }

    const idCar = result[0].idCarrito;

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

        return res.json(purchaseSummary);
      }
    );
  });
};

exports.deleteProductCar = (req, res) => {
  const idProducto = req.params.idProducto;
  const {idCliente } = req.body;

  db.query('SELECT C.idCarrito FROM Carrito C WHERE C.idCliente = ?',[idCliente],(err,result)=>{
    if(err){
      return res.json({error: "Error al buscar dicho idCarrito"});
    }

    const idCustomerCar = result[0].idCarrito;

    console.log("Id del carrito respecto a ese cliente" + idCustomerCar);

    db.query('SELECT CP.idCarritoProducto FROM CarritoProducto CP WHERE CP.idCarrito = ? AND CP.idProductos = ?',[idCustomerCar,idProducto],(err,result)=>{
      if(err){
        return res.json({error: "Error al buscar dicho idCarritoProducto"});
      }

      const idCarProduct = result[0].idCarritoProducto;

      console.log("Id con el que está asociado dicho producto" + idCarProduct);

      db.query('DELETE FROM CarritoProducto WHERE idCarritoProducto = ?',[idCarProduct],(err, result) => {
        if (err) {
          return res.status(500).send("Error al eliminar dicho producto del carrito");
        }

        return res.json({message: "Producto eliminado del carrito"});
      }
    );
    })
  });
};
