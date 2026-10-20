const { Router } = require('express');

const router = Router();

// Ciclo de vida de activos: adquisición, mantenimiento y bajas
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo equipos pendiente de implementar' });
});

module.exports = router;
