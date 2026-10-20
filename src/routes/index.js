const { Router } = require('express');

const router = Router();

// Comprobación de que el servidor responde (la usa la página de inicio)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'gym-system', hora: new Date().toISOString() });
});

// Macroproceso A1: socios, accesos y cobranza
router.use('/socios', require('./socios'));
router.use('/accesos', require('./accesos'));
router.use('/pagos', require('./pagos'));

// Macroproceso A2: instalaciones, equipos y contabilidad
router.use('/salones', require('./salones'));
router.use('/equipos', require('./equipos'));
router.use('/contabilidad', require('./contabilidad'));

// Macroproceso A3: portal web, expedientes y rutinas
router.use('/expedientes', require('./expedientes'));
router.use('/rutinas', require('./rutinas'));

module.exports = router;
