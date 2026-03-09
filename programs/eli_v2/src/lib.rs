use anchor_lang::prelude::*;

declare_id!("H7PyhEsvDRsWkqyHdbJ8oJ17W6EA2tR4eG5ruJCECQac");

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

        msg!("Producto creado: {}", producto.nombre);
        Ok(())
    }

    pub fn actualizar_producto(
        ctx: Context<ActualizarProducto>,
        _codigo: String,
        nombre: String,
        precio: u64,
        costo: u64,
        cantidad: u64,
        categoria: String,
        proveedor: String,
    ) -> Result<()> {
        let producto = &mut ctx.accounts.producto;

        producto.nombre = nombre;
        producto.precio = precio;
        producto.costo = costo;
        producto.cantidad = cantidad;
        producto.categoria = categoria;
        producto.proveedor = proveedor;
        producto.ultima_actualizacion = Clock::get()?.unix_timestamp;

        msg!("Producto actualizado: {}", producto.nombre);
        Ok(())
    }

    pub fn eliminar_producto(_ctx: Context<EliminarProducto>, codigo: String) -> Result<()> {
        msg!("Producto eliminado: {}", codigo);
        Ok(())
    }

    // ==================== VENTAS ====================

    pub fn registrar_venta(
        ctx: Context<RegistrarVenta>,
        folio: String,
        items: Vec<ItemVentaInput>,
        total: u64,
        cliente_id: Option<String>,
        descuento: Option<u64>,
    ) -> Result<()> {
        let venta = &mut ctx.accounts.venta;
        let vendedor = &ctx.accounts.vendedor;

        venta.folio = folio;
        venta.fecha = Clock::get()?.unix_timestamp;
        venta.vendedor = vendedor.key();
        venta.total = total;
        venta.productos = items.len() as u64;
        venta.cliente_id = cliente_id;
        venta.descuento = descuento;

        // Convertir items de input a almacenamiento
        let mut items_storage = Vec::new();
        for item in items {
            items_storage.push(ItemVenta {
                codigo: item.codigo,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
            });
        }
        venta.items = items_storage;

        msg!("Venta registrada: {}", venta.folio);
        Ok(())
    }

    // ==================== CLIENTES ====================

    pub fn registrar_cliente(
        ctx: Context<RegistrarCliente>,
        id: String,
        nombre: String,
        telefono: String,
        email: String,
        direccion: String,
    ) -> Result<()> {
        let cliente = &mut ctx.accounts.cliente;

        cliente.id = id;
        cliente.nombre = nombre;
        cliente.telefono = telefono;
        cliente.email = email;
        cliente.direccion = direccion;
        cliente.fecha_registro = Clock::get()?.unix_timestamp;
        cliente.compras_totales = 0;
        cliente.monto_total = 0;

        msg!("Cliente registrado: {}", cliente.nombre);
        Ok(())
    }

    pub fn actualizar_cliente(
        ctx: Context<ActualizarCliente>,
        _id: String,
        nombre: String,
        telefono: String,
        email: String,
        direccion: String,
    ) -> Result<()> {
        let cliente = &mut ctx.accounts.cliente;

        cliente.nombre = nombre;
        cliente.telefono = telefono;
        cliente.email = email;
        cliente.direccion = direccion;

        msg!("Cliente actualizado: {}", cliente.nombre);
        Ok(())
    }

    pub fn eliminar_cliente(_ctx: Context<EliminarCliente>, id: String) -> Result<()> {
        msg!("Cliente eliminado: {}", id);
        Ok(())
    }

    // ==================== PROVEEDORES ====================

    pub fn crear_proveedor(
        ctx: Context<CrearProveedor>,
        id: String,
        nombre: String,
        contacto: String,
        telefono: String,
        email: String,
        direccion: String,
    ) -> Result<()> {
        let proveedor = &mut ctx.accounts.proveedor;

        proveedor.id = id;
        proveedor.nombre = nombre;
        proveedor.contacto = contacto;
        proveedor.telefono = telefono;
        proveedor.email = email;
        proveedor.direccion = direccion;
        proveedor.fecha_registro = Clock::get()?.unix_timestamp;
        proveedor.productos = Vec::new();
        proveedor.calificacion = 0;
        proveedor.activo = true;

        msg!("Proveedor creado: {}", proveedor.nombre);
        Ok(())
    }
}

// ==================== ESTRUCTURAS DE DATOS ====================

#[account]
#[derive(InitSpace)]
pub struct Producto {
    pub autor: Pubkey,
    #[max_len(20)]
    pub codigo: String,
    #[max_len(50)]
    pub nombre: String,
    pub precio: u64,
    pub costo: u64,
    pub cantidad: u64,
    #[max_len(30)]
    pub categoria: String,
    #[max_len(50)]
    pub proveedor: String,
    pub fecha_agregado: i64,
    pub ultima_actualizacion: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Venta {
    #[max_len(10)]
    pub folio: String,
    pub fecha: i64,
    pub vendedor: Pubkey,
    #[max_len(50)]
    pub items: Vec<ItemVenta>,
    pub total: u64,
    pub productos: u64,
    #[max_len(20)]
    pub cliente_id: Option<String>,
    pub descuento: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ItemVenta {
    #[max_len(20)]
    pub codigo: String,
    #[max_len(50)]
    pub nombre: String,
    pub precio: u64,
    pub cantidad: u64,
    pub subtotal: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ItemVentaInput {
    pub codigo: String,
    pub nombre: String,
    pub precio: u64,
    pub cantidad: u64,
    pub subtotal: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Cliente {
    #[max_len(10)]
    pub id: String,
    #[max_len(50)]
    pub nombre: String,
    #[max_len(15)]
    pub telefono: String,
    #[max_len(50)]
    pub email: String,
    #[max_len(100)]
    pub direccion: String,
    pub fecha_registro: i64,
    pub compras_totales: u64,
    pub monto_total: u64,
    pub ultima_compra: Option<i64>,
}

#[account]
#[derive(InitSpace)]
pub struct Proveedor {
    #[max_len(10)]
    pub id: String,
    #[max_len(50)]
    pub nombre: String,
    #[max_len(50)]
    pub contacto: String,
    #[max_len(15)]
    pub telefono: String,
    #[max_len(50)]
    pub email: String,
    #[max_len(100)]
    pub direccion: String,
    #[max_len(10, 50)]
    pub productos: Vec<String>,
    pub fecha_registro: i64,
    pub calificacion: u64,
    pub activo: bool,
}

// ==================== CONTEXTOS (VALIDACIÓN DE CUENTAS) ====================

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct CrearProducto<'info> {
    #[account(
        init,
        seeds = [b"producto", codigo.as_bytes(), autor.key().as_ref()],
        bump,
        payer = autor,
        space = 8 + Producto::INIT_SPACE
    )]
    pub producto: Account<'info, Producto>,
    #[account(mut)]
    pub autor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct ActualizarProducto<'info> {
    #[account(
        mut,
        seeds = [b"producto", codigo.as_bytes(), autor.key().as_ref()],
        bump,
        realloc = 8 + Producto::INIT_SPACE,
        realloc::payer = autor,
        realloc::zero = true,
    )]
    pub producto: Account<'info, Producto>,
    #[account(mut)]
    pub autor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct EliminarProducto<'info> {
    #[account(
        mut,
        seeds = [b"producto", codigo.as_bytes(), autor.key().as_ref()],
        bump,
        close = autor
    )]
    pub producto: Account<'info, Producto>,
    #[account(mut)]
    pub autor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(folio: String)]
pub struct RegistrarVenta<'info> {
    #[account(
        init,
        seeds = [b"venta", folio.as_bytes()],
        bump,
        payer = vendedor,
        space = 8 + Venta::INIT_SPACE
    )]
    pub venta: Account<'info, Venta>,
    #[account(mut)]
    pub vendedor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct RegistrarCliente<'info> {
    #[account(
        init,
        seeds = [b"cliente", id.as_bytes(), autor.key().as_ref()],
        bump,
        payer = autor,
        space = 8 + Cliente::INIT_SPACE
    )]
    pub cliente: Account<'info, Cliente>,
    #[account(mut)]
    pub autor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct ActualizarCliente<'info> {
    #[account(
        mut,
        seeds = [b"cliente", id.as_bytes(), autor.key().as_ref()],
        bump
    )]
    pub cliente: Account<'info, Cliente>,
    #[account(mut)]
    pub autor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct EliminarCliente<'info> {
    #[account(
        mut,
        seeds = [b"cliente", id.as_bytes(), autor.key().as_ref()],
        bump,
        close = autor
    )]
    pub cliente: Account<'info, Cliente>,
    #[account(mut)]
    pub autor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct CrearProveedor<'info> {
    #[account(
        init,
        seeds = [b"proveedor", id.as_bytes(), autor.key().as_ref()],
        bump,
        payer = autor,
        space = 8 + Proveedor::INIT_SPACE
    )]
    pub proveedor: Account<'info, Proveedor>,
    #[account(mut)]
    pub autor: Signer<'info>,
    pub system_program: Program<'info, System>,
}