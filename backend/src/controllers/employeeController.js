const pool = require('../config/database');
const { registrarLog } = require('../utils/logger');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, puesto, area, salario, fecha_ingreso, activo, created_at FROM empleados ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listar empleados:', err);
    res.status(500).json({ error: 'Error al listar empleados' });
  }
};

const obtener = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, puesto, area, salario, fecha_ingreso, activo, created_at FROM empleados WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obtener empleado:', err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

const crear = async (req, res) => {
  const { nombre, email, telefono, puesto, area, salario, fecha_ingreso } = req.body;

  if (!nombre || !email || !puesto || !area) {
    return res.status(400).json({ error: 'Nombre, email, puesto y área son requeridos' });
  }

  try {
    const exists = await pool.query('SELECT id FROM empleados WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const result = await pool.query(
      `INSERT INTO empleados (nombre, email, telefono, puesto, area, salario, fecha_ingreso)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, email, telefono, puesto, area, salario, fecha_ingreso, activo, created_at`,
      [nombre, email, telefono || '', puesto, area, salario || 0, fecha_ingreso || new Date().toISOString().split('T')[0]]
    );

    const nuevo = result.rows[0];
    await registrarLog(req.user.id, req.user.nombre, `creó empleado ${nuevo.nombre} (${nuevo.puesto})`);

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error crear empleado:', err);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

const editar = async (req, res) => {
  const { nombre, email, telefono, puesto, area, salario, fecha_ingreso, activo } = req.body;

  if (!nombre || !email || !puesto || !area) {
    return res.status(400).json({ error: 'Nombre, email, puesto y área son requeridos' });
  }

  try {
    const target = await pool.query('SELECT * FROM empleados WHERE id = $1', [req.params.id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const old = target.rows[0];
    const emailExists = await pool.query('SELECT id FROM empleados WHERE email = $1 AND id != $2', [email, req.params.id]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está en uso por otro empleado' });
    }

    const nuevoSalario = parseFloat(salario || 0);
    const nuevoPuesto = puesto !== old.puesto;
    const nuevaArea = area !== old.area;
    const cambioSalario = nuevoSalario !== parseFloat(old.salario);

    if (nuevoPuesto || nuevaArea || cambioSalario) {
      let motivo = 'Reestructura';
      if (nuevoPuesto && nuevoSalario > parseFloat(old.salario)) {
        motivo = 'Ascenso';
      } else if (nuevoPuesto) {
        motivo = 'Cambio de puesto';
      } else if (!nuevoPuesto && nuevaArea) {
        motivo = 'Rotación';
      } else if (cambioSalario && nuevoSalario > parseFloat(old.salario)) {
        motivo = 'Aumento';
      } else if (cambioSalario) {
        motivo = 'Ajuste';
      }

      await pool.query(
        `INSERT INTO historial_empleados (empleado_id, puesto_anterior, puesto_nuevo, area_anterior, area_nueva, salario_anterior, salario_nuevo, fecha_cambio, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8)`,
        [req.params.id, old.puesto, puesto, old.area, area, old.salario, nuevoSalario, motivo]
      );
    }

    const result = await pool.query(
      `UPDATE empleados SET nombre = $1, email = $2, telefono = $3, puesto = $4, area = $5,
       salario = $6, fecha_ingreso = $7, activo = $8 WHERE id = $9
       RETURNING id, nombre, email, telefono, puesto, area, salario, fecha_ingreso, activo, created_at`,
      [nombre, email, telefono || '', puesto, area, nuevoSalario,
       fecha_ingreso || old.fecha_ingreso,
       activo !== undefined ? activo : old.activo,
       req.params.id]
    );

    await registrarLog(req.user.id, req.user.nombre, `editó empleado ${email}`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error editar empleado:', err);
    res.status(500).json({ error: 'Error al editar empleado' });
  }
};

const desactivar = async (req, res) => {
  try {
    const target = await pool.query('SELECT * FROM empleados WHERE id = $1', [req.params.id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    await pool.query('UPDATE empleados SET activo = false WHERE id = $1', [req.params.id]);

    await registrarLog(req.user.id, req.user.nombre, `desactivó empleado ${target.rows[0].nombre}`);

    res.json({ message: 'Empleado desactivado' });
  } catch (err) {
    console.error('Error desactivar empleado:', err);
    res.status(500).json({ error: 'Error al desactivar empleado' });
  }
};

const historial = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, puesto_anterior, puesto_nuevo, area_anterior, area_nueva,
              salario_anterior, salario_nuevo, fecha_cambio, motivo, created_at
       FROM historial_empleados
       WHERE empleado_id = $1
       ORDER BY fecha_cambio DESC, created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error historial empleado:', err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { listar, obtener, crear, editar, desactivar, historial };
