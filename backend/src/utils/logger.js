const pool = require('../config/database');

const registrarLog = async (usuarioId, usuarioNombre, accion, detalle = '') => {
  try {
    const user = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [usuarioId]);
    if (user.rows.length > 0 && user.rows[0].rol === 'programador') {
      return;
    }
    await pool.query(
      'INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, detalle) VALUES ($1, $2, $3, $4)',
      [usuarioId, usuarioNombre, accion, detalle]
    );
  } catch (err) {
    console.error('Error al registrar log de auditoría:', err.message);
  }
};

module.exports = { registrarLog };
