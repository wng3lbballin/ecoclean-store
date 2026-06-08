const pool = require('../config/database');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.nombre AS proveedor_nombre, u.nombre AS usuario_nombre
      FROM compras c
      JOIN proveedores p ON p.id = c.proveedor_id
      JOIN usuarios u ON u.id = c.usuario_id
      ORDER BY c.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar compras' });
  }
};

const obtener = async (req, res) => {
  try {
    const compra = await pool.query(
      `SELECT c.*, p.nombre AS proveedor_nombre, u.nombre AS usuario_nombre
       FROM compras c JOIN proveedores p ON p.id = c.proveedor_id
       JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (compra.rows.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

    const detalle = await pool.query(
      `SELECT dc.*, pr.nombre AS producto_nombre
       FROM detalle_compras dc JOIN productos pr ON pr.id = dc.producto_id
       WHERE dc.compra_id = $1`,
      [req.params.id]
    );
    res.json({ ...compra.rows[0], items: detalle.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener compra' });
  }
};

const crear = async (req, res) => {
  const { proveedor_id, items } = req.body;
  if (!proveedor_id) return res.status(400).json({ error: 'Proveedor requerido' });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const lineas = [];

    for (const item of items) {
      if (!item.producto_id || !item.cantidad || item.cantidad <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada item requiere producto_id y cantidad mayor a 0' });
      }
      if (!item.precio_unitario || item.precio_unitario <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada item requiere precio_unitario mayor a 0' });
      }

      const prod = await client.query('SELECT id, nombre FROM productos WHERE id = $1', [item.producto_id]);
      if (prod.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto no encontrado: ${item.producto_id}` });
      }

      const subtotal = parseFloat((item.precio_unitario * item.cantidad).toFixed(2));
      total += subtotal;
      lineas.push({ producto: prod.rows[0], cantidad: item.cantidad, precio_unitario: item.precio_unitario, subtotal });
    }

    const compraResult = await client.query(
      'INSERT INTO compras (proveedor_id, usuario_id, total) VALUES ($1,$2,$3) RETURNING *',
      [proveedor_id, req.user.id, parseFloat(total.toFixed(2))]
    );
    const compra = compraResult.rows[0];

    for (const linea of lineas) {
      await client.query(
        'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [compra.id, linea.producto.id, linea.cantidad, linea.precio_unitario, linea.subtotal]
      );
      await client.query(
        'UPDATE productos SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [linea.cantidad, linea.producto.id]
      );
      await client.query(
        "INSERT INTO movimientos_stock (producto_id, tipo, cantidad, referencia) VALUES ($1,'entrada',$2,$3)",
        [linea.producto.id, linea.cantidad, compra.id]
      );
    }

    await client.query('COMMIT');

    const compraConDetalle = await pool.query(
      `SELECT c.*, p.nombre AS proveedor_nombre
       FROM compras c JOIN proveedores p ON p.id = c.proveedor_id WHERE c.id = $1`,
      [compra.id]
    );
    const detalle = await pool.query(
      `SELECT dc.*, pr.nombre AS producto_nombre
       FROM detalle_compras dc JOIN productos pr ON pr.id = dc.producto_id WHERE dc.compra_id = $1`,
      [compra.id]
    );
    res.status(201).json({ ...compraConDetalle.rows[0], items: detalle.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error crear compra:', err);
    res.status(500).json({ error: 'Error al registrar compra' });
  } finally {
    client.release();
  }
};

module.exports = { listar, obtener, crear };
