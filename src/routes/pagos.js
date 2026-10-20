const { Router } = require('express');

const router = Router();

// Cobro de membresías y emisión de facturas
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo pagos pendiente de implementar' });
});

module.exports = router;
