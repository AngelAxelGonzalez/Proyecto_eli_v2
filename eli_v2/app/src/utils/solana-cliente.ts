import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@project-serum/anchor';
import idl from './idl/eli_v2.json';

const PROGRAM_ID = new PublicKey("H7PyhEsvDRsWkqyHdbJ8oJ17w6EA2tR4eG5ruJCEQac");
const NETWORK = "https://api.devnet.solana.com";

export class EliClient {
  private program: Program;
  private provider: AnchorProvider;
  private connection: Connection;
  
  constructor(wallet: any) {
    this.connection = new Connection(NETWORK);
    this.provider = new AnchorProvider(this.connection, wallet, {});
    this.program = new Program(idl as Idl, PROGRAM_ID, this.provider);
  }
  
  async crearProducto(
    codigo: string,
    nombre: string,
    precio: number,
    costo: number,
    cantidad: number,
    categoria: string,
    proveedor: string
  ) {
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
    
    return { tx, productoPDA };
  }
  
  async obtenerProducto(codigo: string, autor: PublicKey) {
    const [productoPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("producto"), Buffer.from(codigo), autor.toBuffer()],
      this.program.programId
    );
    
    const producto = await this.program.account.producto.fetch(productoPDA);
    return producto;
  }
  
  async registrarCliente(
    id: string,
    nombre: string,
    telefono: string,
    email: string,
    direccion: string
  ) {
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
    
    return { tx, clientePDA };
  }
  
  async obtenerCliente(id: string, autor: PublicKey) {
    const [clientePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("cliente"), Buffer.from(id), autor.toBuffer()],
      this.program.programId
    );
    
    const cliente = await this.program.account.cliente.fetch(clientePDA);
    return cliente;
  }
}