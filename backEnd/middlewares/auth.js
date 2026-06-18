const jwt = require('jsonwebtoken');

// Secret SIEMPRE desde entorno. Sin fallback: si falta, el proceso aborta al arrancar
// (fail-fast) para evitar firmar/verificar JWT con un secreto público y predecible.
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('JWT_SECRET no está definido. Configurá la variable de entorno antes de iniciar.');
}

// Verifica el JWT del header Authorization: Bearer <token>.
// Si es válido, deja { _id, rol } en req.user. Si no, corta con 401.
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no provisto' });
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = { _id: payload._id, rol: payload.rol };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Restringe el acceso a los roles indicados. Debe ir después de verifyToken.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción' });
  }
  next();
};

module.exports = { verifyToken, requireRole, SECRET_KEY };
