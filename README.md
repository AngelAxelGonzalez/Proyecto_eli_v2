 Proyecto ELI - Sistema de Gestión Comercial CRUD

¿Que es Proyecto ELI? es una solución integral de gestión comercial desarrollada en *TypeScript*. Este sistema permite administrar inventarios, ventas, clientes, proveedores y usuarios a través de una interfaz de consola interactiva y robusta, con persistencia de datos local.

---

 Características Principales

* Gestión Integral (CRUD): Control total sobre Inventario, Ventas, Clientes, Proveedores, Categorías y Usuarios.
* Seguridad: Sistema de permisos basado en roles (Admin, Vendedor, Invitado).
* Inteligencia de Negocio: Reportes financieros, estadísticas en tiempo real y alertas de stock bajo.
* Automatización: Reversión automática de inventario al cancelar ventas y conteo de productos por categoría.
* Persistencia: Almacenamiento automático en archivos JSON (no requiere bases de datos externas).
* Robustez: Validaciones en todas las operaciones y tipado fuerte gracias a TypeScript.

 🛠️ Requisitos del Sistema

Antes de comenzar, asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (v14 o superior)
* npm (incluido con Node.js)

 Instalación y Configuración

1. Clonar el proyecto y preparar carpetas:

    bash
    mkdir proyecto-eli
    cd proyecto-eli
    mkdir src
    

2. Instalar dependencias:
    bash
    npm install
    

3. Compilar el código:
    bash
    npm run build

🎮 Ejecución

Para iniciar el sistema, puedes usar cualquiera de los siguientes comandos:

 *Modo Producción :
    bash
    npm start
    
* Modo Desarrollo :
    bash
    npm run dev
    

 Credenciales por Defecto
Al ejecutar el programa por primera vez, utiliza:
* Usuario: admin
* Contraseña: admin123
 📂 Estructura del Proyecto


proyecto-eli
 src/                # Código fuente (.ts)
 dist/               # Código compilado (.js)
 datos_sistema.json  # Base de datos local (autogenerado)
 package.json        # Dependencias y scripts
 tsconfig.json       # Configuración de TypeScript