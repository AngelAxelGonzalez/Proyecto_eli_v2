use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("H7PyhEsvDRsWkqyHdbJ8oJ17w6EA2tR4eG5ruJCEQac");

#[program]
pub mod proyecto_eli_solana {
    use super::*;

    // ==================== PRODUCTOS ====================
    
    pub fn crear_producto(
        ctx: Context<CrearProducto>,
        codigo: String,
        nombre: String,
        precio: u64,
        costo: u64,
        cantidad: u64,
        categoria: String,
        proveedor: String,
    ) -> Result<()> {
        let producto = &mut ctx.accounts.producto;
        let autor = &ctx.accounts.autor;
        
        producto.autor = autor.key();
        producto.codigo = codigo;
        producto.nombre = nombre;
        producto.precio = precio;
        producto.costo = costo;
        producto.cantidad = cantidad;
        producto.categoria = categoria;
        producto.proveedor = proveedor;
        producto.fecha_agregado = Clock::get()?.unix_timestamp;
        producto.ultima_actualizacion = Clock::get()?.unix_timestamp;
        
        // Registrar movimiento inicial en kardex
        let movimiento = &mut ctx.accounts.movimiento;
        movimiento.producto = producto.key();
        movimiento.tipo = TipoMovimiento::Entrada;
        movimiento.cantidad = cantidad as i64;
        movimiento.saldo_anterior = 0;
        movimiento.saldo_nuevo = cantidad;
        movimiento.costo_unitario = costo;
        movimiento.documento = "INVENTARIO_INICIAL".to_string();
        movimiento.fecha = Clock::get()?.unix_timestamp;
        movimiento.usuario = autor.key();
        movimiento.observaciones = "Inventario inicial".to_string();
        
        msg!("Producto creado: {}", producto.nombre);
        Ok(())
    }
    
    // ==================== KARDEX DE INVENTARIO ====================
    
    pub fn registrar_movimiento_inventario(
        ctx: Context<RegistrarMovimiento>,
        producto_codigo: String,
        tipo: u8,
        cantidad: i64,
        documento: String,
        observaciones: String,
    ) -> Result<()> {
        let producto = &mut ctx.accounts.producto;
        let movimiento = &mut ctx.accounts.movimiento;
        let usuario = &ctx.accounts.usuario;
        
        let tipo_mov = match tipo {
            0 => TipoMovimiento::Entrada,
            1 => TipoMovimiento::Salida,
            2 => TipoMovimiento::Ajuste,
            3 => TipoMovimiento::Devolucion,
            4 => TipoMovimiento::Transferencia,
            _ => return Err(ErrorCode::TipoMovimientoInvalido.into()),
        };
        
        // Guardar saldo anterior
        let saldo_anterior = producto.cantidad;
        
        // Actualizar inventario según tipo de movimiento
        match tipo_mov {
            TipoMovimiento::Entrada => {
                producto.cantidad += cantidad as u64;
            }
            TipoMovimiento::Salida => {
                if producto.cantidad < cantidad as u64 {
                    return Err(ErrorCode::StockInsuficiente.into());
                }
                producto.cantidad -= cantidad as u64;
            }
            TipoMovimiento::Ajuste | TipoMovimiento::Devolucion => {
                if cantidad > 0 {
                    producto.cantidad += cantidad as u64;
                } else {
                    if producto.cantidad < (-cantidad) as u64 {
                        return Err(ErrorCode::StockInsuficiente.into());
                    }
                    producto.cantidad -= (-cantidad) as u64;
                }
            }
            TipoMovimiento::Transferencia => {
                // Se maneja en una instrucción separada
            }
        }
        
        // Registrar movimiento
        movimiento.producto = producto.key();
        movimiento.tipo = tipo_mov;
        movimiento.cantidad = cantidad;
        movimiento.saldo_anterior = saldo_anterior;
        movimiento.saldo_nuevo = producto.cantidad;
        movimiento.costo_unitario = producto.costo;
        movimiento.documento = documento;
        movimiento.fecha = Clock::get()?.unix_timestamp;
        movimiento.usuario = usuario.key();
        movimiento.observaciones = observaciones;
        
        producto.ultima_actualizacion = Clock::get()?.unix_timestamp;
        
        msg!("Movimiento registrado: {:?} de {} unidades", tipo_mov, cantidad);
        Ok(())
    }
    
    // ==================== SISTEMA DE PUNTOS ====================
    
    pub fn acumular_puntos(
        ctx: Context<AcumularPuntos>,
        monto: u64,
        venta_id: String,
    ) -> Result<()> {
        let puntos_cliente = &mut ctx.accounts.puntos_cliente;
        let cliente = &ctx.accounts.cliente;
        
        // Calcular puntos: 1 punto por cada $10 gastados
        let puntos_ganados = (monto / 10) as u64;
        
        // Multiplicador por nivel
        let multiplicador = match puntos_cliente.nivel {
            NivelCliente::Bronce => 1,
            NivelCliente::Plata => 12,
            NivelCliente::Oro => 15,
            NivelCliente::Platino => 20,
            NivelCliente::Diamante => 25,
        };
        
        let puntos_a_otorgar = (puntos_ganados * multiplicador) / 10;
        
        // Actualizar puntos
        puntos_cliente.puntos += puntos_a_otorgar;
        puntos_cliente.ultima_actividad = Clock::get()?.unix_timestamp;
        
        // Actualizar nivel
        let nivel_anterior = puntos_cliente.nivel.clone();
        puntos_cliente.nivel = match puntos_cliente.puntos {
            0..=999 => NivelCliente::Bronce,
            1000..=4999 => NivelCliente::Plata,
            5000..=19999 => NivelCliente::Oro,
            20000..=99999 => NivelCliente::Platino,
            _ => NivelCliente::Diamante,
        };
        
        // Registrar historial
        puntos_cliente.historial.push(HistorialPuntos {
            fecha: Clock::get()?.unix_timestamp,
            puntos: puntos_a_otorgar as i32,
            concepto: format!("Compra {} - ${}", venta_id, monto),
            tipo: "ACUMULACION".to_string(),
        });
        
        if nivel_anterior != puntos_cliente.nivel {
            msg!("🎉 Cliente subió a nivel {:?}!", puntos_cliente.nivel);
        }
        
        msg!("Cliente ganó {} puntos", puntos_a_otorgar);
        Ok(())
    }
    
    pub fn canjear_puntos(
        ctx: Context<CanjearPuntos>,
        puntos: u64,
        descripcion: String,
    ) -> Result<()> {
        let puntos_cliente = &mut ctx.accounts.puntos_cliente;
        
        if puntos_cliente.puntos < puntos {
            return Err(ErrorCode::PuntosInsuficientes.into());
        }
        
        let valor = puntos as f64 / 10.0;
        
        puntos_cliente.puntos -= puntos;
        
        puntos_cliente.historial.push(HistorialPuntos {
            fecha: Clock::get()?.unix_timestamp,
            puntos: -(puntos as i32),
            concepto: format!("Canje: {} - ${:.2}", descripcion, valor),
            tipo: "CANJE".to_string(),
        });
        
        msg!("Cliente canjeó {} puntos por ${:.2}", puntos, valor);
        Ok(())
    }
    
    // ==================== FACTURACIÓN ELECTRÓNICA ====================
    
    pub fn generar_factura(
        ctx: Context<GenerarFactura>,
        venta_folio: String,
        subtotal: u64,
        iva: u64,
        total: u64,
        uso_cfdi: String,
    ) -> Result<()> {
        let factura = &mut ctx.accounts.factura;
        let cliente = &ctx.accounts.cliente;
        let venta = &ctx.accounts.venta;
        
        // Validar que el cliente tenga RFC
        if cliente.rfc.is_none() {
            return Err(ErrorCode::ClienteSinRFC.into());
        }
        
        factura.id = format!("FAC{:06}", Clock::get()?.unix_timestamp);
        factura.folio = format!("A{:04}", (Clock::get()?.unix_timestamp % 10000) as u64);
        factura.serie = "A".to_string();
        factura.fecha = Clock::get()?.unix_timestamp;
        factura.cliente = cliente.key();
        factura.venta = venta.key();
        factura.subtotal = subtotal;
        factura.iva = iva;
        factura.total = total;
        factura.uso_cfdi = uso_cfdi;
        factura.uuid = None;
        factura.fecha_timbrado = None;
        
        msg!("Factura generada: {}-{}", factura.serie, factura.folio);
        Ok(())
    }
    
    // ==================== MÚLTIPLES SUCURSALES ====================
    
    pub fn transferir_producto(
        ctx: Context<TransferirProducto>,
        producto_codigo: String,
        cantidad: u64,
    ) -> Result<()> {
        let origen = &mut ctx.accounts.sucursal_origen;
        let destino = &mut ctx.accounts.sucursal_destino;
        let producto = &ctx.accounts.producto;
        
        // Verificar stock en origen
        let stock_origen = origen.inventario.iter()
            .find(|(p, _)| *p == producto.key())
            .map(|(_, c)| *c)
            .unwrap_or(0);
        
        if stock_origen < cantidad {
            return Err(ErrorCode::StockInsuficiente.into());
        }
        
        // Restar de origen
        if let Some((_, stock)) = origen.inventario.iter_mut()
            .find(|(p, _)| *p == producto.key()) {
            *stock -= cantidad;
        }
        
        // Sumar a destino
        if let Some((_, stock)) = destino.inventario.iter_mut()
            .find(|(p, _)| *p == producto.key()) {
            *stock += cantidad;
        } else {
            destino.inventario.push((producto.key(), cantidad));
        }
        
        // Registrar transferencia
        let transferencia = &mut ctx.accounts.transferencia;
        transferencia.id = format!("TRF{:06}", Clock::get()?.unix_timestamp);
        transferencia.producto = producto.key();
        transferencia.cantidad = cantidad;
        transferencia.origen = origen.key();
        transferencia.destino = destino.key();
        transferencia.fecha = Clock::get()?.unix_timestamp;
        transferencia.usuario = ctx.accounts.usuario.key();
        transferencia.estado = EstadoTransferencia::Completada;
        
        msg!("Producto transferido de {} a {}", origen.nombre, destino.nombre);
        Ok(())
    }
    
    // ==================== DASHBOARD EN TIEMPO REAL  ====================
    
    pub fn registrar_venta_con_dashboard(
        ctx: Context<RegistrarVentaConDashboard>,
        folio: String,
        total: u64,
    ) -> Result<()> {
        let venta = &mut ctx.accounts.venta;
        let dashboard = &mut ctx.accounts.dashboard;
        
        venta.folio = folio;
        venta.total = total;
        venta.fecha = Clock::get()?.unix_timestamp;
        
        // Actualizar métricas del dashboard
        dashboard.ventas_hoy += 1;
        dashboard.monto_hoy += total;
        dashboard.ventas_mes += 1;
        dashboard.monto_mes += total;
        dashboard.ultima_actualizacion = Clock::get()?.unix_timestamp;
        
        // Actualizar ventas por hora
        let hora = (Clock::get()?.unix_timestamp / 3600) % 24;
        dashboard.ventas_por_hora[hora as usize] += 1;
        
        msg!("Venta registrada - Dashboard actualizado");
        Ok(())
    }
    
    // ==================== NOTIFICACIONES ====================
    
    pub fn crear_notificacion(
        ctx: Context<CrearNotificacion>,
        titulo: String,
        mensaje: String,
        tipo: u8,
    ) -> Result<()> {
        let notificacion = &mut ctx.accounts.notificacion;
        
        notificacion.id = format!("NOT{:06}", Clock::get()?.unix_timestamp);
        notificacion.titulo = titulo;
        notificacion.mensaje = mensaje;
        notificacion.tipo = match tipo {
            0 => TipoNotificacion::Info,
            1 => TipoNotificacion::Exito,
            2 => TipoNotificacion::Advertencia,
            3 => TipoNotificacion::Error,
            _ => TipoNotificacion::Info,
        };
        notificacion.fecha = Clock::get()?.unix_timestamp;
        notificacion.usuario = ctx.accounts.usuario.key();
        notificacion.leida = false;
        
        msg!("Notificación creada: {}", titulo);
        Ok(())
    }
    
    pub fn marcar_notificacion_leida(
        ctx: Context<MarcarNotificacionLeida>,
        _id: String,
    ) -> Result<()> {
        let notificacion = &mut ctx.accounts.notificacion;
        notificacion.leida = true;
        
        msg!("Notificación marcada como leída");
        Ok(())
    }
    
    pub fn notificar_stock_bajo(
        ctx: Context<NotificarStockBajo>,
        producto_codigo: String,
        cantidad_actual: u64,
    ) -> Result<()> {
        let producto = &ctx.accounts.producto;
        
        // Crear notificación automática
        let notificacion = &mut ctx.accounts.notificacion;
        notificacion.id = format!("STK{:06}", Clock::get()?.unix_timestamp);
        notificacion.titulo = "⚠️ STOCK BAJO".to_string();
        notificacion.mensaje = format!(
            "El producto {} ({}) tiene solo {} unidades. ¡Reabastecer pronto!",
            producto.nombre, producto.codigo, cantidad_actual
        );
        notificacion.tipo = TipoNotificacion::Advertencia;
        notificacion.fecha = Clock::get()?.unix_timestamp;
        notificacion.usuario = ctx.accounts.admin.key();
        notificacion.leida = false;
        
        msg!("Notificación de stock bajo creada");
        Ok(())
    }
}

// ==================== ESTRUCTURAS ====================

#[account]
pub struct Producto {
    pub autor: Pubkey,
    pub codigo: String,
    pub nombre: String,
    pub precio: u64,
    pub costo: u64,
    pub cantidad: u64,
    pub categoria: String,
    pub proveedor: String,
    pub fecha_agregado: i64,
    pub ultima_actualizacion: i64,
}

#[account]
pub struct MovimientoInventario {
    pub producto: Pubkey,
    pub tipo: TipoMovimiento,
    pub cantidad: i64,
    pub saldo_anterior: u64,
    pub saldo_nuevo: u64,
    pub costo_unitario: u64,
    pub documento: String,
    pub fecha: i64,
    pub usuario: Pubkey,
    pub observaciones: String,
}

#[account]
pub struct PuntosCliente {
    pub cliente: Pubkey,
    pub puntos: u64,
    pub nivel: NivelCliente,
    pub historial: Vec<HistorialPuntos>,
    pub ultima_actividad: i64,
}

#[account]
pub struct Factura {
    pub id: String,
    pub folio: String,
    pub serie: String,
    pub fecha: i64,
    pub cliente: Pubkey,
    pub venta: Pubkey,
    pub subtotal: u64,
    pub iva: u64,
    pub total: u64,
    pub uso_cfdi: String,
    pub uuid: Option<String>,
    pub fecha_timbrado: Option<i64>,
}

#[account]
pub struct Sucursal {
    pub id: String,
    pub nombre: String,
    pub direccion: String,
    pub telefono: String,
    pub encargado: Pubkey,
    pub inventario: Vec<(Pubkey, u64)>,
}

#[account]
pub struct TransferenciaInventario {
    pub id: String,
    pub producto: Pubkey,
    pub cantidad: u64,
    pub origen: Pubkey,
    pub destino: Pubkey,
    pub fecha: i64,
    pub usuario: Pubkey,
    pub estado: EstadoTransferencia,
}

#[account]
pub struct DashboardMetrics {
    pub ventas_hoy: u64,
    pub monto_hoy: u64,
    pub ventas_mes: u64,
    pub monto_mes: u64,
    pub ventas_por_hora: [u64; 24],
    pub ultima_actualizacion: i64,
}

#[account]
pub struct Notificacion {
    pub id: String,
    pub titulo: String,
    pub mensaje: String,
    pub tipo: TipoNotificacion,
    pub fecha: i64,
    pub usuario: Pubkey,
    pub leida: bool,
}

#[account]
pub struct Cliente {
    pub id: String,
    pub nombre: String,
    pub telefono: String,
    pub email: String,
    pub direccion: String,
    pub fecha_registro: i64,
    pub compras_totales: u64,
    pub monto_total: u64,
    pub ultima_compra: Option<i64>,
    pub rfc: Option<String>,
    pub regimen_fiscal: Option<String>,
}

#[account]
pub struct Venta {
    pub folio: String,
    pub fecha: i64,
    pub vendedor: Pubkey,
    pub items: Vec<ItemVenta>,
    pub total: u64,
    pub productos: u64,
    pub cliente_id: Option<String>,
    pub descuento: Option<u64>,
    pub puntos_usados: u64,
    pub puntos_ganados: u64,
    pub factura_id: Option<String>,
}

// ==================== ENUMS ====================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TipoMovimiento {
    Entrada,
    Salida,
    Ajuste,
    Devolucion,
    Transferencia,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum NivelCliente {
    Bronce,
    Plata,
    Oro,
    Platino,
    Diamante,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct HistorialPuntos {
    pub fecha: i64,
    pub puntos: i32,
    pub concepto: String,
    pub tipo: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ItemVenta {
    pub codigo: String,
    pub nombre: String,
    pub precio: u64,
    pub cantidad: u64,
    pub subtotal: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EstadoTransferencia {
    Pendiente,
    EnProceso,
    Completada,
    Cancelada,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TipoNotificacion {
    Info,
    Exito,
    Advertencia,
    Error,
}

// ==================== CONTEXTOS ====================

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct CrearProducto<'info> {
    #[account(
        init,
        seeds = [b"producto", codigo.as_bytes(), autor.key().as_ref()],
        bump,
        payer = autor,
        space = 8 + 32 + 4 + 20 + 4 + 50 + 8 + 8 + 8 + 4 + 30 + 4 + 50 + 8 + 8
    )]
    pub producto: Account<'info, Producto>,
    #[account(
        init,
        seeds = [b"movimiento", producto.key().as_ref(), autor.key().as_ref()],
        bump,
        payer = autor,
        space = 8 + 32 + 1 + 8 + 8 + 8 + 8 + 4 + 50 + 8 + 32 + 4 + 100
    )]
    pub movimiento: Account<'info, MovimientoInventario>,
    #[account(mut)]
    pub autor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegistrarMovimiento<'info> {
    #[account(mut)]
    pub producto: Account<'info, Producto>,
    #[account(
        init,
        payer = usuario,
        space = 8 + 32 + 1 + 8 + 8 + 8 + 8 + 4 + 50 + 8 + 32 + 4 + 100
    )]
    pub movimiento: Account<'info, MovimientoInventario>,
    #[account(mut)]
    pub usuario: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcumularPuntos<'info> {
    #[account(
        mut,
        seeds = [b"puntos", cliente.key().as_ref()],
        bump,
    )]
    pub puntos_cliente: Account<'info, PuntosCliente>,
    pub cliente: Account<'info, Cliente>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CanjearPuntos<'info> {
    #[account(mut)]
    pub puntos_cliente: Account<'info, PuntosCliente>,
    pub cliente: Signer<'info>,
}

#[derive(Accounts)]
pub struct GenerarFactura<'info> {
    #[account(
        init,
        payer = cliente,
        space = 8 + 4 + 20 + 4 + 10 + 4 + 1 + 8 + 32 + 32 + 8 + 8 + 8 + 4 + 50 + 4 + 32 + 4 + 8
    )]
    pub factura: Account<'info, Factura>,
    pub cliente: Account<'info, Cliente>,
    pub venta: Account<'info, Venta>,
    #[account(mut)]
    pub cliente_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferirProducto<'info> {
    #[account(mut)]
    pub sucursal_origen: Account<'info, Sucursal>,
    #[account(mut)]
    pub sucursal_destino: Account<'info, Sucursal>,
    pub producto: Account<'info, Producto>,
    #[account(
        init,
        payer = usuario,
        space = 8 + 4 + 20 + 32 + 8 + 32 + 32 + 8 + 32 + 1
    )]
    pub transferencia: Account<'info, TransferenciaInventario>,
    #[account(mut)]
    pub usuario: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegistrarVentaConDashboard<'info> {
    #[account(
        init,
        payer = vendedor,
        space = 8 + 4 + 10 + 8 + 32 + 4 + 100 + 8 + 8 + 4 + 20 + 4 + 8 + 8 + 4 + 32
    )]
    pub venta: Account<'info, Venta>,
    #[account(mut)]
    pub dashboard: Account<'info, DashboardMetrics>,
    #[account(mut)]
    pub vendedor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CrearNotificacion<'info> {
    #[account(
        init,
        payer = usuario,
        space = 8 + 4 + 20 + 4 + 100 + 4 + 100 + 1 + 8 + 32 + 1
    )]
    pub notificacion: Account<'info, Notificacion>,
    #[account(mut)]
    pub usuario: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarcarNotificacionLeida<'info> {
    #[account(mut)]
    pub notificacion: Account<'info, Notificacion>,
    pub usuario: Signer<'info>,
}

#[derive(Accounts)]
pub struct NotificarStockBajo<'info> {
    pub producto: Account<'info, Producto>,
    #[account(
        init,
        payer = admin,
        space = 8 + 4 + 20 + 4 + 100 + 4 + 100 + 1 + 8 + 32 + 1
    )]
    pub notificacion: Account<'info, Notificacion>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ==================== ERRORES ====================

#[error_code]
pub enum ErrorCode {
    #[msg("Stock insuficiente para realizar la operación")]
    StockInsuficiente,
    #[msg("Tipo de movimiento inválido")]
    TipoMovimientoInvalido,
    #[msg("Puntos insuficientes para realizar el canje")]
    PuntosInsuficientes,
    #[msg("El cliente no tiene RFC registrado")]
    ClienteSinRFC,
    #[msg("Sucursal no encontrada")]
    SucursalNoEncontrada,
    #[msg("Producto no encontrado en sucursal")]
    ProductoNoEnSucursal,
}
