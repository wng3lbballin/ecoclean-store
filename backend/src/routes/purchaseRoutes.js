const { Router } = require('express');
const ctrl = require('../controllers/purchaseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();
router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', role('admin', 'gerente'), ctrl.crear);

module.exports = router;
