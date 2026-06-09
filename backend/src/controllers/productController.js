const pool = require('../config/database');
const { registrarLog } = require('../utils/logger');

const listar = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
    `;
    const params = [];

    if (categoria) {
      query += ' WHERE p.categoria_id = $1';
      params.push(categoria);
    }

    query += ' ORDER BY p.nombre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listar productos:', err);
    res.status(500).json({ error: 'Error al listar productos' });
  }
};

const obtener = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const crear = async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = req.body;

  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  if (precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, descripcion || '', precio, stock || 0, categoria_id || null, imagen_url || '']
    );
    await registrarLog(req.user.id, req.user.nombre, `creó producto "${nombre}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error crear producto:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const editar = async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = req.body;

  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  if (precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
  }

  try {
    const result = await pool.query(
      `UPDATE productos
       SET nombre = $1, descripcion = $2, precio = $3, stock = $4,
           categoria_id = $5, imagen_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [nombre, descripcion || '', precio, stock || 0, categoria_id || null, imagen_url || '', req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await registrarLog(req.user.id, req.user.nombre, `editó producto "${nombre}"`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editar producto:', err);
    res.status(500).json({ error: 'Error al editar producto' });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await registrarLog(req.user.id, req.user.nombre, `eliminó producto "${result.rows[0].nombre}"`);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { listar, obtener, crear, editar, eliminar };
