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

exports.getInformation = [authenticateJWT, async (req, res) => {
    const { cp } = req.query;
    console.log(cp)
    const key = 'd1b726ba03907ec0e841c47d17c413fac4af7966';

    try {
        const response = await fetch(`https://api.tau.com.mx/dipomex/v1/codigo_postal?cp=${cp}`, {
            method: 'GET',
            headers: {
                'APIKEY': key,
            }
        });

        const data = await response.json();

        if (!data.error) {
            return res.json(data);
        }

        return res.json({ error: "No se encontró dicho código postal" });

    } catch (err) {
        return res.json({ error: err });
    }
}];