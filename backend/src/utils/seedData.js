const pool = require('../config/database');

async function seedData() {
  try {
    const count = await pool.query('SELECT COUNT(*)::int FROM categorias');
    if (count.rows[0].count > 0) {
      console.log('Datos ya existentes, omitiendo seed de datos');
      return;
    }

    console.log('Insertando datos de ejemplo...');

    const catRes = await pool.query(`
      INSERT INTO categorias (nombre, descripcion) VALUES
        ('Limpieza Hogar', 'Productos para limpieza general del hogar'),
        ('Limpieza Industrial', 'Productos de uso profesional e industrial'),
        ('Cuidado de Pisos', 'Productos especializados para pisos y superficies'),
        ('Cocina', 'Limpiadores y desengrasantes de cocina'),
        ('Aromatizantes', 'Ambientadores y aromatizantes para espacios'),
        ('Accesorios', 'Herramientas y accesorios de limpieza'),
        ('Jabones', 'Jabones líquidos y en barra'),
        ('Higiene Personal', 'Productos de higiene y cuidado personal'),
        ('Lavandería', 'Detergentes y suavizantes'),
        ('Desinfección', 'Productos desinfectantes y antibacteriales'),
        ('Automotriz', 'Productos de limpieza para vehículos'),
        ('Institucional', 'Productos para hoteles, oficinas y escuelas')
      RETURNING id, nombre
    `);

    const cats = {};
    catRes.rows.forEach((c) => { cats[c.nombre] = c.id; });

    const prodRes = await pool.query(`
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
        ('Desinfectante Multiusos 5L', 'Desinfectante concentrado para todo tipo de superficies', 55.00, 45, '${cats['Desinfección']}'),
        ('Cloro Gel 1L', 'Cloro en presentación gel para baños y cocinas', 22.00, 120, '${cats['Desinfección']}'),
        ('Limpiador de Pisos Floral 2L', 'Limpiador para pisos con aroma floral', 38.00, 80, '${cats['Cuidado de Pisos']}'),
        ('Desengrasante Industrial 5L', 'Desengrasante de alta potencia para cocinas industriales', 95.00, 30, '${cats['Limpieza Industrial']}'),
        ('Jabón Líquido para Manos 500ml', 'Jabón líquido antibacterial para manos', 18.00, 200, '${cats['Jabones']}'),
        ('Detergente Líquido Ropa 3L', 'Detergente para ropa delicada y normal', 45.00, 95, '${cats['Lavandería']}'),
        ('Suavizante de Telas 2L', 'Suavizante concentrado aroma lavanda', 32.00, 70, '${cats['Lavandería']}'),
        ('Aromatizante en Spray 400ml', 'Aromatizante ambiental spray automático', 28.00, 150, '${cats['Aromatizantes']}'),
        ('Limpiador de Vidrios 500ml', 'Limpiador para vidrios y espejos sin rayas', 16.00, 180, '${cats['Limpieza Hogar']}'),
        ('Cera para Pisos 1L', 'Cera líquida autobrillante para pisos', 50.00, 25, '${cats['Cuidado de Pisos']}'),
        ('Escoba Profesional', 'Escoba de cerdas duras para uso rudo', 35.00, 60, '${cats['Accesorios']}'),
        ('Trapeador de Microfibra', 'Trapeador con cabezal de microfibra lavable', 65.00, 40, '${cats['Accesorios']}'),
        ('Limpiador de Cocina 750ml', 'Limpiador multiusos especial para cocina', 25.00, 110, '${cats['Cocina']}'),
        ('Gel Antibacterial 1L', 'Gel antibacterial para manos y superficies', 35.00, 160, '${cats['Higiene Personal']}'),
        ('Shampoo para Alfombras 1L', 'Limpiador espumoso para alfombras y tapetes', 60.00, 15, '${cats['Cuidado de Pisos']}')
      RETURNING id
    `);

    await pool.query(`
      INSERT INTO clientes (nombre, email, telefono, direccion) VALUES
        ('Hotel Las Palmas', 'compras@hotellaspalmas.com', '555-1001', 'Av. Reforma 500, CDMX'),
        ('Restaurante El Sazón', 'admin@elsazon.mx', '555-1002', 'Calle Hidalgo 234, Guadalajara'),
        ('Limpieza Total SA', 'ventas@limpiezatotal.com', '555-1003', 'Blvd. Insurgentes 890, Monterrey'),
        ('Escuela Primaria Benito Juárez', 'direccion@benitojuarez.edu.mx', '555-1004', 'Calle Educación 100, Puebla'),
        ('Supermercado La Económica', 'gerencia@laeconomica.com', '555-1005', 'Av. Central 450, CDMX'),
        ('Gimnasio FitLife', 'info@fitlife.mx', '555-1006', 'Calle Deporte 78, Querétaro'),
        ('Clínica San Rafael', 'administracion@sanrafael.com', '555-1007', 'Av. Salud 1200, Mérida'),
        ('María García', 'maria.garcia@email.com', '555-2001', 'Calle Flores 15, CDMX'),
        ('Juan López', 'jlopez@email.com', '555-2002', 'Av. Álamos 340, Toluca'),
        ('Oficinas Corporativas XYZ', 'compras@xyzcorp.com', '555-1008', 'Torre Mayor Piso 20, CDMX')
    `);

    await pool.query(`
      INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES
        ('Químicos del Centro', 'Ing. Roberto Márquez', '555-3001', 'ventas@quimicoscentro.com', 'Parque Industrial 100, Querétaro'),
        ('Distribuidora CleanPro', 'Laura Sánchez', '555-3002', 'laura@cleanpro.mx', 'Av. Industria 500, CDMX'),
        ('Productos EcoClean Mayorista', 'Carlos Ruiz', '555-3003', 'cruiz@ecocleanmay.com', 'Blvd. Comercio 78, Guadalajara'),
        ('Industrias Limpex', 'Ana Ortiz', '555-3004', 'pedidos@limpex.com', 'Zona Industrial 250, Monterrey'),
        ('Suministros del Norte', 'Pedro Hernández', '555-3005', 'info@suminorte.mx', 'Calle Negocios 30, Tijuana'),
        ('Global Clean Supplies', 'Mariana Vega', '555-3006', 'mvega@globalclean.com', 'Parque Logístico 15, EdoMex')
    `);

    const provRes = await pool.query("SELECT id FROM proveedores LIMIT 3");
    const provIds = provRes.rows.map((r) => r.id);

    for (let i = 0; i < 3; i++) {
      const prod = await pool.query('SELECT id, nombre, precio FROM productos ORDER BY RANDOM() LIMIT 3');
      let total = 0;

      const compra = await pool.query(
        `INSERT INTO compras (proveedor_id, usuario_id, total)
         VALUES ($1, (SELECT id FROM usuarios WHERE email='admin@ecoclean.com'), 0) RETURNING id`,
        [provIds[i]]
      );

      for (const p of prod.rows) {
        const cant = Math.floor(Math.random() * 10) + 10;
        const subtotal = parseFloat((p.precio * cant).toFixed(2));
        total += subtotal;

        await pool.query(
          'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
          [compra.rows[0].id, p.id, cant, p.precio, subtotal]
        );
        await pool.query('UPDATE productos SET stock = stock + $1 WHERE id = $2', [cant, p.id]);
        await pool.query("INSERT INTO movimientos_stock (producto_id, tipo, cantidad, referencia) VALUES ($1,'entrada',$2,$3)", [p.id, cant, compra.rows[0].id]);
      }

      await pool.query('UPDATE compras SET total = $1 WHERE id = $2', [total.toFixed(2), compra.rows[0].id]);
    }

    for (let i = 0; i < 8; i++) {
      const prods = await pool.query('SELECT id, nombre, precio, stock FROM productos WHERE stock > 0 ORDER BY RANDOM() LIMIT 3');
      if (prods.rows.length === 0) continue;

      let total = 0;
      const items = [];
      for (const p of prods.rows) {
        const cant = Math.min(Math.floor(Math.random() * 3) + 1, p.stock);
        if (cant <= 0) continue;
        total += p.precio * cant;
        items.push({ id: p.id, cantidad: cant, precio: p.precio, subtotal: (p.precio * cant).toFixed(2) });
      }
      if (items.length === 0) continue;

      const clientRes = await pool.query('SELECT id FROM clientes ORDER BY RANDOM() LIMIT 1');
      const num = `F-${String(i + 1).padStart(5, '0')}`;
      const estados = ['pagado', 'pagado', 'pagado', 'pagado', 'pendiente', 'pendiente', 'pagado', 'pagado'];

      const venta = await pool.query(
        `INSERT INTO ventas (usuario_id, total, cliente_id, numero_factura, estado)
         VALUES ((SELECT id FROM usuarios WHERE email='admin@ecoclean.com'), $1, $2, $3, $4) RETURNING id`,
        [total.toFixed(2), clientRes.rows[0]?.id || null, num, estados[i]]
      );

      for (const item of items) {
        await pool.query(
          'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
          [venta.rows[0].id, item.id, item.cantidad, item.precio, item.subtotal]
        );
        await pool.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [item.cantidad, item.id]);
        await pool.query("INSERT INTO movimientos_stock (producto_id, tipo, cantidad, referencia) VALUES ($1,'salida',$2,$3)", [item.id, item.cantidad, venta.rows[0].id]);
      }
    }

    console.log('Datos de ejemplo insertados correctamente');
  } catch (err) {
    console.error('Error en seed de datos:', err);
  }
}

module.exports = { seedData };
