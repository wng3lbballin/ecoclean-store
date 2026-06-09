const { Router } = require('express');
const { chat, analisisVentas } = require('../controllers/iaController');
const auth = require('../middleware/auth');

const router = Router();

router.use(auth);

router.post('/chat', chat);
router.post('/analisis-ventas', analisisVentas);

module.exports = router;
