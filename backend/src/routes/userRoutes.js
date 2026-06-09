const { Router } = require('express');
const { listar, obtener, crear, editar, desactivar } = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.use(auth);
router.use(role('admin'));

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', editar);
router.delete('/:id', desactivar);

module.exports = router;
