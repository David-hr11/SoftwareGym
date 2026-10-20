const { Router } = require('express');

const router = Router();

// Registro de asistencias y validación con lector de código de barras
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo accesos pendiente de implementar' });
});

module.exports = router;
