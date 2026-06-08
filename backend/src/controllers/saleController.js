const pool = require('../config/database');
const { generateTicket } = require('../utils/pdfGenerator');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nombre AS vendedor_nombre, c.nombre AS cliente_nombre
      FROM ventas v
      JOIN usuarios u ON u.id = v.usuario_id
      LEFT JOIN clientes c ON c.id = v.cliente_id
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
      `SELECT v.*, u.nombre AS vendedor_nombre, c.nombre AS cliente_nombre
       FROM ventas v
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (venta.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`, [req.params.id]
    );
    res.json({ ...venta.rows[0], items: detalle.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

const crear = async (req, res) => {
  const { items, cliente_id, estado } = req.body;

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

    const facturaNum = await client.query("SELECT COUNT(*)::int + 1 AS next FROM ventas");
    const numeroFactura = `F-${String(facturaNum.rows[0].next).padStart(5, '0')}`;

    const ventaResult = await client.query(
      `INSERT INTO ventas (usuario_id, total, cliente_id, numero_factura, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, parseFloat(total.toFixed(2)), cliente_id || null, numeroFactura, estado || 'pagado']
    );
    const venta = ventaResult.rows[0];

    for (const linea of lineas) {
      await client.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [venta.id, linea.producto.id, linea.cantidad, linea.producto.precio, linea.subtotal]
      );
      await client.query(
        'UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [linea.cantidad, linea.producto.id]
      );
      await client.query(
        "INSERT INTO movimientos_stock (producto_id, tipo, cantidad, referencia) VALUES ($1,'salida',$2,$3)",
        [linea.producto.id, linea.cantidad, venta.id]
      );
    }

    await client.query('COMMIT');

    const ventaConDetalle = await pool.query(
      `SELECT v.*, u.nombre AS vendedor_nombre, c.nombre AS cliente_nombre
       FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = $1`,
      [venta.id]
    );
    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`, [venta.id]
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

const actualizarEstado = async (req, res) => {
  const { estado } = req.body;
  if (!estado || !['pagado', 'pendiente', 'cancelado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const result = await pool.query(
      'UPDATE ventas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

const ticket = async (req, res) => {
  try {
    const venta = await pool.query(
      `SELECT v.*, u.nombre AS vendedor_nombre, c.nombre AS cliente_nombre
       FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = $1`,
      [req.params.id]
    );
    if (venta.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = $1`, [req.params.id]
    );

    const pdfBuffer = await generateTicket({ ...venta.rows[0], items: detalle.rows });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="factura-${venta.rows[0].numero_factura || venta.rows[0].id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generar ticket:', err);
    res.status(500).json({ error: 'Error al generar ticket' });
  }
};

module.exports = { listar, obtener, crear, actualizarEstado, ticket };
