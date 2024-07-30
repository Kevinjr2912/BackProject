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

// Agregar una reseña
exports.addResena = [authenticateJWT,(req, res) => {
  const { idCliente, idProducto } = req.params;
  const { comentario, puntuacion } = req.body;

  console.log(req.params);
  console.log(req.body);

  // Inserción de datos
  db.query('INSERT INTO ResenaProducto (comentario, puntuacion, idProductos, idCliente) VALUES (?, ?, ?, ?)', [comentario, puntuacion, idProducto, idCliente], (err, result) => {
    if (err) {
      return res.json({ error: "Error al insertar la reseña", details: err });
    }

    return res.json({message: "Reseña agregada exitosamente"})
  });
}];

exports.updateResena = [authenticateJWT,(req, res) => {
  const idResenaProducto = req.params.idResenaProducto;
  const { comentario, puntuacion } = req.body;

  db.query("SELECT comentario, puntuacion FROM ResenaProducto WHERE idResenaProducto = ?", [idResenaProducto], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error al obtener los datos de la reseña" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    const existingReseña = result[0];
    let resenaEdit = {};

    if (comentario !== existingReseña.comentario) {
      resenaEdit.comentario = comentario;
    }

    if (puntuacion !== existingReseña.puntuacion) {
      resenaEdit.puntuacion = puntuacion;
    }

    if (Object.keys(resenaEdit).length === 0) {
      return res.json({ message: "No se realizaron cambios en la reseña" });
    }

    db.query('UPDATE ResenaProducto SET ? WHERE idResenaProducto = ?', [resenaEdit, idResenaProducto], (err, result) => {
      if (err) {
        console.log(err + " error de update");
        return res.status(500).json({ error: "Error al actualizar la reseña" });
      }
      console.log("reseña actualizada " + resenaEdit.comentario);
      return res.json({ message: "Reseña actualizada exitosamente" });
    });
  });
}];



// Eliminar una reseña
exports.deleteResena = [authenticateJWT,(req, res) => {
  console.log("Esta entrando al controlador")
  console.log(req.params)
  const {resenaId} = req.params;
  console.log("Este el id de la reseña a eliminar " + resenaId);

  db.query('DELETE FROM ResenaProducto WHERE idResenaProducto = ?', [resenaId],(err,result)=>{
    if(err){
      console.log(eror)
      return res.json({error: "Error al eliminar dicha reseña"})
    }

    return res.json({ message: "Reseña eliminada exitosamente" });
  }
  )
}];

//muestra las reseñas referentes a un id de producto
exports.getResenas = [authenticateJWT,async (req, res) => {
  const { idProducto } = req.params; 
  try {
    db.query('SELECT RP.comentario, RP.puntuacion, RP.idResenaProducto, RP.idCliente FROM ResenaProducto RP WHERE RP.idProductos = ?', [idProducto], (err, result) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ error: "Error en la consulta SQL" });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
}];