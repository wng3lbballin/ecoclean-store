const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { registrarLog } = require('../utils/logger');

const MAIN_ADMIN_EMAIL = 'admin@ecoclean.com';
const MAIN_PROG_EMAIL = 'dev@ecoclean.com';

function isProgramador(req) {
  return req.user && req.user.rol === 'programador';
}

const listar = async (req, res) => {
  try {
    const query = isProgramador(req)
      ? 'SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre'
      : "SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE rol != 'programador' ORDER BY nombre";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listar usuarios:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

const obtener = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const crear = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos (nombre, email, password, rol)' });
  }

  if (!['admin', 'vendedor', 'revisor', 'gerente', 'programador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido. Debe ser admin, vendedor, revisor o gerente' });
  }

  if (rol === 'admin' && !isProgramador(req)) {
    return res.status(403).json({ error: 'Solo el programador puede asignar el rol admin' });
  }

  if (rol === 'programador' && !isProgramador(req)) {
    return res.status(403).json({ error: 'No puedes crear usuarios con rol programador' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, activo, created_at',
      [nombre, email, hashedPassword, rol]
    );

    const nuevoUsuario = result.rows[0];
    await registrarLog(req.user.id, req.user.nombre, `creó usuario ${nuevoUsuario.email} (${nuevoUsuario.rol})`);

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    console.error('Error crear usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const editar = async (req, res) => {
  const { nombre, email, rol, activo } = req.body;

  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: 'Nombre, email y rol son requeridos' });
  }

  if (!['admin', 'vendedor', 'revisor', 'gerente', 'programador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  if (rol === 'admin' && !isProgramador(req)) {
    return res.status(403).json({ error: 'Solo el programador puede asignar el rol admin' });
  }

  if (rol === 'programador' && !isProgramador(req)) {
    return res.status(403).json({ error: 'No puedes cambiar a rol programador' });
  }

  try {
    const target = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.params.id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetUser = target.rows[0];

    if (targetUser.rol === 'programador' && !isProgramador(req)) {
      return res.status(403).json({ error: 'Solo el programador puede modificar usuarios con rol programador' });
    }

    if (targetUser.email === MAIN_PROG_EMAIL && targetUser.rol === 'programador' && (rol !== 'programador' || activo === false)) {
      return res.status(403).json({ error: 'No se puede modificar al programador principal' });
    }

    if (req.user.rol !== 'admin' && !isProgramador(req) && targetUser.rol === 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede modificar usuarios con rol admin' });
    }

    if (targetUser.email === MAIN_ADMIN_EMAIL && rol !== 'admin') {
      return res.status(403).json({ error: 'No se puede cambiar el rol del administrador principal' });
    }

    if (targetUser.email === MAIN_ADMIN_EMAIL && activo === false) {
      return res.status(403).json({ error: 'No se puede desactivar al administrador principal' });
    }

    const emailExists = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [email, req.params.id]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está en uso por otro usuario' });
    }

    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol = $3, activo = $4 WHERE id = $5 RETURNING id, nombre, email, rol, activo, created_at',
      [nombre, email, rol, activo !== undefined ? activo : targetUser.activo, req.params.id]
    );

    await registrarLog(req.user.id, req.user.nombre, `editó usuario ${email}`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editar usuario:', err);
    res.status(500).json({ error: 'Error al editar usuario' });
  }
};

const desactivar = async (req, res) => {
  try {
    const target = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.params.id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetUser = target.rows[0];

    if (targetUser.email === MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'No se puede desactivar al administrador principal' });
    }

    if (targetUser.email === MAIN_PROG_EMAIL) {
      return res.status(403).json({ error: 'No se puede desactivar al programador principal' });
    }

    if (targetUser.rol === 'programador' && !isProgramador(req)) {
      return res.status(403).json({ error: 'Solo el programador puede desactivar usuarios con rol programador' });
    }

    if (req.user.rol !== 'admin' && !isProgramador(req) && targetUser.rol === 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede desactivar usuarios con rol admin' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(403).json({ error: 'No puedes desactivar tu propio usuario' });
    }

    await pool.query('UPDATE usuarios SET activo = false WHERE id = $1', [req.params.id]);

    await registrarLog(req.user.id, req.user.nombre, `desactivó usuario ${targetUser.email}`);

    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    console.error('Error desactivar usuario:', err);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

module.exports = { listar, obtener, crear, editar, desactivar };
