const { Router } = require('express');

const router = Router();

// Reservación de salones para instructores
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo salones pendiente de implementar' });
});

module.exports = router;
