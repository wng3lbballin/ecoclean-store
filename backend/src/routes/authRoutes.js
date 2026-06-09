const { Router } = require('express');
const { login, me, cambiarPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = Router();

router.post('/login', login);
router.get('/me', auth, me);
router.put('/cambiar-password', auth, cambiarPassword);

module.exports = router;
