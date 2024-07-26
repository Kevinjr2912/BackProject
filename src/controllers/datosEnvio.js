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

exports.addShippingInformation = async (req, res) => {
    const { codigo_postal, nombre_estado, nombre_municipio, nombre_colonia, calle, referencia } = req.body;
    const idCliente = req.params.idCliente;
    let {numeroExterior} = req.body;

    console.log(req.body)

    if(numeroExterior == ""){
        console.log('El número exterior está vacío');
        numeroExterior = 'NA';
    }

    console.log('El valor de numero exterior es: ' + numeroExterior);

    try {
        console.log('Nombre colonia ' + nombre_colonia);
        let idCodigoPostal = await findOrInsert('CodigoPostal', 'id_codigo_postal', 'codigo_postal', codigo_postal);
        let idEstado = await findOrInsert('Estado', 'id_estado', 'nombre_estado', nombre_estado);
        let idMunicipio = await findOrInsert('Municipio', 'id_municipio', 'nombre_municipio', nombre_municipio);
        let idColonia = await findOrInsert('Colonia', 'id_colonia', 'nombre_colonia', nombre_colonia);

        console.log("Tienen valores dentro de la query " + idCodigoPostal + idEstado + idMunicipio + idColonia + idCliente);

        db.query('INSERT INTO DatosEnvio (id_codigo_postal, id_estado, id_municipio, id_colonia, id_cliente) VALUES (?, ?, ?, ?, ?)', 
            [idCodigoPostal, idEstado, idMunicipio, idColonia, idCliente], 
            (err, result) => {
                if (err) {
                    console.log('Error al insertar los datos a la tabla DatosEnvio ' + err);
                    return res.json({ error: 'Error al insertar los datos a la tabla DatosEnvio' });
                }
            }
        );

        db.query('INSERT INTO DatosDomicilio (IdCliente,calle,numeroExterior,referencia) VALUES (?,?,?,?)',[idCliente,calle,numeroExterior,referencia],(err,result)=>{
            if(err){
                console.log('Error al insertar los datos a la tabla DatosDomicilio' + err);
                return res.json({ error: 'Error al insertar los datos a la tabla DatosDomicilio' }); 
            }

            return res.json({ message: 'Datos de envío agregados exitosamente' });
        })

    } catch (error) {
        return res.json({ error: 'Error al procesar la información de envío: ' + error });
    }
};

const findOrInsert = (table, idField, nameField, value) => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT ${idField} FROM ${table} WHERE ${nameField} = ?`, [value], (err, result) => {
            if (err) {
                return reject('Error al buscar en la tabla ' + table);
            }
            if (result.length === 0) {
                db.query(`INSERT INTO ${table} (${nameField}) VALUES (?)`, [value], (err, result) => {
                    if (err) {
                        return reject('Error al insertar en la tabla ' + table);
                    }
                    resolve(result.insertId);
                });
            } else {
                resolve(result[0][idField]);
            }
        });
    });
};
