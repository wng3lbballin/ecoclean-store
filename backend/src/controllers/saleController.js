const pool = require('../config/database');
const { generateTicket } = require('../utils/pdfGenerator');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nombre AS vendedor_nombre
      FROM ventas v
      JOIN usuarios u ON u.id = v.usuario_id
      ORDER BY v.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listar ventas:', err);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
};

const obtener = async (req, res) => {
  try {
    const venta = await pool.query(
      `SELECT v.*, u.nombre AS vendedor_nombre
       FROM ventas v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = $1`,
      [req.params.id]
    );

    if (venta.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`,
      [req.params.id]
    );

    res.json({ ...venta.rows[0], items: detalle.rows });
  } catch (err) {
    console.error('Error obtener venta:', err);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

const crear = async (req, res) => {
  const { items } = req.body;

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

      const prod = await client.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = $1 FOR UPDATE',
        [item.producto_id]
      );

      if (prod.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto no encontrado: ${item.producto_id}` });
      }

      const producto = prod.rows[0];

      if (producto.stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`,
        });
      }

      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      total += subtotal;

      lineas.push({ producto, cantidad: item.cantidad, subtotal });
    }

    const ventaResult = await client.query(
      'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING *',
      [req.user.id, parseFloat(total.toFixed(2))]
    );
    const venta = ventaResult.rows[0];

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [venta.id, linea.producto.id, linea.cantidad, linea.producto.precio, linea.subtotal]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [linea.cantidad, linea.producto.id]
      );
    }

    await client.query('COMMIT');

    const ventaConDetalle = await pool.query(
      `SELECT v.*, u.nombre AS vendedor_nombre
       FROM ventas v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = $1`,
      [venta.id]
    );

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`,
      [venta.id]
    );

    res.status(201).json({ ...ventaConDetalle.rows[0], items: detalle.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error crear venta:', err);
    res.status(500).json({ error: 'Error al registrar la venta' });
  } finally {
    client.release();
  }
};

const ticket = async (req, res) => {
  try {
    const venta = await pool.query(
      `SELECT v.*, u.nombre AS vendedor_nombre
       FROM ventas v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = $1`,
      [req.params.id]
    );

    if (venta.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`,
      [req.params.id]
    );

    const ventaData = { ...venta.rows[0], items: detalle.rows };
    const pdfBuffer = await generateTicket(ventaData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ticket-${ventaData.id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generar ticket:', err);
    res.status(500).json({ error: 'Error al generar ticket' });
  }
};

module.exports = { listar, obtener, crear, ticket };
