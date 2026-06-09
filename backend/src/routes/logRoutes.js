const { Router } = require('express');
const { listar } = require('../controllers/logController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.use(auth);
router.use(role('admin', 'revisor'));

router.get('/', listar);

module.exports = router;
