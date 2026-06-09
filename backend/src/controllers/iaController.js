const pool = require('../config/database');
const { chatWithDeepSeek, analyzeSalesData } = require('../services/deepseekService');

const chat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes' });
  }

  try {
    const reply = await chatWithDeepSeek(messages);
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
