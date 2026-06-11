const { Router } = require('express');
const ctrl = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();
router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', role('admin', 'gerente', 'programador'), ctrl.crear);
router.put('/:id', role('admin', 'gerente', 'programador'), ctrl.editar);
router.delete('/:id', role('admin', 'gerente', 'programador'), ctrl.desactivar);

module.exports = router;
