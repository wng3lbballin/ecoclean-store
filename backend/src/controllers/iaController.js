const pool = require('../config/database');
const { chatWithDeepSeek, analyzeSalesData } = require('../services/deepseekService');

const formatMoney = (v) => '$' + parseFloat(v || 0).toFixed(2);

async function gatherStoreData() {
  const [
    totalProductos,
    stockBajo,
    productosTop,
    totalVentas,
    ingresosTotales,
    ticketPromedio,
    pendientes,
    ventasMes,
    totalClientes,
    totalProveedores,
    ultimasVentas,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM productos'),
    pool.query('SELECT COUNT(*)::int AS total FROM productos WHERE stock < 5'),
    pool.query(
      `SELECT p.nombre, SUM(dv.cantidad)::int AS cantidad
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       GROUP BY p.id, p.nombre
       ORDER BY cantidad DESC LIMIT 5`
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM ventas'),
    pool.query('SELECT COALESCE(SUM(total), 0)::float AS total FROM ventas'),
    pool.query('SELECT COALESCE(AVG(total), 0)::float AS avg FROM ventas'),
    pool.query("SELECT COUNT(*)::int AS total FROM ventas WHERE estado = 'pendiente'"),
    pool.query(
      `SELECT COALESCE(SUM(total), 0)::float AS total, COUNT(*)::int AS cantidad
       FROM ventas WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)`
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM clientes'),
    pool.query('SELECT COUNT(*)::int AS total FROM proveedores'),
    pool.query(
      `SELECT numero_factura, total, fecha, estado
       FROM ventas ORDER BY fecha DESC LIMIT 5`
    ),
  ]);

  const topProductos = productosTop.rows
    .map((p) => `${p.nombre} (${p.cantidad} uds)`)
    .join(', ');

  const recientes = ultimasVentas.rows
    .map((v) => {
      const f = v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX') : '—';
      return `Factura ${v.numero_factura || 'N/A'}: ${formatMoney(v.total)} (${v.estado}) - ${f}`;
    })
    .join('\n  ');

  return `- Total productos en catálogo: ${totalProductos.rows[0].total}
- Productos con stock bajo (< 5 unidades): ${stockBajo.rows[0].total}
- Productos más vendidos: ${topProductos || 'Sin datos'}
- Total de ventas registradas: ${totalVentas.rows[0].total}
- Ingresos totales: ${formatMoney(ingresosTotales.rows[0].total)}
- Ticket promedio: ${formatMoney(ticketPromedio.rows[0].avg)}
- Ventas pendientes de cobro: ${pendientes.rows[0].total}
- Ventas del mes actual: ${ventasMes.rows[0].cantidad} ventas, ${formatMoney(ventasMes.rows[0].total)}
- Total clientes registrados: ${totalClientes.rows[0].total}
- Total proveedores registrados: ${totalProveedores.rows[0].total}
- Últimas 5 ventas:
  ${recientes || 'Sin ventas recientes'}`;
}

const chat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes' });
  }

  try {
    const storeData = await gatherStoreData();
    const reply = await chatWithDeepSeek(messages, storeData);
    res.json({ reply });
  } catch (err) {
    console.error('Error en chat IA:', err.message);
    if (err.message.includes('DEEPSEEK_API_KEY no configurada')) {
      return res.status(503).json({ error: 'Servicio de IA no disponible. La API key no está configurada.' });
    }
    res.status(500).json({ error: 'Error al comunicarse con el asistente IA' });
  }
};

const analisisVentas = async (_req, res) => {
  try {
    const totalVentas = await pool.query('SELECT COUNT(*)::int AS total FROM ventas');
    const ingresosTotales = await pool.query('SELECT COALESCE(SUM(total), 0)::float AS total FROM ventas');
    const ticketPromedio = await pool.query('SELECT COALESCE(AVG(total), 0)::float AS avg FROM ventas');
    const pendientes = await pool.query("SELECT COUNT(*)::int AS total FROM ventas WHERE estado = 'pendiente'");

    const productosTop = await pool.query(
      `SELECT p.nombre, SUM(dv.cantidad)::int AS cantidad
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       GROUP BY p.id, p.nombre
       ORDER BY cantidad DESC
       LIMIT 5`
    );

    const productosNombres = productosTop.rows.map((p) => p.nombre).join(', ');

    const salesSummary = {
      totalVentas: totalVentas.rows[0].total,
      ingresosTotales: ingresosTotales.rows[0].total,
      ticketPromedio: ticketPromedio.rows[0].avg,
      productosTop: productosNombres || 'Sin datos',
      pendientes: pendientes.rows[0].total,
    };

    const analysis = await analyzeSalesData(salesSummary);
    res.json({ analysis, resumen: salesSummary });
  } catch (err) {
    console.error('Error en análisis IA:', err.message);
    if (err.message.includes('DEEPSEEK_API_KEY no configurada')) {
      return res.status(503).json({ error: 'Servicio de IA no disponible. La API key no está configurada.' });
    }
    res.status(500).json({ error: 'Error al generar el análisis con IA' });
  }
};

module.exports = { chat, analisisVentas };
