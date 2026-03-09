import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../idl/proyecto_eli_solana.json'; // IDL generado por Anchor

// Configuración
const PROGRAM_ID = new PublicKey("H7PyhEsvDRsWkqyHdbJ8oJ17W6EA2tR4eG5ruJCECQac");
const SOLANA_NETWORK = "devnet"; // o "mainnet-beta"

export class SolanaCrudClient {
  private program: Program;
  private provider: AnchorProvider;

  constructor(connection: Connection, wallet: any) {
    this.provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(idl as Idl, PROGRAM_ID, this.provider);
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
      
      // Encontrar la PDA para este producto
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

      console.log("Producto creado. Transacción:", tx);
      return { success: true, tx, productoPDA };
    } catch (error) {
      console.error("Error creando producto:", error);
      return { success: false, error };
    }
  }

  async obtenerProducto(codigo: string, autor: PublicKey) {
    try {
      const [productoPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("producto"), Buffer.from(codigo), autor.toBuffer()],
        this.program.programId
      );

      const producto = await this.program.account.producto.fetch(productoPDA);
      return producto;
    } catch (error) {
      console.error("Error obteniendo producto:", error);
      return null;
    }
  }

  async obtenerTodosProductos() {
    try {
      const productos = await this.program.account.producto.all();
      return productos;
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      return [];
    }
  }

  async actualizarProducto(
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

      const tx = await this.program.methods
        .actualizarProducto(
          codigo,
          nombre,
          new BN(precio),
          new BN(costo),
          new BN(cantidad),
          categoria,
          proveedor
        )
        .accounts({
          autor: autor,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error actualizando producto:", error);
      return { success: false, error };
    }
  }

  async eliminarProducto(codigo: string) {
    try {
      const autor = this.provider.wallet.publicKey;

      const tx = await this.program.methods
        .eliminarProducto(codigo)
        .accounts({
          autor: autor,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error eliminando producto:", error);
      return { success: false, error };
    }
  }

  // ==================== VENTAS ====================

  async registrarVenta(
    folio: string,
    items: any[],
    total: number,
    clienteId?: string,
    descuento?: number
  ) {
    try {
      const vendedor = this.provider.wallet.publicKey;
      
      const [ventaPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("venta"), Buffer.from(folio)],
        this.program.programId
      );

      const itemsInput = items.map(item => ({
        codigo: item.codigo,
        nombre: item.nombre,
        precio: new BN(item.precio),
        cantidad: new BN(item.cantidad),
        subtotal: new BN(item.subtotal),
      }));

      const tx = await this.program.methods
        .registrarVenta(
          folio,
          itemsInput,
          new BN(total),
          clienteId || null,
          descuento ? new BN(descuento) : null
        )
        .accounts({
          venta: ventaPDA,
          vendedor: vendedor,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx, ventaPDA };
    } catch (error) {
      console.error("Error registrando venta:", error);
      return { success: false, error };
    }
  }

  async obtenerTodasVentas() {
    try {
      const ventas = await this.program.account.venta.all();
      return ventas;
    } catch (error) {
      console.error("Error obteniendo ventas:", error);
      return [];
    }
  }

  // ==================== CLIENTES ====================

  async registrarCliente(
    id: string,
    nombre: string,
    telefono: string,
    email: string,
    direccion: string
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
      console.error("Error registrando cliente:", error);
      return { success: false, error };
    }
  }

  async obtenerTodosClientes() {
    try {
      const clientes = await this.program.account.cliente.all();
      return clientes;
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      return [];
    }
  }

  async actualizarCliente(
    id: string,
    nombre: string,
    telefono: string,
    email: string,
    direccion: string
  ) {
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
      console.error("Error actualizando cliente:", error);
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
      console.error("Error eliminando cliente:", error);
      return { success: false, error };
    }
  }

  // ==================== PROVEEDORES ====================

  async crearProveedor(
    id: string,
    nombre: string,
    contacto: string,
    telefono: string,
    email: string,
    direccion: string
  ) {
    try {
      const autor = this.provider.wallet.publicKey;

      const [proveedorPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("proveedor"), Buffer.from(id), autor.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .crearProveedor(id, nombre, contacto, telefono, email, direccion)
        .accounts({
          proveedor: proveedorPDA,
          autor: autor,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx, proveedorPDA };
    } catch (error) {
      console.error("Error creando proveedor:", error);
      return { success: false, error };
    }
  }

  async obtenerTodosProveedores() {
    try {
      const proveedores = await this.program.account.proveedor.all();
      return proveedores;
    } catch (error) {
      console.error("Error obteniendo proveedores:", error);
      return [];
    }
  }
}