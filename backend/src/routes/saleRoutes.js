const { Router } = require('express');
const ctrl = require('../controllers/saleController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id/ticket', ctrl.ticket);
router.get('/:id', ctrl.obtener);
router.post('/', role('admin', 'vendedor', 'gerente', 'programador'), ctrl.crear);
router.patch('/:id/estado', role('admin', 'vendedor', 'gerente', 'programador'), ctrl.actualizarEstado);

module.exports = router;
