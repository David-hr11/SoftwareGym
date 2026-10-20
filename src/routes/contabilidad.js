const { Router } = require('express');

const router = Router();

// Ingresos, egresos, nómina y reportes gerenciales
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo contabilidad pendiente de implementar' });
});

module.exports = router;
