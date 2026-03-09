use std::collections::HashMap;
use std::fs;
use std::io::{self, Write};
use std::path::Path;
use chrono::{Local, DateTime, Datelike};
use serde::{Deserialize, Serialize};
use chrono::Timelike;

// ==================== INTERFACES ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Producto {
    codigo: String,
    nombre: String,
    precio: f64,
    costo: f64,
    cantidad: i32,
    categoria: String,
    proveedor: String,
    fecha_agregado: String,
    ultima_actualizacion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ItemVenta {
    codigo: String,
    nombre: String,
    precio: f64,
    cantidad: i32,
    subtotal: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Venta {
    folio: String,
    fecha: String,
    vendedor: String,
    items: Vec<ItemVenta>,
    total: f64,
    productos: usize,
    cliente_id: Option<String>,
    descuento: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Cliente {
    id: String,
    nombre: String,
    telefono: String,
    email: String,
    direccion: String,
    fecha_registro: String,
    compras_totales: i32,
    monto_total: f64,
    ultima_compra: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Proveedor {
    id: String,
    nombre: String,
    contacto: String,
    telefono: String,
    email: String,
    direccion: String,
    productos: Vec<String>,
    fecha_registro: String,
    calificacion: i32,
    total_compras: f64,
    activo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Categoria {
    id: String,
    nombre: String,
    descripcion: String,
    fecha_creacion: String,
    total_productos: i32,
    activo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PermisosCRUD {
    crear: bool,
    leer: bool,
    actualizar: bool,
    eliminar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PermisosUsuario {
    inventario: PermisosCRUD,
    ventas: PermisosCRUD,
    clientes: PermisosCRUD,
    proveedores: PermisosCRUD,
    categorias: PermisosCRUD,
    usuarios: PermisosCRUD,
    reportes: bool,
    configuracion: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
enum Rol {
    Admin,
    Vendedor,
    Invitado,
}

impl Rol {
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "admin" => Some(Rol::Admin),
            "vendedor" => Some(Rol::Vendedor),
            "invitado" => Some(Rol::Invitado),
            _ => None,
        }
    }

    fn to_string(&self) -> String {
        match self {
            Rol::Admin => "admin".to_string(),
            Rol::Vendedor => "vendedor".to_string(),
            Rol::Invitado => "invitado".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Usuario {
    usuario: String,
    contrasena: String,
    nombre: String,
    rol: Rol,
    permisos: PermisosUsuario,
    fecha_registro: String,
    ultimo_acceso: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DatosSistema {
    usuarios: Vec<Usuario>,
    productos: Vec<Producto>,
    clientes: Vec<Cliente>,
    ventas: Vec<Venta>,
    proveedores: Vec<Proveedor>,
    categorias: Vec<Categoria>,
}

// ==================== FUNCIÓN AHORA ====================

fn ahora() -> DateTime<Local> {
    Local::now()
}

// ==================== CLASE PRINCIPAL ====================

struct ProyectoEli {
    usuarios: Vec<Usuario>,
    productos: Vec<Producto>,
    clientes: Vec<Cliente>,
    ventas: Vec<Venta>,
    proveedores: Vec<Proveedor>,
    categorias: Vec<Categoria>,
    usuario_actual: Option<Usuario>,
}

impl ProyectoEli {
    fn new() -> Self {
        let mut proyecto = ProyectoEli {
            usuarios: Vec::new(),
            productos: Vec::new(),
            clientes: Vec::new(),
            ventas: Vec::new(),
            proveedores: Vec::new(),
            categorias: Vec::new(),
            usuario_actual: None,
        };
        
        proyecto.cargar_datos();
        
        if proyecto.usuarios.is_empty() {
            let permisos_admin = PermisosUsuario {
                inventario: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                ventas: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                clientes: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                proveedores: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                categorias: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                usuarios: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                reportes: true,
                configuracion: true,
            };
            
            proyecto.usuarios.push(Usuario {
                usuario: "admin".to_string(),
                contrasena: "admin123".to_string(),
                nombre: "Administrador".to_string(),
                rol: Rol::Admin,
                permisos: permisos_admin,
                fecha_registro: ahora().to_rfc3339(),
                ultimo_acceso: Some(ahora().to_rfc3339()),
            });
            
            proyecto.guardar_datos();
        }
        
        proyecto
    }
    
    fn guardar_datos(&self) {
        let datos = DatosSistema {
            usuarios: self.usuarios.clone(),
            productos: self.productos.clone(),
            clientes: self.clientes.clone(),
            ventas: self.ventas.clone(),
            proveedores: self.proveedores.clone(),
            categorias: self.categorias.clone(),
        };
        
        if let Ok(json) = serde_json::to_string_pretty(&datos) {
            let _ = fs::write("datos_sistema.json", json);
        }
    }
    
    fn cargar_datos(&mut self) {
        if Path::new("datos_sistema.json").exists() {
            if let Ok(data) = fs::read_to_string("datos_sistema.json") {
                if let Ok(datos) = serde_json::from_str::<DatosSistema>(&data) {
                    self.usuarios = datos.usuarios;
                    self.productos = datos.productos;
                    self.clientes = datos.clientes;
                    self.ventas = datos.ventas;
                    self.proveedores = datos.proveedores;
                    self.categorias = datos.categorias;
                }
            }
        }
    }
    
    fn preguntar(texto: &str) -> String {
        print!("{}", texto);
        io::stdout().flush().unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        input.trim().to_string()
    }
    
    fn mostrar_saludo(&self) {
        let ahora = Local::now();
        let hora = ahora.hour();
        
        let saludo = if hora < 12 { "Buenos días" } 
                    else if hora < 18 { "Buenas tardes" } 
                    else { "Buenas noches" };
        
        let _nombre_usuario = self.usuario_actual.as_ref().map(|u| u.nombre.clone()).unwrap_or_else(|| "Usuario".to_string());
        
        println!("\n{}!", saludo);
        println!("Sistema de Gestión Comercial - {}", ahora.format("%d/%m/%Y %H:%M:%S"));
        
        if let Some(usuario) = &self.usuario_actual {
            if usuario.rol == Rol::Admin {
                println!("👑 Modo Administrador");
            }
        }
        
        println!("{}", "-".repeat(60));
    }
    
    async fn login(&mut self) -> bool {
        let mut intentos = 0;
        let max_intentos = 3;
        
        while intentos < max_intentos {
            println!("\n{}", "=".repeat(60));
            println!("🔐 INICIO DE SESIÓN - PROYECTO ELI");
            println!("{}", "=".repeat(60));
            
            let usuario = Self::preguntar("Usuario: ");
            let contrasena = Self::preguntar("Contraseña: ");
            
            if let Some(user) = self.usuarios.iter_mut().find(|u| u.usuario == usuario && u.contrasena == contrasena) {
                self.usuario_actual = Some(user.clone());
                user.ultimo_acceso = Some(ahora().to_rfc3339());
                
                
                println!("\n✅ ¡Bienvenido {}!", user.nombre);
                self.guardar_datos();
                return true;
            }
            
            intentos += 1;
            println!("\n❌ Usuario o contraseña incorrectos. Intento {} de {}", intentos, max_intentos);
            
            if intentos < max_intentos {
                Self::preguntar("\nPresiona Enter para intentar nuevamente...");
            }
        }
        
        println!("\n⛔ Demasiados intentos fallidos. Sistema bloqueado.");
        false
    }
    
    async fn cambiar_contrasena(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("🔐 CAMBIAR CONTRASEÑA");
        println!("{}", "=".repeat(60));
        
        let usuario_actual = match &mut self.usuario_actual {
            Some(u) => u,
            None => {
                println!("❌ No hay usuario autenticado");
                return;
            }
        };
        
        let actual = Self::preguntar("Contraseña actual: ");
        
        if actual != usuario_actual.contrasena {
            println!("❌ Contraseña actual incorrecta");
            return;
        }
        
        let nueva = Self::preguntar("Nueva contraseña: ");
        let confirmar = Self::preguntar("Confirmar nueva contraseña: ");
        
        if nueva != confirmar {
            println!("❌ Las contraseñas no coinciden");
            return;
        }
        
        if nueva.len() < 4 {
            println!("❌ La contraseña debe tener al menos 4 caracteres");
            return;
        }
        
        usuario_actual.contrasena = nueva;
        self.guardar_datos();
        
        println!("✅ Contraseña actualizada correctamente");
    }
    
    fn verificar_permiso(&self, modulo: &str, accion: Option<&str>) -> bool {
        let usuario_actual = match &self.usuario_actual {
            Some(u) => u,
            None => return false,
        };
        
        if usuario_actual.rol == Rol::Admin {
            return true;
        }
        
        match modulo {
            "inventario" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.inventario.crear,
                        "leer" => usuario_actual.permisos.inventario.leer,
                        "actualizar" => usuario_actual.permisos.inventario.actualizar,
                        "eliminar" => usuario_actual.permisos.inventario.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "ventas" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.ventas.crear,
                        "leer" => usuario_actual.permisos.ventas.leer,
                        "actualizar" => usuario_actual.permisos.ventas.actualizar,
                        "eliminar" => usuario_actual.permisos.ventas.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "clientes" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.clientes.crear,
                        "leer" => usuario_actual.permisos.clientes.leer,
                        "actualizar" => usuario_actual.permisos.clientes.actualizar,
                        "eliminar" => usuario_actual.permisos.clientes.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "proveedores" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.proveedores.crear,
                        "leer" => usuario_actual.permisos.proveedores.leer,
                        "actualizar" => usuario_actual.permisos.proveedores.actualizar,
                        "eliminar" => usuario_actual.permisos.proveedores.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "categorias" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.categorias.crear,
                        "leer" => usuario_actual.permisos.categorias.leer,
                        "actualizar" => usuario_actual.permisos.categorias.actualizar,
                        "eliminar" => usuario_actual.permisos.categorias.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "usuarios" => {
                if let Some(accion) = accion {
                    match accion {
                        "crear" => usuario_actual.permisos.usuarios.crear,
                        "leer" => usuario_actual.permisos.usuarios.leer,
                        "actualizar" => usuario_actual.permisos.usuarios.actualizar,
                        "eliminar" => usuario_actual.permisos.usuarios.eliminar,
                        _ => false,
                    }
                } else {
                    false
                }
            },
            "reportes" => usuario_actual.permisos.reportes,
            "configuracion" => usuario_actual.permisos.configuracion,
            _ => false,
        }
    }
    
    fn verificar_stock_bajo(&self) -> bool {
        let productos_bajos: Vec<&Producto> = self.productos.iter()
            .filter(|p| p.cantidad <= 5)
            .collect();
        
        if !productos_bajos.is_empty() {
            println!("\n{}", "⚠️".repeat(20));
            println!("🔴 ALERTA: PRODUCTOS CON STOCK BAJO");
            println!("{}", "⚠️".repeat(20));
            
            for p in productos_bajos {
                println!(" • {} - {} - STOCK: {} unidades", p.codigo, p.nombre, p.cantidad);
            }
            
            println!("{}", "⚠️".repeat(20));
            true
        } else {
            false
        }
    }
    
    fn determinar_modulo(opcion: &str) -> &'static str {
        if let Ok(op) = opcion.parse::<i32>() {
            if (1..=7).contains(&op) { return "inventario"; }
            if (8..=12).contains(&op) { return "ventas"; }
            if (13..=18).contains(&op) { return "clientes"; }
            if (19..=23).contains(&op) { return "proveedores"; }
            if (24..=27).contains(&op) { return "categorias"; }
            if (28..=32).contains(&op) { return "usuarios"; }
        }
        "reportes"
    }
    
    async fn menu_principal(&mut self) {
        loop {
            println!("\n{}", "=".repeat(60));
            self.mostrar_saludo();
            self.verificar_stock_bajo();
            
            println!("\n📦 INVENTARIO:");
            println!(" 1. ➕ Crear producto");
            println!(" 2. 👁️ Ver productos");
            println!(" 3. 🔍 Buscar producto (avanzado)");
            println!(" 4. ✏️ Actualizar producto");
            println!(" 5. 🗑️ Eliminar producto");
            println!(" 6. 📊 Análisis financiero");
            println!(" 7. 🔴 Ver stock bajo");
            
            println!("\n💰 VENTAS:");
            println!(" 8. ➕ Registrar venta");
            println!(" 9. 👁️ Ver ventas");
            println!(" 10. ✏️ Editar venta");
            println!(" 11. 🗑️ Cancelar venta");
            println!(" 12. 📈 Estadísticas de ventas");
            
            println!("\n👥 CLIENTES:");
            println!(" 13. ➕ Crear cliente");
            println!(" 14. 👁️ Ver clientes");
            println!(" 15. 🔍 Buscar cliente");
            println!(" 16. ✏️ Actualizar cliente");
            println!(" 17. 🗑️ Eliminar cliente");
            println!(" 18. 📊 Historial de compras");
            
            println!("\n🏭 PROVEEDORES:");
            println!(" 19. ➕ Crear proveedor");
            println!(" 20. 👁️ Ver proveedores");
            println!(" 21. 🔍 Buscar proveedor");
            println!(" 22. ✏️ Actualizar proveedor");
            println!(" 23. 🗑️ Eliminar proveedor");
            
            println!("\n📑 CATEGORÍAS:");
            println!(" 24. ➕ Crear categoría");
            println!(" 25. 👁️ Ver categorías");
            println!(" 26. ✏️ Actualizar categoría");
            println!(" 27. 🗑️ Eliminar categoría");
            
            println!("\n👤 USUARIOS (Admin):");
            println!(" 28. ➕ Crear usuario");
            println!(" 29. 👁️ Ver usuarios");
            println!(" 30. ✏️ Editar usuario");
            println!(" 31. 🗑️ Eliminar usuario");
            println!(" 32. 🔐 Gestionar permisos");
            
            println!("\n📊 REPORTES:");
            println!(" 33. 📦 Reporte inventario");
            println!(" 34. 💰 Reporte ventas");
            println!(" 35. 👥 Reporte clientes");
            println!(" 36. 📈 Reporte financiero completo");
            
            println!("\n 0. 🚪 Salir");
            println!("{}", "=".repeat(60));
            
            let opcion = Self::preguntar("\nSelecciona una opción (0-36): ");
            
            if opcion == "0" {
                println!("\n👋 ¡Hasta pronto!");
                self.guardar_datos();
                break;
            }
            
            match opcion.as_str() {
                "1" => self.agregar_producto().await,
                "2" => self.ver_inventario(),
                "3" => self.buscar_productos_avanzado().await,
                "4" => self.editar_producto().await,
                "5" => self.eliminar_producto().await,
                "6" => self.analisis_financiero(),
                "7" => self.ver_stock_bajo(),
                "8" => self.registrar_venta().await,
                "9" => self.ver_historial_ventas(),
                "10" => self.editar_venta().await,
                "11" => self.cancelar_venta().await,
                "12" => self.estadisticas_ventas(),
                "13" => self.registrar_cliente().await,
                "14" => self.ver_clientes(),
                "15" => self.buscar_cliente().await,
                "16" => self.editar_cliente().await,
                "17" => self.eliminar_cliente().await,
                "18" => self.ver_historial_compras_cliente().await,
                "19" => self.crear_proveedor().await,
                "20" => self.ver_proveedores(),
                "21" => self.buscar_proveedor().await,
                "22" => self.editar_proveedor().await,
                "23" => self.eliminar_proveedor().await,
                "24" => self.crear_categoria().await,
                "25" => self.ver_categorias(),
                "26" => self.editar_categoria().await,
                "27" => self.eliminar_categoria().await,
                "28" => self.crear_usuario().await,
                "29" => self.ver_usuarios(),
                "30" => self.editar_usuario().await,
                "31" => self.eliminar_usuario().await,
                "32" => self.gestion_permisos_usuario().await,
                "33" => self.generar_reporte_inventario(),
                "34" => self.generar_reporte_ventas(),
                "35" => self.generar_reporte_clientes(),
                "36" => self.generar_reporte_financiero_completo(),
                _ => println!("\n❌ Opción no válida"),
            }
            
            if opcion != "0" {
                Self::preguntar("\nPresiona Enter para continuar...");
            }
        }
    }
    
    // ==================== CRUD DE PRODUCTOS ====================
    
    fn ver_inventario(&self) {
        println!("\n{}", "=".repeat(120));
        println!("📦 INVENTARIO ACTUAL - ANÁLISIS FINANCIERO");
        println!("{}", "=".repeat(120));
        
        if self.productos.is_empty() {
            println!("📭 No hay productos en el inventario");
            return;
        }
        
        let mut inversion_total = 0.0;
        let mut valor_venta_total = 0.0;
        let mut total_productos = 0;
        
        println!("{:8} {:15} {:10} {:10} {:10} {:10} {:6} {:12} {:12}", 
            "Código", "Nombre", "Categoría", "Costo", "Precio", "Ganancia", "Cant.", "Inv. Total", "Valor Vta");
        println!("{}", "-".repeat(120));
        
        let mut productos_ordenados = self.productos.clone();
        productos_ordenados.sort_by(|a, b| a.nombre.cmp(&b.nombre));
        
        for producto in &productos_ordenados {
            let costo_unit = producto.costo;
            let ganancia_unit = producto.precio - costo_unit;
            let inversion_prod = costo_unit * producto.cantidad as f64;
            let valor_venta_prod = producto.precio * producto.cantidad as f64;
            let stock_bajo = if producto.cantidad <= 5 { "⚠️" } else { " " };
            
            println!(
                "{:8} {:15} {:10} ${:9.2} ${:9.2} ${:9.2} {}{:5} ${:11.2} ${:11.2}",
                producto.codigo,
                &producto.nombre[..producto.nombre.len().min(14)],
                &producto.categoria[..producto.categoria.len().min(9)],
                costo_unit,
                producto.precio,
                ganancia_unit,
                stock_bajo,
                producto.cantidad,
                inversion_prod,
                valor_venta_prod
            );
            
            inversion_total += inversion_prod;
            valor_venta_total += valor_venta_prod;
            total_productos += producto.cantidad;
        }
        
        let ganancia_potencial_total = valor_venta_total - inversion_total;
        let margen = if valor_venta_total > 0.0 { (ganancia_potencial_total / valor_venta_total) * 100.0 } else { 0.0 };
        
        println!("{}", "=".repeat(120));
        println!("📊 TOTALES GLOBALES:");
        println!(" 📦 Unidades totales: {}", total_productos);
        println!(" 💰 INVERSIÓN TOTAL: ${:.2}", inversion_total);
        println!(" 💵 VALOR DE VENTA TOTAL: ${:.2}", valor_venta_total);
        println!(" 📈 GANANCIA POTENCIAL TOTAL: ${:.2}", ganancia_potencial_total);
        println!(" 📊 MARGEN DE GANANCIA: {:.1}%", margen);
        println!("{}", "=".repeat(120));
    }
    
    async fn agregar_producto(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("➕ AGREGAR NUEVO PRODUCTO");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("inventario", Some("crear")) {
            println!("⛔ No tienes permiso para agregar productos");
            return;
        }
        
        let nombre = Self::preguntar("Nombre del producto: ");
        if nombre.trim().is_empty() {
            println!("❌ El nombre no puede estar vacío");
            return;
        }
        
        let precio: f64 = match Self::preguntar("Precio de VENTA al público: $").parse() {
            Ok(p) if p > 0.0 => p,
            _ => {
                println!("❌ Ingresa un precio válido mayor a 0");
                return;
            }
        };
        
        let costo: f64 = match Self::preguntar("💰 Precio de COMPRA (inversión): $").parse() {
            Ok(c) if c > 0.0 => c,
            _ => {
                println!("❌ Ingresa un costo válido mayor a 0");
                return;
            }
        };
        
        if costo >= precio {
            println!("⚠️ ADVERTENCIA: El costo es mayor o igual al precio de venta");
            println!(" Ganancia por unidad: ${:.2}", precio - costo);
            let confirmar = Self::preguntar("¿Continuar de todas formas? (s/n): ");
            if confirmar.to_lowercase() != "s" {
                return;
            }
        }
        
        let cantidad: i32 = match Self::preguntar("Cantidad en inventario: ").parse() {
            Ok(c) if c >= 0 => c,
            _ => {
                println!("❌ Ingresa una cantidad válida");
                return;
            }
        };
        
        let mut codigo = Self::preguntar("Código del producto (opcional): ");
        if codigo.trim().is_empty() {
            codigo = format!("PROD{:03}", self.productos.len() + 1);
        }
        
        if self.productos.iter().any(|p| p.codigo == codigo) {
            println!("❌ Ya existe un producto con el código {}", codigo);
            return;
        }
        
        let mut categoria = "General".to_string();
        
        if !self.categorias.is_empty() {
            println!("\n📑 Categorías disponibles:");
            for (i, cat) in self.categorias.iter().enumerate() {
                println!(" {}. {}", i + 1, cat.nombre);
            }
            println!(" 0. Crear nueva categoría");
            
            let opcion_cat = Self::preguntar("Selecciona una categoría (número): ");
            
            if opcion_cat == "0" {
                let nueva_cat = Self::preguntar("Nueva categoría: ");
                if !nueva_cat.trim().is_empty() {
                    self.crear_categoria_rapida(nueva_cat.trim().to_string()).await;
                    categoria = nueva_cat.trim().to_string();
                }
            } else if let Ok(idx) = opcion_cat.parse::<usize>() {
                if idx > 0 && idx <= self.categorias.len() {
                    categoria = self.categorias[idx - 1].nombre.clone();
                }
            }
        } else {
            let cat_input = Self::preguntar("Categoría (opcional): ");
            if !cat_input.trim().is_empty() {
                categoria = cat_input.trim().to_string();
            }
        }
        
        let mut proveedor = "No especificado".to_string();
        
        if !self.proveedores.is_empty() {
            println!("\n🏭 Proveedores disponibles:");
            for (i, prov) in self.proveedores.iter().enumerate() {
                println!(" {}. {}", i + 1, prov.nombre);
            }
            println!(" 0. Otro proveedor");
            
            let opcion_prov = Self::preguntar("Selecciona un proveedor (número): ");
            
            if opcion_prov == "0" {
                let prov_input = Self::preguntar("Proveedor: ");
                if !prov_input.trim().is_empty() {
                    proveedor = prov_input.trim().to_string();
                }
            } else if let Ok(idx) = opcion_prov.parse::<usize>() {
                if idx > 0 && idx <= self.proveedores.len() {
                    proveedor = self.proveedores[idx - 1].nombre.clone();
                }
            }
        } else {
            let prov_input = Self::preguntar("Proveedor (opcional): ");
            if !prov_input.trim().is_empty() {
                proveedor = prov_input.trim().to_string();
            }
        }
        
        let nuevo_producto = Producto {
            codigo: codigo.clone(),
            nombre: nombre.trim().to_string(),
            precio,
            costo,
            cantidad,
            categoria: categoria.clone(),
            proveedor: proveedor.clone(),
            fecha_agregado: ahora().to_rfc3339(),
            ultima_actualizacion: ahora().to_rfc3339(),
        };
        
        self.productos.push(nuevo_producto);
        
        if let Some(categoria_obj) = self.categorias.iter_mut().find(|c| c.nombre == categoria) {
            categoria_obj.total_productos += 1;
        }
        
        if proveedor != "No especificado" {
            if let Some(proveedor_obj) = self.proveedores.iter_mut().find(|p| p.nombre == proveedor) {
                if !proveedor_obj.productos.contains(&codigo) {
                    proveedor_obj.productos.push(codigo.clone());
                }
            }
        }
        
        self.guardar_datos();
        
        println!("\n{}", "=".repeat(50));
        println!("✅ ¡PRODUCTO AGREGADO CON ÉXITO!");
        println!("{}", "=".repeat(50));
        println!("Código: {}", codigo);
        println!("Nombre: {}", nombre);
        println!("Precio venta: ${:.2}", precio);
        println!("💰 Costo compra: ${:.2}", costo);
        println!("📈 Ganancia x unidad: ${:.2}", precio - costo);
        println!("Cantidad: {}", cantidad);
        println!("Categoría: {}", categoria);
        println!("Proveedor: {}", proveedor);
        println!("{}", "=".repeat(50));
    }
    
    async fn crear_categoria_rapida(&mut self, nombre: String) {
        let categoria_id = format!("CAT{:04}", self.categorias.len() + 1);
        let categoria = Categoria {
            id: categoria_id,
            nombre,
            descripcion: "Creada desde producto".to_string(),
            fecha_creacion: ahora().to_rfc3339(),
            total_productos: 0,
            activo: true,
        };
        
        println!("✅ Categoría '{}' creada automáticamente", categoria.nombre);
        self.categorias.push(categoria);
    }
    
    async fn buscar_productos_avanzado(&self) {
        println!("\n{}", "=".repeat(60));
        println!("🔍 BÚSQUEDA AVANZADA DE PRODUCTOS");
        println!("{}", "=".repeat(60));
        
        println!("\n1. Buscar por nombre");
        println!("2. Buscar por código");
        println!("3. Buscar por categoría");
        println!("4. Buscar por proveedor");
        println!("5. Buscar por rango de precio");
        println!("6. Buscar por stock (menor a...)");
        println!("7. Buscar por margen de ganancia");
        println!("0. Volver");
        
        let opcion = Self::preguntar("\nSelecciona tipo de búsqueda: ");
        let resultados: Vec<&Producto>;
        
        match opcion.as_str() {
            "1" => {
                let termino = Self::preguntar("Nombre a buscar: ").to_lowercase();
                resultados = self.productos.iter()
                    .filter(|p| p.nombre.to_lowercase().contains(&termino))
                    .collect();
            },
            "2" => {
                let termino = Self::preguntar("Código a buscar: ").to_lowercase();
                resultados = self.productos.iter()
                    .filter(|p| p.codigo.to_lowercase().contains(&termino))
                    .collect();
            },
            "3" => {
                let categoria = Self::preguntar("Categoría: ").to_lowercase();
                resultados = self.productos.iter()
                    .filter(|p| p.categoria.to_lowercase().contains(&categoria))
                    .collect();
            },
            "4" => {
                let proveedor = Self::preguntar("Proveedor: ").to_lowercase();
                resultados = self.productos.iter()
                    .filter(|p| p.proveedor.to_lowercase().contains(&proveedor))
                    .collect();
            },
            "5" => {
                let min_precio: f64 = match Self::preguntar("Precio mínimo: $").parse() {
                    Ok(p) => p,
                    _ => {
                        println!("❌ Precio inválido");
                        return;
                    }
                };
                
                let max_precio: f64 = match Self::preguntar("Precio máximo: $").parse() {
                    Ok(p) => p,
                    _ => {
                        println!("❌ Precio inválido");
                        return;
                    }
                };
                
                resultados = self.productos.iter()
                    .filter(|p| p.precio >= min_precio && p.precio <= max_precio)
                    .collect();
            },
            "6" => {
                let max_stock: i32 = match Self::preguntar("Stock máximo: ").parse() {
                    Ok(s) => s,
                    _ => {
                        println!("❌ Stock inválido");
                        return;
                    }
                };
                
                resultados = self.productos.iter()
                    .filter(|p| p.cantidad <= max_stock)
                    .collect();
            },
            "7" => {
                let min_margen: f64 = match Self::preguntar("Margen mínimo (%): ").parse() {
                    Ok(m) => m,
                    _ => {
                        println!("❌ Margen inválido");
                        return;
                    }
                };
                
                resultados = self.productos.iter()
                    .filter(|p| {
                        let margen = ((p.precio - p.costo) / p.precio) * 100.0;
                        margen >= min_margen
                    })
                    .collect();
            },
            "0" => return,
            _ => return,
        }
        
        if !resultados.is_empty() {
            println!("\n✅ {} productos encontrados:", resultados.len());
            println!("{}", "-".repeat(80));
            
            for p in resultados {
                let ganancia = p.precio - p.costo;
                let margen = (ganancia / p.precio) * 100.0;
                
                println!("\n 📦 {} - {}", p.codigo, p.nombre);
                println!(" Precio: ${:.2} | Costo: ${:.2}", p.precio, p.costo);
                println!(" Ganancia: ${:.2} ({:.1}%)", ganancia, margen);
                println!(" Stock: {} | Categoría: {}", p.cantidad, p.categoria);
                println!(" Proveedor: {}", p.proveedor);
            }
        } else {
            println!("❌ No se encontraron productos");
        }
    }
    
    async fn editar_producto(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("✏️ EDITAR PRODUCTO");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("inventario", Some("actualizar")) {
            println!("⛔ No tienes permiso para editar productos");
            return;
        }
        
        let codigo = Self::preguntar("Ingresa el código del producto a editar: ");
        
        let producto = match self.productos.iter_mut().find(|p| p.codigo == codigo) {
            Some(p) => p,
            None => {
                println!("❌ Producto no encontrado");
                return;
            }
        };
        
        let categoria_anterior = producto.categoria.clone();
        let proveedor_anterior = producto.proveedor.clone();
        
        println!("\nProducto actual: {}", producto.nombre);
        println!("(Deja en blanco para mantener el valor actual)");
        println!("{}", "-".repeat(30));
        
        let nuevo_nombre = Self::preguntar(&format!("Nuevo nombre [{}]: ", producto.nombre));
        if !nuevo_nombre.trim().is_empty() {
            producto.nombre = nuevo_nombre.trim().to_string();
        }
        
        let nuevo_costo = Self::preguntar(&format!("Nuevo costo de compra [${:.2}]: ", producto.costo));
        if !nuevo_costo.trim().is_empty() {
            if let Ok(costo) = nuevo_costo.parse::<f64>() {
                producto.costo = costo;
            } else {
                println!("Costo no válido, se mantiene el actual");
            }
        }
        
        let nuevo_precio = Self::preguntar(&format!("Nuevo precio de venta [${:.2}]: ", producto.precio));
        if !nuevo_precio.trim().is_empty() {
            if let Ok(precio) = nuevo_precio.parse::<f64>() {
                producto.precio = precio;
            } else {
                println!("Precio no válido, se mantiene el actual");
            }
        }
        
        let nueva_cantidad = Self::preguntar(&format!("Nueva cantidad [{}]: ", producto.cantidad));
        if !nueva_cantidad.trim().is_empty() {
            if let Ok(cantidad) = nueva_cantidad.parse::<i32>() {
                producto.cantidad = cantidad;
            } else {
                println!("Cantidad no válida, se mantiene la actual");
            }
        }
        
        let nueva_categoria = Self::preguntar(&format!("Nueva categoría [{}]: ", producto.categoria));
        if !nueva_categoria.trim().is_empty() && nueva_categoria != producto.categoria {
            if let Some(cat_anterior) = self.categorias.iter_mut().find(|c| c.nombre == categoria_anterior) {
                cat_anterior.total_productos = (cat_anterior.total_productos - 1).max(0);
            }
            
            if let Some(cat_nueva) = self.categorias.iter_mut().find(|c| c.nombre == nueva_categoria.trim()) {
                cat_nueva.total_productos += 1;
            }
            
            producto.categoria = nueva_categoria.trim().to_string();
        }
        
        let nuevo_proveedor = Self::preguntar(&format!("Nuevo proveedor [{}]: ", producto.proveedor));
        if !nuevo_proveedor.trim().is_empty() && nuevo_proveedor != producto.proveedor {
            if let Some(prov_anterior) = self.proveedores.iter_mut().find(|p| p.nombre == proveedor_anterior) {
                prov_anterior.productos.retain(|x| x != &codigo);
            }
            
            if nuevo_proveedor.trim() != "No especificado" {
                if let Some(prov_nuevo) = self.proveedores.iter_mut().find(|p| p.nombre == nuevo_proveedor.trim()) {
                    if !prov_nuevo.productos.contains(&codigo) {
                        prov_nuevo.productos.push(codigo.clone());
                    }
                }
            }
            
            producto.proveedor = nuevo_proveedor.trim().to_string();
        }
        
        producto.ultima_actualizacion = ahora().to_rfc3339();
        self.guardar_datos();
        
        println!("\n✅ Producto actualizado correctamente");
    }
    
    async fn eliminar_producto(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("🗑️ ELIMINAR PRODUCTO");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("inventario", Some("eliminar")) {
            println!("⛔ No tienes permiso para eliminar productos");
            return;
        }
        
        let codigo = Self::preguntar("Ingresa el código del producto a eliminar: ");
        
        let index = match self.productos.iter().position(|p| p.codigo == codigo) {
            Some(i) => i,
            None => {
                println!("❌ Producto no encontrado");
                return;
            }
        };
        
        let producto = &self.productos[index];
        
        println!("\nProducto encontrado: {}", producto.nombre);
        println!("Código: {}", producto.codigo);
        println!("Precio: ${:.2}", producto.precio);
        println!("Costo: ${:.2}", producto.costo);
        println!("Cantidad: {}", producto.cantidad);
        println!("Categoría: {}", producto.categoria);
        println!("Proveedor: {}", producto.proveedor);
        
        let ventas_asociadas = self.ventas.iter()
            .filter(|v| v.items.iter().any(|item| item.codigo == codigo))
            .count();
        
        if ventas_asociadas > 0 {
            println!("\n⚠️ Este producto aparece en {} venta(s)", ventas_asociadas);
            println!(" Eliminarlo afectará el historial de ventas");
        }
        
        let confirmacion = Self::preguntar("\n¿Estás seguro de eliminar? (s/n): ");
        
        if confirmacion.to_lowercase() == "s" {
            let producto = self.productos.remove(index);
            
            if let Some(categoria) = self.categorias.iter_mut().find(|c| c.nombre == producto.categoria) {
                categoria.total_productos = (categoria.total_productos - 1).max(0);
            }
            
            if let Some(proveedor) = self.proveedores.iter_mut().find(|p| p.nombre == producto.proveedor) {
                proveedor.productos.retain(|x| x != &producto.codigo);
            }
            
            self.guardar_datos();
            println!("✅ Producto eliminado correctamente");
        } else {
            println!("Operación cancelada");
        }
    }
    
    fn analisis_financiero(&self) {
        println!("\n{}", "=".repeat(70));
        println!("📊 ANÁLISIS FINANCIERO DEL INVENTARIO");
        println!("{}", "=".repeat(70));
        
        if self.productos.is_empty() {
            println!("📭 No hay productos en el inventario");
            return;
        }
        
        let mut inversion_total = 0.0;
        let mut venta_total = 0.0;
        
        println!("\n{:25} {:15} {:15} {:15} {:10}", 
            "Producto", "Inversión", "Venta", "Ganancia", "Margen");
        println!("{}", "-".repeat(80));
        
        for producto in &self.productos {
            let inversion = producto.costo * producto.cantidad as f64;
            let venta = producto.precio * producto.cantidad as f64;
            let ganancia = venta - inversion;
            let margen = if venta > 0.0 { (ganancia / venta) * 100.0 } else { 0.0 };
            
            println!(
                "{:25} ${:14.2} ${:14.2} ${:14.2} {:9.1}%",
                &producto.nombre[..producto.nombre.len().min(24)],
                inversion,
                venta,
                ganancia,
                margen
            );
            
            inversion_total += inversion;
            venta_total += venta;
        }
        
        let ganancia_total = venta_total - inversion_total;
        let margen_total = if venta_total > 0.0 { (ganancia_total / venta_total) * 100.0 } else { 0.0 };
        
        println!("{}", "=".repeat(80));
        println!(
            "{:25} ${:14.2} ${:14.2} ${:14.2} {:9.1}%",
            "TOTAL:",
            inversion_total,
            venta_total,
            ganancia_total,
            margen_total
        );
    }
    
    fn ver_stock_bajo(&self) {
        println!("\n{}", "=".repeat(70));
        println!("🔴 PRODUCTOS CON STOCK BAJO (≤ 5 UNIDADES)");
        println!("{}", "=".repeat(70));
        
        let productos_bajos: Vec<&Producto> = self.productos.iter()
            .filter(|p| p.cantidad <= 5)
            .collect();
        
        if productos_bajos.is_empty() {
            println!("✅ No hay productos con stock bajo. ¡Todo en orden!");
            return;
        }
        
        println!("{:8} {:25} {:10} {:12} {:12} {:12}", 
            "Código", "Nombre", "Cantidad", "Precio", "Costo", "Ganancia");
        println!("{}", "-".repeat(80));
        
        for p in &productos_bajos {
            let ganancia = p.precio - p.costo;
            
            println!(
                "{:8} {:25} {:10} ${:11.2} ${:11.2} ${:11.2}",
                p.codigo,
                &p.nombre[..p.nombre.len().min(24)],
                p.cantidad,
                p.precio,
                p.costo,
                ganancia
            );
        }
        
        println!("{}", "=".repeat(80));
        println!("🔴 Total productos con stock bajo: {}", productos_bajos.len());
        println!("\n📦 SUGERENCIA: Considera realizar un pedido para estos productos.");
        
        let valor_reorden: f64 = productos_bajos.iter()
            .map(|p| p.cantidad as f64 * p.costo)
            .sum();
        
        println!("💰 Inversión necesaria para reorden: ${:.2}", valor_reorden);
    }
    
    // ==================== CRUD DE VENTAS ====================
    
    async fn registrar_venta(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("💰 REGISTRAR NUEVA VENTA");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("ventas", Some("crear")) {
            println!("⛔ No tienes permiso para registrar ventas");
            return;
        }
        
        if self.productos.is_empty() {
            println!("❌ No hay productos en el inventario");
            return;
        }
        
        println!("\nProductos disponibles:");
        for p in &self.productos {
            println!(" {} - {} - ${:.2} - Stock: {}", p.codigo, p.nombre, p.precio, p.cantidad);
        }
        
        let mut cliente_id = None;
        
        if !self.clientes.is_empty() {
            println!("\n👥 Clientes registrados:");
            for i in 0..self.clientes.len().min(5) {
                let c = &self.clientes[i];
                println!(" {}. {} (ID: {})", i + 1, c.nombre, c.id);
            }
            println!(" 0. Venta sin cliente registrado");
            
            let opcion_cliente = Self::preguntar("Selecciona un cliente (número) [0]: ");
            
            if opcion_cliente != "0" {
                if let Ok(idx) = opcion_cliente.parse::<usize>() {
                    if idx > 0 && idx <= self.clientes.len() {
                        cliente_id = Some(self.clientes[idx - 1].id.clone());
                    }
                }
            }
        }
        
        let mut items_venta = Vec::new();
        let mut total = 0.0;
        
        loop {
            println!("\n{}", "-".repeat(30));
            let codigo = Self::preguntar("Código del producto (o 'fin' para terminar): ");
            
            if codigo.to_lowercase() == "fin" {
                break;
            }
            
            let producto = match self.productos.iter_mut().find(|p| p.codigo == codigo) {
                Some(p) => p,
                None => {
                    println!("❌ Producto no encontrado");
                    continue;
                }
            };
            
            let cantidad: i32 = match Self::preguntar(&format!("Cantidad (máx {}): ", producto.cantidad)).parse() {
                Ok(c) if c > 0 && c <= producto.cantidad => c,
                _ => {
                    println!("❌ Cantidad no válida o insuficiente");
                    continue;
                }
            };
            
            let subtotal = producto.precio * cantidad as f64;
            
            items_venta.push(ItemVenta {
                codigo: producto.codigo.clone(),
                nombre: producto.nombre.clone(),
                precio: producto.precio,
                cantidad,
                subtotal,
            });
            
            total += subtotal;
            println!("✅ Agregado: {} x{} = ${:.2}", producto.nombre, cantidad, subtotal);
        }
        
        if items_venta.is_empty() {
            println!("❌ No se agregaron productos");
            return;
        }
        
        println!("\n{}", "=".repeat(50));
        println!("RESUMEN DE LA VENTA");
        println!("{}", "-".repeat(50));
        
        for item in &items_venta {
            println!("{} x{} - ${:.2}", item.nombre, item.cantidad, item.subtotal);
        }
        
        println!("{}", "-".repeat(50));
        println!("TOTAL: ${:.2}", total);
        
        let mut descuento = 0.0;
        let aplicar_desc = Self::preguntar("\n¿Aplicar descuento? (s/n): ").to_lowercase();
        
        if aplicar_desc == "s" {
            if let Ok(desc) = Self::preguntar("Porcentaje de descuento: %").parse::<f64>() {
                if desc >= 0.0 && desc <= 100.0 {
                    descuento = desc;
                    let total_con_desc = total * (1.0 - descuento / 100.0);
                    println!("Total con descuento: ${:.2}", total_con_desc);
                    total = total_con_desc;
                } else {
                    println!("Descuento no aplicado (debe ser 0-100)");
                }
            } else {
                println!("Descuento no aplicado");
            }
        }
        
        let confirmar = Self::preguntar("\n¿Confirmar venta? (s/n): ");
        
        if confirmar.to_lowercase() != "s" {
            println!("❌ Venta cancelada");
            return;
        }
        
        for item in &items_venta {
            if let Some(producto) = self.productos.iter_mut().find(|p| p.codigo == item.codigo) {
                producto.cantidad -= item.cantidad;
                producto.ultima_actualizacion = ahora().to_rfc3339();
            }
        }
        
        let vendedor = self.usuario_actual.as_ref().map(|u| u.nombre.clone()).unwrap_or_else(|| "Sistema".to_string());
        
        let venta = Venta {
            folio: format!("V{:04}", self.ventas.len() + 1),
            fecha: ahora().to_rfc3339(),
            vendedor,
            items: items_venta.clone(),
            total,
            productos: items_venta.len(),
            cliente_id,
            descuento: if descuento > 0.0 { Some(descuento) } else { None },
        };
        
        if let Some(cliente_id) = &venta.cliente_id {
            if let Some(cliente) = self.clientes.iter_mut().find(|c| c.id == *cliente_id) {
                cliente.compras_totales += 1;
                cliente.monto_total += venta.total;
                cliente.ultima_compra = Some(ahora().to_rfc3339());
            }
        }
        
        self.ventas.push(venta);
        self.guardar_datos();
        
        println!("\n{}", "=".repeat(50));
        println!("✅ ¡VENTA REGISTRADA CON ÉXITO!");
        println!("Folio: {}", self.ventas.last().unwrap().folio);
        println!("Total: ${:.2}", total);
        if descuento > 0.0 {
            println!("Descuento aplicado: {}%", descuento);
        }
        println!("{}", "=".repeat(50));
    }
    
    fn ver_historial_ventas(&self) {
        println!("\n{}", "=".repeat(80));
        println!("📋 HISTORIAL DE VENTAS");
        println!("{}", "=".repeat(80));
        
        if self.ventas.is_empty() {
            println!("📭 No hay ventas registradas");
            return;
        }
        
        let total_general: f64 = self.ventas.iter().map(|v| v.total).sum();
        
        for venta in self.ventas.iter().rev().take(10) {
            println!("\nFolio: {} | Fecha: {}", venta.folio, venta.fecha);
            println!("Vendedor: {}", venta.vendedor);
            
            if let Some(cliente_id) = &venta.cliente_id {
                if let Some(cliente) = self.clientes.iter().find(|c| c.id == *cliente_id) {
                    println!("Cliente: {}", cliente.nombre);
                }
            }
            
            println!("Productos: {} | Total: ${:.2}", venta.productos, venta.total);
            if let Some(descuento) = venta.descuento {
                println!("Descuento: {}%", descuento);
            }
            println!("{}", "-".repeat(50));
        }
        
        println!("\n📊 TOTAL VENTAS: {} | MONTO TOTAL: ${:.2}", self.ventas.len(), total_general);
    }
    
    async fn editar_venta(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("✏️ EDITAR VENTA");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("ventas", Some("actualizar")) {
            println!("⛔ No tienes permiso para editar ventas");
            return;
        }
        
        let folio = Self::preguntar("Ingresa el folio de la venta a editar: ");
        
        let venta_index = match self.ventas.iter().position(|v| v.folio == folio) {
            Some(i) => i,
            None => {
                println!("❌ Venta no encontrada");
                return;
            }
        };
        
        let mut venta = self.ventas[venta_index].clone();
        
        println!("\n📋 Editando venta {}", folio);
        println!("Fecha original: {}", venta.fecha);
        println!("Vendedor: {}", venta.vendedor);
        println!("Total actual: ${:.2}", venta.total);
        
        println!("\n1. Cambiar vendedor");
        println!("2. Agregar producto");
        println!("3. Quitar producto");
        println!("4. Modificar cantidad de producto");
        println!("5. Aplicar descuento");
        println!("0. Cancelar");
        
        let opcion = Self::preguntar("\nSelecciona una opción: ");
        
        match opcion.as_str() {
            "1" => {
                let nuevo_vendedor = Self::preguntar(&format!("Nuevo vendedor [{}]: ", venta.vendedor));
                if !nuevo_vendedor.trim().is_empty() {
                    venta.vendedor = nuevo_vendedor.trim().to_string();
                    println!("✅ Vendedor actualizado");
                }
            },
            "2" => self.agregar_producto_a_venta(&mut venta).await,
            "3" => self.quitar_producto_de_venta(&mut venta).await,
            "4" => self.modificar_cantidad_venta(&mut venta).await,
            "5" => {
                if let Ok(descuento) = Self::preguntar("Porcentaje de descuento: %").parse::<f64>() {
                    if descuento >= 0.0 && descuento <= 100.0 {
                        venta.descuento = Some(descuento);
                    } else {
                        println!("❌ Descuento debe estar entre 0 y 100");
                    }
                } else {
                    println!("❌ Descuento inválido");
                }
            },
            "0" => return,
            _ => return,
        }
        
        if opcion != "0" {
            let subtotal: f64 = venta.items.iter().map(|item| item.subtotal).sum();
            let descuento = venta.descuento.unwrap_or(0.0);
            venta.total = subtotal * (1.0 - descuento / 100.0);
            venta.productos = venta.items.len();
            venta.fecha = format!("{} (EDITADA)", ahora().to_rfc3339());
            
            self.ventas[venta_index] = venta;
            self.guardar_datos();
            
            println!("\n✅ Venta actualizada. Nuevo total: ${:.2}", self.ventas[venta_index].total);
        }
    }
    
    async fn agregar_producto_a_venta(&mut self, venta: &mut Venta) {
        println!("\n📦 Productos disponibles:");
        for p in &self.productos {
            println!(" {} - {} - ${:.2} - Stock: {}", p.codigo, p.nombre, p.precio, p.cantidad);
        }
        
        let codigo = Self::preguntar("\nCódigo del producto: ");
        
        let producto = match self.productos.iter_mut().find(|p| p.codigo == codigo) {
            Some(p) => p,
            None => {
                println!("❌ Producto no encontrado");
                return;
            }
        };
        
        let cantidad: i32 = match Self::preguntar(&format!("Cantidad (máx {}): ", producto.cantidad)).parse() {
            Ok(c) if c > 0 && c <= producto.cantidad => c,
            _ => {
                println!("❌ Cantidad inválida");
                return;
            }
        };
        
        if let Some(item_existente) = venta.items.iter_mut().find(|item| item.codigo == codigo) {
            item_existente.cantidad += cantidad;
            item_existente.subtotal = item_existente.precio * item_existente.cantidad as f64;
        } else {
            venta.items.push(ItemVenta {
                codigo: producto.codigo.clone(),
                nombre: producto.nombre.clone(),
                precio: producto.precio,
                cantidad,
                subtotal: producto.precio * cantidad as f64,
            });
        }
        
        producto.cantidad -= cantidad;
        println!("✅ Producto agregado: {} x{}", producto.nombre, cantidad);
    }
    
    async fn quitar_producto_de_venta(&mut self, venta: &mut Venta) {
        println!("\nProductos en la venta:");
        for (i, item) in venta.items.iter().enumerate() {
            println!("{}. {} x{} - ${:.2}", i + 1, item.nombre, item.cantidad, item.subtotal);
        }
        
        let idx: usize = match Self::preguntar("\nNúmero del producto a quitar: ").parse::<usize>() {
            Ok(i) if i > 0 && i <= venta.items.len() => i - 1,
            _ => {
                println!("❌ Número inválido");
                return;
            }
        };
        
        let item = venta.items.remove(idx);
        
        if let Some(producto) = self.productos.iter_mut().find(|p| p.codigo == item.codigo) {
            producto.cantidad += item.cantidad;
        }
        
        println!("✅ Producto quitado: {}", item.nombre);
    }
    
    async fn modificar_cantidad_venta(&mut self, venta: &mut Venta) {
        println!("\nProductos en la venta:");
        for (i, item) in venta.items.iter().enumerate() {
            println!("{}. {} - Cantidad actual: {}", i + 1, item.nombre, item.cantidad);
        }
        
        let idx: usize = match Self::preguntar("\nNúmero del producto a modificar: ").parse::<usize>() {
            Ok(i) if i > 0 && i <= venta.items.len() => i - 1,
            _ => {
                println!("❌ Número inválido");
                return;
            }
        };
        
        let item = &mut venta.items[idx];
        let nueva_cantidad: i32 = match Self::preguntar(&format!("Nueva cantidad (máx 999): ")).parse() {
            Ok(c) if c > 0 => c,
            _ => {
                println!("❌ Cantidad inválida");
                return;
            }
        };
        
        let diferencia = nueva_cantidad - item.cantidad;
        
        if let Some(producto) = self.productos.iter_mut().find(|p| p.codigo == item.codigo) {
            if diferencia > 0 && producto.cantidad < diferencia {
                println!("❌ Stock insuficiente. Disponible: {}", producto.cantidad);
                return;
            }
            producto.cantidad -= diferencia;
        }
        
        item.cantidad = nueva_cantidad;
        item.subtotal = item.precio * nueva_cantidad as f64;
        
        println!("✅ Cantidad actualizada a {}", nueva_cantidad);
    }
    
    async fn cancelar_venta(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("🗑️ CANCELAR VENTA");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("ventas", Some("eliminar")) {
            println!("⛔ No tienes permiso para cancelar ventas");
            return;
        }
        
        let folio = Self::preguntar("Ingresa el folio de la venta a cancelar: ");
        
        let venta_index = match self.ventas.iter().position(|v| v.folio == folio) {
            Some(i) => i,
            None => {
                println!("❌ Venta no encontrada");
                return;
            }
        };
        
        let venta = &self.ventas[venta_index];
        
        println!("\n📋 Venta encontrada:");
        println!("Folio: {}", venta.folio);
        println!("Fecha: {}", venta.fecha);
        println!("Vendedor: {}", venta.vendedor);
        println!("Total: ${:.2}", venta.total);
        println!("\nProductos vendidos:");
        
        for item in &venta.items {
            println!(" • {} x{} - ${:.2}", item.nombre, item.cantidad, item.subtotal);
        }
        
        println!("\n⚠️ ADVERTENCIA: Esta acción no se puede deshacer");
        
        let confirmar = Self::preguntar("¿Estás SEGURO de cancelar esta venta? (s/n): ");
        
        if confirmar.to_lowercase() != "s" {
            println!("❌ Cancelación abortada");
            return;
        }
        
        for item in &venta.items {
            if let Some(producto) = self.productos.iter_mut().find(|p| p.codigo == item.codigo) {
                producto.cantidad += item.cantidad;
                producto.ultima_actualizacion = ahora().to_rfc3339();
                println!("🔄 Inventario restaurado: {} +{}", item.nombre, item.cantidad);
            }
        }
        
        self.ventas.remove(venta_index);
        self.guardar_datos();
        
        println!("\n✅ ¡VENTA CANCELADA EXITOSAMENTE!");
        println!("📦 Inventario restaurado automáticamente");
    }
    
    fn estadisticas_ventas(&self) {
        println!("\n{}", "=".repeat(50));
        println!("📈 ESTADÍSTICAS DE VENTAS");
        println!("{}", "=".repeat(50));
        
        if self.ventas.is_empty() {
            println!("📭 No hay datos de ventas");
            return;
        }
        
        let total_ventas = self.ventas.len();
        let total_monto: f64 = self.ventas.iter().map(|v| v.total).sum();
        let promedio = total_monto / total_ventas as f64;
        
        let max_venta = self.ventas.iter().max_by(|a, b| a.total.partial_cmp(&b.total).unwrap()).unwrap();
        let min_venta = self.ventas.iter().min_by(|a, b| a.total.partial_cmp(&b.total).unwrap()).unwrap();
        
        println!("📊 Total de ventas: {}", total_ventas);
        println!("💰 Monto total: ${:.2}", total_monto);
        println!("📈 Promedio por venta: ${:.2}", promedio);
        println!("🏆 Venta más alta: ${:.2} (Folio: {})", max_venta.total, max_venta.folio);
        println!("📉 Venta más baja: ${:.2} (Folio: {})", min_venta.total, min_venta.folio);
        
        let mut ventas_por_mes: HashMap<String, f64> = HashMap::new();
        
        for v in &self.ventas {
            if let Ok(fecha) = DateTime::parse_from_rfc3339(&v.fecha) {
                let mes = fecha.format("%B %Y").to_string();
                *ventas_por_mes.entry(mes).or_insert(0.0) += v.total;
            }
        }
        
        println!("\n📊 Ventas por mes:");
        for (mes, monto) in ventas_por_mes {
            println!(" {}: ${:.2}", mes, monto);
        }
    }
    
    // ==================== CRUD DE CLIENTES ====================
    
    async fn registrar_cliente(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("➕ REGISTRAR NUEVO CLIENTE");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("clientes", Some("crear")) {
            println!("⛔ No tienes permiso para registrar clientes");
            return;
        }
        
        let nombre = Self::preguntar("Nombre completo: ");
        if nombre.trim().is_empty() {
            println!("❌ El nombre no puede estar vacío");
            return;
        }
        
        let telefono = Self::preguntar("Teléfono: ");
        let email = Self::preguntar("Email: ");
        let direccion = Self::preguntar("Dirección: ");
        
        let cliente_id = format!("C{:04}", self.clientes.len() + 1);
        
        let cliente = Cliente {
            id: cliente_id.clone(),
            nombre: nombre.trim().to_string(),
            telefono: if telefono.trim().is_empty() { "No especificado".to_string() } else { telefono.trim().to_string() },
            email: if email.trim().is_empty() { "No especificado".to_string() } else { email.trim().to_string() },
            direccion: if direccion.trim().is_empty() { "No especificada".to_string() } else { direccion.trim().to_string() },
            fecha_registro: ahora().to_rfc3339(),
            compras_totales: 0,
            monto_total: 0.0,
            ultima_compra: None,
        };
        
        self.clientes.push(cliente);
        self.guardar_datos();
        
        println!("\n✅ Cliente registrado exitosamente");
        println!("ID: {}", cliente_id);
        println!("Nombre: {}", nombre);
    }
    
    fn ver_clientes(&self) {
        println!("\n{}", "=".repeat(70));
        println!("👥 LISTA DE CLIENTES");
        println!("{}", "=".repeat(70));
        
        if self.clientes.is_empty() {
            println!("📭 No hay clientes registrados");
            return;
        }
        
        println!("{:8} {:25} {:15} {:20}", "ID", "Nombre", "Teléfono", "Email");
        println!("{}", "-".repeat(70));
        
        let mut clientes_ordenados = self.clientes.clone();
        clientes_ordenados.sort_by(|a, b| a.nombre.cmp(&b.nombre));
        
        for cliente in &clientes_ordenados {
            println!(
                "{:8} {:25} {:15} {:20}",
                cliente.id,
                &cliente.nombre[..cliente.nombre.len().min(24)],
                &cliente.telefono[..cliente.telefono.len().min(14)],
                &cliente.email[..cliente.email.len().min(19)]
            );
        }
        
        println!("{}", "=".repeat(70));
        println!("📊 Total de clientes: {}", self.clientes.len());
    }
    
    async fn buscar_cliente(&self) {
        println!("\n{}", "=".repeat(50));
        println!("🔍 BUSCAR CLIENTE");
        println!("{}", "=".repeat(50));
        
        let termino = Self::preguntar("Ingresa nombre o ID del cliente: ").to_lowercase();
        
        let resultados: Vec<&Cliente> = self.clientes.iter()
            .filter(|c| 
                c.nombre.to_lowercase().contains(&termino) ||
                c.id.to_lowercase().contains(&termino) ||
                c.email.to_lowercase().contains(&termino)
            )
            .collect();
        
        if !resultados.is_empty() {
            println!("\n✅ {} cliente(s) encontrado(s):", resultados.len());
            
            for c in resultados {
                println!("\n ID: {}", c.id);
                println!(" Nombre: {}", c.nombre);
                println!(" Teléfono: {}", c.telefono);
                println!(" Email: {}", c.email);
                println!(" Dirección: {}", c.direccion);
                println!(" Compras: {}", c.compras_totales);
                println!(" Total gastado: ${:.2}", c.monto_total);
            }
        } else {
            println!("❌ No se encontraron clientes");
        }
    }
    
    async fn editar_cliente(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("✏️ EDITAR CLIENTE");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("clientes", Some("actualizar")) {
            println!("⛔ No tienes permiso para editar clientes");
            return;
        }
        
        let cliente_id = Self::preguntar("Ingresa el ID del cliente a editar: ");
        
        let cliente = match self.clientes.iter_mut().find(|c| c.id == cliente_id) {
            Some(c) => c,
            None => {
                println!("❌ Cliente no encontrado");
                return;
            }
        };
        
        println!("\nCliente actual: {}", cliente.nombre);
        println!("(Deja en blanco para mantener el valor actual)");
        
        let nuevo_nombre = Self::preguntar(&format!("Nuevo nombre [{}]: ", cliente.nombre));
        if !nuevo_nombre.trim().is_empty() {
            cliente.nombre = nuevo_nombre.trim().to_string();
        }
        
        let nuevo_telefono = Self::preguntar(&format!("Nuevo teléfono [{}]: ", cliente.telefono));
        if !nuevo_telefono.trim().is_empty() {
            cliente.telefono = nuevo_telefono.trim().to_string();
        }
        
        let nuevo_email = Self::preguntar(&format!("Nuevo email [{}]: ", cliente.email));
        if !nuevo_email.trim().is_empty() {
            cliente.email = nuevo_email.trim().to_string();
        }
        
        let nueva_direccion = Self::preguntar(&format!("Nueva dirección [{}]: ", cliente.direccion));
        if !nueva_direccion.trim().is_empty() {
            cliente.direccion = nueva_direccion.trim().to_string();
        }
        
        self.guardar_datos();
        println!("✅ Cliente actualizado correctamente");
    }
    
    async fn eliminar_cliente(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("🗑️ ELIMINAR CLIENTE");
        println!("{}", "=".repeat(50));
        
        if !self.verificar_permiso("clientes", Some("eliminar")) {
            println!("⛔ No tienes permiso para eliminar clientes");
            return;
        }
        
        let cliente_id = Self::preguntar("Ingresa el ID del cliente a eliminar: ");
        
        let index = match self.clientes.iter().position(|c| c.id == cliente_id) {
            Some(i) => i,
            None => {
                println!("❌ Cliente no encontrado");
                return;
            }
        };
        
        let cliente = &self.clientes[index];
        
        println!("\nCliente encontrado: {}", cliente.nombre);
        println!("Compras realizadas: {}", cliente.compras_totales);
        println!("Monto total: ${:.2}", cliente.monto_total);
        
        let ventas_cliente = self.ventas.iter()
            .filter(|v| v.cliente_id == Some(cliente_id.clone()))
            .count();
        
        if ventas_cliente > 0 {
            println!("\n⚠️ Este cliente tiene {} venta(s) asociada(s)", ventas_cliente);
            println!(" Eliminarlo afectará el historial de ventas");
        }
        
        let confirmacion = Self::preguntar("\n¿Estás seguro de eliminar? (s/n): ");
        
        if confirmacion.to_lowercase() == "s" {
            self.clientes.remove(index);
            self.guardar_datos();
            println!("✅ Cliente eliminado correctamente");
        } else {
            println!("Operación cancelada");
        }
    }
    
    async fn ver_historial_compras_cliente(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("📊 HISTORIAL DE COMPRAS DEL CLIENTE");
        println!("{}", "=".repeat(60));
        
        let cliente_id = Self::preguntar("ID del cliente: ");
        
        let cliente = match self.clientes.iter_mut().find(|c| c.id == cliente_id) {
            Some(c) => c,
            None => {
                println!("❌ Cliente no encontrado");
                return;
            }
        };
        
        let compras: Vec<&Venta> = self.ventas.iter()
            .filter(|v| v.cliente_id == Some(cliente_id.clone()))
            .collect();
        
        println!("\n👤 Cliente: {}", cliente.nombre);
        println!("📧 Email: {}", cliente.email);
        println!("📱 Teléfono: {}", cliente.telefono);
        println!("📅 Registrado: {}", cliente.fecha_registro);
        
        if !compras.is_empty() {
            println!("\n🛒 Historial de compras ({} compras):", compras.len());
            
            let mut total_gastado = 0.0;
            let mut productos_comprados = 0;
            
            for compra in &compras {
                println!("\n 📅 {} - Folio: {}", compra.fecha, compra.folio);
                println!(" Total: ${:.2}", compra.total);
                println!(" Productos: {} items", compra.productos);
                
                for item in &compra.items {
                    println!(" • {} x{} - ${:.2}", item.nombre, item.cantidad, item.subtotal);
                }
                
                total_gastado += compra.total;
                productos_comprados += compra.items.iter().map(|item| item.cantidad).sum::<i32>();
            }
            
            println!("\n💰 TOTAL GASTADO: ${:.2}", total_gastado);
            println!("📦 TOTAL PRODUCTOS: {} unidades", productos_comprados);
            println!("📊 PROMEDIO POR COMPRA: ${:.2}", total_gastado / compras.len() as f64);
            
            cliente.compras_totales = compras.len() as i32;
            cliente.monto_total = total_gastado;
            cliente.ultima_compra = Some(self.ventas.iter().filter(|v| v.cliente_id == Some(cliente_id.clone())).last().unwrap().fecha.clone());
            
            self.guardar_datos();
        } else {
            println!("\n📭 Este cliente no tiene compras registradas");
        }
    }
    
    // ==================== CRUD DE PROVEEDORES ====================
    
    async fn crear_proveedor(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("➕ CREAR NUEVO PROVEEDOR");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("proveedores", Some("crear")) {
            println!("⛔ No tienes permiso para crear proveedores");
            return;
        }
        
        let nombre = Self::preguntar("Nombre del proveedor: ");
        if nombre.trim().is_empty() {
            println!("❌ El nombre no puede estar vacío");
            return;
        }
        
        let contacto = Self::preguntar("Nombre de contacto: ");
        let contacto = if contacto.trim().is_empty() { "No especificado".to_string() } else { contacto.trim().to_string() };
        
        let telefono = Self::preguntar("Teléfono: ");
        let email = Self::preguntar("Email: ");
        let direccion = Self::preguntar("Dirección: ");
        
        let proveedor_id = format!("PROV{:04}", self.proveedores.len() + 1);
        
        let proveedor = Proveedor {
            id: proveedor_id.clone(),
            nombre: nombre.trim().to_string(),
            contacto: contacto.clone(),
            telefono: if telefono.trim().is_empty() { "No especificado".to_string() } else { telefono.trim().to_string() },
            email: if email.trim().is_empty() { "No especificado".to_string() } else { email.trim().to_string() },
            direccion: if direccion.trim().is_empty() { "No especificada".to_string() } else { direccion.trim().to_string() },
            productos: Vec::new(),
            fecha_registro: ahora().to_rfc3339(),
            calificacion: 0,
            total_compras: 0.0,
            activo: true,
        };
        
        self.proveedores.push(proveedor);
        self.guardar_datos();
        
        println!("\n✅ Proveedor creado exitosamente");
        println!("ID: {}", proveedor_id);
        println!("Nombre: {}", nombre);
        println!("Contacto: {}", contacto);
    }
    
    fn ver_proveedores(&self) {
        println!("\n{}", "=".repeat(80));
        println!("🏭 LISTA DE PROVEEDORES");
        println!("{}", "=".repeat(80));
        
        if self.proveedores.is_empty() {
            println!("📭 No hay proveedores registrados");
            return;
        }
        
        println!("{:8} {:25} {:20} {:15} {:10}", "ID", "Nombre", "Contacto", "Teléfono", "Productos");
        println!("{}", "-".repeat(80));
        
        let mut proveedores_ordenados = self.proveedores.clone();
        proveedores_ordenados.sort_by(|a, b| a.nombre.cmp(&b.nombre));
        
        for prov in &proveedores_ordenados {
            let num_productos = prov.productos.len();
            println!(
                "{:8} {:25} {:20} {:15} {:10}",
                prov.id,
                &prov.nombre[..prov.nombre.len().min(24)],
                &prov.contacto[..prov.contacto.len().min(19)],
                &prov.telefono[..prov.telefono.len().min(14)],
                num_productos
            );
        }
        
        println!("{}", "=".repeat(80));
        println!("📊 Total de proveedores: {}", self.proveedores.len());
    }
    
    async fn buscar_proveedor(&self) {
        println!("\n{}", "=".repeat(60));
        println!("🔍 BUSCAR PROVEEDOR");
        println!("{}", "=".repeat(60));
        
        println!("1. Buscar por nombre");
        println!("2. Buscar por ID");
        println!("3. Buscar por producto que provee");
        
        let opcion = Self::preguntar("\nSelecciona tipo de búsqueda: ");
        
        let resultados: Vec<&Proveedor> = match opcion.as_str() {
            "1" => {
                let termino = Self::preguntar("Nombre a buscar: ").to_lowercase();
                self.proveedores.iter()
                    .filter(|p| p.nombre.to_lowercase().contains(&termino))
                    .collect()
            },
            "2" => {
                let termino = Self::preguntar("ID a buscar: ").to_lowercase();
                self.proveedores.iter()
                    .filter(|p| p.id.to_lowercase().contains(&termino))
                    .collect()
            },
            "3" => {
                let codigo = Self::preguntar("Código de producto: ");
                self.proveedores.iter()
                    .filter(|p| p.productos.contains(&codigo))
                    .collect()
            },
            _ => Vec::new(),
        };
        
        if !resultados.is_empty() {
            println!("\n✅ {} proveedor(es) encontrado(s):", resultados.len());
            
            for p in resultados {
                println!("\n ID: {}", p.id);
                println!(" Nombre: {}", p.nombre);
                println!(" Contacto: {}", p.contacto);
                println!(" Teléfono: {}", p.telefono);
                println!(" Email: {}", p.email);
                println!(" Dirección: {}", p.direccion);
                
                if !p.productos.is_empty() {
                    println!(" Productos que provee: {}", p.productos.join(", "));
                }
            }
        } else {
            println!("❌ No se encontraron proveedores");
        }
    }
    
    async fn editar_proveedor(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("✏️ EDITAR PROVEEDOR");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("proveedores", Some("actualizar")) {
            println!("⛔ No tienes permiso para editar proveedores");
            return;
        }
        
        let prov_id = Self::preguntar("ID del proveedor a editar: ");
        
        let proveedor = match self.proveedores.iter_mut().find(|p| p.id == prov_id) {
            Some(p) => p,
            None => {
                println!("❌ Proveedor no encontrado");
                return;
            }
        };
        
        println!("\nEditando: {}", proveedor.nombre);
        println!("(Deja en blanco para mantener el valor actual)");
        
        let nuevo_nombre = Self::preguntar(&format!("Nuevo nombre [{}]: ", proveedor.nombre));
        if !nuevo_nombre.trim().is_empty() {
            proveedor.nombre = nuevo_nombre.trim().to_string();
        }
        
        let nuevo_contacto = Self::preguntar(&format!("Nuevo contacto [{}]: ", proveedor.contacto));
        if !nuevo_contacto.trim().is_empty() {
            proveedor.contacto = nuevo_contacto.trim().to_string();
        }
        
        let nuevo_telefono = Self::preguntar(&format!("Nuevo teléfono [{}]: ", proveedor.telefono));
        if !nuevo_telefono.trim().is_empty() {
            proveedor.telefono = nuevo_telefono.trim().to_string();
        }
        
        let nuevo_email = Self::preguntar(&format!("Nuevo email [{}]: ", proveedor.email));
        if !nuevo_email.trim().is_empty() {
            proveedor.email = nuevo_email.trim().to_string();
        }
        
        let nueva_direccion = Self::preguntar(&format!("Nueva dirección [{}]: ", proveedor.direccion));
        if !nueva_direccion.trim().is_empty() {
            proveedor.direccion = nueva_direccion.trim().to_string();
        }
        
        self.guardar_datos();
        println!("✅ Proveedor actualizado correctamente");
    }
    
    async fn eliminar_proveedor(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("🗑️ ELIMINAR PROVEEDOR");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("proveedores", Some("eliminar")) {
            println!("⛔ No tienes permiso para eliminar proveedores");
            return;
        }
        
        let prov_id = Self::preguntar("ID del proveedor a eliminar: ");
        
        let index = match self.proveedores.iter().position(|p| p.id == prov_id) {
            Some(i) => i,
            None => {
                println!("❌ Proveedor no encontrado");
                return;
            }
        };
        
        let proveedor = &self.proveedores[index];
        
        println!("\nProveedor: {}", proveedor.nombre);
        println!("Contacto: {}", proveedor.contacto);
        println!("Productos que provee: {}", proveedor.productos.len());
        
        let productos_asociados: Vec<&Producto> = self.productos.iter()
            .filter(|p| p.proveedor == proveedor.nombre)
            .collect();
        
        if !productos_asociados.is_empty() {
            println!("\n⚠️ Este proveedor tiene {} productos asociados:", productos_asociados.len());
            
            for p in productos_asociados.iter().take(5) {
                println!(" • {} - {}", p.codigo, p.nombre);
            }
        }
        
        let confirmacion = Self::preguntar("\n¿Estás seguro de eliminar? (s/n): ");
        
        if confirmacion.to_lowercase() == "s" {
            self.proveedores.remove(index);
            self.guardar_datos();
            println!("✅ Proveedor eliminado correctamente");
        } else {
            println!("Operación cancelada");
        }
    }
    
    // ==================== CRUD DE CATEGORÍAS ====================
    
    async fn crear_categoria(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("➕ CREAR NUEVA CATEGORÍA");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("categorias", Some("crear")) {
            println!("⛔ No tienes permiso para crear categorías");
            return;
        }
        
        let nombre = Self::preguntar("Nombre de la categoría: ");
        if nombre.trim().is_empty() {
            println!("❌ El nombre no puede estar vacío");
            return;
        }
        
        let descripcion = Self::preguntar("Descripción: ");
        
        let categoria_id = format!("CAT{:04}", self.categorias.len() + 1);
        
        let categoria = Categoria {
            id: categoria_id.clone(),
            nombre: nombre.trim().to_string(),
            descripcion: if descripcion.trim().is_empty() { "Sin descripción".to_string() } else { descripcion.trim().to_string() },
            fecha_creacion: ahora().to_rfc3339(),
            total_productos: 0,
            activo: true,
        };
        
        self.categorias.push(categoria);
        self.guardar_datos();
        
        println!("\n✅ Categoría creada exitosamente");
        println!("ID: {}", categoria_id);
        println!("Nombre: {}", nombre);
    }
    
    fn ver_categorias(&mut self) {
        println!("\n{}", "=".repeat(70));
        println!("📑 LISTA DE CATEGORÍAS");
        println!("{}", "=".repeat(70));
        
        if self.categorias.is_empty() {
            println!("📭 No hay categorías registradas");
            return;
        }
        
        for cat in &mut self.categorias {
            cat.total_productos = self.productos.iter()
                .filter(|p| p.categoria == cat.nombre)
                .count() as i32;
        }
        
        println!("{:8} {:25} {:10} {:25}", "ID", "Nombre", "Productos", "Descripción");
        println!("{}", "-".repeat(70));
        
        let mut categorias_ordenadas = self.categorias.clone();
        categorias_ordenadas.sort_by(|a, b| a.nombre.cmp(&b.nombre));
        
        for cat in &categorias_ordenadas {
            println!(
                "{:8} {:25} {:10} {:25}",
                cat.id,
                &cat.nombre[..cat.nombre.len().min(24)],
                cat.total_productos,
                &cat.descripcion[..cat.descripcion.len().min(24)]
            );
        }
        
        println!("{}", "=".repeat(70));
        println!("📊 Total de categorías: {}", self.categorias.len());
    }
    
    async fn editar_categoria(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("✏️ EDITAR CATEGORÍA");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("categorias", Some("actualizar")) {
            println!("⛔ No tienes permiso para editar categorías");
            return;
        }
        
        let cat_id = Self::preguntar("ID de la categoría a editar: ");
        
        let categoria = match self.categorias.iter_mut().find(|c| c.id == cat_id) {
            Some(c) => c,
            None => {
                println!("❌ Categoría no encontrada");
                return;
            }
        };
        
        println!("\nEditando: {}", categoria.nombre);
        println!("(Deja en blanco para mantener el valor actual)");
        
        let nuevo_nombre = Self::preguntar(&format!("Nuevo nombre [{}]: ", categoria.nombre));
        if !nuevo_nombre.trim().is_empty() && nuevo_nombre != categoria.nombre {
            for producto in &mut self.productos {
                if producto.categoria == categoria.nombre {
                    producto.categoria = nuevo_nombre.trim().to_string();
                }
            }
            categoria.nombre = nuevo_nombre.trim().to_string();
        }
        
        let nueva_desc = Self::preguntar(&format!("Nueva descripción [{}]: ", categoria.descripcion));
        if !nueva_desc.trim().is_empty() {
            categoria.descripcion = nueva_desc.trim().to_string();
        }
        
        self.guardar_datos();
        println!("✅ Categoría actualizada correctamente");
    }
    
    async fn eliminar_categoria(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("🗑️ ELIMINAR CATEGORÍA");
        println!("{}", "=".repeat(60));
        
        if !self.verificar_permiso("categorias", Some("eliminar")) {
            println!("⛔ No tienes permiso para eliminar categorías");
            return;
        }
        
        let cat_id = Self::preguntar("ID de la categoría a eliminar: ");
        
        let index = match self.categorias.iter().position(|c| c.id == cat_id) {
            Some(i) => i,
            None => {
                println!("❌ Categoría no encontrada");
                return;
            }
        };
        
        let categoria = &self.categorias[index];
        
        println!("\nCategoría: {}", categoria.nombre);
        println!("Descripción: {}", categoria.descripcion);
        
        let productos_en_cat: Vec<&mut Producto> = self.productos.iter_mut()
            .filter(|p| p.categoria == categoria.nombre)
            .collect();
        let num_productos = productos_en_cat.len();
        
        if num_productos > 0 {
            println!("\n⚠️ Hay {} productos en esta categoría:", num_productos);
            
            for p in productos_en_cat.iter().take(5) {
                println!(" • {} - {}", p.codigo, p.nombre);
            }
            
            println!("\n¿Qué deseas hacer?");
            println!("1. Reasignar productos a \"General\"");
            println!("2. Cancelar eliminación");
            
            let opcion = Self::preguntar("Selecciona una opción: ");
            
            if opcion == "1" {
                for p in self.productos.iter_mut().filter(|p| p.categoria == categoria.nombre) {
                    p.categoria = "General".to_string();
                }
                println!("✅ Productos reasignados a \"General\"");
            } else {
                println!("Operación cancelada");
                return;
            }
        }
        
        let confirmacion = Self::preguntar("\n¿Estás seguro de eliminar la categoría? (s/n): ");
        
        if confirmacion.to_lowercase() == "s" {
            self.categorias.remove(index);
            self.guardar_datos();
            println!("✅ Categoría eliminada correctamente");
        } else {
            println!("Operación cancelada");
        }
    }
    
    // ==================== CRUD DE USUARIOS ====================
    
    fn crear_permisos_por_defecto(rol: &Rol) -> PermisosUsuario {
        match rol {
            Rol::Admin => PermisosUsuario {
                inventario: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                ventas: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                clientes: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                proveedores: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                categorias: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                usuarios: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: true },
                reportes: true,
                configuracion: true,
            },
            Rol::Vendedor => PermisosUsuario {
                inventario: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                ventas: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: false },
                clientes: PermisosCRUD { crear: true, leer: true, actualizar: true, eliminar: false },
                proveedores: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                categorias: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                usuarios: PermisosCRUD { crear: false, leer: false, actualizar: false, eliminar: false },
                reportes: false,
                configuracion: false,
            },
            Rol::Invitado => PermisosUsuario {
                inventario: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                ventas: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                clientes: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                proveedores: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                categorias: PermisosCRUD { crear: false, leer: true, actualizar: false, eliminar: false },
                usuarios: PermisosCRUD { crear: false, leer: false, actualizar: false, eliminar: false },
                reportes: false,
                configuracion: false,
            },
        }
    }
    
    async fn crear_usuario(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("➕ CREAR NUEVO USUARIO");
        println!("{}", "=".repeat(50));
        
        if self.usuario_actual.as_ref().map_or(true, |u| u.rol != Rol::Admin) {
            println!("⛔ Solo administradores pueden crear usuarios");
            return;
        }
        
        let usuario = Self::preguntar("Nombre de usuario: ");
        if usuario.trim().is_empty() {
            println!("❌ El nombre de usuario no puede estar vacío");
            return;
        }
        
        if self.usuarios.iter().any(|u| u.usuario == usuario) {
            println!("❌ El nombre de usuario ya existe");
            return;
        }
        
        let nombre = Self::preguntar("Nombre completo: ");
        if nombre.trim().is_empty() {
            println!("❌ El nombre no puede estar vacío");
            return;
        }
        
        let contrasena = Self::preguntar("Contraseña: ");
        let confirmar = Self::preguntar("Confirmar contraseña: ");
        
        if contrasena != confirmar {
            println!("❌ Las contraseñas no coinciden");
            return;
        }
        
        if contrasena.len() < 4 {
            println!("❌ La contraseña debe tener al menos 4 caracteres");
            return;
        }
        
        println!("\nRoles disponibles:");
        println!("1. admin - Acceso completo");
        println!("2. vendedor - Solo ventas e inventario");
        println!("3. invitado - Solo consultas");
        
        let rol_op = Self::preguntar("Selecciona rol (1-3) [2]: ");
        let rol_op = if rol_op.is_empty() { "2".to_string() } else { rol_op };
        
        let rol = match rol_op.as_str() {
            "1" => Rol::Admin,
            "3" => Rol::Invitado,
            _ => Rol::Vendedor,
        };
        
        let nuevo_usuario = Usuario {
            usuario: usuario.trim().to_string(),
            contrasena,
            nombre: nombre.trim().to_string(),
            rol: rol.clone(),
            permisos: Self::crear_permisos_por_defecto(&rol),
            fecha_registro: ahora().to_rfc3339(),
            ultimo_acceso: None,
        };
        
        self.usuarios.push(nuevo_usuario);
        self.guardar_datos();
        
        println!("\n✅ Usuario creado exitosamente");
        println!("Usuario: {}", usuario);
        println!("Nombre: {}", nombre);
        println!("Rol: {}", rol.to_string());
    }
    
    fn ver_usuarios(&self) {
        println!("\n{}", "=".repeat(70));
        println!("👤 LISTA DE USUARIOS");
        println!("{}", "=".repeat(70));
        
        println!("{:15} {:25} {:12} {:20}", "Usuario", "Nombre", "Rol", "Último acceso");
        println!("{}", "-".repeat(70));
        
        for usuario in &self.usuarios {
            let ultimo = usuario.ultimo_acceso.as_ref()
                .map(|f| f.split('T').next().unwrap_or("Nunca").to_string())
                .unwrap_or_else(|| "Nunca".to_string());
            
            println!(
                "{:15} {:25} {:12} {:20}",
                usuario.usuario,
                &usuario.nombre[..usuario.nombre.len().min(24)],
                usuario.rol.to_string(),
                ultimo
            );
        }
        
        println!("{}", "=".repeat(70));
        println!("📊 Total de usuarios: {}", self.usuarios.len());
    }
    
    async fn editar_usuario(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("✏️ EDITAR USUARIO");
        println!("{}", "=".repeat(50));
        
        if self.usuario_actual.as_ref().map_or(true, |u| u.rol != Rol::Admin) {
            println!("⛔ Solo administradores pueden editar usuarios");
            return;
        }
        
        let usuario_editar = Self::preguntar("Nombre de usuario a editar: ");
        
        let usuario = match self.usuarios.iter_mut().find(|u| u.usuario == usuario_editar) {
            Some(u) => u,
            None => {
                println!("❌ Usuario no encontrado");
                return;
            }
        };
        
        println!("\nEditando a: {}", usuario.nombre);
        println!("(Deja en blanco para mantener el valor actual)");
        
        let nuevo_nombre = Self::preguntar(&format!("Nuevo nombre [{}]: ", usuario.nombre));
        if !nuevo_nombre.trim().is_empty() {
            usuario.nombre = nuevo_nombre.trim().to_string();
        }
        
        println!("\nRoles disponibles:");
        println!("1. admin - Acceso completo");
        println!("2. vendedor - Solo ventas e inventario");
        println!("3. invitado - Solo consultas");
        
        let rol_op = Self::preguntar(&format!("Selecciona nuevo rol (1-3) [{}]: ", usuario.rol.to_string()));
        
        if !rol_op.trim().is_empty() {
            let nuevo_rol = match rol_op.as_str() {
                "1" => Some(Rol::Admin),
                "2" => Some(Rol::Vendedor),
                "3" => Some(Rol::Invitado),
                _ => None,
            };
            
            if let Some(rol) = nuevo_rol {
                if rol.to_string() != usuario.rol.to_string() {
                    usuario.rol = rol.clone();
                    usuario.permisos = Self::crear_permisos_por_defecto(&rol);
                }
            }
        }
        
        let cambiar_pass = Self::preguntar("\n¿Cambiar contraseña? (s/n): ");
        
        if cambiar_pass.to_lowercase() == "s" {
            let nueva = Self::preguntar("Nueva contraseña: ");
            
            if nueva.len() >= 4 {
                usuario.contrasena = nueva;
                println!("✅ Contraseña actualizada");
            } else {
                println!("❌ La contraseña debe tener al menos 4 caracteres");
            }
        }
        
        self.guardar_datos();
        println!("✅ Usuario actualizado correctamente");
    }
    
    async fn eliminar_usuario(&mut self) {
        println!("\n{}", "=".repeat(50));
        println!("🗑️ ELIMINAR USUARIO");
        println!("{}", "=".repeat(50));
        
        if self.usuario_actual.as_ref().map_or(true, |u| u.rol != Rol::Admin) {
            println!("⛔ Solo administradores pueden eliminar usuarios");
            return;
        }
        
        if self.usuarios.len() <= 1 {
            println!("❌ No puedes eliminar el último usuario");
            return;
        }
        
        let usuario_eliminar = Self::preguntar("Nombre de usuario a eliminar: ");
        
        if self.usuario_actual.as_ref().map_or(false, |u| u.usuario == usuario_eliminar) {
            println!("❌ No puedes eliminarte a ti mismo");
            return;
        }
        
        let index = match self.usuarios.iter().position(|u| u.usuario == usuario_eliminar) {
            Some(i) => i,
            None => {
                println!("❌ Usuario no encontrado");
                return;
            }
        };
        
        let usuario = &self.usuarios[index];
        
        println!("\nUsuario encontrado: {} ({})", usuario.nombre, usuario.rol.to_string());
        println!("Registrado: {}", usuario.fecha_registro.split('T').next().unwrap_or("Desconocido"));
        
        let confirmacion = Self::preguntar("¿Estás seguro de eliminar? (s/n): ");
        
        if confirmacion.to_lowercase() == "s" {
            self.usuarios.remove(index);
            self.guardar_datos();
            println!("✅ Usuario eliminado correctamente");
        } else {
            println!("Operación cancelada");
        }
    }
    
    async fn gestion_permisos_usuario(&mut self) {
        println!("\n{}", "=".repeat(60));
        println!("🔐 GESTIÓN DE PERMISOS DE USUARIO");
        println!("{}", "=".repeat(60));
        
        if self.usuario_actual.as_ref().map_or(true, |u| u.rol != Rol::Admin) {
            println!("⛔ Solo administradores pueden gestionar permisos");
            return;
        }
        
        let usuario = Self::preguntar("Nombre de usuario: ");
        
        let user = match self.usuarios.iter_mut().find(|u| u.usuario == usuario) {
            Some(u) => u,
            None => {
                println!("❌ Usuario no encontrado");
                return;
            }
        };
        
        println!("\n👤 Usuario: {} ({})", user.nombre, user.usuario);
        println!("Rol actual: {}", user.rol.to_string());
        
        println!("\n📋 PERMISOS DETALLADOS:");
        println!("{}", "-".repeat(60));
        
        let modulos = vec![
            ("inventario", "📦 Inventario"),
            ("ventas", "💰 Ventas"),
            ("clientes", "👥 Clientes"),
            ("proveedores", "🏭 Proveedores"),
            ("categorias", "📑 Categorías"),
            ("usuarios", "👤 Usuarios"),
            ("reportes", "📊 Reportes"),
            ("configuracion", "⚙️ Configuración"),
        ];
        
        let mut cambios = false;
        
        for (modulo_key, modulo_nombre) in modulos {
            println!("\n{}:", modulo_nombre);
            
            match modulo_key {
                "inventario" => {
                    let permiso = &mut user.permisos.inventario;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "ventas" => {
                    let permiso = &mut user.permisos.ventas;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "clientes" => {
                    let permiso = &mut user.permisos.clientes;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "proveedores" => {
                    let permiso = &mut user.permisos.proveedores;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "categorias" => {
                    let permiso = &mut user.permisos.categorias;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "usuarios" => {
                    let permiso = &mut user.permisos.usuarios;
                    Self::editar_permiso_crud(permiso, &mut cambios).await;
                },
                "reportes" => {
                    let actual = user.permisos.reportes;
                    let nuevo = Self::preguntar_booleano(&format!(" Acceso (s/n) [{}]: ", if actual { "s" } else { "n" })).await;
                    if nuevo != actual {
                        user.permisos.reportes = nuevo;
                        cambios = true;
                    }
                },
                "configuracion" => {
                    let actual = user.permisos.configuracion;
                    let nuevo = Self::preguntar_booleano(&format!(" Acceso (s/n) [{}]: ", if actual { "s" } else { "n" })).await;
                    if nuevo != actual {
                        user.permisos.configuracion = nuevo;
                        cambios = true;
                    }
                },
                _ => {}
            }
        }
        
        if cambios {
            self.guardar_datos();
            println!("\n✅ Permisos actualizados correctamente");
        } else {
            println!("\nℹ️ No se realizaron cambios");
        }
    }
    
    async fn editar_permiso_crud(permiso: &mut PermisosCRUD, cambios: &mut bool) {
        let acciones = vec!["crear", "leer", "actualizar", "eliminar"];
        
        for accion in acciones {
            let actual = match accion {
                "crear" => permiso.crear,
                "leer" => permiso.leer,
                "actualizar" => permiso.actualizar,
                "eliminar" => permiso.eliminar,
                _ => false,
            };
            
            let nuevo = Self::preguntar_booleano(&format!(" {} (s/n) [{}]: ", 
                accion, 
                if actual { "s" } else { "n" }
            )).await;
            
            if nuevo != actual {
                match accion {
                    "crear" => permiso.crear = nuevo,
                    "leer" => permiso.leer = nuevo,
                    "actualizar" => permiso.actualizar = nuevo,
                    "eliminar" => permiso.eliminar = nuevo,
                    _ => {}
                }
                *cambios = true;
            }
        }
    }
    
    async fn preguntar_booleano(prompt: &str) -> bool {
        let respuesta = Self::preguntar(prompt).to_lowercase();
        respuesta == "s"
    }
    
    // ==================== REPORTES ====================
    
    fn generar_reporte_inventario(&self) {
        println!("\n📊 Generando reporte de inventario...");
        println!("❌ Funcionalidad PDF no disponible en esta versión de Rust");
        println!(" Se recomienda usar bibliotecas como printpdf o similar");
        
        self.ver_inventario();
    }
    
    fn generar_reporte_ventas(&self) {
        println!("\n📊 Generando reporte de ventas...");
        println!("❌ Funcionalidad PDF no disponible en esta versión de Rust");
        
        self.ver_historial_ventas();
    }
    
    fn generar_reporte_clientes(&self) {
        println!("\n📊 Generando reporte de clientes...");
        println!("❌ Funcionalidad PDF no disponible en esta versión de Rust");
        
        self.ver_clientes();
        
        if !self.clientes.is_empty() {
            let total_compras: i32 = self.clientes.iter().map(|c| c.compras_totales).sum();
            let total_monto: f64 = self.clientes.iter().map(|c| c.monto_total).sum();
            
            println!("\n📊 ESTADÍSTICAS DE CLIENTES:");
            println!(" Total clientes: {}", self.clientes.len());
            println!(" Total compras: {}", total_compras);
            println!(" Monto total: ${:.2}", total_monto);
            println!(" Promedio por cliente: ${:.2}", total_monto / self.clientes.len() as f64);
        }
    }
    
    fn generar_reporte_financiero_completo(&self) {
        println!("\n📈 Generando reporte financiero completo...");
        println!("❌ Funcionalidad PDF no disponible en esta versión de Rust");
        
        println!("\n{}", "=".repeat(60));
        println!("📈 REPORTE FINANCIERO COMPLETO");
        println!("{}", "=".repeat(60));
        
        // 1. ANÁLISIS DE INVENTARIO
        println!("\n1. ANÁLISIS DE INVENTARIO");
        println!("{}", "-".repeat(40));
        
        if !self.productos.is_empty() {
            let inversion_total: f64 = self.productos.iter()
                .map(|p| p.costo * p.cantidad as f64)
                .sum();
            let venta_total: f64 = self.productos.iter()
                .map(|p| p.precio * p.cantidad as f64)
                .sum();
            
            let ganancia_potencial = venta_total - inversion_total;
            let margen = if venta_total > 0.0 { (ganancia_potencial / venta_total) * 100.0 } else { 0.0 };
            let unidades_totales: i32 = self.productos.iter().map(|p| p.cantidad).sum();
            
            println!(" Inversión Total: ${:.2}", inversion_total);
            println!(" Valor de Venta Total: ${:.2}", venta_total);
            println!(" Ganancia Potencial: ${:.2}", ganancia_potencial);
            println!(" Margen de Ganancia: {:.1}%", margen);
            println!(" Productos en Stock: {}", self.productos.len());
            println!(" Unidades Totales: {}", unidades_totales);
        } else {
            println!(" No hay productos en inventario");
        }
        
        // 2. ANÁLISIS DE VENTAS
        println!("\n2. ANÁLISIS DE VENTAS");
        println!("{}", "-".repeat(40));
        
        if !self.ventas.is_empty() {
            let total_ventas = self.ventas.len();
            let total_monto: f64 = self.ventas.iter().map(|v| v.total).sum();
            let promedio = total_monto / total_ventas as f64;
            let max_venta = self.ventas.iter().map(|v| v.total).fold(0.0/0.0, |m, v| v.max(m));
            let min_venta = self.ventas.iter().map(|v| v.total).fold(0.0/0.0, |m, v| v.min(m));
            
            println!(" Total de Ventas: {}", total_ventas);
            println!(" Monto Total: ${:.2}", total_monto);
            println!(" Promedio por Venta: ${:.2}", promedio);
            println!(" Venta Máxima: ${:.2}", max_venta);
            println!(" Venta Mínima: ${:.2}", min_venta);
        } else {
            println!(" No hay ventas registradas");
        }
        
        // 3. ANÁLISIS DE CLIENTES
        println!("\n3. ANÁLISIS DE CLIENTES");
        println!("{}", "-".repeat(40));
        
        if !self.clientes.is_empty() {
            let total_compras: i32 = self.clientes.iter().map(|c| c.compras_totales).sum();
            let total_monto_clientes: f64 = self.clientes.iter().map(|c| c.monto_total).sum();
            
            println!(" Total Clientes: {}", self.clientes.len());
            println!(" Total Compras Realizadas: {}", total_compras);
            println!(" Monto Total Clientes: ${:.2}", total_monto_clientes);
            
            if total_compras > 0 {
                let ticket_promedio = total_monto_clientes / total_compras as f64;
                println!(" Ticket Promedio: ${:.2}", ticket_promedio);
            }
        } else {
            println!(" No hay clientes registrados");
        }
        
        // 4. RESUMEN GENERAL
        println!("\n4. RESUMEN GENERAL");
        println!("{}", "-".repeat(40));
        
        println!(" Productos: {}", self.productos.len());
        println!(" Clientes: {}", self.clientes.len());
        println!(" Ventas: {}", self.ventas.len());
        println!(" Proveedores: {}", self.proveedores.len());
        println!(" Categorías: {}", self.categorias.len());
        println!(" Usuarios: {}", self.usuarios.len());
    }
} // <-- ESTA ES LA LLAVE QUE FALTABA - CIERRE DEL IMPL

// ==================== FUNCIÓN PRINCIPAL ====================

#[tokio::main]
async fn main() {
    let mut asistente = ProyectoEli::new();
    
    if asistente.login().await {
        asistente.menu_principal().await;
    } else {
        println!("\n ⛔  No se pudo iniciar sesión. Saliendo del sistema...");
        std::process::exit(1);
    }
} 