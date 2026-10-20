const { Router } = require('express');

const router = Router();

// Banco de dietas y rutinas de ejercicio
router.get('/', (req, res) => {
  res.status(501).json({ mensaje: 'Módulo rutinas pendiente de implementar' });
});

module.exports = router;
