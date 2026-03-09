# 🚀 Proyecto Eli Solana V2
### Sistema de Gestión Empresarial en la Blockchain (2026)

Este proyecto es un *Smart Contract* (Programa) desarrollado en *Solana* utilizando el framework *Anchor*. Está diseñado para gestionar el inventario, ventas, clientes y proveedores de un negocio de forma descentralizada y segura.

---

## 🛠️ ¿Qué hace este Código?
El programa permite realizar operaciones *CRUD* (Crear, Leer, Actualizar y Eliminar) sobre cuatro pilares:

1.  *📦 Productos:* Registro con código único, precio, costo y stock (usando PDAs).
2.  *💰 Ventas:* Generación de folios, registro de ítems, totales y descuentos.
3.  *👥 Clientes:* Base de datos con historial de compras y contacto.
4.  *🚚 Proveedores:* Registro de proveedores activos y calificación.

---

## 🏗️ Estructura del Proyecto
* *programs/eli_v2/src/lib.rs*: Lógica del contrato en Rust.
* *app/src/utils/solana-cliente.ts*: Puente en TypeScript para el Frontend.
* *Anchor.toml*: Configuración de red (Devnet) y rutas de la wallet.

---

## 🚀 Guía de Instalación Rápida

### 1. Configurar el Entorno
Si acabas de clonar o borrar todo, asegúrate de que tu terminal reconozca Solana:
```bash
# Agregar Solana al PATH (si no te reconoce el comando)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source ~/.bashrc

 Configuración de Llaves

Genera tu billetera de desarrollo si aún no la tienes:
 solana-keygen new --no-passphrase

 Instalación de Dependencias
 # En la raíz del proyecto
npm install

# En la carpeta del frontend
cd app && npm install

 Compilación y Despliegue

Para convertir el código Rust en un programa de Solana:

# Compilar el código (Modo Hacker)
anchor build

# Obtener fondos de prueba (Devnet)
solana airdrop 2


# Desplegar en la Blockchain
anchor deploy

 Uso del Cliente (TypeScript)
Para integrar el sistema en tu aplicación, usa la clase SolanaCrudClient

// Ejemplo: Crear un nuevo dulce
const client = new SolanaCrudClient(connection, wallet);
await client.crearProducto(
  "DULCE-01", 
  "Papas Locas", 
  15.0, // Precio
  10.0, // Costo
  100,  // Cantidad
  "Botanas", 
  "Sabritas"
);

echo por

• Roger Hassan Díaz García  
• Ángel Axel González Cruz 
• Josué Martín Anguiano de la Cruz  


(Lo hicimos en conjunto por que solo uno tiene PC )