# Proyecto_eli_v2

El Proyecto Eli es un sistema integral de gestión empresarial desarrollado en Python que funciona como un asistente virtual para administrar pequeños y medianos negocios. Aquí te explico qué hace a grandes rasgos:

Propósito Principal

Automatizar y simplificar la gestión diaria de un negocio, centralizando en una sola aplicación todas las operaciones comerciales fundamentales.


Componentes Principales

 Gestión de Inventario

· Control de stock de productos
· Registro de precios de compra y venta
· Categorización de productos
· Alertas de stock bajo
· Búsqueda avanzada de productos

Sistema de Ventas

· Registro de ventas con actualización automática del inventario
· Cálculo automático de ganancias por venta
· Asociación de ventas con clientes
· Generación de facturas en PDF

 Gestión de Clientes

· Base de datos de clientes
· Historial de compras por cliente
· Estadísticas de compras
· Identificación de clientes frecuentes

Análisis y Reportes

· Reportes PDF: Ventas, inventario, facturas
· Gráficas: Ventas, productos más vendidos, ganancias
· Estadísticas: Ganancias totales, promedios, mejores días

Sistema de Seguridad

· Login con usuario y contraseña
· Diferentes niveles de acceso (admin/user)
· Cambio de contraseña
· Creación de nuevos usuarios (solo admin)

Persistencia de Datos

Todo se guarda automáticamente en archivos JSON:

· inventario.json - Productos y existencias
· ventas.json - Historial de transacciones
· clientes.json - Información de clientes
· ganancias.json - Registro de ganancias
· usuarios.json - Credenciales del sistema


 Interfaz

· Menú interactivo por consola
· Navegación intuitiva con números
· Feedback visual con emojis y formato
· Submenús para cada módulo



 Flujo de Trabajo Típico


1. Login del usuario
2. Gestión de inventario (agregar/editar productos)
3. Registro de ventas (con clientes)
4. Consulta de reportes y estadísticas
5. Generación de facturas y gráficas
6. Análisis de ganancias



 Beneficios Clave

 Todo en uno: Centraliza todas las operaciones del negocio
 Automatización: Reduce errores manuales
 Toma de decisiones: Reportes y gráficas para análisis
 Escalable: Fácil de modificar y expandir
 Sin costo: Software libre y personalizable
 Portátil: Funciona en cualquier sistema con Python


 Para qué tipo de negocios sirve

· Tiendas minoristas
· Restaurantes pequeños
· Emprendimientos
· Distribuidoras pequeñas
· Negocios online
· Cualquier negocio que necesite control de inventario y ventas

Tecnologías Utilizadas

· Python 3 - Lenguaje base
· JSON - Almacenamiento de datos
· ReportLab - Generación de PDFs
· Matplotlib - Creación de gráficas
· Hashlib - Encriptación de contraseñas


 Lo que puedes lograr con Eli

1. Control total de tu inventario en tiempo real
2. Análisis de tus productos más vendidos
3. Identificación de tus mejores clientes
4. Seguimiento de tus ganancias diarias
5. Profesionalismo con facturas y reportes PDF
6. Seguridad con múltiples usuarios
7. Visibilidad con gráficas de rendimiento


En resumen, Eli es como tener un asistente personal que se encarga de llevar todos los registros de tu negocio, te ayuda a tomar decisiones basadas en datos reales y te permite tener un control completo de tus operaciones comerciales, todo desde una interfaz sencilla pero poderosa