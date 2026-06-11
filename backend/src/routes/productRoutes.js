const { Router } = require('express');
const ctrl = require('../controllers/productController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', role('admin', 'gerente'), ctrl.crear);
router.put('/:id', role('admin', 'gerente'), ctrl.editar);
router.delete('/:id', role('admin', 'gerente'), ctrl.eliminar);

module.exports = router;
