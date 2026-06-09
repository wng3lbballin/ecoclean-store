const pool = require('../config/database');
const { registrarLog } = require('../utils/logger');

const listar = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar proveedores' });
  }
};

const obtener = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

const crear = async (req, res) => {
  const { nombre, contacto, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const result = await pool.query(
      'INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nombre, contacto || '', telefono || '', email || '', direccion || '']
    );
    await registrarLog(req.user.id, req.user.nombre, `creó proveedor "${nombre}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

const editar = async (req, res) => {
  const { nombre, contacto, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const result = await pool.query(
      'UPDATE proveedores SET nombre=$1, contacto=$2, telefono=$3, email=$4, direccion=$5 WHERE id=$6 RETURNING *',
      [nombre, contacto || '', telefono || '', email || '', direccion || '', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await registrarLog(req.user.id, req.user.nombre, `editó proveedor "${nombre}"`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al editar proveedor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM proveedores WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await registrarLog(req.user.id, req.user.nombre, `eliminó proveedor "${result.rows[0].nombre}"`);
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

module.exports = { listar, obtener, crear, editar, eliminar };
