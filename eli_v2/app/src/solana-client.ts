import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@project-serum/anchor';
import idl from './idl/proyecto_eli_solana.json';
import { SolanaCredential, DEFAULT_PROGRAM_ID, DEFAULT_NETWORK } from './solana-credential';

// Tipos
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

export interface MovimientoInventario {
  producto: PublicKey;
  tipo: number;
  cantidad: number;
  saldoAnterior: BN;
  saldoNuevo: BN;
  costoUnitario: BN;
  documento: string;
  fecha: BN;
  usuario: PublicKey;
  observaciones: string;
}

export interface PuntosCliente {
  cliente: PublicKey;
  puntos: BN;
  nivel: number; // 0=Bronce, 1=Plata, 2=Oro, 3=Platino, 4=Diamante
  historial: HistorialPuntos[];
  ultimaActividad: BN;
}

export interface HistorialPuntos {
  fecha: BN;
  puntos: number;
  concepto: string;
  tipo: string;
}

export interface Factura {
  id: string;
  folio: string;
  serie: string;
  fecha: BN;
  cliente: PublicKey;
  venta: PublicKey;
  subtotal: BN;
  iva: BN;
  total: BN;
  usoCfdi: string;
  uuid: string | null;
  fechaTimbrado: BN | null;
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  encargado: PublicKey;
  inventario: Array<[PublicKey, BN]>;
}

export interface TransferenciaInventario {
  id: string;
  producto: PublicKey;
  cantidad: BN;
  origen: PublicKey;
  destino: PublicKey;
  fecha: BN;
  usuario: PublicKey;
  estado: number; // 0=Pendiente, 1=EnProceso, 2=Completada, 3=Cancelada
}

export interface DashboardMetrics {
  ventasHoy: BN;
  montoHoy: BN;
  ventasMes: BN;
  montoMes: BN;
  ventasPorHora: BN[];
  ultimaActualizacion: BN;
}

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: number; // 0=Info, 1=Éxito, 2=Advertencia, 3=Error
  fecha: BN;
  usuario: PublicKey;
  leida: boolean;
}

export class SolanaClient {
  private program: Program;
  private provider: AnchorProvider;
  private connection: Connection;
  private creds: SolanaCredential;

  constructor(wallet: any, programId?: string, network?: string) {
    this.creds = new SolanaCredential(network || DEFAULT_NETWORK, programId || DEFAULT_PROGRAM_ID);
    this.connection = this.creds.getConnection();
    this.provider = this.creds.createProvider(wallet);
    this.program = new Program(idl as Idl, this.creds.getProgramId(), this.provider);
    
    console.log("✅ Cliente Solana inicializado con todas las funcionalidades");
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
        .crearProducto(codigo, nombre, new BN(precio), new BN(costo), new BN(cantidad), categoria, proveedor)
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

  // ==================== KARDEX ====================
  
  async registrarMovimientoInventario(
    productoCodigo: string,
    tipo: number, // 0=Entrada, 1=Salida, 2=Ajuste, 3=Devolucion, 4=Transferencia
    cantidad: number,
    documento: string,
    observaciones: string
  ) {
    try {
      const usuario = this.provider.wallet.publicKey;
      
      const tx = await this.program.methods
        .registrarMovimientoInventario(productoCodigo, tipo, cantidad, documento, observaciones)
        .accounts({
          usuario: usuario,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error registrando movimiento:", error);
      return { success: false, error };
    }
  }

  async obtenerKardexProducto(productoPDA: PublicKey) {
    try {
      const movimientos = await this.program.account.movimientoInventario.all();
      return movimientos.filter(m => (m.account as any).producto.equals(productoPDA));
    } catch (error) {
      console.error("❌ Error obteniendo kardex:", error);
      return [];
    }
  }

  // ==================== PUNTOS Y FIDELIZACIÓN ====================
  
  async acumularPuntos(clienteId: string, monto: number, ventaId: string) {
    try {
      const cliente = await this.obtenerCliente(clienteId, this.provider.wallet.publicKey);
      if (!cliente) throw new Error("Cliente no encontrado");

      const [puntosPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("puntos"), (cliente as any).cliente.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .acumularPuntos(new BN(monto), ventaId)
        .accounts({
          puntosCliente: puntosPDA,
          cliente: (cliente as any).cliente,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error acumulando puntos:", error);
      return { success: false, error };
    }
  }

  async canjearPuntos(puntos: number, descripcion: string) {
    try {
      const tx = await this.program.methods
        .canjearPuntos(new BN(puntos), descripcion)
        .accounts({
          cliente: this.provider.wallet.publicKey,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error canjeando puntos:", error);
      return { success: false, error };
    }
  }

  async obtenerPuntosCliente(clienteId: string) {
    try {
      const cliente = await this.obtenerCliente(clienteId, this.provider.wallet.publicKey);
      if (!cliente) return null;

      const [puntosPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("puntos"), (cliente as any).cliente.toBuffer()],
        this.program.programId
      );

      return await this.program.account.puntosCliente.fetch(puntosPDA);
    } catch (error) {
      console.error("❌ Error obteniendo puntos:", error);
      return null;
    }
  }

  // ==================== REPORTES ====================
  
  async generarReporteVentas(fechaInicio: Date, fechaFin: Date): Promise<any> {
    try {
      const ventas = await this.program.account.venta.all();
      
      const ventasFiltradas = ventas.filter(v => {
        const fecha = new Date((v.account as any).fecha.toNumber() * 1000);
        return fecha >= fechaInicio && fecha <= fechaFin;
      });

      const totalVentas = ventasFiltradas.length;
      const montoTotal = ventasFiltradas.reduce((sum, v) => sum + (v.account as any).total.toNumber(), 0);
      const promedio = totalVentas > 0 ? montoTotal / totalVentas : 0;

      // Ventas por día
      const ventasPorDia = new Map<string, { count: number; monto: number }>();
      ventasFiltradas.forEach(v => {
        const fecha = new Date((v.account as any).fecha.toNumber() * 1000).toLocaleDateString();
        const actual = ventasPorDia.get(fecha) || { count: 0, monto: 0 };
        actual.count++;
        actual.monto += (v.account as any).total.toNumber();
        ventasPorDia.set(fecha, actual);
      });

      // Top productos
      const productosVendidos = new Map<string, { nombre: string; cantidad: number; total: number }>();
      ventasFiltradas.forEach(v => {
        (v.account as any).items.forEach((item: any) => {
          const actual = productosVendidos.get(item.codigo) || { nombre: item.nombre, cantidad: 0, total: 0 };
          actual.cantidad += item.cantidad;
          actual.total += item.subtotal;
          productosVendidos.set(item.codigo, actual);
        });
      });

      const topProductos = Array.from(productosVendidos.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);

      return {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        totalVentas,
        montoTotal,
        promedio,
        ventasPorDia: Array.from(ventasPorDia.entries()),
        topProductos,
      };
    } catch (error) {
      console.error("❌ Error generando reporte:", error);
      return null;
    }
  }

  async generarReporteInventario(): Promise<any> {
    try {
      const productos = await this.program.account.producto.all();
      
      const inversionTotal = productos.reduce((sum, p) => sum + (p.account as any).costo.toNumber() * (p.account as any).cantidad.toNumber(), 0);
      const ventaTotal = productos.reduce((sum, p) => sum + (p.account as any).precio.toNumber() * (p.account as any).cantidad.toNumber(), 0);
      const gananciaPotencial = ventaTotal - inversionTotal;
      
      const stockBajo = productos.filter(p => (p.account as any).cantidad.toNumber() <= 5);
      const productosPorCaducar = productos.filter(p => {
        const fechaCad = (p.account as any).fechaCaducidad;
        if (!fechaCad) return false;
        const diasRestantes = (fechaCad.toNumber() - Date.now() / 1000) / 86400;
        return diasRestantes <= 30;
      });

      return {
        totalProductos: productos.length,
        unidadesTotales: productos.reduce((sum, p) => sum + (p.account as any).cantidad.toNumber(), 0),
        inversionTotal,
        ventaTotal,
        gananciaPotencial,
        margen: ventaTotal > 0 ? (gananciaPotencial / ventaTotal) * 100 : 0,
        stockBajo: stockBajo.length,
        productosPorCaducar: productosPorCaducar.length,
      };
    } catch (error) {
      console.error("❌ Error generando reporte de inventario:", error);
      return null;
    }
  }

  async generarReporteFinanciero(): Promise<any> {
    try {
      const ventas = await this.program.account.venta.all();
      const productos = await this.program.account.producto.all();
      
      const ventasTotales = ventas.reduce((sum, v) => sum + (v.account as any).total.toNumber(), 0);
      const costoVentas = ventas.reduce((sum, v) => {
        const costoItems = (v.account as any).items.reduce((itemSum: number, item: any) => {
          const producto = productos.find(p => (p.account as any).codigo === item.codigo);
          return itemSum + ((producto?.account as any)?.costo.toNumber() || 0) * item.cantidad;
        }, 0);
        return sum + costoItems;
      }, 0);
      
      const utilidadBruta = ventasTotales - costoVentas;
      const margenBruto = ventasTotales > 0 ? (utilidadBruta / ventasTotales) * 100 : 0;
      
      const valorInventario = productos.reduce((sum, p) => sum + (p.account as any).costo.toNumber() * (p.account as any).cantidad.toNumber(), 0);
      const rotacionInventario = valorInventario > 0 ? costoVentas / valorInventario : 0;
      
      return {
        ventasTotales,
        costoVentas,
        utilidadBruta,
        margenBruto,
        valorInventario,
        rotacionInventario,
        numeroVentas: ventas.length,
        numeroProductos: productos.length,
      };
    } catch (error) {
      console.error("❌ Error generando reporte financiero:", error);
      return null;
    }
  }

  // ==================== FACTURACIÓN ====================
  
  async generarFactura(ventaFolio: string, usoCfdi: string) {
    try {
      const ventas = await this.program.account.venta.all();
      const venta = ventas.find(v => (v.account as any).folio === ventaFolio);
      if (!venta) throw new Error("Venta no encontrada");

      const subtotal = (venta.account as any).total.toNumber() / 1.16;
      const iva = (venta.account as any).total.toNumber() - subtotal;

      const tx = await this.program.methods
        .generarFactura(ventaFolio, new BN(subtotal), new BN(iva), (venta.account as any).total, usoCfdi)
        .accounts({
          cliente: (venta.account as any).clienteId,
          venta: venta.publicKey,
          clienteSigner: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error generando factura:", error);
      return { success: false, error };
    }
  }

  async obtenerFacturas(clienteId?: string): Promise<any[]> {
    try {
      const facturas = await this.program.account.factura.all();
      
      if (clienteId) {
        const cliente = await this.obtenerCliente(clienteId, this.provider.wallet.publicKey);
        if (cliente) {
          return facturas.filter(f => (f.account as any).cliente.equals((cliente as any).cliente));
        }
      }
      
      return facturas.map(f => f.account);
    } catch (error) {
      console.error("❌ Error obteniendo facturas:", error);
      return [];
    }
  }

  // ==================== SUCURSALES ====================
  
  async transferirProducto(sucursalOrigenId: string, sucursalDestinoId: string, productoCodigo: string, cantidad: number) {
    try {
      const tx = await this.program.methods
        .transferirProducto(productoCodigo, new BN(cantidad))
        .accounts({
          sucursalOrigen: new PublicKey(sucursalOrigenId),
          sucursalDestino: new PublicKey(sucursalDestinoId),
          usuario: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error transfiriendo producto:", error);
      return { success: false, error };
    }
  }

  async obtenerSucursales(): Promise<any[]> {
    try {
      const sucursales = await this.program.account.sucursal.all();
      return sucursales.map(s => s.account);
    } catch (error) {
      console.error("❌ Error obteniendo sucursales:", error);
      return [];
    }
  }

  // ==================== DASHBOARD EN TIEMPO REAL ====================
  
  async obtenerDashboard(): Promise<DashboardMetrics | null> {
    try {
      const dashboards = await this.program.account.dashboardMetrics.all();
      if (dashboards.length === 0) return null;
      return dashboards[0].account as unknown as DashboardMetrics;
    } catch (error) {
      console.error("❌ Error obteniendo dashboard:", error);
      return null;
    }
  }

  async registrarVentaConDashboard(venta: any) {
    try {
      const tx = await this.program.methods
        .registrarVentaConDashboard(venta.folio, new BN(venta.total))
        .accounts({
          vendedor: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error registrando venta con dashboard:", error);
      return { success: false, error };
    }
  }

  // ==================== NOTIFICACIONES ====================
  
  async crearNotificacion(titulo: string, mensaje: string, tipo: number) {
    try {
      const tx = await this.program.methods
        .crearNotificacion(titulo, mensaje, tipo)
        .accounts({
          usuario: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error creando notificación:", error);
      return { success: false, error };
    }
  }

  async obtenerNotificaciones(leidas: boolean = false): Promise<any[]> {
    try {
      const notificaciones = await this.program.account.notificacion.all();
      return notificaciones
        .filter(n => (n.account as any).leida === leidas)
        .map(n => n.account);
    } catch (error) {
      console.error("❌ Error obteniendo notificaciones:", error);
      return [];
    }
  }

  async marcarNotificacionLeida(notificacionId: string) {
    try {
      const tx = await this.program.methods
        .marcarNotificacionLeida(notificacionId)
        .accounts({
          usuario: this.provider.wallet.publicKey,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error marcando notificación:", error);
      return { success: false, error };
    }
  }

  async notificarStockBajo(productoCodigo: string) {
    try {
      const tx = await this.program.methods
        .notificarStockBajo(productoCodigo, new BN(0))
        .accounts({
          admin: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error notificando stock bajo:", error);
      return { success: false, error };
    }
  }

  // ==================== CLIENTES ====================
  
  async registrarCliente(id: string, nombre: string, telefono: string, email: string, direccion: string, rfc?: string) {
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

      // Si tiene RFC, actualizar después
      if (rfc) {
        await this.actualizarCliente(id, nombre, telefono, email, direccion, rfc);
      }

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

  async actualizarCliente(id: string, nombre: string, telefono: string, email: string, direccion: string, rfc?: string) {
    try {
      const autor = this.provider.wallet.publicKey;

      const tx = await this.program.methods
        .actualizarCliente(id, nombre, telefono, email, direccion)
        .accounts({
          autor: autor,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error actualizando cliente:", error);
      return { success: false, error };
    }
  }

  async eliminarCliente(id: string) {
    try {
      const autor = this.provider.wallet.publicKey;

      const tx = await this.program.methods
        .eliminarCliente(id)
        .accounts({
          autor: autor,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("❌ Error eliminando cliente:", error);
      return { success: false, error };
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

  // ==================== VENTAS ====================
  
  async registrarVenta(venta: any) {
    try {
      const vendedor = this.provider.wallet.publicKey;
      const [ventaPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("venta"), Buffer.from(venta.folio)],
        this.program.programId
      );

      const tx = await this.program.methods
        .registrarVenta(
          venta.folio,
          venta.items.map((i: any) => ({
            codigo: i.codigo,
            nombre: i.nombre,
            precio: new BN(i.precio),
            cantidad: new BN(i.cantidad),
            subtotal: new BN(i.subtotal),
          })),
          new BN(venta.total),
          venta.clienteId || null,
          venta.descuento ? new BN(venta.descuento) : null
        )
        .accounts({
          venta: ventaPDA,
          vendedor: vendedor,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Acumular puntos si hay cliente
      if (venta.clienteId && venta.clienteId !== "sin_cliente") {
        await this.acumularPuntos(venta.clienteId, venta.total, venta.folio);
      }

      // Actualizar dashboard
      await this.registrarVentaConDashboard(venta);

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
