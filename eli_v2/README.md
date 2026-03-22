*Proyecto eli v2*

 Un sistema completo de gestión comercial construido sobre la blockchain de Solana. Incluye control de inventario, ventas, clientes, proveedores, sistema de puntos, facturación electrónica, múltiples sucursales, dashboard en tiempo real y notificaciones automatizadas (aun no funcionan ☹).

*🔐 Credenciales por Defecto*

⚠️ IMPORTANTE: Estas credenciales son solo para desarrollo. En producción, cambia la contraseña inmediatamente.

Usuario: admin
Contraseña: admin123
Rol: Administrador
Permisos: Todos los permisos habilitados

*Niveles de Cliente y Puntos*

Nivel Puntos Requeridos Descuento Multiplicador
🥉 Bronce 0 - 999 0% 1.0x
🥈 Plata 1,000 - 4,999 2% 1.2x
🥇 Oro 5,000 - 19,999 5% 1.5x
💎 Platino 20,000 - 99,999 10% 2.0x
👑 Diamante 100,000+ 15% 2.5x

*1. 📦 Inventario*

· Crear producto: Registra nuevo producto con código, nombre, precio, costo, cantidad, ubicación y lote
· Ver productos: Lista todos los productos con stock actual
· Buscar producto: Búsqueda avanzada por nombre, código, categoría, precio, stock
· Editar producto: Actualiza información del producto
· Eliminar producto: Elimina producto (con verificación de ventas asociadas)
· Kardex: Historial completo de movimientos de inventario
· Stock bajo: Lista productos con ≤ 5 unidades

*2. 💰 Ventas*

· Registrar venta: Proceso completo con selección de cliente, productos, descuentos y puntos
· Ver ventas: Historial con filtros por fecha, cliente, vendedor
· Editar venta: Modificar ventas existentes
· Cancelar venta: Anular venta y restaurar inventario
· Estadísticas: Análisis de ventas por período, productos más vendidos

*3. 👥 Clientes*

· Registrar cliente: Creación de cliente con datos personales y fiscales
· Programa fidelidad: Acumulación de puntos y niveles
· Historial de compras: Detalle de todas las compras del cliente

*4. ⭐ Sistema de Puntos*

· Acumulación: 1 punto por cada $10 gastados (multiplicador por nivel)
· Canje: 10 puntos = $1 de descuento
· Niveles: Bronce → Plata → Oro → Platino → Diamante

*5. 📄 Facturación*

· Generar factura: CFDI con RFC, régimen fiscal, IVA
· Ver facturas: Listado de facturas generadas

*6. 🏭 Múltiples Sucursales*

· Transferir productos: Mover inventario entre sucursales
· Inventario por sucursal: Control descentralizado

*7. 📊 Dashboard Tiempo Real*

· Métricas: Ventas hoy, este mes, promedio
· Gráficos: Ventas por hora
· Alertas: Stock bajo, productos por caducar

*8. 🔔 Notificaciones(Aun no lo logramos hacer jalar ☹)*

· Alertas automáticas: Stock bajo, productos por caducar
· Notificaciones manuales: Para eventos importantes

*9. 🤖 *Chatbot Inteligente*

- Responde preguntas sobre stock, precios y ventas
- Procesa lenguaje natural (preguntas en español)
- Ayuda a los clientes 24/7
- Comandos: "¿Hay laptops?", "¿Cuánto cuesta un mouse?", "Ventas de hoy"

*10. 🧠 *IA Predictiva*

- Predice ventas futuras basado en datos históricos
- Detecta productos con stock bajo automáticamente
- Genera recomendaciones inteligentes
- Analiza tendencias de ventas

*11. 💱 Múltiples Monedas*

- Soporte para USD, EUR, MXN, CAD, GBP, JPY
- Tipos de cambio en tiempo real
- Conversión automática en ventas
- Formatea precios en cualquier moneda

· Blockchain: Solana
· Framework: Anchor
· Lenguajes: Rust, TypeScript
· Compromise: NLP para el chatbot 
·Axios: API de tipos de cambio 

echo por
 
• Angel Axel González Cruz 
• Hasly Jocelyn González Macias 

