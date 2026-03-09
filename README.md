📦 Sistema de Gestión Comercial 
- Proyecto Eli v2

¡Bienvenido al Proyecto Eli! Este es un sistema integral de gestión comercial desarrollado en Rust, diseñado para administrar inventarios, ventas, clientes, proveedores y usuarios de forma eficiente y segura.

🚀 ¿Qué hace este código?
El sistema funciona como un asistente administrativo completo (estilo "Jarvis" para negocios) con las siguientes capacidades:

*Gestión de Inventario: Permite crear, buscar, actualizar y eliminar productos, incluyendo un análisis financiero de inversión y ganancia potencial.

*Alertas de Stock: El sistema verifica automáticamente si algún producto tiene 5 unidades o menos y lanza una alerta roja al iniciar.

*Módulo de Ventas: Registro de ventas con folios automáticos, aplicación de descuentos y actualización inmediata del inventario.

*Control de Usuarios y Permisos: Sistema de Login seguro con roles (Admin, Vendedor, Invitado). Los permisos son granulares: puedes decidir quién puede borrar productos y quién solo puede verlos.

Persistencia de Datos: Toda la información se guarda automáticamente en un archivo datos_sistema.json, por lo que no pierdes nada al cerrar el programa.

*Reportes: Generación de reportes financieros, de inventario y de clientes detallados en consola.

🛠️ Requisitos para que "jale" (Instalación)
Para ejecutar este proyecto en un entorno Linux o GitHub Codespaces, necesitas instalar lo siguiente:

 Rust y Cargo
Es el motor principal. Si no lo tienes, instala con este comando en la terminal:

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env

Dependencias (Cargo.toml)

El proyecto utiliza librerías externas que deben estar en tu archivo Cargo.toml:
serde y serde_json: Para el manejo de archivos JSON.
chrono: Para el manejo de fechas y horas reales.
tokio: Para permitir funciones asíncronas (async/await).

Credenciales por defecto:

Usuario: admin
Contraseña: admin123

 *Echo con pucho ezfuerzo por*
 
 *Angel Axel Gonzalez Cruz
 *Roger Hassan Diaz Garcia 
 *Josue Martin Anguiano de la Cruz