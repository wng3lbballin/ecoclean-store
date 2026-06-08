const pool = require('../config/database');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, COUNT(p.id)::int AS total_productos FROM categorias c LEFT JOIN productos p ON p.categoria_id = c.id GROUP BY c.id ORDER BY c.nombre'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listar categorias:', err);
    res.status(500).json({ error: 'Error al listar categorías' });
  }
};

const obtener = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obtener categoria:', err);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

const crear = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error crear categoria:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const editar = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  try {
    const result = await pool.query(
      'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre, descripcion || '', req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editar categoria:', err);
    res.status(500).json({ error: 'Error al editar categoría' });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM categorias WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    console.error('Error eliminar categoria:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { listar, obtener, crear, editar, eliminar };
