-- =====================================================
-- EcoClean Store — Inyección de datos históricos masivos
-- =====================================================
-- Ejecutar en: Render Dashboard > ecoclean-db > SQL Editor
-- O copiar en el Shell del backend y correr con psql
-- =====================================================
-- Genera ~250 ventas y ~50 compras en los últimos 24 meses
-- para que los gráficos, reportes y análisis IA funcionen.

DO $$
DECLARE
  v_usuario RECORD;
  v_producto RECORD;
  v_cliente RECORD;
  v_proveedor RECORD;
  v_fecha TIMESTAMP;
  v_total DECIMAL(12,2);
  v_subtotal DECIMAL(12,2);
  v_cantidad INT;
  v_num_factura TEXT;
  v_venta_id UUID;
  v_compra_id UUID;
  v_factura_seq INT;
  v_mes INT;
  v_dia INT;
  v_hora INT;
  v_num_ventas INT;
  v_items INT;
  v_estado TEXT;
  v_i INT;
  v_j INT;
  v_producto_id UUID;
  v_precio DECIMAL(10,2);
  v_prod RECORD;
BEGIN
  -- Secuencia de factura desde el último número
  SELECT COALESCE(MAX(NULLIF(regexp_replace(numero_factura, '[^0-9]', '', 'g'), '')::int), 0)
  INTO v_factura_seq FROM ventas;

  RAISE NOTICE 'Secuencia inicial: %', v_factura_seq;

  -- ========= COMPRAS (50 compras en 24 meses) =========
  RAISE NOTICE 'Insertando compras...';
  FOR v_mes IN REVERSE 24..1 LOOP
    FOR v_i IN 1..floor(random() * 3 + 1)::int LOOP
      SELECT id INTO v_proveedor FROM proveedores ORDER BY random() LIMIT 1;
      SELECT id INTO v_usuario FROM usuarios WHERE activo = true ORDER BY random() LIMIT 1;
      
      v_fecha := date_trunc('month', CURRENT_DATE - (v_mes || ' months')::interval)
                 + (random() * 27 || ' days')::interval
                 + (floor(random() * 14 + 7) || ' hours')::interval
                 + (floor(random() * 60) || ' minutes')::interval;
      
      v_total := 0;
      INSERT INTO compras (proveedor_id, usuario_id, total, fecha)
      VALUES (v_proveedor.id, v_usuario.id, 0, v_fecha)
      RETURNING id INTO v_compra_id;
      
      FOR v_j IN 1..floor(random() * 4 + 2)::int LOOP
        SELECT id, nombre, precio INTO v_producto
        FROM productos WHERE stock >= 0 ORDER BY random() LIMIT 1;
        
        v_cantidad := floor(random() * 41 + 10)::int;
        v_subtotal := round((v_producto.precio * v_cantidad)::numeric, 2);
        v_total := v_total + v_subtotal;
        
        INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (v_compra_id, v_producto.id, v_cantidad, v_producto.precio, v_subtotal);
        
        UPDATE productos SET stock = stock + v_cantidad WHERE id = v_producto.id;
      END LOOP;
      
      UPDATE compras SET total = v_total WHERE id = v_compra_id;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Compras insertadas.';

  -- ========= VENTAS (~250 ventas en 24 meses) =========
  RAISE NOTICE 'Insertando ventas...';
  FOR v_mes IN REVERSE 24..0 LOOP
    v_num_ventas := floor(random() * 8 + 8)::int;
    FOR v_i IN 1..v_num_ventas LOOP
      SELECT id INTO v_usuario FROM usuarios WHERE activo = true ORDER BY random() LIMIT 1;
      
      IF random() < 0.75 THEN
        SELECT id INTO v_cliente FROM clientes ORDER BY random() LIMIT 1;
      ELSE
        v_cliente := NULL;
      END IF;
      
      v_fecha := date_trunc('month', CURRENT_DATE - (v_mes || ' months')::interval)
                 + (random() * 27 || ' days')::interval
                 + (floor(random() * 14 + 7) || ' hours')::interval
                 + (floor(random() * 60) || ' minutes')::interval;
      
      IF random() < 0.15 THEN
        v_estado := 'pendiente';
      ELSIF random() < 0.07 THEN
        v_estado := 'cancelado';
      ELSE
        v_estado := 'pagado';
      END IF;
      
      v_factura_seq := v_factura_seq + 1;
      v_num_factura := 'F-' || lpad(v_factura_seq::text, 5, '0');
      v_total := 0;
      
      INSERT INTO ventas (usuario_id, total, cliente_id, numero_factura, estado, fecha)
      VALUES (v_usuario.id, 0, CASE WHEN v_cliente IS NOT NULL THEN v_cliente.id ELSE NULL END, v_num_factura, v_estado, v_fecha)
      RETURNING id INTO v_venta_id;
      
      v_items := floor(random() * 4 + 1)::int;
      FOR v_j IN 1..v_items LOOP
        SELECT id, nombre, precio INTO v_producto
        FROM productos WHERE stock > 0 ORDER BY random() LIMIT 1;
        
        IF v_producto.id IS NOT NULL THEN
          v_cantidad := floor(random() * 5 + 1)::int;
          v_subtotal := round((v_producto.precio * v_cantidad)::numeric, 2);
          v_total := v_total + v_subtotal;
          
          INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES (v_venta_id, v_producto.id, v_cantidad, v_producto.precio, v_subtotal);
        END IF;
      END LOOP;
      
      UPDATE ventas SET total = v_total WHERE id = v_venta_id;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Ventas insertadas.';
END $$;

-- ========= RESUMEN =========
SELECT 
  'Total ventas' AS metrica, COUNT(*)::text AS valor FROM ventas
UNION ALL
SELECT 'Total compras', COUNT(*)::text FROM compras
UNION ALL
SELECT 'Ingresos totales', '$' || COALESCE(SUM(total), 0)::numeric(12,2)::text FROM ventas
UNION ALL
SELECT 'Rango fechas', MIN(fecha)::date::text || ' a ' || MAX(fecha)::date::text FROM ventas;
