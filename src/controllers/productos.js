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
        return res.sendStatus(403); // Prohibido (token inválido)
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // No autorizado (sin token)
  }
};

//Configurar multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array("imagen", 5);

// Ruta para agregar producto y subir imágenes
exports.addProduct = (req, res) => {
  upload(req, res, (err) => {
    const files = req.files;

    if (!files) {
      return res.status(404).json({ message: "Imagenes no recibidas" });
    }

    const { nombre, precio, nombreCategoria, descripcion, id_equipo } =
      req.body;

    let idCategoria = 0;

    if (nombreCategoria == "Overol") {
      idCategoria = 2;
    } else {
      idCategoria = 1;
    }

    db.query(
      "INSERT INTO Productos (nombre, precio, descripcion, id_equipo, id_categoria) VALUES (?, ?, ?, ?, ?)",
      [nombre, precio, descripcion, id_equipo, idCategoria],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error al agregar el producto" });
        }

        const idProducto = result.insertId;
        const imageValues = files.map((file) => [idProducto, file.buffer]);

        db.query(
          "INSERT INTO ImagenProducto (idProducto,imagen) VALUES ?",
          [imageValues],
          (err, result) => {
            if (err) {
              console.log("Sucedio un error");

              return res
                .status(500)
                .json({
                  message: "Error al agregar las imágenes del producto",
                });
            }
            return res
              .status(201)
              .json({ message: "Producto e imágenes agregadas exitosamente" });
          }
        );
      }
    );
  });
};

exports.getAllProducts = (req, res) => {
  db.query(
    "SELECT Productos.idProductos, Productos.nombre, Productos.precio, Productos.descripcion,Categoria.nombreCategoria, Equipo.nombre_equipo FROM Productos INNER JOIN Categoria ON Productos.id_categoria = Categoria.idCategoria INNER JOIN Equipo ON Productos.id_equipo = Equipo.idEquipo ",
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al obtener los elementos" });
      }
      console.log(result);
      return res.json(result);
    }
  );
};

exports.getAllHelmets = (req, res) => {
  db.query(
    "SELECT P.idProductos, P.nombre, P.precio, P.descripcion, C.nombreCategoria, E.nombre_equipo , MIN(IP.imagen) AS imagen FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria INNER JOIN ImagenProducto IP ON P.idProductos = IP.idProducto INNER JOIN Equipo E ON P.id_equipo = E.idEquipo WHERE P.id_categoria = 1 GROUP BY P.idProductos",
    (err, result) => {
      if (err) {
        return res.json({ error: "Error al obtener los cascos" });
      }

      const products = result.map((product) => ({
        idProducto: product.idProductos,
        nombre: product.nombre, 
        precio: product.precio,
        descripcion: product.descripcion,
        nombreCategoria: product.nombreCategoria,
        nombreEquipo: product.nombre_equipo,
        imagen: product.imagen.toString("base64"),
      }));

      console.log(products);

      res.json(products);
    }
  );
};

exports.getInformationProduct = (req, res) => {
  const idProducto = req.params.idProducto;
  console.log(idProducto);
  let objInformationProduct = {};
  let img = [];

  db.query(
    "SELECT IP.imagen FROM ImagenProducto IP WHERE IP.idProducto = ?",
    [idProducto],
    (err, result) => {
      if (err) {
        return res.json({
          error: "Error al buscar las imagenes correspondientes del producto",
        });
      }

      let images = result.map((img) => img.imagen.toString("base64"));

      objInformationProduct.img1 = images[0];
      objInformationProduct.img2 = images[1];
      objInformationProduct.img3 = images[2];
    }
  );

  db.query(
    "SELECT P.nombre,P.idProductos, P.precio, P.descripcion, C.nombreCategoria FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria WHERE P.idProductos = ?",
    [idProducto],
    (err, result) => {
      if (err) {
        return res.json({
          error: "Error al obtener la información del producto",
        });
      }

      if (result.length > 0) {
        objInformationProduct.idProducto = result[0].idProductos;
        objInformationProduct.nombre = result[0].nombre;
        objInformationProduct.precio = result[0].precio;
        objInformationProduct.descripcion = result[0].descripcion;
        objInformationProduct.nombreCategoria = result[0].nombreCategoria;
      }

      return res.json(objInformationProduct);
    }
  );
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const productFront = req.body;
  const { nombre, precio, descripcion, equipo } = req.body;

  db.query(
    "SELECT * FROM Productos WHERE idProductos = ?",
    [productId],
    (err, result) => {
      if (err) {
        console.error("Error al obtener el producto:", err);
        return res
          .status(500)
          .json({
            message: "Error al obtener el producto con el ID especificado",
          });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({
            message: "No se encontró ningún producto con el ID especificado",
          });
      }

      const product = result[0];
      const updateProduct = {};

      if (nombre != product.nombre) {
        updateProduct.nombre = nombre;
      }
      if (precio != product.precio) {
        updateProduct.precio = precio;
      }
      if (descripcion != product.descripcion) {
        updateProduct.descripcion = descripcion;
      }
      if (equipo != product.equipo) {
        updateProduct.equipo = equipo;
      }

      db.query(
        "UPDATE Productos SET ? WHERE idProductos = ?",
        [updateProduct, productId],
        (err, result) => {
          if (err) {
            console.error("Error al actualizar el producto:", err);
            return res
              .status(500)
              .json({ message: "Error al modificar algún dato del producto" });
          }
          return res.status(200).json(productFront);
        }
      );
    }
  );
};

exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  console.log(productId);

  db.query(
    "DELETE FROM ImagenProducto WHERE idProducto = ?",
    productId,
    (err, result) => {
      if (err) {
        res
          .status(500)
          .send(
            "Error al eliminar dichas imagenes relacionadas con el producto"
          );
        throw err;
      }
    }
  );

  db.query(
    "DELETE FROM Productos WHERE idProductos = ?",
    productId,
    (err, result) => {
      if (err) {
        res.status(500).send("Error al eliminar dicho producto");
      }

      res
        .status(200)
        .send(
          "Producto eliminado de la base de datos así como sus respectivas imágenes"
        );
    }
  );
};
