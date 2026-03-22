import { SolanaClient } from './client';
import { ServicioMonedas } from './monedas';
import compromise from 'compromise';

export interface MensajeChat {
    id: string;
    usuario: string;
    mensaje: string;
    respuesta: string;
    timestamp: Date;
    intencion: string;
    entidades: any;
}

export class ChatbotService {
    private client: SolanaClient;
    private monedas: ServicioMonedas;
    private historial: MensajeChat[] = [];
    private listeners: Array<(mensaje: MensajeChat) => void> = [];

    constructor(client: SolanaClient, monedas: ServicioMonedas) {
        this.client = client;
        this.monedas = monedas;
        console.log("🤖 Chatbot inicializado");
    }

    async procesarMensaje(usuario: string, mensaje: string): Promise<string> {
        console.log('📨 Mensaje de ${usuario}: ${mensaje}');
        
        // Analizar mensaje con NLP
        const doc = compromise(mensaje.toLowerCase());
        const intencion = this.detectarIntencion(doc, mensaje);
        const entidades = this.extraerEntidades(doc, mensaje);
        
        // Generar respuesta según intención
        let respuesta = "";
        
        switch(intencion) {
            case "saludo":
                respuesta = this.respuestaSaludo();
                break;
            case "consultar_stock":
                respuesta = await this.consultarStock(entidades.producto);
                break;
            case "consultar_precio":
                respuesta = await this.consultarPrecio(entidades.producto, entidades.moneda);
                break;
            case "consultar_ventas_hoy":
                respuesta = await this.consultarVentasHoy();
                break;
            case "productos_destacados":
                respuesta = await this.productosDestacados();
                break;
            case "ayuda":
                respuesta = this.mostrarAyuda();
                break;
            case "despedida":
                respuesta = this.respuestaDespedida();
                break;
            case "cambio_moneda":
                respuesta = await this.cambioMoneda(entidades.monto, entidades.origen, entidades.destino);
                break;
            case "puntos_cliente":
                respuesta = await this.consultarPuntos(entidades.cliente);
                break;
            default:
                respuesta = this.respuestaNoEntendido();
        }
        
        // Guardar en historial
        const mensajeChat: MensajeChat = {
            id: 'MSG_${Date.now()}',
            usuario,
            mensaje,
            respuesta,
            timestamp: new Date(),
            intencion,
            entidades
        };
        
        this.historial.push(mensajeChat);
        this.listeners.forEach(listener => listener(mensajeChat));
        
        console.log('🤖 Respuesta: ${respuesta}');
        return respuesta;
    }
    
    private detectarIntencion(doc: any, mensaje: string): string {
        const texto = mensaje.toLowerCase();
        
        // Saludos
        if (texto.match(/hola|buenos dias|buenas tardes|qué tal|saludos/i)) {
            return "saludo";
        }
        
        // Stock
        if (texto.match(/stock|inventario|hay|disponible|tienes/i)) {
            return "consultar_stock";
        }
        
        // Precios
        if (texto.match(/precio|cuesta|vale|cuánto|costo|valor/i)) {
            return "consultar_precio";
        }
        
        // Ventas
        if (texto.match(/ventas?|vendido|facturación/i)) {
            return "consultar_ventas_hoy";
        }
        
        // Productos destacados
        if (texto.match(/destacados|populares|más vendido|recomiendas/i)) {
            return "productos_destacados";
        }
        
        // Monedas
        if (texto.match(/cambio|convertir|moneda|dolar|euro|peso/i)) {
            return "cambio_moneda";
        }
        
        // Puntos
        if (texto.match(/puntos|fidelidad|recompensa|nivel/i)) {
            return "puntos_cliente";
        }
        
        // Despedida
        if (texto.match(/adiós|chao|hasta luego|nos vemos|gracias/i)) {
            return "despedida";
        }
        
        // Ayuda
        if (texto.match(/ayuda|opciones|comandos|qué puedes hacer/i)) {
            return "ayuda";
        }
        
        return "desconocido";
    }
    
    private extraerEntidades(doc: any, mensaje: string): any {
        const entidades: any = {};
        
        // Extraer producto
        const palabras = mensaje.toLowerCase().split(" ");
        const productosComunes = ["camisa", "pantalon", "zapatos", "laptop", "telefono", "tablet"];
        for (const palabra of palabras) {
            if (productosComunes.includes(palabra)) {
                entidades.producto = palabra;
                break;
            }
        }
        
        // Extraer moneda
        if (mensaje.includes("dolar") || mensaje.includes("usd")) entidades.moneda = "USD";
        if (mensaje.includes("euro") || mensaje.includes("eur")) entidades.moneda = "EUR";
        if (mensaje.includes("peso") || mensaje.includes("mxn")) entidades.moneda = "MXN";
        
        // Extraer monto
        const montoMatch = mensaje.match(/\d+(\.\d+)?/);
        if (montoMatch) entidades.monto = parseFloat(montoMatch[0]);
        
        return entidades;
    }
    
    private respuestaSaludo(): string {
        const saludos = [
            "¡Hola! ¿En qué puedo ayudarte hoy? 😊",
            "¡Buen día! Cuéntame, ¿qué necesitas?",
            "¡Saludos! Estoy aquí para ayudarte con tu consulta.",
            "¡Hola! ¿Necesitas información sobre productos o precios?"
        ];
        return saludos[Math.floor(Math.random() * saludos.length)];
    }
    
    private async consultarStock(producto?: string): Promise<string> {
        try {
            if (!producto) {
                return "¿Qué producto te interesa? Por favor especifica el nombre.";
            }
            
            const productos = await this.client.obtenerTodosProductos();
            const encontrado = productos.find((p: any) => 
                p.nombre.toLowerCase().includes(producto)
            );
            
            if (encontrado) {
                const cantidadData = (encontrado as any).cantidad;
                const stock = cantidadData ? (cantidadData.toNumber ? cantidadData.toNumber() : Number(cantidadData)) : 0;
                return '📦 ${encontrado.nombre}: ${stock} unidades (${estado})';
            } else {
                return '❌ No encontré "${producto}". ¿Quieres que te muestre productos similares?';
            }
        } catch (error) {
            return "Lo siento, hubo un error consultando el stock. Intenta más tarde.";
        }
    }
    
    private async consultarPrecio(producto?: string, moneda: string = "MXN"): Promise<string> {
        try {
            if (!producto) {
                return "¿De qué producto quieres saber el precio?";
            }
            
            const productos = await this.client.obtenerTodosProductos();
            const encontrado = productos.find((p: any) => 
                p.nombre.toLowerCase().includes(producto)
            );
            
            if (encontrado) {
                const precioData = (encontrado as any).precio;
                const precioMNX = precioData ? (precioData.toNumber ? precioData.toNumber() : Number(precioData)) : 0;

                const precioConvertido = this.monedas.convertir(precioMNX, "MNX" , moneda)
                const monedaObj = this.monedas.obtenerMoneda(moneda);
                
                return '💰 ${encontrado.nombre}: ${monedaObj?.simbolo}${precioConvertido.toFixed(2)} ${moneda}';
            } else {
                return '❌ No encontré "${producto}". ¿Quieres que te muestre productos similares?';
            }
        } catch (error) {
            return "Lo siento, hubo un error consultando el precio.";
        }
    }
    
    private async consultarVentasHoy(): Promise<string> {
        try {
            const ventas = await this.client.obtenerTodasVentas();
            const hoy = new Date();
            const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            
            const ventasHoy = ventas.filter((v: any) => {
                const fechaVenta = new Date(v.fecha?.toNumber() * 1000);
                return fechaVenta >= inicioHoy;
            });
            
            const totalVentas = ventasHoy.length;
            const totalMonto = ventasHoy.reduce((sum: number, v: any) => sum + (v.total?.toNumber() || 0), 0);
            
            return '📊 Ventas de hoy: ${totalVentas} transacciones\n💰 Total: $${totalMonto.toFixed(2)} MXN';
        } catch (error) {
            return "Lo siento, no pude obtener las ventas de hoy.";
        }
    }
    
    private async productosDestacados(): Promise<string> {
        try {
            const productos = await this.client.obtenerTodosProductos();
            const topProductos = [...productos]
                .sort((a: any, b: any) => (b.cantidad?.toNumber() || 0) - (a.cantidad?.toNumber() || 0))
                .slice(0, 5);
            
            let respuesta = "🌟 PRODUCTOS DESTACADOS 🌟\n";
            topProductos.forEach((p: any, i: number) => {
                respuesta += '${i + 1}. ${p.nombre} - $${(p.precio?.toNumber() || 0).toFixed(2)} MXN\n';
            });
            
            return respuesta;
        } catch (error) {
            return "Lo siento, no pude obtener los productos destacados.";
        }
    }
    
    private async cambioMoneda(monto?: number, origen?: string, destino?: string): Promise<string> {
        if (!monto || !origen || !destino) {
            return "Por favor especifica: 'convertir [monto] [moneda_origen] a [moneda_destino]'\nEjemplo: convertir 100 USD a MXN";
        }
        
        try {
            const resultado = this.monedas.convertir(monto, origen.toUpperCase(), destino.toUpperCase());
            const monedaOrigen = this.monedas.obtenerMoneda(origen.toUpperCase());
            const monedaDestino = this.monedas.obtenerMoneda(destino.toUpperCase());
            
            return '💱 ${monedaOrigen?.simbolo}${monto} ${origen.toUpperCase()} = ${monedaDestino?.simbolo}${resultado.toFixed(2)} ${destino.toUpperCase()}';
        } catch (error) {
            return "Lo siento, no pude realizar la conversión. Monedas soportadas: USD, EUR, MXN, CAD, GBP, JPY";
        }
    }
    
    private async consultarPuntos(cliente?: string): Promise<string> {
        if (!cliente) {
            return "Por favor proporciona tu ID de cliente o email para consultar tus puntos.";
        }
        
        try {
            const clientes = await this.client.obtenerTodosClientes();
            const encontrado = clientes.find((c: any) => 
                c.email?.toLowerCase().includes(cliente) || 
                c.nombre?.toLowerCase().includes(cliente)
            );
            
            if (encontrado) {
                let puntos = 0;
                const puntosRaw = encontrado.puntos_acumulados;

                if (puntosRaw){
                    if (typeof puntosRaw === 'object' && (puntosRaw as any).toNumber) {
                        puntos = (puntosRaw as any).toNumber();
                    } else if (typeof puntosRaw === 'number'){
                        puntos = puntosRaw;  
                    }
                    } else {
                        puntos = Number(puntosRaw);
                    } 
                      
                const puntosNumero = Number(puntos) || 0;
                const nivel = this.obtenerNivel(puntosNumero);
                const valor = puntosNumero / 10;
                
                return '⭐ CLIENTE: ${encontrado.nombre}\n🎯 Nivel: ${nivel}\n⭐ Puntos: ${puntos}\n💰 Valor en dinero: $${valor.toFixed(2)} MXN';
            } else {
                return "No encontré un cliente con esos datos. ¿Quieres registrarte?";
            }
        } catch (error) {
            return "Lo siento, no pude consultar tus puntos.";
        }
    }
    
    private obtenerNivel(puntos: number): string {
        if (puntos >= 100000) return "👑 DIAMANTE (15% descuento)";
        if (puntos >= 20000) return "💎 PLATINO (10% descuento)";
        if (puntos >= 5000) return "🥇 ORO (5% descuento)";
        if (puntos >= 1000) return "🥈 PLATA (2% descuento)";
        return "🥉 BRONCE";
    }
    
    private mostrarAyuda(): string {
        return `🤖 COMANDOS DISPONIBLES:
        
📦 PRODUCTOS:
   • "¿Hay [producto]?" - Consultar stock
   • "¿Cuánto cuesta [producto]?" - Consultar precio
   • "Productos destacados" - Ver lo más popular

💰 VENTAS:
   • "Ventas de hoy" - Resumen del día

💱 MONEDAS:
   • "Convertir 100 USD a MXN" - Tipo de cambio

⭐ CLIENTES:
   • "Mis puntos" - Consultar puntos de fidelidad

🤝 OTROS:
   • "Ayuda" - Mostrar este mensaje
   • "Gracias" - Despedida

¿En qué más puedo ayudarte?`;
    }
    
    private respuestaDespedida(): string {
        const despedidas = [
            "¡Hasta luego! Vuelve pronto 😊",
            "¡Gracias por tu consulta! Que tengas un excelente día 🌟",
            "¡Nos vemos! Estaré aquí cuando me necesites 🤖",
            "¡Hasta pronto! No olvides revisar tus puntos de fidelidad ⭐"
        ];
        return despedidas[Math.floor(Math.random() * despedidas.length)];
    }
    
    private respuestaNoEntendido(): string {
        return "No entendí tu mensaje. ¿Puedes reformularlo? Escribe 'ayuda' para ver los comandos disponibles.";
    }
    
    obtenerHistorial(): MensajeChat[] {
        return this.historial;
    }
    
    suscribir(callback: (mensaje: MensajeChat) => void): void {
        this.listeners.push(callback);
    }
    
    limpiarHistorial(): void {
        this.historial = [];
    }
}

export default ChatbotService;