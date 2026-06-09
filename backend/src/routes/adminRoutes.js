const { Router } = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const pool = require('../config/database');

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(monthOffset) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthOffset);
  d.setDate(randomBetween(1, 28));
  d.setHours(randomBetween(7, 20), randomBetween(0, 59), 0, 0);
  return d.toISOString();
}

const router = Router();
router.use(auth);
router.use(role('admin'));

router.post('/injectar-datos', async (_req, res) => {
  try {
    const users = await pool.query('SELECT id, nombre FROM usuarios WHERE activo = true');
    const products = await pool.query('SELECT id, nombre, precio, stock FROM productos');
    const clients = await pool.query('SELECT id, nombre FROM clientes');
    const suppliers = await pool.query('SELECT id, nombre FROM proveedores');

    if (users.rows.length === 0) return res.status(400).json({ error: 'No hay usuarios' });

    let compras = 0, ventas = 0;
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM ventas');
    let facturaSeq = countRes.rows[0].total;

    // Compras
    for (let mes = 24; mes >= 1; mes--) {
      for (let c = 0; c < randomBetween(1, 3); c++) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const supplier = randomFrom(suppliers.rows);
          const user = randomFrom(users.rows);
          const fecha = randomDate(mes);
          let total = 0;
          const items = [];

          for (let i = 0; i < randomBetween(2, 5); i++) {
            const prod = randomFrom(products.rows);
            const cant = randomBetween(10, 50);
            const precio = parseFloat(prod.precio);
            const subtotal = parseFloat((precio * cant).toFixed(2));
            total += subtotal;
            items.push({ pid: prod.id, cant, precio, subtotal });
          }

          const cr = await client.query(
            'INSERT INTO compras (proveedor_id, usuario_id, total, fecha) VALUES ($1,$2,$3,$4) RETURNING id',
            [supplier.id, user.id, parseFloat(total.toFixed(2)), fecha]
          );

          for (const item of items) {
            await client.query(
              'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
              [cr.rows[0].id, item.pid, item.cant, item.precio, item.subtotal]
            );
            await client.query('UPDATE productos SET stock = stock + $1 WHERE id = $2', [item.cant, item.pid]);
          }

          await client.query('COMMIT');
          compras++;
        } catch (err) {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      }
    }

    // Ventas
    for (let mes = 24; mes >= 0; mes--) {
      for (let v = 0; v < randomBetween(8, 15); v++) {
        const clientConn = await pool.connect();
        try {
          await clientConn.query('BEGIN');
          const user = randomFrom(users.rows);
          const cliente = Math.random() > 0.25 ? randomFrom(clients.rows) : null;
          const fecha = randomDate(mes);
          const r = Math.random();
          const estado = r < 0.15 ? 'pendiente' : r < 0.22 ? 'cancelado' : 'pagado';

          facturaSeq++;
          const num = 'F-' + String(facturaSeq).padStart(5, '0');
          let total = 0;
          const items = [];

          const vr = await clientConn.query(
            'INSERT INTO ventas (usuario_id, total, cliente_id, numero_factura, estado, fecha) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [user.id, 0, cliente ? cliente.id : null, num, estado, fecha]
          );

          for (let i = 0; i < randomBetween(1, 4); i++) {
            const prod = randomFrom(products.rows);
            const cant = randomBetween(1, 5);
            const precio = parseFloat(prod.precio);
            const subtotal = parseFloat((precio * cant).toFixed(2));
            total += subtotal;
            items.push({ pid: prod.id, cant, precio, subtotal });
          }

          for (const item of items) {
            await clientConn.query(
              'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
              [vr.rows[0].id, item.pid, item.cant, item.precio, item.subtotal]
            );
          }

          await clientConn.query('UPDATE ventas SET total = $1 WHERE id = $2', [parseFloat(total.toFixed(2)), vr.rows[0].id]);
          await clientConn.query('COMMIT');
          ventas++;
        } catch (err) {
          await clientConn.query('ROLLBACK');
        } finally {
          clientConn.release();
        }
      }
    }

    res.json({
      message: 'Datos inyectados exitosamente',
      comprasCreadas: compras,
      ventasCreadas: ventas,
    });
  } catch (err) {
    console.error('Error inyectando datos:', err);
    res.status(500).json({ error: 'Error al inyectar datos' });
  }
});

module.exports = router;
