const { Router } = require('express');
const ctrl = require('../controllers/productController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', role('admin'), ctrl.crear);
router.put('/:id', role('admin'), ctrl.editar);
router.delete('/:id', role('admin'), ctrl.eliminar);

module.exports = router;
