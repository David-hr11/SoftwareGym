const { Router } = require('express');

const router = Router();

// Altas, bajas y modificaciones de socios; estados de membresía
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo socios pendiente de implementar' });
});

module.exports = router;
