const pool = require('../config/database');

const ventasMensuales = async (req, res) => {
  try {
    const { anio } = req.query;
    const year = parseInt(anio) || new Date().getFullYear();

    const result = await pool.query(
      `SELECT 
        EXTRACT(MONTH FROM fecha)::int AS mes,
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(total), 0)::float AS total
       FROM ventas
       WHERE EXTRACT(YEAR FROM fecha) = $1
       GROUP BY EXTRACT(MONTH FROM fecha)
       ORDER BY mes`,
      [year]
    );

    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const data = meses.map((nombre, i) => {
      const found = result.rows.find((r) => r.mes === i + 1);
      return {
        mes: nombre,
        cantidad: found ? found.cantidad : 0,
        total: found ? found.total : 0,
      };
    });

    res.json({ anio: year, data });
  } catch (err) {
    console.error('Error ventas mensuales:', err);
    res.status(500).json({ error: 'Error al obtener ventas mensuales' });
  }
};

const ventasAnuales = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        EXTRACT(YEAR FROM fecha)::int AS anio,
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(total), 0)::float AS total
       FROM ventas
       GROUP BY EXTRACT(YEAR FROM fecha)
       ORDER BY anio`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error ventas anuales:', err);
    res.status(500).json({ error: 'Error al obtener ventas anuales' });
  }
};

const reporte = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos (YYYY-MM-DD)' });
    }

    const params = [desde, hasta + ' 23:59:59'];

    const resumen = await pool.query(
      `SELECT 
        COUNT(*)::int AS total_ventas,
        COALESCE(SUM(v.total), 0)::float AS ingresos,
        COALESCE(AVG(v.total), 0)::float AS ticket_promedio
       FROM ventas v
       WHERE v.fecha >= $1 AND v.fecha <= $2`,
      params
    );

    const productosMasVendidos = await pool.query(
      `SELECT 
        p.nombre,
        SUM(dv.cantidad)::int AS cantidad_total,
        COALESCE(SUM(dv.subtotal), 0)::float AS ingresos
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.fecha >= $1 AND v.fecha <= $2
       GROUP BY p.id, p.nombre
       ORDER BY cantidad_total DESC
       LIMIT 10`,
      params
    );

    const ventasPorDia = await pool.query(
      `SELECT 
        DATE(fecha) AS dia,
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(total), 0)::float AS total
       FROM ventas
       WHERE fecha >= $1 AND fecha <= $2
       GROUP BY DATE(fecha)
       ORDER BY dia`,
      params
    );

    res.json({
      periodo: { desde, hasta },
      resumen: resumen.rows[0],
      productosMasVendidos: productosMasVendidos.rows,
      ventasPorDia: ventasPorDia.rows,
    });
  } catch (err) {
    console.error('Error reporte:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

module.exports = { ventasMensuales, ventasAnuales, reporte };
