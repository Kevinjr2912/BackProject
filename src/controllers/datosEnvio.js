//Cargar las variables de entorno
const db = require('../database/conecction');
const jwt = require('jsonwebtoken');

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

exports.addShippingInformation = [authenticateJWT, async (req, res) => {
    const {
        codigo_postal,
        nombre_estado,
        nombre_municipio,
        nombre_colonia,
        calle,
        referencia,
    } = req.body;
    const idCliente = req.params.idCliente;
    let { numeroExterior } = req.body;

    console.log(req.body);
    console.log(idCliente);

    if (numeroExterior == "") {
        console.log("El número exterior está vacío");
        numeroExterior = "NA";
    }

    console.log("El valor de numero exterior es: " + numeroExterior);

    try {
        console.log("Nombre colonia " + nombre_colonia);
        let idCodigoPostal = await findOrInsert(
            "CodigoPostal",
            "id_codigo_postal",
            "codigo_postal",
            codigo_postal
        );
        let idEstado = await findOrInsert(
            "Estado",
            "id_estado",
            "nombre_estado",
            nombre_estado
        );
        let idMunicipio = await findOrInsert(
            "Municipio",
            "id_municipio",
            "nombre_municipio",
            nombre_municipio
        );
        let idColonia = await findOrInsert(
            "Colonia",
            "id_colonia",
            "nombre_colonia",
            nombre_colonia
        );

        console.log(
            "Tienen valores dentro de la query " +
            idCodigoPostal +
            idEstado +
            idMunicipio +
            idColonia +
            idCliente
        );

        db.query(
            "INSERT INTO DatosEnvio (id_codigo_postal, id_estado, id_municipio, id_colonia, id_cliente) VALUES (?, ?, ?, ?, ?)",
            [idCodigoPostal, idEstado, idMunicipio, idColonia, idCliente],
            (err, result) => {
                if (err) {
                    console.log(
                        "Error al insertar los datos a la tabla DatosEnvio " + err
                    );
                    return res.json({
                        error: "Error al insertar los datos a la tabla DatosEnvio",
                    });
                }
            }
        );

        db.query(
            "INSERT INTO DatosDomicilio (IdCliente,calle,numeroExterior,referencia) VALUES (?,?,?,?)",
            [idCliente, calle, numeroExterior, referencia],
            (err, result) => {
                if (err) {
                    console.log(
                        "Error al insertar los datos a la tabla DatosDomicilio" + err
                    );
                    return res.status(500).json({
                        error: "Error al insertar los datos a la tabla DatosDomicilio",
                    });
                }

                return res
                    .status(200)
                    .json({ message: "Datos de envío agregados exitosamente" });
            }
        );
    } catch (error) {
        return res.json({
            error: "Error al procesar la información de envío: " + error,
        });
    }
}];

const findOrInsert = (table, idField, nameField, value) => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT ${idField} FROM ${table} WHERE ${nameField} = ?`,
            [value],
            (err, result) => {
                if (err) {
                    return reject("Error al buscar en la tabla " + table);
                }
                if (result.length === 0) {
                    db.query(
                        `INSERT INTO ${table} (${nameField}) VALUES (?)`,
                        [value],
                        (err, result) => {
                            if (err) {
                                return reject("Error al insertar en la tabla " + table);
                            }
                            resolve(result.insertId);
                        }
                    );
                } else {
                    resolve(result[0][idField]);
                }
            }
        );
    });
};

exports.getCustomerAddress = [authenticateJWT, (req, res) => {
    const idCliente = req.params.idCliente;

    db.query(
        "SELECT D.calle,D.numeroExterior,M.nombre_municipio FROM DatosDomicilio D INNER JOIN Cliente C ON D.idCliente = C.id_cliente INNER JOIN Municipio M WHERE C.id_cliente = ?",
        [idCliente],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al buscar dicha dirección de envío" });
            }

            if (result.length == 0) {
                return res.status(400).json({ error: "No se encontró un cliente con dichos datos" })
            }

            return res.json(result);
        }
    );
}];

exports.getFormCustomerAddress = [authenticateJWT, (req, res) => {
    const { idCliente } = req.params;
    console.log(idCliente)
    db.query(
        "SELECT DD.calle,DD.numeroExterior,DD.referencia,E.nombre_estado,M.nombre_municipio,Col.nombre_colonia,CP.codigo_postal FROM DatosDomicilio DD INNER JOIN DatosEnvio DE ON DD.idCliente = DE.id_cliente INNER JOIN Estado E ON DE.id_estado = E.id_estado INNER JOIN Municipio M ON DE.id_municipio = M.id_municipio INNER JOIN Colonia Col ON DE.id_colonia = Col.id_colonia INNER JOIN CodigoPostal CP ON DE.id_codigo_postal = CP.id_codigo_postal WHERE DD.idCliente = ? AND DE.id_cliente = ?", [idCliente, idCliente],
        (err, result) => {
            if (err) {
                console.log(err)
                return res
                    .status(500)
                    .json({
                        error:
                            "Error al obtener los datos requeridos de envío de un cliente",
                    });
            }

            if (result.length == 0) {
                return res
                    .status(404)
                    .json({ message: "No existen datos envío para ese cliente" });
            }

            const infoEnvio = {
                codigoPostal: result[0].codigo_postal,
                estado: result[0].nombre_estado,
                municipio: result[0].nombre_municipio,
                colonia: result[0].nombre_colonia,
                calle: result[0].calle,
                numeroExterior: result[0].numeroExterior,
                referencia: result[0].referencia,
            };

            console.log(infoEnvio);

            return res.status(200).json(infoEnvio);
        }
    );
}];


exports.updateShippingInformation = [authenticateJWT, async (req, res) => {
    const {
        codigo_postal,
        nombre_estado,
        nombre_municipio,
        nombre_colonia,
        calle,
        referencia,
    } = req.body;
    const idCliente = req.params.idCliente;
    let { numeroExterior } = req.body;

    if (numeroExterior === "") {
        numeroExterior = "NA";
    }

    try {
        let idCodigoPostal = await findOrInsert(
            "CodigoPostal",
            "id_codigo_postal",
            "codigo_postal",
            codigo_postal
        );
        let idEstado = await findOrInsert(
            "Estado",
            "id_estado",
            "nombre_estado",
            nombre_estado
        );
        let idMunicipio = await findOrInsert(
            "Municipio",
            "id_municipio",
            "nombre_municipio",
            nombre_municipio
        );
        let idColonia = await findOrInsert(
            "Colonia",
            "id_colonia",
            "nombre_colonia",
            nombre_colonia
        );

        // Actualizar datos de envío
        db.query(
            "UPDATE DatosEnvio SET id_codigo_postal = ?, id_estado = ?, id_municipio = ?, id_colonia = ? WHERE id_cliente = ?",
            [idCodigoPostal, idEstado, idMunicipio, idColonia, idCliente],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: "Error al actualizar los datos de envío",
                    });
                }
            }
        );

        // Actualizar datos de domicilio
        db.query(
            "UPDATE DatosDomicilio SET calle = ?, numeroExterior = ?, referencia = ? WHERE idCliente = ?",
            [calle, numeroExterior, referencia, idCliente],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: "Error al actualizar los datos de domicilio",
                    });
                }

                return res.status(200).json({
                    message: "Datos de envío actualizados exitosamente",
                });
            }
        );
    } catch (error) {
        return res.status(500).json({
            error: "Error al procesar la información de envío: " + error,
        });
    }
}];


