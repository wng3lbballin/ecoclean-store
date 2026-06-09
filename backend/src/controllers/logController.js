const pool = require('../config/database');

const listar = async (req, res) => {
  try {
    const { page = 1, limit = 50, desde, hasta } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (desde) {
      conditions.push('l.created_at >= $' + (params.length + 1));
      params.push(desde);
    }
    if (hasta) {
      conditions.push('l.created_at <= $' + (params.length + 1));
      params.push(hasta + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM logs_auditoria l ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT l.* FROM logs_auditoria l ${whereClause} ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Error listar logs:', err);
    res.status(500).json({ error: 'Error al listar logs de auditoría' });
  }
};

module.exports = { listar };
