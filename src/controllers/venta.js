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
    res.sendStatus(401);
  }
};

exports.getdetailSale = [authenticateJWT,(req, res) => {
  db.query('SELECT CC.email,P.fecha,P.total, P.idPedido FROM CredencialAccesoCliente CC INNER JOIN Cliente C ON CC.id_cliente = C.id_cliente INNER JOIN Pedido P ON C.id_cliente = P.idCliente', (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Ocurrió un error al obtener los elementos" });
    }

    res.json(result)
  })
}];

exports.getDetailsOrder = [authenticateJWT,(req, res) => {
  const { idPedido } = req.params;

  db.query('SELECT P.nombre,P.precio,DP.cantidad FROM DetallePedido DP INNER JOIN Productos P  ON DP.id_producto = P.idProductos WHERE DP.id_pedido = ?', [idPedido], (err, result) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Error al obtener el nombre de dicho producto, la cantidad y precio" });
    }

    return res.status(200).json(result);
  })
}]


exports.getShippingDetail = [authenticateJWT,(req, res) => {
  const { idPedido } = req.params;

  db.query('SELECT DD.calle, DD.numeroExterior, DD.referencia, E.nombre_estado, M.nombre_municipio, Col.nombre_colonia, CP.codigo_postal FROM DetallePedido DP INNER JOIN Pedido P ON DP.id_pedido = P.idPedido INNER JOIN Cliente C ON P.idCliente = C.id_cliente INNER JOIN DatosDomicilio DD ON C.id_cliente = DD.idCliente JOIN DatosEnvio DE ON DD.idCliente = DE.id_cliente INNER JOIN Estado E ON DE.id_estado = E.id_estado INNER JOIN Municipio M ON DE.id_municipio = M.id_municipio INNER JOIN Colonia Col ON DE.id_colonia = Col.id_colonia INNER JOIN CodigoPostal CP ON DE.id_codigo_postal = CP.id_codigo_postal WHERE P.idPedido = ?', [idPedido], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error al buscar dichos datos" });
    }

    if (result.length === 0) {
      return res.status(400).json({ error: "Elemento no encontrado" });
    }

    const dataShipping = {
      codigoPostal: result[0].codigo_postal,
      estado: result[0].nombre_estado,
      municipio: result[0].nombre_municipio,
      colonia: result[0].nombre_colonia,
      calle: result[0].calle,
      numeroExterior: result[0].numeroExterior,
      referencia: result[0].referencia
    }

    console.log(dataShipping)

    return res.status(200).json(dataShipping);

  })
}]


exports.getPDFSale = [authenticateJWT,(req,res) => {
  const { idPedido } = req.params;
  
  db.query('SELECT CP.comprobante_pago FROM ComprobantePago CP INNER JOIN Pedido P ON CP.id_pedido = P.idPedido INNER JOIN DetallePedido DP ON P.idPedido = DP.id_pedido WHERE CP.id_pedido = ?',[idPedido],(err,result)=>{
    if(err){
      return res.status(500).json({error: "Error al obtener dicha imagen de pago"})
    }

    return res.status(200).json(result)
  })
}]