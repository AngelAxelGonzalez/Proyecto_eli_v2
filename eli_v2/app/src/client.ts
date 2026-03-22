import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@project-serum/anchor';
import idl from './idl/proyecto_eli_solana.json';

// Configuración
const PROGRAM_ID = new PublicKey("H7PyhEsvDRsWkqyHdbJ8oJ17w6EA2tR4eG5ruJCEQac");
const SOLANA_NETWORK = "https://api.devnet.solana.com";

export interface Producto {
    autor: PublicKey;
    codigo: string;
    nombre: string;
    precio: BN;
    costo: BN;
    cantidad: BN;
    categoria: string;
    proveedor: string;
    fechaAgregado: BN;
    ultimaActualizacion: BN;
}

export interface Cliente {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
    fechaRegistro: BN;
    comprasTotales: BN;
    montoTotal: BN;
    ultimaCompra: BN | null;
}

export class SolanaClient {
    private program: Program;
    private provider: AnchorProvider;
    private connection: Connection;

    constructor(wallet: any) {
        this.connection = new Connection(SOLANA_NETWORK);
        this.provider = new AnchorProvider(this.connection, wallet, {
            commitment: "confirmed",
        });
        this.program = new Program(idl as Idl, PROGRAM_ID, this.provider);
        console.log("✅ Cliente Solana inicializado");
    }

    // ==================== PRODUCTOS ====================

    async crearProducto(
        codigo: string,
        nombre: string,
        precio: number,
        costo: number,
        cantidad: number,
        categoria: string,
        proveedor: string
    ) {
        try {
            const autor = this.provider.wallet.publicKey;
            const [productoPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("producto"), Buffer.from(codigo), autor.toBuffer()],
                this.program.programId
            );

            const tx = await this.program.methods
                .crearProducto(
                    codigo,
                    nombre,
                    new BN(precio),
                    new BN(costo),
                    new BN(cantidad),
                    categoria,
                    proveedor
                )
                .accounts({
                    producto: productoPDA,
                    autor: autor,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            return { success: true, tx, productoPDA };
        } catch (error) {
            console.error("❌ Error creando producto:", error);
            return { success: false, error };
        }
    }

    async obtenerProducto(codigo: string, autor: PublicKey) {
        try {
            const [productoPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("producto"), Buffer.from(codigo), autor.toBuffer()],
                this.program.programId
            );
            return await this.program.account.producto.fetch(productoPDA);
        } catch (error) {
            console.error("❌ Error obteniendo producto:", error);
            return null;
        }
    }

    async obtenerTodosProductos() {
        try {
            const productos = await this.program.account.producto.all();
            return productos.map(p => p.account);
        } catch (error) {
            console.error("❌ Error obteniendo productos:", error);
            return [];
        }
    }

    // ==================== VENTAS ====================

    async registrarVenta(ventaData: any) {
        try {
            const vendedor = this.provider.wallet.publicKey;
            const [ventaPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("venta"), Buffer.from(ventaData.folio)],
                this.program.programId
            );

            const items = ventaData.items.map((item: any) => ({
                codigo: item.codigo,
                nombre: item.nombre,
                precio: new BN(item.precio),
                cantidad: new BN(item.cantidad),
                subtotal: new BN(item.subtotal),
            }));

            const tx = await this.program.methods
                .registrarVenta(
                    ventaData.folio,
                    items,
                    new BN(ventaData.total),
                    ventaData.clienteId || null,
                    ventaData.descuento ? new BN(ventaData.descuento) : null
                )
                .accounts({
                    venta: ventaPDA,
                    vendedor: vendedor,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            return { success: true, tx, ventaPDA };
        } catch (error) {
            console.error("❌ Error registrando venta:", error);
            return { success: false, error };
        }
    }

    async obtenerTodasVentas() {
        try {
            const ventas = await this.program.account.venta.all();
            return ventas.map(v => v.account);
        } catch (error) {
            console.error("❌ Error obteniendo ventas:", error);
            return [];
        }
    }

    // ==================== CLIENTES ====================

    async registrarCliente(
        id: string,
        nombre: string,
        telefono: string,
        email: string,
        direccion: string,
        rfc?: string
    ) {
        try {
            const autor = this.provider.wallet.publicKey;
            const [clientePDA] = await PublicKey.findProgramAddress(
                [Buffer.from("cliente"), Buffer.from(id), autor.toBuffer()],
                this.program.programId
            );

            const tx = await this.program.methods
                .registrarCliente(id, nombre, telefono, email, direccion)
                .accounts({
                    cliente: clientePDA,
                    autor: autor,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            return { success: true, tx, clientePDA };
        } catch (error) {
            console.error("❌ Error registrando cliente:", error);
            return { success: false, error };
        }
    }

    async obtenerCliente(id: string, autor: PublicKey) {
        try {
            const [clientePDA] = await PublicKey.findProgramAddress(
                [Buffer.from("cliente"), Buffer.from(id), autor.toBuffer()],
                this.program.programId
            );
            return await this.program.account.cliente.fetch(clientePDA);
        } catch (error) {
            console.error("❌ Error obteniendo cliente:", error);
            return null;
        }
    }

    async obtenerTodosClientes(autor?: PublicKey) {
        try {
            const autorKey = autor || this.provider.wallet.publicKey;
            const clientes = await this.program.account.cliente.all();
            
            const filtrados = clientes.filter(c => {
                const cliente = c.account as any;
                return cliente.autor && cliente.autor.equals(autorKey);
            });

            return filtrados.map(c => c.account);
        } catch (error) {
            console.error("❌ Error obteniendo clientes:", error);
            return [];
        }
    }

    // ==================== MÚLTIPLES MONEDAS ====================

    async registrarVentaConMoneda(ventaData: any, moneda: string = "MXN"): Promise<any> {
        try {
            const { ServicioMonedas } = await import('./monedas');
            const servicioMonedas = new ServicioMonedas();
            const totalEnMXN = servicioMonedas.convertir(ventaData.total, moneda, "MXN");
            
            const ventaConvertida = {
                ...ventaData,
                total: totalEnMXN,
                moneda_original: moneda,
                total_original: ventaData.total
            };
            
            return await this.registrarVenta(ventaConvertida);
        } catch (error) {
            console.error("❌ Error registrando venta con moneda:", error);
            return { success: false, error };
        }
    }

    async obtenerVentaConMoneda(ventaId: string, monedaDestino: string = "MXN"): Promise<any> {
        try {
            const venta = await this.obtenerVenta(ventaId);
            if (!venta) return null;
            
            const { ServicioMonedas } = await import('./monedas');
            const servicioMonedas = new ServicioMonedas();
            const totalConvertido = servicioMonedas.convertir(venta.total, "MXN", monedaDestino);
            
            return {
                ...venta,
                total_mostrar: totalConvertido,
                moneda_mostrar: monedaDestino,
                total_original: venta.total,
                moneda_original: "MXN"
            };
        } catch (error) {
            console.error("❌ Error obteniendo venta con moneda:", error);
            return null;
        }
    }

    async obtenerVenta(ventaId: string): Promise<any> {
        try {
            const ventas = await this.obtenerTodasVentas();
            return ventas.find((v: any) => v.folio === ventaId);
        } catch (error) {
            console.error("❌ Error obteniendo venta:", error);
            return null;
        }
    }

    // ==================== NOTIFICACIONES ====================

    async crearNotificacion(titulo: string, mensaje: string, tipo: number = 0) {
        try {
            const usuario = this.provider.wallet.publicKey;
            const [notificacionPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("notificacion"), Buffer.from(Date.now().toString()), usuario.toBuffer()],
                this.program.programId
            );

            const tx = await this.program.methods
                .crearNotificacion(titulo, mensaje, tipo)
                .accounts({
                    notificacion: notificacionPDA,
                    usuario: usuario,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            return { success: true, tx };
        } catch (error) {
            console.error("❌ Error creando notificación:", error);
            return { success: false, error };
        }
    }

    // ==================== REPORTES ====================

    async generarReporteInventario(): Promise<any> {
        try {
            const productos = await this.obtenerTodosProductos();
            
            const inversionTotal = productos.reduce((sum: number, p: any) => {
                let costo = 0, cantidad = 0;
                if (p.costo) {
                    costo = typeof p.costo === 'object' && p.costo.toNumber ? p.costo.toNumber() : Number(p.costo);
                }
                if (p.cantidad) {
                    cantidad = typeof p.cantidad === 'object' && p.cantidad.toNumber ? p.cantidad.toNumber() : Number(p.cantidad);
                }
                return sum + (costo * cantidad);
            }, 0);
            
            const ventaTotal = productos.reduce((sum: number, p: any) => {
                let precio = 0, cantidad = 0;
                if (p.precio) {
                    precio = typeof p.precio === 'object' && p.precio.toNumber ? p.precio.toNumber() : Number(p.precio);
                }
                if (p.cantidad) {
                    cantidad = typeof p.cantidad === 'object' && p.cantidad.toNumber ? p.cantidad.toNumber() : Number(p.cantidad);
                }
                return sum + (precio * cantidad);
            }, 0);
            
            const stockBajo = productos.filter((p: any) => {
                let cantidad = 0;
                if (p.cantidad) {
                    cantidad = typeof p.cantidad === 'object' && p.cantidad.toNumber ? p.cantidad.toNumber() : Number(p.cantidad);
                }
                return cantidad <= 5;
            });
            
            return {
                totalProductos: productos.length,
                inversionTotal,
                ventaTotal,
                stockBajo: stockBajo.length,
                gananciaPotencial: ventaTotal - inversionTotal,
                productosPorCaducar: 0
            };
        } catch (error) {
            console.error("❌ Error generando reporte:", error);
            return null;
        }
    }

    async generarReporteVentas(fechaInicio: Date, fechaFin: Date): Promise<any> {
        try {
            const ventas = await this.obtenerTodasVentas();
            
            const ventasFiltradas = ventas.filter((v: any) => {
                let fechaVenta = new Date();
                if (v.fecha) {
                    fechaVenta = typeof v.fecha === 'object' && v.fecha.toNumber 
                        ? new Date(v.fecha.toNumber() * 1000) 
                        : new Date(Number(v.fecha) * 1000);
                }
                return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
            });
            
            const totalVentas = ventasFiltradas.length;
            const totalMonto = ventasFiltradas.reduce((sum: number, v: any) => {
                let monto = 0;
                if (v.total) {
                    monto = typeof v.total === 'object' && v.total.toNumber ? v.total.toNumber() : Number(v.total);
                }
                return sum + monto;
            }, 0);
            
            return {
                totalVentas,
                totalMonto,
                promedio: totalVentas > 0 ? totalMonto / totalVentas : 0,
                ventas: ventasFiltradas
            };
        } catch (error) {
            console.error("❌ Error generando reporte de ventas:", error);
            return null;
        }
    }

    // ==================== UTILIDADES ====================

    async obtenerSaldo(): Promise<number> {
        try {
            const balance = await this.connection.getBalance(this.provider.wallet.publicKey);
            return balance / 1e9;
        } catch (error) {
            console.error("❌ Error obteniendo saldo:", error);
            return 0;
        }
    }

    isWalletConnected(): boolean {
        return this.provider.wallet.publicKey !== null;
    }

    obtenerDireccion(): string {
        return this.provider.wallet.publicKey?.toString() || "";
    }
}

export default SolanaClient;