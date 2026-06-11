const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `Eres un asistente virtual de EcoClean Store, una tienda de productos de limpieza ecológicos. 
Tu función es ayudar a los usuarios con dudas operativas sobre el sistema ERP y también con análisis de datos del negocio:

OPERACIONES DEL ERP:
- Facturación y ventas (cómo registrar ventas, estados de pago, tickets PDF)
- Inventario y productos (cómo agregar productos, control de stock, alertas de stock bajo)
- Clientes y proveedores (cómo gestionar contactos)
- Compras y reposición de inventario
- Dashboard y reportes (cómo interpretar estadísticas, generar reportes por período)
- Gestión de usuarios y roles (admin, vendedor, revisor, gerente)
- Seguridad y cambio de contraseña

ANÁLISIS DE DATOS:
Tienes acceso a datos actuales de la tienda (incluidos en cada consulta). Puedes usarlos para:
- Responder preguntas sobre ventas, ingresos, productos, stock, clientes y proveedores
- Hacer proyecciones basadas en tendencias de los datos disponibles
- Recomendar qué productos necesitan reposición según el stock bajo
- Sugerir estrategias de venta según los productos más vendidos
- Analizar el estado de cobros pendientes
- Comparar el desempeño del mes actual contra métricas históricas

Responde siempre en español, de forma clara, concisa y profesional. 
Cuando uses datos numéricos, indícalos explícitamente.
Si te preguntan algo fuera del alcance del sistema ERP o para lo cual no tienes datos, indica amablemente que solo puedes ayudar con temas relacionados a EcoClean Store.`;

function buildSystemPrompt(storeData) {
  let dataSection = '';
  if (storeData) {
    dataSection = `
DATOS ACTUALES DE LA TIENDA (usar como referencia para responder preguntas):
${storeData}
`;
  }
  return SYSTEM_PROMPT + dataSection;
}

async function chatWithDeepSeek(messages, storeData) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY no configurada en el servidor');
  }

  const requestMessages = [
    { role: 'system', content: buildSystemPrompt(storeData) },
    ...messages,
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: requestMessages,
      temperature: 0.7,
      max_tokens: 800,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('DeepSeek API error:', response.status, errorData);
    throw new Error(errorData.error?.message || `Error de DeepSeek API (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeSalesData(salesSummary) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY no configurada en el servidor');
  }

  const prompt = `Analiza los siguientes datos de ventas de EcoClean Store y proporciona:
1. Un resumen de tendencias observadas
2. Proyecciones para los próximos meses
3. Sugerencias de inventario (qué productos podrían necesitar reposición)
4. Recomendaciones para mejorar las ventas

Datos de ventas:
- Total de ventas: ${salesSummary.totalVentas}
- Ingresos totales: $${salesSummary.ingresosTotales.toFixed(2)}
- Ticket promedio: $${salesSummary.ticketPromedio.toFixed(2)}
- Productos más vendidos: ${salesSummary.productosTop || 'No disponible'}
- Ventas pendientes: ${salesSummary.pendientes}

Responde en español, en un formato claro con viñetas o párrafos cortos. Máximo 300 palabras.`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Eres un experto analista de negocio para una tienda de productos de limpieza ecológicos. Das recomendaciones accionables y basadas en datos.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('DeepSeek API error:', response.status, errorData);
    throw new Error(errorData.error?.message || `Error de DeepSeek API (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = { chatWithDeepSeek, analyzeSalesData };
