import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@project-serum/anchor';

/**
 * Clase para manejar credenciales y conexión a Solana
 * 
 * @example
 * const creds = new SolanaCredential("devnet", "H7PyhEsvDRsWkqyHdbJ8oJ17w6EA2tR4eG5ruJCEQac");
 * const connection = creds.getConnection();
 */
export class SolanaCredential {
  private connection: Connection;
  private network: string;
  private programId: PublicKey;

  constructor(network: string = "devnet", programId: string) {
    this.network = network;
    this.programId = new PublicKey(programId);
    
    // Configurar la URL según la red
    let url: string;
    switch (network) {
      case "devnet":
        url = "https://api.devnet.solana.com";
        break;
      case "mainnet":
        url = "https://api.mainnet-beta.solana.com";
        break;
      case "testnet":
        url = "https://api.testnet.solana.com";
        break;
      default:
        url = "http://localhost:8899";
    }
    
    this.connection = new Connection(url, "confirmed");
    console.log('🔌 Conectado a Solana ${network}: ${url}');
  }

  /**
   * Obtener la conexión a Solana
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Obtener el ID del programa
   */
  getProgramId(): PublicKey {
    return this.programId;
  }

  /**
   * Obtener la red actual
   */
  getNetwork(): string {
    return this.network;
  }

  /**
   * Crear un provider con una wallet
   */
  createProvider(wallet: any): AnchorProvider {
    return new AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
  }

  /**
   * Verificar si la red está disponible
   */
  async isNetworkAvailable(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log("📡 Versión de Solana:", version);
      return true;
    } catch (error) {
      console.error("❌ No se pudo conectar a la red Solana:", error);
      return false;
    }
  }

  /**
   * Obtener el saldo de una dirección
   */
  async getBalance(address: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(address);
      return balance / 1e9; // Convertir lamports a SOL
    } catch (error) {
      console.error("Error obteniendo balance:", error);
      return 0;
    }
  }

  /**
   * Formatear una dirección para mostrar
   */
  formatAddress(address: PublicKey | string, length: number = 8): string {
    const addr = address.toString();
    return '${addr.slice(0, length)}...${addr.slice(-length)}';
  }
}

// Configuración por defecto
export const DEFAULT_PROGRAM_ID = "H7PyhEsvDRsWkqyHdbJ8oJ17w6EA2tR4eG5ruJCEQac";
export const DEFAULT_NETWORK = "devnet";
