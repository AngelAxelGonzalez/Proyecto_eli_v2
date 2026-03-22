import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { EliV2 } from "../target/types/eli_v2";
import { assert } from "chai";

describe("eli_v2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.EliV2 as Program<EliV2>;
  
  it("Crear producto", async () => {
    const codigo = "PROD001";
    const nombre = "Producto de prueba";
    const precio = new anchor.BN(10000);
    const costo = new anchor.BN(7000);
    const cantidad = new anchor.BN(10);
    const categoria = "General";
    const proveedor = "Proveedor Test";
    
    const [productoPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("producto"), Buffer.from(codigo), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    
    const tx = await program.methods
      .crearProducto(codigo, nombre, precio, costo, cantidad, categoria, proveedor)
      .accounts({
        producto: productoPDA,
        autor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transacción:", tx);
    
    const producto = await program.account.producto.fetch(productoPDA);
    assert.equal(producto.nombre, nombre);
    assert.equal(producto.precio.toString(), precio.toString());
    
    console.log("✅ Producto creado:", producto.nombre);
  });
  
  it("Registrar cliente", async () => {
    const id = "CLI001";
    const nombre = "Cliente Test";
    const telefono = "555-1234";
    const email = "cliente@test.com";
    const direccion = "Calle Principal 123";
    
    const [clientePDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("cliente"), Buffer.from(id), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    
    const tx = await program.methods
      .registrarCliente(id, nombre, telefono, email, direccion)
      .accounts({
        cliente: clientePDA,
        autor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transacción:", tx);
    console.log("✅ Cliente registrado:", nombre);
  });
});
