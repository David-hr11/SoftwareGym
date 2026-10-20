const { Router } = require('express');

const router = Router();

// Expediente físico e historial de avance del socio
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo expedientes pendiente de implementar' });
});

module.exports = router;
