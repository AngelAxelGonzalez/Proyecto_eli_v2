import * as fs from 'fs';
import * as readline from 'readline';
import * as crypto from 'crypto';

const ZONA_HORARIA = 'America/Mexico_City';

function ahora(): Date {
    return new Date();
}

//  INTERFACES 

interface Producto {
    codigo: string;
    nombre: string;
    precio: number;
    costo: number;
    cantidad: number;
    categoria: string;
    proveedor: string;
    fecha_agregado: string;
    ultima_actualizacion: string;
}

interface ItemVenta {
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
}

interface Venta {
    folio: string;
    fecha: string;
    vendedor: string;
    items: ItemVenta[];
    total: number;
    productos: number;
    cliente_id?: string;
    descuento?: number;
}

interface Cliente {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
    fecha_registro: string;
    compras_totales: number;
    monto_total: number;
    ultima_compra?: string;
}

interface Proveedor {
    id: string;
    nombre: string;
    contacto: string;
    telefono: string;
    email: string;
    direccion: string;
    productos: string[];
    fecha_registro: string;
    calificacion: number;
    total_compras: number;
    activo: boolean;
}

interface Categoria {
    id: string;
    nombre: string;
    descripcion: string;
    fecha_creacion: string;
    total_productos: number;
    activo: boolean;
}

interface PermisosCRUD {
    crear: boolean;
    leer: boolean;
    actualizar: boolean;
    eliminar: boolean;

}

interface PermisosUsuario {
    inventario: PermisosCRUD;
    ventas: PermisosCRUD;
    clientes: PermisosCRUD;
    proveedores: PermisosCRUD;
    categorias: PermisosCRUD;
    usuarios: PermisosCRUD;
    reportes: boolean;
    configuracion: boolean;
}

type Rol = 'admin' | 'vendedor' | 'invitado';

interface Usuario {
    usuario: string;
    contrasena: string;
    nombre: string;
    rol: Rol;
    permisos: PermisosUsuario;
    fecha_registro: string;
    ultimo_acceso?: string;
}

interface DatosSistema {
    usuarios: Usuario[];
    productos: Producto[];
    clientes: Cliente[];
    ventas: Venta[];
    proveedores: Proveedor[];
    categorias: Categoria[];
}

// CLASE PRINCIPAL 

class ProyectoEli {
    private usuarios: Usuario[] = [];
    private productos: Producto[] = [];
    private clientes: Cliente[] = [];
    private ventas: Venta[] = [];
    private proveedores: Proveedor[] = [];
    private categorias: Categoria[] = [];
    private usuarioActual: Usuario | null = null;
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.cargarDatos();
        
        if (this.usuarios.length === 0) {
            const permisosAdmin: PermisosUsuario = {
                inventario: { crear: true, leer: true, actualizar: true, eliminar: true },
                ventas: { crear: true, leer: true, actualizar: true, eliminar: true },
                clientes: { crear: true, leer: true, actualizar: true, eliminar: true },
                proveedores: { crear: true, leer: true, actualizar: true, eliminar: true },
                categorias: { crear: true, leer: true, actualizar: true, eliminar: true },
                usuarios: { crear: true, leer: true, actualizar: true, eliminar: true },
                reportes: true,
                configuracion: true
            };
            
            this.usuarios.push({
                usuario: 'admin',
                contrasena: 'admin123',
                nombre: 'Administrador',
                rol: 'admin',
                permisos: permisosAdmin,
                fecha_registro: ahora().toISOString(),
                ultimo_acceso: ahora().toISOString()
            });
            this.guardarDatos();
        }
    }

    // MÉTODOS DE ARCHIVOS 

    private guardarDatos(): void {
        try {
            const datos: DatosSistema = {
                usuarios: this.usuarios,
                productos: this.productos,
                clientes: this.clientes,
                ventas: this.ventas,
                proveedores: this.proveedores,
                categorias: this.categorias
            };
            fs.writeFileSync('datos_sistema.json', JSON.stringify(datos, null, 2), 'utf-8');
        } catch (error) {
            console.log(`Error al guardar datos: ${error}`);
        }
    }

    private cargarDatos(): void {
        try {
            if (fs.existsSync('datos_sistema.json')) {
                const data = fs.readFileSync('datos_sistema.json', 'utf-8');
                const datos = JSON.parse(data) as DatosSistema;
                this.usuarios = datos.usuarios || [];
                this.productos = datos.productos || [];
                this.clientes = datos.clientes || [];
                this.ventas = datos.ventas || [];
                this.proveedores = datos.proveedores || [];
                this.categorias = datos.categorias || [];
            }
        } catch (error) {
            console.log(`Error al cargar datos: ${error}`);
        }
    }

    private async preguntar(query: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(query, resolve);
        });
    }

    private async preguntarContrasena(query: string): Promise<string> {
        // En Node.js no hay getpass nativo, usamos readline normal
        return this.preguntar(query);
    }

    //  MÉTODOS DE AUTENTICACIÓN 

    private mostrarSaludo(): void {
        const hora = ahora().getHours();
        let saludo = '';
        if (hora < 12) saludo = 'Buenos días';
        else if (hora < 18) saludo = 'Buenas tardes';
        else saludo = 'Buenas noches';

        const nombreUsuario = this.usuarioActual?.nombre || 'Usuario';
        console.log(`\n${saludo}, ${nombreUsuario}!`);
        console.log(`Sistema de Gestión Comercial - ${ahora().toLocaleDateString('es-MX')} ${ahora().toLocaleTimeString()}`);
        
        if (this.usuarioActual?.rol === 'admin') {
            console.log('👑 Modo Administrador');
        }
        console.log('-'.repeat(60));
    }

    async login(): Promise<boolean> {
        let intentos = 0;
        const maxIntentos = 3;

        while (intentos < maxIntentos) {
            console.clear();
            console.log('\n' + '='.repeat(60));
            console.log('🔐 INICIO DE SESIÓN - PROYECTO ELI');
            console.log('='.repeat(60));

            const usuario = await this.preguntar('Usuario: ');
            const contrasena = await this.preguntarContrasena('Contraseña: ');

            const user = this.usuarios.find(u => u.usuario === usuario && u.contrasena === contrasena);
            if (user) {
                this.usuarioActual = user;
                user.ultimo_acceso = ahora().toISOString();
                this.guardarDatos();
                console.log(`\n✅ ¡Bienvenido ${user.nombre}!`);
                return true;
            }

            intentos++;
            console.log(`\n❌ Usuario o contraseña incorrectos. Intento ${intentos} de ${maxIntentos}`);
            if (intentos < maxIntentos) {
                await this.preguntar('\nPresiona Enter para intentar nuevamente...');
            }
        }

        console.log('\n⛔ Demasiados intentos fallidos. Sistema bloqueado.');
        return false;
    }

    async cambiarContrasena(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🔐 CAMBIAR CONTRASEÑA');
        console.log('='.repeat(60));

        if (!this.usuarioActual) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        const actual = await this.preguntarContrasena('Contraseña actual: ');
        if (actual !== this.usuarioActual.contrasena) {
            console.log('❌ Contraseña actual incorrecta');
            return;
        }

        const nueva = await this.preguntarContrasena('Nueva contraseña: ');
        const confirmar = await this.preguntarContrasena('Confirmar nueva contraseña: ');

        if (nueva !== confirmar) {
            console.log('❌ Las contraseñas no coinciden');
            return;
        }

        if (nueva.length < 4) {
            console.log('❌ La contraseña debe tener al menos 4 caracteres');
            return;
        }

        this.usuarioActual.contrasena = nueva;
        this.guardarDatos();
        console.log('✅ Contraseña actualizada correctamente');
    }

    private verificarPermiso(modulo: keyof PermisosUsuario, accion?: keyof PermisosCRUD): boolean {
        if (!this.usuarioActual) return false;
        
        if (this.usuarioActual.rol === 'admin') return true;
        
        const permisos = this.usuarioActual.permisos;
        
        if (accion) {
            const permisoModulo = permisos[modulo];
            if (typeof permisoModulo === 'object') {
                return permisoModulo[accion] || false;
            }
            return false;
        } else {
            const permiso = permisos[modulo];
            return typeof permiso === 'boolean' ? permiso : false;
        }
    }

    private verificarStockBajo(): boolean {
        const productosBajos = this.productos.filter(p => p.cantidad <= 5);
        if (productosBajos.length > 0) {
            console.log('\n' + '⚠️'.repeat(20));
            console.log('🔴 ALERTA: PRODUCTOS CON STOCK BAJO');
            console.log('⚠️'.repeat(20));
            productosBajos.forEach(p => {
                console.log(` • ${p.codigo} - ${p.nombre} - STOCK: ${p.cantidad} unidades`);
            });
            console.log('⚠️'.repeat(20));
            return true;
        }
        return false;
    }

    private determinarModulo(opcion: string): keyof PermisosUsuario {
        const op = parseInt(opcion);
        if (op >= 1 && op <= 7) return 'inventario';
        if (op >= 8 && op <= 12) return 'ventas';
        if (op >= 13 && op <= 18) return 'clientes';
        if (op >= 19 && op <= 23) return 'proveedores';
        if (op >= 24 && op <= 27) return 'categorias';
        if (op >= 28 && op <= 32) return 'usuarios';
        return 'reportes';
    }

    //  MENÚ PRINCIPAL 

    async menuPrincipal(): Promise<void> {
        while (true) {
            console.clear();
            this.mostrarSaludo();
            this.verificarStockBajo();

            console.log('\n' + '═'.repeat(60));
            console.log('📋 SISTEMA DE GESTIÓN COMERCIAL - CRUD COMPLETO');
            console.log('═'.repeat(60));

            console.log('\n📦 INVENTARIO:');
            console.log('  1.  ➕  Crear producto');
            console.log('  2.  👁️  Ver productos');
            console.log('  3.  🔍  Buscar producto (avanzado)');
            console.log('  4.  ✏️  Actualizar producto');
            console.log('  5.  🗑️  Eliminar producto');
            console.log('  6.  📊  Análisis financiero');
            console.log('  7.  🔴  Ver stock bajo');

            console.log('\n💰 VENTAS:');
            console.log('  8.  ➕  Registrar venta');
            console.log('  9.  👁️  Ver ventas');
            console.log(' 10.  ✏️  Editar venta');
            console.log(' 11.  🗑️  Cancelar venta');
            console.log(' 12.  📈  Estadísticas de ventas');

            console.log('\n👥 CLIENTES:');
            console.log(' 13.  ➕  Crear cliente');
            console.log(' 14.  👁️  Ver clientes');
            console.log(' 15.  🔍  Buscar cliente');
            console.log(' 16.  ✏️  Actualizar cliente');
            console.log(' 17.  🗑️  Eliminar cliente');
            console.log(' 18.  📊  Historial de compras');

            console.log('\n🏭 PROVEEDORES:');
            console.log(' 19.  ➕  Crear proveedor');
            console.log(' 20.  👁️  Ver proveedores');
            console.log(' 21.  🔍  Buscar proveedor');
            console.log(' 22.  ✏️  Actualizar proveedor');
            console.log(' 23.  🗑️  Eliminar proveedor');

            console.log('\n📑 CATEGORÍAS:');
            console.log(' 24.  ➕  Crear categoría');
            console.log(' 25.  👁️  Ver categorías');
            console.log(' 26.  ✏️  Actualizar categoría');
            console.log(' 27.  🗑️  Eliminar categoría');

            console.log('\n👤 USUARIOS (Admin):');
            console.log(' 28.  ➕  Crear usuario');
            console.log(' 29.  👁️  Ver usuarios');
            console.log(' 30.  ✏️  Editar usuario');
            console.log(' 31.  🗑️  Eliminar usuario');
            console.log(' 32.  🔐  Gestionar permisos');

            console.log('\n📊 REPORTES:');
            console.log(' 33.  📦  Reporte inventario');
            console.log(' 34.  💰  Reporte ventas');
            console.log(' 35.  👥  Reporte clientes');
            console.log(' 36.  📈  Reporte financiero completo');

            console.log('\n 0.  🚪  Salir');
            console.log('═'.repeat(60));

            const opcion = await this.preguntar('\nSelecciona una opción (0-36): ');

            if (opcion === '0') {
                console.log('\n👋 ¡Hasta pronto!');
                this.guardarDatos();
                this.rl.close();
                return;
            }

            const modulo = this.determinarModulo(opcion);
            const requierePermiso = this.verificarPermiso(modulo, 'ejecutar' as any);
            
            if (!requierePermiso && modulo !== 'reportes') {
                console.log('\n⛔ No tienes permiso para realizar esta acción');
                await this.preguntar('\nPresiona Enter para continuar...');
                continue;
            }

            switch (opcion) {
                case '1': await this.agregarProducto(); break;
                case '2': this.verInventario(); break;
                case '3': await this.buscarProductosAvanzado(); break;
                case '4': await this.editarProducto(); break;
                case '5': await this.eliminarProducto(); break;
                case '6': this.analisisFinanciero(); break;
                case '7': this.verStockBajo(); break;
                case '8': await this.registrarVenta(); break;
                case '9': this.verHistorialVentas(); break;
                case '10': await this.editarVenta(); break;
                case '11': await this.cancelarVenta(); break;
                case '12': this.estadisticasVentas(); break;
                case '13': await this.registrarCliente(); break;
                case '14': this.verClientes(); break;
                case '15': await this.buscarCliente(); break;
                case '16': await this.editarCliente(); break;
                case '17': await this.eliminarCliente(); break;
                case '18': await this.verHistorialComprasCliente(); break;
                case '19': await this.crearProveedor(); break;
                case '20': this.verProveedores(); break;
                case '21': await this.buscarProveedor(); break;
                case '22': await this.editarProveedor(); break;
                case '23': await this.eliminarProveedor(); break;
                case '24': await this.crearCategoria(); break;
                case '25': this.verCategorias(); break;
                case '26': await this.editarCategoria(); break;
                case '27': await this.eliminarCategoria(); break;
                case '28': await this.crearUsuario(); break;
                case '29': this.verUsuarios(); break;
                case '30': await this.editarUsuario(); break;
                case '31': await this.eliminarUsuario(); break;
                case '32': await this.gestionPermisosUsuario(); break;
                case '33': this.generarReporteInventario(); break;
                case '34': this.generarReporteVentas(); break;
                case '35': this.generarReporteClientes(); break;
                case '36': this.generarReporteFinancieroCompleto(); break;
                default:
                    console.log('\n❌ Opción no válida');
            }

            if (opcion !== '0') {
                await this.preguntar('\nPresiona Enter para continuar...');
            }
        }
    }

    //  CRUD DE PRODUCTOS 

    private verInventario(): void {
        console.log('\n' + '='.repeat(120));
        console.log('📦 INVENTARIO ACTUAL - ANÁLISIS FINANCIERO');
        console.log('='.repeat(120));

        if (this.productos.length === 0) {
            console.log('📭 No hay productos en el inventario');
            return;
        }

        let inversionTotal = 0;
        let valorVentaTotal = 0;
        let totalProductos = 0;

        console.log(`${'Código'.padEnd(8)} ${'Nombre'.padEnd(15)} ${'Categoría'.padEnd(10)} ${'Costo'.padEnd(10)} ${'Precio'.padEnd(10)} ${'Ganancia'.padEnd(10)} ${'Cant.'.padEnd(6)} ${'Inv. Total'.padEnd(12)} ${'Valor Vta'.padEnd(12)}`);
        console.log('-'.repeat(120));

        const productosOrdenados = [...this.productos].sort((a, b) => a.nombre.localeCompare(b.nombre));

        for (const producto of productosOrdenados) {
            const costoUnit = producto.costo || producto.precio * 0.7;
            const gananciaUnit = producto.precio - costoUnit;
            const inversionProd = costoUnit * producto.cantidad;
            const valorVentaProd = producto.precio * producto.cantidad;
            const stockBajo = producto.cantidad <= 5 ? '⚠️' : '   ';

            console.log(
                `${producto.codigo.padEnd(8)} ${producto.nombre.slice(0, 14).padEnd(15)} ` +
                `${producto.categoria.slice(0, 9).padEnd(10)} $${costoUnit.toFixed(2).padEnd(9)} ` +
                `$${producto.precio.toFixed(2).padEnd(9)} $${gananciaUnit.toFixed(2).padEnd(9)} ` +
                `${stockBajo}${producto.cantidad.toString().padEnd(5)} $${inversionProd.toFixed(2).padEnd(11)} $${valorVentaProd.toFixed(2).padEnd(11)}`
            );

            inversionTotal += inversionProd;
            valorVentaTotal += valorVentaProd;
            totalProductos += producto.cantidad;
        }

        const gananciaPotencialTotal = valorVentaTotal - inversionTotal;
        const margen = valorVentaTotal > 0 ? (gananciaPotencialTotal / valorVentaTotal * 100) : 0;

        console.log('='.repeat(120));
        console.log('📊 TOTALES GLOBALES:');
        console.log(` 📦 Unidades totales: ${totalProductos}`);
        console.log(` 💰 INVERSIÓN TOTAL: $${inversionTotal.toFixed(2)}`);
        console.log(` 💵 VALOR DE VENTA TOTAL: $${valorVentaTotal.toFixed(2)}`);
        console.log(` 📈 GANANCIA POTENCIAL TOTAL: $${gananciaPotencialTotal.toFixed(2)}`);
        console.log(` 📊 MARGEN DE GANANCIA: ${margen.toFixed(1)}%`);
        console.log('='.repeat(120));
    }

    async agregarProducto(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('➕ AGREGAR NUEVO PRODUCTO');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('inventario', 'crear')) {
            console.log('⛔ No tienes permiso para agregar productos');
            return;
        }

        const nombre = await this.preguntar('Nombre del producto: ');
        if (!nombre.trim()) {
            console.log('❌ El nombre no puede estar vacío');
            return;
        }

        let precio: number;
        try {
            precio = parseFloat(await this.preguntar('Precio de VENTA al público: $'));
            if (precio <= 0) {
                console.log('❌ El precio debe ser mayor a 0');
                return;
            }
        } catch {
            console.log('❌ Ingresa un precio válido');
            return;
        }

        let costo: number;
        try {
            costo = parseFloat(await this.preguntar('💰 Precio de COMPRA (inversión): $'));
            if (costo <= 0) {
                console.log('❌ El costo debe ser mayor a 0');
                return;
            }
            if (costo >= precio) {
                console.log(`⚠️ ADVERTENCIA: El costo es mayor o igual al precio de venta`);
                console.log(`   Ganancia por unidad: $${(precio - costo).toFixed(2)}`);
                const confirmar = await this.preguntar('¿Continuar de todas formas? (s/n): ');
                if (confirmar.toLowerCase() !== 's') return;
            }
        } catch {
            console.log('❌ Ingresa un costo válido');
            return;
        }

        let cantidad: number;
        try {
            cantidad = parseInt(await this.preguntar('Cantidad en inventario: '));
            if (cantidad < 0) {
                console.log('❌ La cantidad no puede ser negativa');
                return;
            }
        } catch {
            console.log('❌ Ingresa una cantidad válida');
            return;
        }

        let codigo = await this.preguntar('Código del producto (opcional): ');
        if (!codigo.trim()) {
            codigo = `PROD${(this.productos.length + 1).toString().padStart(3, '0')}`;
        }

        const existe = this.productos.some(p => p.codigo === codigo);
        if (existe) {
            console.log(`❌ Ya existe un producto con el código ${codigo}`);
            return;
        }

        // Selección de categoría
        let categoria: string;
        if (this.categorias.length > 0) {
            console.log('\n📑 Categorías disponibles:');
            this.categorias.forEach((cat, i) => {
                console.log(`  ${i + 1}. ${cat.nombre}`);
            });
            console.log('  0. Crear nueva categoría');

            const opcionCat = await this.preguntar('Selecciona una categoría (número): ');
            if (opcionCat === '0') {
                categoria = await this.preguntar('Nueva categoría: ');
                if (categoria.trim()) {
                    await this.crearCategoriaRapida(categoria.trim());
                } else {
                    categoria = 'General';
                }
            } else if (opcionCat && !isNaN(parseInt(opcionCat))) {
                const idx = parseInt(opcionCat) - 1;
                if (idx >= 0 && idx < this.categorias.length) {
                    categoria = this.categorias[idx].nombre;
                } else {
                    categoria = 'General';
                }
            } else {
                categoria = 'General';
            }
        } else {
            categoria = await this.preguntar('Categoría (opcional): ') || 'General';
        }

        // Selección de proveedor
        let proveedor: string;
        if (this.proveedores.length > 0) {
            console.log('\n🏭 Proveedores disponibles:');
            this.proveedores.forEach((prov, i) => {
                console.log(`  ${i + 1}. ${prov.nombre}`);
            });
            console.log('  0. Otro proveedor');

            const opcionProv = await this.preguntar('Selecciona un proveedor (número): ');
            if (opcionProv === '0') {
                proveedor = await this.preguntar('Proveedor: ') || 'No especificado';
            } else if (opcionProv && !isNaN(parseInt(opcionProv))) {
                const idx = parseInt(opcionProv) - 1;
                if (idx >= 0 && idx < this.proveedores.length) {
                    proveedor = this.proveedores[idx].nombre;
                } else {
                    proveedor = 'No especificado';
                }
            } else {
                proveedor = 'No especificado';
            }
        } else {
            proveedor = await this.preguntar('Proveedor (opcional): ') || 'No especificado';
        }

        const nuevoProducto: Producto = {
            codigo,
            nombre: nombre.trim(),
            precio,
            costo,
            cantidad,
            categoria: categoria.trim(),
            proveedor: proveedor.trim(),
            fecha_agregado: ahora().toISOString(),
            ultima_actualizacion: ahora().toISOString()
        };

        this.productos.push(nuevoProducto);

        // Actualizar conteo en categoría
        const categoriaObj = this.categorias.find(c => c.nombre === categoria);
        if (categoriaObj) {
            categoriaObj.total_productos = (categoriaObj.total_productos || 0) + 1;
        }

        // Actualizar productos del proveedor
        const proveedorObj = this.proveedores.find(p => p.nombre === proveedor);
        if (proveedorObj && proveedor !== 'No especificado') {
            if (!proveedorObj.productos) proveedorObj.productos = [];
            if (!proveedorObj.productos.includes(codigo)) {
                proveedorObj.productos.push(codigo);
            }
        }

        this.guardarDatos();

        console.log('\n' + '='.repeat(50));
        console.log('✅ ¡PRODUCTO AGREGADO CON ÉXITO!');
        console.log('='.repeat(50));
        console.log(`Código: ${codigo}`);
        console.log(`Nombre: ${nombre}`);
        console.log(`Precio venta: $${precio.toFixed(2)}`);
        console.log(`💰 Costo compra: $${costo.toFixed(2)}`);
        console.log(`📈 Ganancia x unidad: $${(precio - costo).toFixed(2)}`);
        console.log(`Cantidad: ${cantidad}`);
        console.log(`Categoría: ${categoria}`);
        console.log(`Proveedor: ${proveedor}`);
        console.log('='.repeat(50));
    }

    private async crearCategoriaRapida(nombre: string): Promise<void> {
        const categoriaId = `CAT${(this.categorias.length + 1).toString().padStart(4, '0')}`;
        const categoria: Categoria = {
            id: categoriaId,
            nombre,
            descripcion: 'Creada desde producto',
            fecha_creacion: ahora().toISOString(),
            total_productos: 0,
            activo: true
        };
        this.categorias.push(categoria);
        console.log(`✅ Categoría '${nombre}' creada automáticamente`);
    }

    async buscarProductosAvanzado(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 BÚSQUEDA AVANZADA DE PRODUCTOS');
        console.log('='.repeat(60));

        console.log('\n1. Buscar por nombre');
        console.log('2. Buscar por código');
        console.log('3. Buscar por categoría');
        console.log('4. Buscar por proveedor');
        console.log('5. Buscar por rango de precio');
        console.log('6. Buscar por stock (menor a...)');
        console.log('7. Buscar por margen de ganancia');
        console.log('0. Volver');

        const opcion = await this.preguntar('\nSelecciona tipo de búsqueda: ');

        let resultados: Producto[] = [];

        if (opcion === '1') {
            const termino = (await this.preguntar('Nombre a buscar: ')).toLowerCase();
            resultados = this.productos.filter(p => p.nombre.toLowerCase().includes(termino));
        } else if (opcion === '2') {
            const termino = (await this.preguntar('Código a buscar: ')).toLowerCase();
            resultados = this.productos.filter(p => p.codigo.toLowerCase().includes(termino));
        } else if (opcion === '3') {
            const categoria = (await this.preguntar('Categoría: ')).toLowerCase();
            resultados = this.productos.filter(p => p.categoria.toLowerCase().includes(categoria));
        } else if (opcion === '4') {
            const proveedor = (await this.preguntar('Proveedor: ')).toLowerCase();
            resultados = this.productos.filter(p => p.proveedor.toLowerCase().includes(proveedor));
        } else if (opcion === '5') {
            try {
                const minPrecio = parseFloat(await this.preguntar('Precio mínimo: $'));
                const maxPrecio = parseFloat(await this.preguntar('Precio máximo: $'));
                resultados = this.productos.filter(p => p.precio >= minPrecio && p.precio <= maxPrecio);
            } catch {
                console.log('❌ Precios inválidos');
                return;
            }
        } else if (opcion === '6') {
            try {
                const maxStock = parseInt(await this.preguntar('Stock máximo: '));
                resultados = this.productos.filter(p => p.cantidad <= maxStock);
            } catch {
                console.log('❌ Stock inválido');
                return;
            }
        } else if (opcion === '7') {
            try {
                const minMargen = parseFloat(await this.preguntar('Margen mínimo (%): '));
                resultados = this.productos.filter(p => {
                    const costo = p.costo || p.precio * 0.7;
                    const margen = ((p.precio - costo) / p.precio) * 100;
                    return margen >= minMargen;
                });
            } catch {
                console.log('❌ Margen inválido');
                return;
            }
        } else if (opcion === '0') {
            return;
        }

        if (resultados.length > 0) {
            console.log(`\n✅ ${resultados.length} productos encontrados:`);
            console.log('-'.repeat(80));
            for (const p of resultados) {
                const costo = p.costo || p.precio * 0.7;
                const ganancia = p.precio - costo;
                const margen = (ganancia / p.precio) * 100;

                console.log(`\n  📦 ${p.codigo} - ${p.nombre}`);
                console.log(`     Precio: $${p.precio.toFixed(2)} | Costo: $${costo.toFixed(2)}`);
                console.log(`     Ganancia: $${ganancia.toFixed(2)} (${margen.toFixed(1)}%)`);
                console.log(`     Stock: ${p.cantidad} | Categoría: ${p.categoria}`);
                console.log(`     Proveedor: ${p.proveedor}`);
            }
        } else {
            console.log('❌ No se encontraron productos');
        }
    }

    async editarProducto(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('✏️ EDITAR PRODUCTO');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('inventario', 'actualizar')) {
            console.log('⛔ No tienes permiso para editar productos');
            return;
        }

        const codigo = await this.preguntar('Ingresa el código del producto a editar: ');
        const producto = this.productos.find(p => p.codigo === codigo);

        if (!producto) {
            console.log('❌ Producto no encontrado');
            return;
        }

        const categoriaAnterior = producto.categoria;
        const proveedorAnterior = producto.proveedor;

        console.log(`\nProducto actual: ${producto.nombre}`);
        console.log('(Deja en blanco para mantener el valor actual)');
        console.log('-'.repeat(30));

        const nuevoNombre = await this.preguntar(`Nuevo nombre [${producto.nombre}]: `);
        if (nuevoNombre.trim()) producto.nombre = nuevoNombre.trim();

        try {
            const nuevoCosto = await this.preguntar(`Nuevo costo de compra [$${producto.costo.toFixed(2)}]: `);
            if (nuevoCosto.trim()) producto.costo = parseFloat(nuevoCosto);
        } catch {
            console.log('Costo no válido, se mantiene el actual');
        }

        try {
            const nuevoPrecio = await this.preguntar(`Nuevo precio de venta [$${producto.precio.toFixed(2)}]: `);
            if (nuevoPrecio.trim()) producto.precio = parseFloat(nuevoPrecio);
        } catch {
            console.log('Precio no válido, se mantiene el actual');
        }

        try {
            const nuevaCantidad = await this.preguntar(`Nueva cantidad [${producto.cantidad}]: `);
            if (nuevaCantidad.trim()) producto.cantidad = parseInt(nuevaCantidad);
        } catch {
            console.log('Cantidad no válida, se mantiene la actual');
        }

        const nuevaCategoria = await this.preguntar(`Nueva categoría [${producto.categoria}]: `);
        if (nuevaCategoria.trim() && nuevaCategoria !== producto.categoria) {
            // Actualizar conteo de categorías
            const catAnterior = this.categorias.find(c => c.nombre === categoriaAnterior);
            if (catAnterior) {
                catAnterior.total_productos = Math.max(0, (catAnterior.total_productos || 1) - 1);
            }
            
            const catNueva = this.categorias.find(c => c.nombre === nuevaCategoria.trim());
            if (catNueva) {
                catNueva.total_productos = (catNueva.total_productos || 0) + 1;
            }
            
            producto.categoria = nuevaCategoria.trim();
        }

        const nuevoProveedor = await this.preguntar(`Nuevo proveedor [${producto.proveedor}]: `);
        if (nuevoProveedor.trim() && nuevoProveedor !== producto.proveedor) {
            // Actualizar productos del proveedor anterior
            const provAnterior = this.proveedores.find(p => p.nombre === proveedorAnterior);
            if (provAnterior && provAnterior.productos) {
                const index = provAnterior.productos.indexOf(codigo);
                if (index > -1) provAnterior.productos.splice(index, 1);
            }

            // Actualizar nuevo proveedor
            const provNuevo = this.proveedores.find(p => p.nombre === nuevoProveedor.trim());
            if (provNuevo && nuevoProveedor.trim() !== 'No especificado') {
                if (!provNuevo.productos) provNuevo.productos = [];
                if (!provNuevo.productos.includes(codigo)) {
                    provNuevo.productos.push(codigo);
                }
            }

            producto.proveedor = nuevoProveedor.trim();
        }

        producto.ultima_actualizacion = ahora().toISOString();
        this.guardarDatos();
        console.log('\n✅ Producto actualizado correctamente');
    }

    async eliminarProducto(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('🗑️ ELIMINAR PRODUCTO');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('inventario', 'eliminar')) {
            console.log('⛔ No tienes permiso para eliminar productos');
            return;
        }

        const codigo = await this.preguntar('Ingresa el código del producto a eliminar: ');
        const index = this.productos.findIndex(p => p.codigo === codigo);

        if (index === -1) {
            console.log('❌ Producto no encontrado');
            return;
        }

        const producto = this.productos[index];
        console.log(`\nProducto encontrado: ${producto.nombre}`);
        console.log(`Código: ${producto.codigo}`);
        console.log(`Precio: $${producto.precio.toFixed(2)}`);
        console.log(`Costo: $${producto.costo.toFixed(2)}`);
        console.log(`Cantidad: ${producto.cantidad}`);
        console.log(`Categoría: ${producto.categoria}`);
        console.log(`Proveedor: ${producto.proveedor}`);

        // Verificar ventas asociadas
        const ventasAsociadas = this.ventas.filter(v => 
            v.items.some(item => item.codigo === codigo)
        ).length;

        if (ventasAsociadas > 0) {
            console.log(`\n⚠️  Este producto aparece en ${ventasAsociadas} venta(s)`);
            console.log('   Eliminarlo afectará el historial de ventas');
        }

        const confirmacion = await this.preguntar('\n¿Estás seguro de eliminar? (s/n): ');
        if (confirmacion.toLowerCase() === 's') {
            // Actualizar categoría
            const categoria = this.categorias.find(c => c.nombre === producto.categoria);
            if (categoria) {
                categoria.total_productos = Math.max(0, (categoria.total_productos || 1) - 1);
            }

            // Actualizar proveedor
            const proveedor = this.proveedores.find(p => p.nombre === producto.proveedor);
            if (proveedor && proveedor.productos) {
                const idxProd = proveedor.productos.indexOf(codigo);
                if (idxProd > -1) proveedor.productos.splice(idxProd, 1);
            }

            this.productos.splice(index, 1);
            this.guardarDatos();
            console.log('✅ Producto eliminado correctamente');
        } else {
            console.log('Operación cancelada');
        }
    }

    private analisisFinanciero(): void {
        console.log('\n' + '='.repeat(70));
        console.log('📊 ANÁLISIS FINANCIERO DEL INVENTARIO');
        console.log('='.repeat(70));

        if (this.productos.length === 0) {
            console.log('📭 No hay productos en el inventario');
            return;
        }

        let inversionTotal = 0;
        let ventaTotal = 0;

        console.log(`\n${'Producto'.padEnd(25)} ${'Inversión'.padEnd(15)} ${'Venta'.padEnd(15)} ${'Ganancia'.padEnd(15)} ${'Margen'.padEnd(10)}`);
        console.log('-'.repeat(80));

        for (const producto of this.productos) {
            const costoUnit = producto.costo || producto.precio * 0.7;
            const inversion = costoUnit * producto.cantidad;
            const venta = producto.precio * producto.cantidad;
            const ganancia = venta - inversion;
            const margen = venta > 0 ? (ganancia / venta * 100) : 0;

            console.log(
                `${producto.nombre.slice(0, 24).padEnd(25)} $${inversion.toFixed(2).padEnd(14)} ` +
                `$${venta.toFixed(2).padEnd(14)} $${ganancia.toFixed(2).padEnd(14)} ${margen.toFixed(1).padEnd(9)}%`
            );

            inversionTotal += inversion;
            ventaTotal += venta;
        }

        const gananciaTotal = ventaTotal - inversionTotal;
        const margenTotal = ventaTotal > 0 ? (gananciaTotal / ventaTotal * 100) : 0;

        console.log('='.repeat(80));
        console.log(
            `${'TOTAL:'.padEnd(25)} $${inversionTotal.toFixed(2).padEnd(14)} ` +
            `$${ventaTotal.toFixed(2).padEnd(14)} $${gananciaTotal.toFixed(2).padEnd(14)} ${margenTotal.toFixed(1).padEnd(9)}%`
        );
    }

    private verStockBajo(): void {
        console.log('\n' + '='.repeat(70));
        console.log('🔴 PRODUCTOS CON STOCK BAJO (≤ 5 UNIDADES)');
        console.log('='.repeat(70));

        const productosBajos = this.productos.filter(p => p.cantidad <= 5);

        if (productosBajos.length === 0) {
            console.log('✅ No hay productos con stock bajo. ¡Todo en orden!');
            return;
        }

        console.log(`${'Código'.padEnd(8)} ${'Nombre'.padEnd(25)} ${'Cantidad'.padEnd(10)} ${'Precio'.padEnd(12)} ${'Costo'.padEnd(12)} ${'Ganancia'.padEnd(12)}`);
        console.log('-'.repeat(80));

        for (const p of productosBajos) {
            const costo = p.costo || p.precio * 0.7;
            const ganancia = p.precio - costo;
            console.log(
                `${p.codigo.padEnd(8)} ${p.nombre.slice(0, 24).padEnd(25)} ${p.cantidad.toString().padEnd(10)} ` +
                `$${p.precio.toFixed(2).padEnd(11)} $${costo.toFixed(2).padEnd(11)} $${ganancia.toFixed(2).padEnd(11)}`
            );
        }

        console.log('='.repeat(80));
        console.log(`🔴 Total productos con stock bajo: ${productosBajos.length}`);

        console.log('\n📦 SUGERENCIA: Considera realizar un pedido para estos productos.');
        const valorReorden = productosBajos.reduce((sum, p) => 
            sum + (p.cantidad * (p.costo || p.precio * 0.7)), 0);
        console.log(`💰 Inversión necesaria para reorden: $${valorReorden.toFixed(2)}`);
    }

    //  CRUD DE VENTAS 

    async registrarVenta(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('💰 REGISTRAR NUEVA VENTA');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('ventas', 'crear')) {
            console.log('⛔ No tienes permiso para registrar ventas');
            return;
        }

        if (this.productos.length === 0) {
            console.log('❌ No hay productos en el inventario');
            return;
        }

        console.log('\nProductos disponibles:');
        for (const p of this.productos) {
            console.log(` ${p.codigo} - ${p.nombre} - $${p.precio.toFixed(2)} - Stock: ${p.cantidad}`);
        }

        // Seleccionar cliente (opcional)
        let clienteId: string | undefined = undefined;
        if (this.clientes.length > 0) {
            console.log('\n👥 Clientes registrados:');
            for (let i = 0; i < Math.min(5, this.clientes.length); i++) {
                const c = this.clientes[i];
                console.log(` ${i + 1}. ${c.nombre} (ID: ${c.id})`);
            }
            console.log(' 0. Venta sin cliente registrado');

            const opcionCliente = (await this.preguntar('Selecciona un cliente (número) [0]: ')) || '0';
            if (opcionCliente !== '0' && !isNaN(parseInt(opcionCliente))) {
                const idx = parseInt(opcionCliente) - 1;
                if (idx >= 0 && idx < this.clientes.length) {
                    clienteId = this.clientes[idx].id;
                }
            }
        }

        const itemsVenta: ItemVenta[] = [];
        let total = 0;

        while (true) {
            console.log('\n' + '-'.repeat(30));
            const codigo = await this.preguntar('Código del producto (o \'fin\' para terminar): ');
            if (codigo.toLowerCase() === 'fin') break;

            const producto = this.productos.find(p => p.codigo === codigo);
            if (!producto) {
                console.log('❌ Producto no encontrado');
                continue;
            }

            try {
                const cantidad = parseInt(await this.preguntar(`Cantidad (máx ${producto.cantidad}): `));
                if (cantidad <= 0) {
                    console.log('❌ La cantidad debe ser positiva');
                    continue;
                }
                if (cantidad > producto.cantidad) {
                    console.log(`❌ Solo hay ${producto.cantidad} unidades disponibles`);
                    continue;
                }

                const subtotal = producto.precio * cantidad;
                itemsVenta.push({
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad,
                    subtotal
                });
                total += subtotal;
                console.log(`✅ Agregado: ${producto.nombre} x${cantidad} = $${subtotal.toFixed(2)}`);
            } catch {
                console.log('❌ Cantidad no válida');
                continue;
            }
        }

        if (itemsVenta.length === 0) {
            console.log('❌ No se agregaron productos');
            return;
        }

        console.log('\n' + '='.repeat(50));
        console.log('RESUMEN DE LA VENTA');
        console.log('-'.repeat(50));
        for (const item of itemsVenta) {
            console.log(`${item.nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`);
        }
        console.log('-'.repeat(50));
        console.log(`TOTAL: $${total.toFixed(2)}`);

        // Aplicar descuento (opcional)
        let descuento = 0;
        const aplicarDesc = (await this.preguntar('\n¿Aplicar descuento? (s/n): ')).toLowerCase();
        if (aplicarDesc === 's') {
            try {
                descuento = parseFloat(await this.preguntar('Porcentaje de descuento: %'));
                if (descuento >= 0 && descuento <= 100) {
                    const totalConDesc = total * (1 - descuento / 100);
                    console.log(`Total con descuento: $${totalConDesc.toFixed(2)}`);
                    total = totalConDesc;
                } else {
                    console.log('Descuento no aplicado (debe ser 0-100)');
                }
            } catch {
                console.log('Descuento no aplicado');
            }
        }

        const confirmar = await this.preguntar('\n¿Confirmar venta? (s/n): ');
        if (confirmar.toLowerCase() !== 's') {
            console.log('❌ Venta cancelada');
            return;
        }

        // Actualizar inventario
        for (const item of itemsVenta) {
            const producto = this.productos.find(p => p.codigo === item.codigo);
            if (producto) {
                producto.cantidad -= item.cantidad;
                producto.ultima_actualizacion = ahora().toISOString();
            }
        }

        const venta: Venta = {
            folio: `V${(this.ventas.length + 1).toString().padStart(4, '0')}`,
            fecha: ahora().toISOString(),
            vendedor: this.usuarioActual?.nombre || 'Sistema',
            items: itemsVenta,
            total,
            productos: itemsVenta.length,
            cliente_id: clienteId,
            descuento: descuento > 0 ? descuento : undefined
        };

        this.ventas.push(venta);

        // Actualizar estadísticas del cliente
        if (clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            if (cliente) {
                cliente.compras_totales = (cliente.compras_totales || 0) + 1;
                cliente.monto_total = (cliente.monto_total || 0) + total;
                cliente.ultima_compra = ahora().toISOString();
            }
        }

        this.guardarDatos();

        console.log('\n' + '='.repeat(50));
        console.log('✅ ¡VENTA REGISTRADA CON ÉXITO!');
        console.log(`Folio: ${venta.folio}`);
        console.log(`Total: $${total.toFixed(2)}`);
        if (descuento > 0) {
            console.log(`Descuento aplicado: ${descuento}%`);
        }
        console.log('='.repeat(50));
    }

    private verHistorialVentas(): void {
        console.log('\n' + '='.repeat(80));
        console.log('📋 HISTORIAL DE VENTAS');
        console.log('='.repeat(80));

        if (this.ventas.length === 0) {
            console.log('📭 No hay ventas registradas');
            return;
        }

        const totalGeneral = this.ventas.reduce((sum, v) => sum + v.total, 0);

        for (const venta of this.ventas.slice(-10).reverse()) {
            console.log(`\nFolio: ${venta.folio} | Fecha: ${new Date(venta.fecha).toLocaleString()}`);
            console.log(`Vendedor: ${venta.vendedor}`);
            
            if (venta.cliente_id) {
                const cliente = this.clientes.find(c => c.id === venta.cliente_id);
                if (cliente) {
                    console.log(`Cliente: ${cliente.nombre}`);
                }
            }
            
            console.log(`Productos: ${venta.productos} | Total: $${venta.total.toFixed(2)}`);
            if (venta.descuento) {
                console.log(`Descuento: ${venta.descuento}%`);
            }
            console.log('-'.repeat(50));
        }

        console.log(`\n📊 TOTAL VENTAS: ${this.ventas.length} | MONTO TOTAL: $${totalGeneral.toFixed(2)}`);
    }

    async editarVenta(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('✏️ EDITAR VENTA');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('ventas', 'actualizar')) {
            console.log('⛔ No tienes permiso para editar ventas');
            return;
        }

        const folio = await this.preguntar('Ingresa el folio de la venta a editar: ');
        const ventaIndex = this.ventas.findIndex(v => v.folio === folio);

        if (ventaIndex === -1) {
            console.log('❌ Venta no encontrada');
            return;
        }

        const venta = this.ventas[ventaIndex];

        console.log(`\n📋 Editando venta ${folio}`);
        console.log(`Fecha original: ${new Date(venta.fecha).toLocaleString()}`);
        console.log(`Vendedor: ${venta.vendedor}`);
        console.log(`Total actual: $${venta.total.toFixed(2)}`);

        console.log('\n1. Cambiar vendedor');
        console.log('2. Agregar producto');
        console.log('3. Quitar producto');
        console.log('4. Modificar cantidad de producto');
        console.log('5. Aplicar descuento');
        console.log('0. Cancelar');

        const opcion = await this.preguntar('\nSelecciona una opción: ');

        if (opcion === '1') {
            const nuevoVendedor = await this.preguntar(`Nuevo vendedor [${venta.vendedor}]: `);
            if (nuevoVendedor.trim()) {
                venta.vendedor = nuevoVendedor.trim();
                console.log('✅ Vendedor actualizado');
            }
        } else if (opcion === '2') {
            await this.agregarProductoAVenta(venta);
        } else if (opcion === '3') {
            await this.quitarProductoDeVenta(venta);
        } else if (opcion === '4') {
            await this.modificarCantidadVenta(venta);
        } else if (opcion === '5') {
            try {
                const descuento = parseFloat(await this.preguntar('Porcentaje de descuento: %'));
                if (descuento >= 0 && descuento <= 100) {
                    venta.descuento = descuento;
                } else {
                    console.log('❌ Descuento debe estar entre 0 y 100');
                }
            } catch {
                console.log('❌ Descuento inválido');
            }
        } else if (opcion === '0') {
            return;
        }

        if (opcion !== '0') {
            // Recalcular total
            const subtotal = venta.items.reduce((sum, item) => sum + item.subtotal, 0);
            const descuento = venta.descuento || 0;
            venta.total = subtotal * (1 - descuento / 100);
            venta.productos = venta.items.length;
            venta.fecha = ahora().toISOString() + ' (EDITADA)';
            this.guardarDatos();
            console.log(`\n✅ Venta actualizada. Nuevo total: $${venta.total.toFixed(2)}`);
        }
    }

    private async agregarProductoAVenta(venta: Venta): Promise<void> {
        console.log('\n📦 Productos disponibles:');
        for (const p of this.productos) {
            console.log(` ${p.codigo} - ${p.nombre} - $${p.precio.toFixed(2)} - Stock: ${p.cantidad}`);
        }

        const codigo = await this.preguntar('\nCódigo del producto: ');
        const producto = this.productos.find(p => p.codigo === codigo);

        if (!producto) {
            console.log('❌ Producto no encontrado');
            return;
        }

        try {
            const cantidad = parseInt(await this.preguntar(`Cantidad (máx ${producto.cantidad}): `));
            if (cantidad <= 0) {
                console.log('❌ Cantidad inválida');
                return;
            }
            if (cantidad > producto.cantidad) {
                console.log(`❌ Solo hay ${producto.cantidad} disponibles`);
                return;
            }

            // Verificar si el producto ya está en la venta
            const itemExistente = venta.items.find(item => item.codigo === codigo);
            if (itemExistente) {
                itemExistente.cantidad += cantidad;
                itemExistente.subtotal = itemExistente.precio * itemExistente.cantidad;
            } else {
                venta.items.push({
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad,
                    subtotal: producto.precio * cantidad
                });
            }

            // Actualizar inventario
            producto.cantidad -= cantidad;
            console.log(`✅ Producto agregado: ${producto.nombre} x${cantidad}`);
        } catch {
            console.log('❌ Cantidad inválida');
        }
    }

    private async quitarProductoDeVenta(venta: Venta): Promise<void> {
        console.log('\nProductos en la venta:');
        venta.items.forEach((item, i) => {
            console.log(`${i + 1}. ${item.nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`);
        });

        try {
            const idx = parseInt(await this.preguntar('\nNúmero del producto a quitar: ')) - 1;
            if (idx >= 0 && idx < venta.items.length) {
                const item = venta.items.splice(idx, 1)[0];
                
                // Restaurar inventario
                const producto = this.productos.find(p => p.codigo === item.codigo);
                if (producto) {
                    producto.cantidad += item.cantidad;
                }
                
                console.log(`✅ Producto quitado: ${item.nombre}`);
            } else {
                console.log('❌ Número inválido');
            }
        } catch {
            console.log('❌ Entrada inválida');
        }
    }

    private async modificarCantidadVenta(venta: Venta): Promise<void> {
        console.log('\nProductos en la venta:');
        venta.items.forEach((item, i) => {
            console.log(`${i + 1}. ${item.nombre} - Cantidad actual: ${item.cantidad}`);
        });

        try {
            const idx = parseInt(await this.preguntar('\nNúmero del producto a modificar: ')) - 1;
            if (idx >= 0 && idx < venta.items.length) {
                const item = venta.items[idx];
                const nuevaCantidad = parseInt(await this.preguntar(`Nueva cantidad (máx 999): `));
                
                if (nuevaCantidad > 0) {
                    const diferencia = nuevaCantidad - item.cantidad;
                    
                    // Verificar stock disponible
                    const producto = this.productos.find(p => p.codigo === item.codigo);
                    if (producto) {
                        if (diferencia > 0 && producto.cantidad < diferencia) {
                            console.log(`❌ Stock insuficiente. Disponible: ${producto.cantidad}`);
                            return;
                        }
                        producto.cantidad -= diferencia;
                    }
                    
                    item.cantidad = nuevaCantidad;
                    item.subtotal = item.precio * nuevaCantidad;
                    console.log(`✅ Cantidad actualizada a ${nuevaCantidad}`);
                } else {
                    console.log('❌ Cantidad inválida');
                }
            } else {
                console.log('❌ Número inválido');
            }
        } catch {
            console.log('❌ Entrada inválida');
        }
    }

    async cancelarVenta(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🗑️ CANCELAR VENTA');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('ventas', 'eliminar')) {
            console.log('⛔ No tienes permiso para cancelar ventas');
            return;
        }

        const folio = await this.preguntar('Ingresa el folio de la venta a cancelar: ');
        const ventaIndex = this.ventas.findIndex(v => v.folio === folio);

        if (ventaIndex === -1) {
            console.log('❌ Venta no encontrada');
            return;
        }

        const venta = this.ventas[ventaIndex];

        console.log(`\n📋 Venta encontrada:`);
        console.log(`Folio: ${venta.folio}`);
        console.log(`Fecha: ${new Date(venta.fecha).toLocaleString()}`);
        console.log(`Vendedor: ${venta.vendedor}`);
        console.log(`Total: $${venta.total.toFixed(2)}`);
        console.log('\nProductos vendidos:');
        for (const item of venta.items) {
            console.log(`  • ${item.nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`);
        }

        console.log('\n⚠️  ADVERTENCIA: Esta acción no se puede deshacer');
        const confirmar = await this.preguntar('¿Estás SEGURO de cancelar esta venta? (s/n): ');
        
        if (confirmar.toLowerCase() !== 's') {
            console.log('❌ Cancelación abortada');
            return;
        }

        // Restaurar inventario
        for (const item of venta.items) {
            const producto = this.productos.find(p => p.codigo === item.codigo);
            if (producto) {
                producto.cantidad += item.cantidad;
                producto.ultima_actualizacion = ahora().toISOString();
                console.log(`🔄 Inventario restaurado: ${item.nombre} +${item.cantidad}`);
            }
        }

        // Eliminar la venta
        this.ventas.splice(ventaIndex, 1);
        this.guardarDatos();

        console.log('\n✅ ¡VENTA CANCELADA EXITOSAMENTE!');
        console.log('📦 Inventario restaurado automáticamente');
    }

    private estadisticasVentas(): void {
        console.log('\n' + '='.repeat(50));
        console.log('📈 ESTADÍSTICAS DE VENTAS');
        console.log('='.repeat(50));

        if (this.ventas.length === 0) {
            console.log('📭 No hay datos de ventas');
            return;
        }

        const totalVentas = this.ventas.length;
        const totalMonto = this.ventas.reduce((sum, v) => sum + v.total, 0);
        const promedio = totalMonto / totalVentas;
        const maxVenta = this.ventas.reduce((max, v) => v.total > max.total ? v : max, this.ventas[0]);
        const minVenta = this.ventas.reduce((min, v) => v.total < min.total ? v : min, this.ventas[0]);

        console.log(`📊 Total de ventas: ${totalVentas}`);
        console.log(`💰 Monto total: $${totalMonto.toFixed(2)}`);
        console.log(`📈 Promedio por venta: $${promedio.toFixed(2)}`);
        console.log(`🏆 Venta más alta: $${maxVenta.total.toFixed(2)} (Folio: ${maxVenta.folio})`);
        console.log(`📉 Venta más baja: $${minVenta.total.toFixed(2)} (Folio: ${minVenta.folio})`);

        // Ventas por mes (simplificado)
        const ventasPorMes: { [key: string]: number } = {};
        for (const v of this.ventas) {
            const mes = new Date(v.fecha).toLocaleString('es-MX', { month: 'long', year: 'numeric' });
            ventasPorMes[mes] = (ventasPorMes[mes] || 0) + v.total;
        }

        console.log('\n📊 Ventas por mes:');
        for (const [mes, monto] of Object.entries(ventasPorMes)) {
            console.log(`   ${mes}: $${monto.toFixed(2)}`);
        }
    }

    //  CRUD DE CLIENTES 

    async registrarCliente(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('➕ REGISTRAR NUEVO CLIENTE');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('clientes', 'crear')) {
            console.log('⛔ No tienes permiso para registrar clientes');
            return;
        }

        const nombre = await this.preguntar('Nombre completo: ');
        if (!nombre.trim()) {
            console.log('❌ El nombre no puede estar vacío');
            return;
        }

        const telefono = await this.preguntar('Teléfono: ');
        const email = await this.preguntar('Email: ');
        const direccion = await this.preguntar('Dirección: ');

        const clienteId = `C${(this.clientes.length + 1).toString().padStart(4, '0')}`;

        const cliente: Cliente = {
            id: clienteId,
            nombre: nombre.trim(),
            telefono: telefono.trim() || 'No especificado',
            email: email.trim() || 'No especificado',
            direccion: direccion.trim() || 'No especificada',
            fecha_registro: ahora().toISOString(),
            compras_totales: 0,
            monto_total: 0
        };

        this.clientes.push(cliente);
        this.guardarDatos();

        console.log('\n✅ Cliente registrado exitosamente');
        console.log(`ID: ${clienteId}`);
        console.log(`Nombre: ${nombre}`);
    }

    private verClientes(): void {
        console.log('\n' + '='.repeat(70));
        console.log('👥 LISTA DE CLIENTES');
        console.log('='.repeat(70));

        if (this.clientes.length === 0) {
            console.log('📭 No hay clientes registrados');
            return;
        }

        console.log(`${'ID'.padEnd(8)} ${'Nombre'.padEnd(25)} ${'Teléfono'.padEnd(15)} ${'Email'.padEnd(20)}`);
        console.log('-'.repeat(70));

        const clientesOrdenados = [...this.clientes].sort((a, b) => a.nombre.localeCompare(b.nombre));

        for (const cliente of clientesOrdenados) {
            console.log(
                `${cliente.id.padEnd(8)} ${cliente.nombre.slice(0, 24).padEnd(25)} ` +
                `${cliente.telefono.slice(0, 14).padEnd(15)} ${cliente.email.slice(0, 19).padEnd(20)}`
            );
        }

        console.log('='.repeat(70));
        console.log(`📊 Total de clientes: ${this.clientes.length}`);
    }

    async buscarCliente(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 BUSCAR CLIENTE');
        console.log('='.repeat(50));

        const termino = (await this.preguntar('Ingresa nombre o ID del cliente: ')).toLowerCase().trim();

        const resultados = this.clientes.filter(c => 
            c.nombre.toLowerCase().includes(termino) ||
            c.id.toLowerCase().includes(termino) ||
            c.email.toLowerCase().includes(termino)
        );

        if (resultados.length > 0) {
            console.log(`\n✅ ${resultados.length} cliente(s) encontrado(s):`);
            for (const c of resultados) {
                console.log(`\n ID: ${c.id}`);
                console.log(` Nombre: ${c.nombre}`);
                console.log(` Teléfono: ${c.telefono}`);
                console.log(` Email: ${c.email}`);
                console.log(` Dirección: ${c.direccion}`);
                console.log(` Compras: ${c.compras_totales || 0}`);
                console.log(` Total gastado: $${(c.monto_total || 0).toFixed(2)}`);
            }
        } else {
            console.log('❌ No se encontraron clientes');
        }
    }

    async editarCliente(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('✏️ EDITAR CLIENTE');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('clientes', 'actualizar')) {
            console.log('⛔ No tienes permiso para editar clientes');
            return;
        }

        const clienteId = await this.preguntar('Ingresa el ID del cliente a editar: ');
        const cliente = this.clientes.find(c => c.id === clienteId);

        if (!cliente) {
            console.log('❌ Cliente no encontrado');
            return;
        }

        console.log(`\nCliente actual: ${cliente.nombre}`);
        console.log('(Deja en blanco para mantener el valor actual)');

        const nuevoNombre = await this.preguntar(`Nuevo nombre [${cliente.nombre}]: `);
        if (nuevoNombre.trim()) cliente.nombre = nuevoNombre.trim();

        const nuevoTelefono = await this.preguntar(`Nuevo teléfono [${cliente.telefono}]: `);
        if (nuevoTelefono.trim()) cliente.telefono = nuevoTelefono.trim();

        const nuevoEmail = await this.preguntar(`Nuevo email [${cliente.email}]: `);
        if (nuevoEmail.trim()) cliente.email = nuevoEmail.trim();

        const nuevaDireccion = await this.preguntar(`Nueva dirección [${cliente.direccion}]: `);
        if (nuevaDireccion.trim()) cliente.direccion = nuevaDireccion.trim();

        this.guardarDatos();
        console.log('✅ Cliente actualizado correctamente');
    }

    async eliminarCliente(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('🗑️ ELIMINAR CLIENTE');
        console.log('='.repeat(50));

        if (!this.verificarPermiso('clientes', 'eliminar')) {
            console.log('⛔ No tienes permiso para eliminar clientes');
            return;
        }

        const clienteId = await this.preguntar('Ingresa el ID del cliente a eliminar: ');
        const index = this.clientes.findIndex(c => c.id === clienteId);

        if (index === -1) {
            console.log('❌ Cliente no encontrado');
            return;
        }

        const cliente = this.clientes[index];
        console.log(`\nCliente encontrado: ${cliente.nombre}`);
        console.log(`Compras realizadas: ${cliente.compras_totales || 0}`);
        console.log(`Monto total: $${(cliente.monto_total || 0).toFixed(2)}`);

        // Verificar ventas asociadas
        const ventasCliente = this.ventas.filter(v => v.cliente_id === clienteId);
        if (ventasCliente.length > 0) {
            console.log(`\n⚠️  Este cliente tiene ${ventasCliente.length} venta(s) asociada(s)`);
            console.log('   Eliminarlo afectará el historial de ventas');
        }

        const confirmacion = await this.preguntar('\n¿Estás seguro de eliminar? (s/n): ');
        if (confirmacion.toLowerCase() === 's') {
            this.clientes.splice(index, 1);
            this.guardarDatos();
            console.log('✅ Cliente eliminado correctamente');
        } else {
            console.log('Operación cancelada');
        }
    }

    async verHistorialComprasCliente(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('📊 HISTORIAL DE COMPRAS DEL CLIENTE');
        console.log('='.repeat(60));

        const clienteId = await this.preguntar('ID del cliente: ');

        const cliente = this.clientes.find(c => c.id === clienteId);
        if (!cliente) {
            console.log('❌ Cliente no encontrado');
            return;
        }

        const compras = this.ventas.filter(v => v.cliente_id === clienteId);

        console.log(`\n👤 Cliente: ${cliente.nombre}`);
        console.log(`📧 Email: ${cliente.email}`);
        console.log(`📱 Teléfono: ${cliente.telefono}`);
        console.log(`📅 Registrado: ${new Date(cliente.fecha_registro).toLocaleDateString()}`);

        if (compras.length > 0) {
            console.log(`\n🛒 Historial de compras (${compras.length} compras):`);
            let totalGastado = 0;
            let productosComprados = 0;

            for (const compra of compras) {
                console.log(`\n  📅 ${new Date(compra.fecha).toLocaleDateString()} - Folio: ${compra.folio}`);
                console.log(`     Total: $${compra.total.toFixed(2)}`);
                console.log(`     Productos: ${compra.productos} items`);

                for (const item of compra.items) {
                    console.log(`       • ${item.nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`);
                }

                totalGastado += compra.total;
                productosComprados += compra.items.reduce((sum, item) => sum + item.cantidad, 0);
            }

            console.log(`\n💰 TOTAL GASTADO: $${totalGastado.toFixed(2)}`);
            console.log(`📦 TOTAL PRODUCTOS: ${productosComprados} unidades`);
            console.log(`📊 PROMEDIO POR COMPRA: $${(totalGastado / compras.length).toFixed(2)}`);

            // Actualizar estadísticas
            cliente.compras_totales = compras.length;
            cliente.monto_total = totalGastado;
            cliente.ultima_compra = compras[compras.length - 1].fecha;
            this.guardarDatos();
        } else {
            console.log('\n📭 Este cliente no tiene compras registradas');
        }
    }

    // CRUD DE PROVEEDORES 

    async crearProveedor(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('➕ CREAR NUEVO PROVEEDOR');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('proveedores', 'crear')) {
            console.log('⛔ No tienes permiso para crear proveedores');
            return;
        }

        const nombre = await this.preguntar('Nombre del proveedor: ');
        if (!nombre.trim()) {
            console.log('❌ El nombre no puede estar vacío');
            return;
        }

        const contacto = await this.preguntar('Nombre de contacto: ') || 'No especificado';
        const telefono = await this.preguntar('Teléfono: ');
        const email = await this.preguntar('Email: ');
        const direccion = await this.preguntar('Dirección: ');

        const proveedorId = `PROV${(this.proveedores.length + 1).toString().padStart(4, '0')}`;

        const proveedor: Proveedor = {
            id: proveedorId,
            nombre: nombre.trim(),
            contacto: contacto.trim(),
            telefono: telefono.trim() || 'No especificado',
            email: email.trim() || 'No especificado',
            direccion: direccion.trim() || 'No especificada',
            productos: [],
            fecha_registro: ahora().toISOString(),
            calificacion: 0,
            total_compras: 0,
            activo: true
        };

        this.proveedores.push(proveedor);
        this.guardarDatos();

        console.log(`\n✅ Proveedor creado exitosamente`);
        console.log(`ID: ${proveedorId}`);
        console.log(`Nombre: ${nombre}`);
        console.log(`Contacto: ${contacto}`);
    }

    private verProveedores(): void {
        console.log('\n' + '='.repeat(80));
        console.log('🏭 LISTA DE PROVEEDORES');
        console.log('='.repeat(80));

        if (this.proveedores.length === 0) {
            console.log('📭 No hay proveedores registrados');
            return;
        }

        console.log(`${'ID'.padEnd(8)} ${'Nombre'.padEnd(25)} ${'Contacto'.padEnd(20)} ${'Teléfono'.padEnd(15)} ${'Productos'.padEnd(10)}`);
        console.log('-'.repeat(80));

        for (const prov of this.proveedores.sort((a, b) => a.nombre.localeCompare(b.nombre))) {
            const numProductos = prov.productos?.length || 0;
            console.log(
                `${prov.id.padEnd(8)} ${prov.nombre.slice(0, 24).padEnd(25)} ` +
                `${prov.contacto.slice(0, 19).padEnd(20)} ${prov.telefono.slice(0, 14).padEnd(15)} ${numProductos.toString().padEnd(10)}`
            );
        }

        console.log('='.repeat(80));
        console.log(`📊 Total de proveedores: ${this.proveedores.length}`);
    }

    async buscarProveedor(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 BUSCAR PROVEEDOR');
        console.log('='.repeat(60));

        console.log('1. Buscar por nombre');
        console.log('2. Buscar por ID');
        console.log('3. Buscar por producto que provee');

        const opcion = await this.preguntar('\nSelecciona tipo de búsqueda: ');

        let resultados: Proveedor[] = [];

        if (opcion === '1') {
            const termino = (await this.preguntar('Nombre a buscar: ')).toLowerCase();
            resultados = this.proveedores.filter(p => p.nombre.toLowerCase().includes(termino));
        } else if (opcion === '2') {
            const termino = (await this.preguntar('ID a buscar: ')).toLowerCase();
            resultados = this.proveedores.filter(p => p.id.toLowerCase().includes(termino));
        } else if (opcion === '3') {
            const codigo = await this.preguntar('Código de producto: ');
            resultados = this.proveedores.filter(p => p.productos?.includes(codigo));
        }

        if (resultados.length > 0) {
            console.log(`\n✅ ${resultados.length} proveedor(es) encontrado(s):`);
            for (const p of resultados) {
                console.log(`\n  ID: ${p.id}`);
                console.log(`  Nombre: ${p.nombre}`);
                console.log(`  Contacto: ${p.contacto}`);
                console.log(`  Teléfono: ${p.telefono}`);
                console.log(`  Email: ${p.email}`);
                console.log(`  Dirección: ${p.direccion}`);
                if (p.productos?.length) {
                    console.log(`  Productos que provee: ${p.productos.join(', ')}`);
                }
            }
        } else {
            console.log('❌ No se encontraron proveedores');
        }
    }

    async editarProveedor(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('✏️ EDITAR PROVEEDOR');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('proveedores', 'actualizar')) {
            console.log('⛔ No tienes permiso para editar proveedores');
            return;
        }

        const provId = await this.preguntar('ID del proveedor a editar: ');
        const proveedor = this.proveedores.find(p => p.id === provId);

        if (!proveedor) {
            console.log('❌ Proveedor no encontrado');
            return;
        }

        console.log(`\nEditando: ${proveedor.nombre}`);
        console.log('(Deja en blanco para mantener el valor actual)');

        const nuevoNombre = await this.preguntar(`Nuevo nombre [${proveedor.nombre}]: `);
        if (nuevoNombre.trim()) proveedor.nombre = nuevoNombre.trim();

        const nuevoContacto = await this.preguntar(`Nuevo contacto [${proveedor.contacto}]: `);
        if (nuevoContacto.trim()) proveedor.contacto = nuevoContacto.trim();

        const nuevoTelefono = await this.preguntar(`Nuevo teléfono [${proveedor.telefono}]: `);
        if (nuevoTelefono.trim()) proveedor.telefono = nuevoTelefono.trim();

        const nuevoEmail = await this.preguntar(`Nuevo email [${proveedor.email}]: `);
        if (nuevoEmail.trim()) proveedor.email = nuevoEmail.trim();

        const nuevaDireccion = await this.preguntar(`Nueva dirección [${proveedor.direccion}]: `);
        if (nuevaDireccion.trim()) proveedor.direccion = nuevaDireccion.trim();

        this.guardarDatos();
        console.log('✅ Proveedor actualizado correctamente');
    }

    async eliminarProveedor(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🗑️ ELIMINAR PROVEEDOR');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('proveedores', 'eliminar')) {
            console.log('⛔ No tienes permiso para eliminar proveedores');
            return;
        }

        const provId = await this.preguntar('ID del proveedor a eliminar: ');
        const index = this.proveedores.findIndex(p => p.id === provId);

        if (index === -1) {
            console.log('❌ Proveedor no encontrado');
            return;
        }

        const proveedor = this.proveedores[index];
        console.log(`\nProveedor: ${proveedor.nombre}`);
        console.log(`Contacto: ${proveedor.contacto}`);
        console.log(`Productos que provee: ${proveedor.productos?.length || 0}`);

        // Verificar productos asociados
        const productosAsociados = this.productos.filter(p => p.proveedor === proveedor.nombre);
        if (productosAsociados.length > 0) {
            console.log(`\n⚠️  Este proveedor tiene ${productosAsociados.length} productos asociados:`);
            for (const p of productosAsociados.slice(0, 5)) {
                console.log(`   • ${p.codigo} - ${p.nombre}`);
            }
        }

        const confirmacion = await this.preguntar('\n¿Estás seguro de eliminar? (s/n): ');
        if (confirmacion.toLowerCase() === 's') {
            this.proveedores.splice(index, 1);
            this.guardarDatos();
            console.log('✅ Proveedor eliminado correctamente');
        } else {
            console.log('Operación cancelada');
        }
    }

    //  CRUD DE CATEGORÍAS 

    async crearCategoria(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('➕ CREAR NUEVA CATEGORÍA');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('categorias', 'crear')) {
            console.log('⛔ No tienes permiso para crear categorías');
            return;
        }

        const nombre = await this.preguntar('Nombre de la categoría: ');
        if (!nombre.trim()) {
            console.log('❌ El nombre no puede estar vacío');
            return;
        }

        const descripcion = await this.preguntar('Descripción: ');

        const categoriaId = `CAT${(this.categorias.length + 1).toString().padStart(4, '0')}`;

        const categoria: Categoria = {
            id: categoriaId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || 'Sin descripción',
            fecha_creacion: ahora().toISOString(),
            total_productos: 0,
            activo: true
        };

        this.categorias.push(categoria);
        this.guardarDatos();

        console.log(`\n✅ Categoría creada exitosamente`);
        console.log(`ID: ${categoriaId}`);
        console.log(`Nombre: ${nombre}`);
    }

    private verCategorias(): void {
        console.log('\n' + '='.repeat(70));
        console.log('📑 LISTA DE CATEGORÍAS');
        console.log('='.repeat(70));

        if (this.categorias.length === 0) {
            console.log('📭 No hay categorías registradas');
            return;
        }

        // Actualizar conteo de productos
        for (const cat of this.categorias) {
            cat.total_productos = this.productos.filter(p => p.categoria === cat.nombre).length;
        }

        console.log(`${'ID'.padEnd(8)} ${'Nombre'.padEnd(25)} ${'Productos'.padEnd(10)} ${'Descripción'.padEnd(25)}`);
        console.log('-'.repeat(70));

        for (const cat of this.categorias.sort((a, b) => a.nombre.localeCompare(b.nombre))) {
            console.log(
                `${cat.id.padEnd(8)} ${cat.nombre.slice(0, 24).padEnd(25)} ` +
                `${(cat.total_productos || 0).toString().padEnd(10)} ${cat.descripcion.slice(0, 24).padEnd(25)}`
            );
        }

        console.log('='.repeat(70));
        console.log(`📊 Total de categorías: ${this.categorias.length}`);
    }

    async editarCategoria(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('✏️ EDITAR CATEGORÍA');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('categorias', 'actualizar')) {
            console.log('⛔ No tienes permiso para editar categorías');
            return;
        }

        const catId = await this.preguntar('ID de la categoría a editar: ');
        const categoria = this.categorias.find(c => c.id === catId);

        if (!categoria) {
            console.log('❌ Categoría no encontrada');
            return;
        }

        console.log(`\nEditando: ${categoria.nombre}`);
        console.log('(Deja en blanco para mantener el valor actual)');

        const nuevoNombre = await this.preguntar(`Nuevo nombre [${categoria.nombre}]: `);
        if (nuevoNombre.trim() && nuevoNombre !== categoria.nombre) {
            // Actualizar categoría en productos existentes
            for (const producto of this.productos) {
                if (producto.categoria === categoria.nombre) {
                    producto.categoria = nuevoNombre.trim();
                }
            }
            categoria.nombre = nuevoNombre.trim();
        }

        const nuevaDesc = await this.preguntar(`Nueva descripción [${categoria.descripcion}]: `);
        if (nuevaDesc.trim()) {
            categoria.descripcion = nuevaDesc.trim();
        }

        this.guardarDatos();
        console.log('✅ Categoría actualizada correctamente');
    }

    async eliminarCategoria(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🗑️ ELIMINAR CATEGORÍA');
        console.log('='.repeat(60));

        if (!this.verificarPermiso('categorias', 'eliminar')) {
            console.log('⛔ No tienes permiso para eliminar categorías');
            return;
        }

        const catId = await this.preguntar('ID de la categoría a eliminar: ');
        const index = this.categorias.findIndex(c => c.id === catId);

        if (index === -1) {
            console.log('❌ Categoría no encontrada');
            return;
        }

        const categoria = this.categorias[index];
        console.log(`\nCategoría: ${categoria.nombre}`);
        console.log(`Descripción: ${categoria.descripcion}`);

        // Verificar productos en esta categoría
        const productosEnCat = this.productos.filter(p => p.categoria === categoria.nombre);
        if (productosEnCat.length > 0) {
            console.log(`\n⚠️  Hay ${productosEnCat.length} productos en esta categoría:`);
            for (const p of productosEnCat.slice(0, 5)) {
                console.log(`   • ${p.codigo} - ${p.nombre}`);
            }

            console.log('\n¿Qué deseas hacer?');
            console.log('1. Reasignar productos a "General"');
            console.log('2. Cancelar eliminación');

            const opcion = await this.preguntar('Selecciona una opción: ');
            if (opcion === '1') {
                for (const p of productosEnCat) {
                    p.categoria = 'General';
                }
                console.log('✅ Productos reasignados a "General"');
            } else {
                console.log('Operación cancelada');
                return;
            }
        }

        const confirmacion = await this.preguntar('\n¿Estás seguro de eliminar la categoría? (s/n): ');
        if (confirmacion.toLowerCase() === 's') {
            this.categorias.splice(index, 1);
            this.guardarDatos();
            console.log('✅ Categoría eliminada correctamente');
        } else {
            console.log('Operación cancelada');
        }
    }

    //CRUD DE USUARIOS 

    private crearPermisosPorDefecto(rol: Rol): PermisosUsuario {
        if (rol === 'admin') {
            return {
                inventario: { crear: true, leer: true, actualizar: true, eliminar: true },
                ventas: { crear: true, leer: true, actualizar: true, eliminar: true },
                clientes: { crear: true, leer: true, actualizar: true, eliminar: true },
                proveedores: { crear: true, leer: true, actualizar: true, eliminar: true },
                categorias: { crear: true, leer: true, actualizar: true, eliminar: true },
                usuarios: { crear: true, leer: true, actualizar: true, eliminar: true },
                reportes: true,
                configuracion: true
            };
        } else if (rol === 'vendedor') {
            return {
                inventario: { crear: false, leer: true, actualizar: false, eliminar: false },
                ventas: { crear: true, leer: true, actualizar: true, eliminar: false },
                clientes: { crear: true, leer: true, actualizar: true, eliminar: false },
                proveedores: { crear: false, leer: true, actualizar: false, eliminar: false },
                categorias: { crear: false, leer: true, actualizar: false, eliminar: false },
                usuarios: { crear: false, leer: false, actualizar: false, eliminar: false },
                reportes: false,
                configuracion: false
            };
        } else { // invitado
            return {
                inventario: { crear: false, leer: true, actualizar: false, eliminar: false },
                ventas: { crear: false, leer: true, actualizar: false, eliminar: false },
                clientes: { crear: false, leer: true, actualizar: false, eliminar: false },
                proveedores: { crear: false, leer: true, actualizar: false, eliminar: false },
                categorias: { crear: false, leer: true, actualizar: false, eliminar: false },
                usuarios: { crear: false, leer: false, actualizar: false, eliminar: false },
                reportes: false,
                configuracion: false
            };
        }
    }

    async crearUsuario(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('➕ CREAR NUEVO USUARIO');
        console.log('='.repeat(50));

        if (this.usuarioActual?.rol !== 'admin') {
            console.log('⛔ Solo administradores pueden crear usuarios');
            return;
        }

        const usuario = await this.preguntar('Nombre de usuario: ');
        if (!usuario.trim()) {
            console.log('❌ El nombre de usuario no puede estar vacío');
            return;
        }

        if (this.usuarios.some(u => u.usuario === usuario)) {
            console.log('❌ El nombre de usuario ya existe');
            return;
        }

        const nombre = await this.preguntar('Nombre completo: ');
        if (!nombre.trim()) {
            console.log('❌ El nombre no puede estar vacío');
            return;
        }

        const contrasena = await this.preguntarContrasena('Contraseña: ');
        const confirmar = await this.preguntarContrasena('Confirmar contraseña: ');

        if (contrasena !== confirmar) {
            console.log('❌ Las contraseñas no coinciden');
            return;
        }

        if (contrasena.length < 4) {
            console.log('❌ La contraseña debe tener al menos 4 caracteres');
            return;
        }

        console.log('\nRoles disponibles:');
        console.log('1. admin - Acceso completo');
        console.log('2. vendedor - Solo ventas e inventario');
        console.log('3. invitado - Solo consultas');

        const rolOp = (await this.preguntar('Selecciona rol (1-3) [2]: ')) || '2';
        let rol: Rol = 'vendedor';
        if (rolOp === '1') rol = 'admin';
        else if (rolOp === '3') rol = 'invitado';

        const nuevoUsuario: Usuario = {
            usuario: usuario.trim(),
            contrasena,
            nombre: nombre.trim(),
            rol,
            permisos: this.crearPermisosPorDefecto(rol),
            fecha_registro: ahora().toISOString()
        };

        this.usuarios.push(nuevoUsuario);
        this.guardarDatos();

        console.log('\n✅ Usuario creado exitosamente');
        console.log(`Usuario: ${usuario}`);
        console.log(`Nombre: ${nombre}`);
        console.log(`Rol: ${rol}`);
    }

    private verUsuarios(): void {
        console.log('\n' + '='.repeat(70));
        console.log('👤 LISTA DE USUARIOS');
        console.log('='.repeat(70));

        console.log(`${'Usuario'.padEnd(15)} ${'Nombre'.padEnd(25)} ${'Rol'.padEnd(12)} ${'Último acceso'.padEnd(20)}`);
        console.log('-'.repeat(70));

        for (const usuario of this.usuarios) {
            let ultimo = usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleDateString() : 'Nunca';
            console.log(
                `${usuario.usuario.padEnd(15)} ${usuario.nombre.slice(0, 24).padEnd(25)} ` +
                `${usuario.rol.padEnd(12)} ${ultimo.padEnd(20)}`
            );
        }

        console.log('='.repeat(70));
        console.log(`📊 Total de usuarios: ${this.usuarios.length}`);
    }

    async editarUsuario(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('✏️ EDITAR USUARIO');
        console.log('='.repeat(50));

        if (this.usuarioActual?.rol !== 'admin') {
            console.log('⛔ Solo administradores pueden editar usuarios');
            return;
        }

        const usuarioEditar = await this.preguntar('Nombre de usuario a editar: ');
        const usuario = this.usuarios.find(u => u.usuario === usuarioEditar);

        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        console.log(`\nEditando a: ${usuario.nombre}`);
        console.log('(Deja en blanco para mantener el valor actual)');

        const nuevoNombre = await this.preguntar(`Nuevo nombre [${usuario.nombre}]: `);
        if (nuevoNombre.trim()) usuario.nombre = nuevoNombre.trim();

        console.log('\nRoles disponibles:');
        console.log('1. admin - Acceso completo');
        console.log('2. vendedor - Solo ventas e inventario');
        console.log('3. invitado - Solo consultas');

        const rolOp = await this.preguntar(`Selecciona nuevo rol (1-3) [${usuario.rol}]: `);
        if (rolOp.trim()) {
            let nuevoRol: Rol | undefined;
            if (rolOp === '1') nuevoRol = 'admin';
            else if (rolOp === '2') nuevoRol = 'vendedor';
            else if (rolOp === '3') nuevoRol = 'invitado';
            
            if (nuevoRol && nuevoRol !== usuario.rol) {
                usuario.rol = nuevoRol;
                usuario.permisos = this.crearPermisosPorDefecto(nuevoRol);
            }
        }

        const cambiarPass = await this.preguntar('\n¿Cambiar contraseña? (s/n): ');
        if (cambiarPass.toLowerCase() === 's') {
            const nueva = await this.preguntarContrasena('Nueva contraseña: ');
            if (nueva.length >= 4) {
                usuario.contrasena = nueva;
                console.log('✅ Contraseña actualizada');
            } else {
                console.log('❌ La contraseña debe tener al menos 4 caracteres');
            }
        }

        this.guardarDatos();
        console.log('✅ Usuario actualizado correctamente');
    }

    async eliminarUsuario(): Promise<void> {
        console.log('\n' + '='.repeat(50));
        console.log('🗑️ ELIMINAR USUARIO');
        console.log('='.repeat(50));

        if (this.usuarioActual?.rol !== 'admin') {
            console.log('⛔ Solo administradores pueden eliminar usuarios');
            return;
        }

        if (this.usuarios.length <= 1) {
            console.log('❌ No puedes eliminar el último usuario');
            return;
        }

        const usuarioEliminar = await this.preguntar('Nombre de usuario a eliminar: ');

        if (usuarioEliminar === this.usuarioActual.usuario) {
            console.log('❌ No puedes eliminarte a ti mismo');
            return;
        }

        const index = this.usuarios.findIndex(u => u.usuario === usuarioEliminar);

        if (index === -1) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        const usuario = this.usuarios[index];
        console.log(`\nUsuario encontrado: ${usuario.nombre} (${usuario.rol})`);
        console.log(`Registrado: ${new Date(usuario.fecha_registro).toLocaleDateString()}`);

        const confirmacion = await this.preguntar('¿Estás seguro de eliminar? (s/n): ');
        if (confirmacion.toLowerCase() === 's') {
            this.usuarios.splice(index, 1);
            this.guardarDatos();
            console.log('✅ Usuario eliminado correctamente');
        } else {
            console.log('Operación cancelada');
        }
    }

    async gestionPermisosUsuario(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('🔐 GESTIÓN DE PERMISOS DE USUARIO');
        console.log('='.repeat(60));

        if (this.usuarioActual?.rol !== 'admin') {
            console.log('⛔ Solo administradores pueden gestionar permisos');
            return;
        }

        const usuario = await this.preguntar('Nombre de usuario: ');
        const user = this.usuarios.find(u => u.usuario === usuario);

        if (!user) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        console.log(`\n👤 Usuario: ${user.nombre} (${user.usuario})`);
        console.log(`Rol actual: ${user.rol}`);

        if (!user.permisos) {
            user.permisos = this.crearPermisosPorDefecto(user.rol);
        }

        console.log('\n📋 PERMISOS DETALLADOS:');
        console.log('-'.repeat(60));

        const modulos: Array<{key: keyof PermisosUsuario, nombre: string}> = [
            { key: 'inventario', nombre: '📦 Inventario' },
            { key: 'ventas', nombre: '💰 Ventas' },
            { key: 'clientes', nombre: '👥 Clientes' },
            { key: 'proveedores', nombre: '🏭 Proveedores' },
            { key: 'categorias', nombre: '📑 Categorías' },
            { key: 'usuarios', nombre: '👤 Usuarios' },
            { key: 'reportes', nombre: '📊 Reportes' },
            { key: 'configuracion', nombre: '⚙️ Configuración' }
        ];

        let cambios = false;

        for (const { key, nombre } of modulos) {
            console.log(`\n${nombre}:`);
            
            const permiso = user.permisos[key];
            
            if (typeof permiso === 'object') {
                // Permisos CRUD
                const acciones: Array<keyof PermisosCRUD> = ['crear', 'leer', 'actualizar', 'eliminar'];
                for (const accion of acciones) {
                    const actual = permiso[accion];
                    const nuevo = await this.preguntar(`  ${accion.charAt(0).toUpperCase() + accion.slice(1)} (s/n) [${actual ? 's' : 'n'}]: `);
                    if (nuevo.toLowerCase() === 's' || nuevo.toLowerCase() === 'n') {
                        const nuevoValor = nuevo.toLowerCase() === 's';
                        if (nuevoValor !== actual) {
                            permiso[accion] = nuevoValor;
                            cambios = true;
                        }
                    }
                }
            } else {
                // Permisos booleanos
                const actual = permiso as boolean;
                const nuevo = await this.preguntar(`  Acceso (s/n) [${actual ? 's' : 'n'}]: `);
                if (nuevo.toLowerCase() === 's' || nuevo.toLowerCase() === 'n') {
                    const nuevoValor = nuevo.toLowerCase() === 's';
                    if (nuevoValor !== actual) {
                        (user.permisos[key] as boolean) = nuevoValor;
                        cambios = true;
                    }
                }
            }
        }

        if (cambios) {
            this.guardarDatos();
            console.log('\n✅ Permisos actualizados correctamente');
        } else {
            console.log('\nℹ️ No se realizaron cambios');
        }
    }

    // REPORTES 

    private generarReporteInventario(): void {
        console.log('\n📊 Generando reporte de inventario...');
        console.log('❌ Funcionalidad PDF no disponible en esta versión de TypeScript');
        console.log('   Se recomienda usar bibliotecas como pdfkit o puppeteer');
        
        // Mostrar resumen en consola
        this.verInventario();
    }

    private generarReporteVentas(): void {
        console.log('\n📊 Generando reporte de ventas...');
        console.log('❌ Funcionalidad PDF no disponible en esta versión de TypeScript');
        
        // Mostrar resumen en consola
        this.verHistorialVentas();
    }

    private generarReporteClientes(): void {
        console.log('\n📊 Generando reporte de clientes...');
        console.log('❌ Funcionalidad PDF no disponible en esta versión de TypeScript');
        
        // Mostrar resumen en consola
        this.verClientes();
        
        if (this.clientes.length > 0) {
            const totalCompras = this.clientes.reduce((sum, c) => sum + (c.compras_totales || 0), 0);
            const totalMonto = this.clientes.reduce((sum, c) => sum + (c.monto_total || 0), 0);
            
            console.log('\n📊 ESTADÍSTICAS DE CLIENTES:');
            console.log(`   Total clientes: ${this.clientes.length}`);
            console.log(`   Total compras: ${totalCompras}`);
            console.log(`   Monto total: $${totalMonto.toFixed(2)}`);
            if (this.clientes.length > 0) {
                console.log(`   Promedio por cliente: $${(totalMonto / this.clientes.length).toFixed(2)}`);
            }
        }
    }

    private generarReporteFinancieroCompleto(): void {
        console.log('\n📈 Generando reporte financiero completo...');
        console.log('❌ Funcionalidad PDF no disponible en esta versión de TypeScript');
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 REPORTE FINANCIERO COMPLETO');
        console.log('='.repeat(60));

        // ANÁLISIS DE INVENTARIO
        console.log('\n1. ANÁLISIS DE INVENTARIO');
        console.log('-'.repeat(40));

        if (this.productos.length > 0) {
            let inversionTotal = 0;
            let ventaTotal = 0;

            for (const p of this.productos) {
                const costo = p.costo || p.precio * 0.7;
                inversionTotal += costo * p.cantidad;
                ventaTotal += p.precio * p.cantidad;
            }

            const gananciaPotencial = ventaTotal - inversionTotal;
            const margen = ventaTotal > 0 ? (gananciaPotencial / ventaTotal * 100) : 0;

            console.log(`   Inversión Total: $${inversionTotal.toFixed(2)}`);
            console.log(`   Valor de Venta Total: $${ventaTotal.toFixed(2)}`);
            console.log(`   Ganancia Potencial: $${gananciaPotencial.toFixed(2)}`);
            console.log(`   Margen de Ganancia: ${margen.toFixed(1)}%`);
            console.log(`   Productos en Stock: ${this.productos.length}`);
            console.log(`   Unidades Totales: ${this.productos.reduce((sum, p) => sum + p.cantidad, 0)}`);
        } else {
            console.log('   No hay productos en inventario');
        }

        // ANÁLISIS DE VENTAS
        console.log('\n2. ANÁLISIS DE VENTAS');
        console.log('-'.repeat(40));

        if (this.ventas.length > 0) {
            const totalVentas = this.ventas.length;
            const totalMonto = this.ventas.reduce((sum, v) => sum + v.total, 0);
            const promedio = totalMonto / totalVentas;
            const maxVenta = Math.max(...this.ventas.map(v => v.total));
            const minVenta = Math.min(...this.ventas.map(v => v.total));

            console.log(`   Total de Ventas: ${totalVentas}`);
            console.log(`   Monto Total: $${totalMonto.toFixed(2)}`);
            console.log(`   Promedio por Venta: $${promedio.toFixed(2)}`);
            console.log(`   Venta Máxima: $${maxVenta.toFixed(2)}`);
            console.log(`   Venta Mínima: $${minVenta.toFixed(2)}`);
        } else {
            console.log('   No hay ventas registradas');
        }

        //ANÁLISIS DE CLIENTES
        console.log('\n3. ANÁLISIS DE CLIENTES');
        console.log('-'.repeat(40));

        if (this.clientes.length > 0) {
            const totalCompras = this.clientes.reduce((sum, c) => sum + (c.compras_totales || 0), 0);
            const totalMontoClientes = this.clientes.reduce((sum, c) => sum + (c.monto_total || 0), 0);

            console.log(`   Total Clientes: ${this.clientes.length}`);
            console.log(`   Total Compras Realizadas: ${totalCompras}`);
            console.log(`   Monto Total Clientes: $${totalMontoClientes.toFixed(2)}`);

            if (totalCompras > 0) {
                const ticketPromedio = totalMontoClientes / totalCompras;
                console.log(`   Ticket Promedio: $${ticketPromedio.toFixed(2)}`);
            }
        } else {
            console.log('   No hay clientes registrados');
        }

        //  RESUMEN GENERAL
        console.log('\n4. RESUMEN GENERAL');
        console.log('-'.repeat(40));

        console.log(`   Productos: ${this.productos.length}`);
        console.log(`   Clientes: ${this.clientes.length}`);
        console.log(`   Ventas: ${this.ventas.length}`);
        console.log(`   Proveedores: ${this.proveedores.length}`);
        console.log(`   Categorías: ${this.categorias.length}`);
        console.log(`   Usuarios: ${this.usuarios.length}`);
    }
}

// PUNTO DE ENTRADA PRINCIPAL 

async function main() {
    try {
        const asistente = new ProyectoEli();
        if (await asistente.login()) {
            await asistente.menuPrincipal();
        } else {
            console.log('\n⛔ No se pudo iniciar sesión. Saliendo del sistema...');
            process.exit(1);
        }
    } catch (error) {
        console.log(`\n❌ Error inesperado: ${error}`);
        console.log('Por favor, contacta al soporte técnico.');
        process.exit(1);
    }
}

main();
