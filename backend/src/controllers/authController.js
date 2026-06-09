const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { registrarLog } = require('../utils/logger');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET || 'ecoclean_jwt_secret_key_2024',
      { expiresIn: '8h' }
    );

    await registrarLog(user.id, user.nombre, 'inició sesión');

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const cambiarPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const result = await pool.query('SELECT password FROM usuarios WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    await registrarLog(req.user.id, req.user.nombre, 'cambió su contraseña');

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error cambiar password:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { login, me, cambiarPassword };
