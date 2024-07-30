//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..','uploads'));
  },
  filename: (req, file, cb) => {
      cb(null, `${file.originalname}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // Limita el tamaño del archivo a 10MB
  fileFilter: (req, file, cb) => {        
      if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Please upload an image'));
      }
      cb(null, true);
  }
}).array("imagen",3);

exports.addProduct = [authenticateJWT,(req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No se subieron los archivos');
    }

    const files = req.files;
    const { nombre, precio, descripcion, id_equipo, id_categoria } = req.body;

    db.query(
      "INSERT INTO Productos (nombre, precio, descripcion, id_equipo, id_categoria) VALUES (?, ?, ?, ?, ?)",
      [nombre, precio, descripcion, id_equipo, id_categoria],
      (err, result) => {
        if (err) {
          console.error('Error al agregar producto:', err);
          return res.status(500).json({ message: "Error al agregar el producto" });
        }

        const idProducto = result.insertId;
        const imageValues = files.map((file) => [idProducto, file.filename, file.path]);

        db.query(
          "INSERT INTO ImagenProducto (idProducto, filename, filepath) VALUES ?",
          [imageValues],
          (err) => {
            if (err) {
              return res.status(500).json({ message: "Error al agregar las imágenes del producto" });
            }
            return res.status(201).json({ message: "Producto e imágenes agregadas exitosamente" });
          }
        );
      }
    );
  });
}];

exports.getAllProducts = [authenticateJWT,(req, res) => {
  db.query(
    "SELECT Productos.idProductos, Productos.nombre, Productos.precio, Productos.descripcion,Categoria.nombreCategoria, Equipo.nombre_equipo FROM Productos INNER JOIN Categoria ON Productos.id_categoria = Categoria.idCategoria INNER JOIN Equipo ON Productos.id_equipo = Equipo.idEquipo ",
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al obtener los elementos" });
      }
      return res.json(result);
    }
  );
}];

exports.getAllHelmets = [authenticateJWT,(req, res) => {
  db.query(
    "SELECT P.idProductos, P.nombre, P.precio, P.descripcion, C.nombreCategoria, E.nombre_equipo,IP.filename FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria INNER JOIN Equipo E ON P.id_equipo = E.idEquipo INNER JOIN ImagenProducto IP ON IP.idProducto = P.idProductos WHERE C.nombreCategoria = 'Casco' GROUP BY IP.idProducto;",
    (err, result) => {
      if (err) {
        console.log(err)
        return res.json({ error: "Error al obtener los cascos" });
      }

      const products = result.map((product) => ({
        idProducto: product.idProductos,
        nombre: product.nombre, 
        precio: product.precio,
        descripcion: product.descripcion,
        nombreCategoria: product.nombreCategoria,
        nombreEquipo: product.nombre_equipo,
        filename: product.filename,
      }));

      return res.json(products);
    }
  );
}];

exports.getAllOveralls = [authenticateJWT,(req, res) => {
  db.query(
    "SELECT P.idProductos, P.nombre, P.precio, P.descripcion, C.nombreCategoria, E.nombre_equipo,IP.filename FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria INNER JOIN Equipo E ON P.id_equipo = E.idEquipo INNER JOIN ImagenProducto IP ON IP.idProducto = P.idProductos WHERE C.nombreCategoria = 'Overol' GROUP BY IP.idProducto",
    (err, result) => {
      if (err) {
        console.log(err)
        return res.json({ error: "Error al obtener los cascos" });
      }

      const products = result.map((product) => ({
        idProducto: product.idProductos,
        nombre: product.nombre, 
        precio: product.precio,
        descripcion: product.descripcion,
        nombreCategoria: product.nombreCategoria,
        nombreEquipo: product.nombre_equipo,
        filename: product.filename,
      }));

      return res.json(products);
    }
  );
}];

exports.getInformationProduct = [authenticateJWT,(req, res) => {
  const idProducto = req.params.idProducto;
  console.log(idProducto);
  let objInformationProduct = {};

  db.query(
    "SELECT IP.filename FROM ImagenProducto IP WHERE IP.idProducto = ?",
    [idProducto],
    (err, result) => {
      if (err) {
        return res.json({
          error: "Error al buscar las imagenes correspondientes del producto",
        });
      }

      let imagesReferences = result.map((imgFilename) => imgFilename.filename);

      console.log(imagesReferences)
      objInformationProduct.img1Filename = imagesReferences[0];
      objInformationProduct.img2Filename = imagesReferences[1];
      objInformationProduct.img3Filename = imagesReferences[2];
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
}];

exports.updateProduct = [authenticateJWT,(req, res) => {
  const productId = req.params.id;
  const { nombre, precio, descripcion, equipo } = req.body;
  let productFront = req.body;

  db.query( 
    "SELECT * FROM Productos WHERE idProductos = ?",
    [productId],
    (err, result) => {
      if (err) {
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
      console.log(product)
      const updateProduct = {};

      if (nombre != product.nombre) {
        updateProduct.nombre = nombre;
        productFront.nombre = nombre;
      }
      if (precio != product.precio) {
        updateProduct.precio = precio;
        productFront.precio = precio;
      }
      if (descripcion != product.descripcion) {
        updateProduct.descripcion = descripcion;
        productFront.descripcion = descripcion;
      }
      if (equipo != product.id_equipo) {
        updateProduct.id_equipo = equipo;
        productFront.equipo = equipo;
      }

      console.log(updateProduct)

      if (Object.keys(updateProduct).length === 0) {
        return res.status(400).json({
          message: "No hay datos para actualizar",
        });
      }

      db.query(
        "UPDATE Productos SET ? WHERE idProductos = ?",
        [updateProduct, productId],
        (err, result) => {
          if (err) {
            console.log(err)
            return res
              .status(500)
              .json({ message: "Error al modificar algún dato del producto" });
          }
          return res.status(200).json(productFront);
        }
      );
    }
  );
}];


exports.deleteProduct = [authenticateJWT,(req, res) => {
  const productId = req.params.id;

  console.log(productId);

  db.query(
    "DELETE FROM ImagenProducto WHERE idProducto = ?",
    productId,
    (err, result) => {
      if (err) {
        console.log(err)
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
      console.log(err)
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
}];


// Controlador
exports.getOchoHelmets = (req, res) => {
  console.log("Fetching helmets...");
  db.query(
    "SELECT P.idProductos, P.nombre, P.precio, P.descripcion, C.nombreCategoria, E.nombre_equipo,IP.filename FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria INNER JOIN Equipo E ON P.id_equipo = E.idEquipo INNER JOIN ImagenProducto IP ON IP.idProducto = P.idProductos WHERE C.nombreCategoria = 'Casco' GROUP BY IP.idProducto LIMIT 8;",
    (err, result) => {
      if (err) {
        console.error("Error al obtener los cascos:", err);
        return res.json({ error: "Error al obtener los cascos" });
      }

      console.log("Raw result:", result);

      const products = result.map((product) => ({
        idProducto: product.idProductos,
        nombre: product.nombre, 
        precio: product.precio,
        descripcion: product.descripcion,
        nombreCategoria: product.nombreCategoria,
        nombreEquipo: product.nombre_equipo,
        filename: product.filename,
      }));

      console.log("Processed products:", products);

      res.json(products);
    }
  );
};

exports.getOchoOveroles = (req, res) => {
  console.log("Fetching overalls...");
  db.query(
   "SELECT P.idProductos, P.nombre, P.precio, P.descripcion, C.nombreCategoria, E.nombre_equipo,IP.filename FROM Productos P INNER JOIN Categoria C ON P.id_categoria = C.idCategoria INNER JOIN Equipo E ON P.id_equipo = E.idEquipo INNER JOIN ImagenProducto IP ON IP.idProducto = P.idProductos WHERE C.nombreCategoria = 'Overol  ' GROUP BY IP.idProducto LIMIT 8;",
    (err, result) => {
      if (err) {
        console.error("Error al obtener los overoles:", err);
        return res.json({ error: "Error al obtener los overoles" });
      }

      console.log("Raw result:", result);

      const products = result.map((product) => ({
        idProducto: product.idProductos,
        nombre: product.nombre, 
        precio: product.precio,
        descripcion: product.descripcion,
        nombreCategoria: product.nombreCategoria,
        nombreEquipo: product.nombre_equipo,
        filename: product.filename,
      }));

      console.log("Processed products:", products);

      res.json(products);
    }
  );
};
