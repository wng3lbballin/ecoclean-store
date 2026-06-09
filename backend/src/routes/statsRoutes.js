const { Router } = require('express');
const { ventasMensuales, ventasAnuales, reporte } = require('../controllers/statsController');
const auth = require('../middleware/auth');

const router = Router();

router.use(auth);

router.get('/ventas-mensuales', ventasMensuales);
router.get('/ventas-anuales', ventasAnuales);
router.get('/reporte', reporte);

module.exports = router;
