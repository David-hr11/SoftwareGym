// Control de acceso por rol (RBAC): administrador, recepcionista, instructor, socio.
// Placeholder: cuando Firebase Auth esté listo, aquí se verifica el token
// y se revisa que el rol del usuario esté en la lista permitida.

function requireRole(...roles) {
  return (req, res, next) => {
    // TODO: verificar token de Firebase Auth y rol
    next();
  };
}

module.exports = { requireRole };
