import axios from 'axios';

export interface Moneda {
    codigo: string;      // USD, EUR, MXN, etc.
    simbolo: string;     // $, €, £
    nombre: string;      // Dólar, Euro, Peso
    tipo_cambio: number; // Contra MXN
    fecha_actualizacion: Date;
    activa: boolean;
}

export class ServicioMonedas {
    private monedas: Map<string, Moneda> = new Map();
    private apiUrl: string = "https://api.exchangerate-api.com/v4/latest/MXN";
    
    constructor() {
        this.inicializarMonedas();
        this.actualizarTiposCambio();
        
        // Actualizar cada hora
        setInterval(() => this.actualizarTiposCambio(), 3600000);
    }
    
    private inicializarMonedas(): void {
        const monedasBase: Moneda[] = [
            { codigo: "MXN", simbolo: "$", nombre: "Peso Mexicano", tipo_cambio: 1, fecha_actualizacion: new Date(), activa: true },
            { codigo: "USD", simbolo: "$", nombre: "Dólar Americano", tipo_cambio: 0.058, fecha_actualizacion: new Date(), activa: true },
            { codigo: "EUR", simbolo: "€", nombre: "Euro", tipo_cambio: 0.054, fecha_actualizacion: new Date(), activa: true },
            { codigo: "CAD", simbolo: "$", nombre: "Dólar Canadiense", tipo_cambio: 0.079, fecha_actualizacion: new Date(), activa: true },
            { codigo: "GBP", simbolo: "£", nombre: "Libra Esterlina", tipo_cambio: 0.046, fecha_actualizacion: new Date(), activa: true },
            { codigo: "JPY", simbolo: "¥", nombre: "Yen Japonés", tipo_cambio: 8.78, fecha_actualizacion: new Date(), activa: true },
            { codigo: "COP", simbolo: "$", nombre: "Peso Colombiano", tipo_cambio: 230, fecha_actualizacion: new Date(), activa: true },
            { codigo: "ARS", simbolo: "$", nombre: "Peso Argentino", tipo_cambio: 12.5, fecha_actualizacion: new Date(), activa: true },
            { codigo: "BRL", simbolo: "R$", nombre: "Real Brasileño", tipo_cambio: 0.29, fecha_actualizacion: new Date(), activa: true },
            { codigo: "CLP", simbolo: "$", nombre: "Peso Chileno", tipo_cambio: 54, fecha_actualizacion: new Date(), activa: true },
        ];
        
        monedasBase.forEach(m => this.monedas.set(m.codigo, m));
    }
    
    async actualizarTiposCambio(): Promise<void> {
        try {
            console.log("🔄 Actualizando tipos de cambio...");
            const response = await axios.get(this.apiUrl);

            const data = response.data as any ;
            const rates = data.rates;
            
            for (const [codigo, moneda] of this.monedas) {
                if (rates[codigo]) {
                    moneda.tipo_cambio = rates[codigo];
                    moneda.fecha_actualizacion = new Date();
                }
            }
            
            console.log("✅ Tipos de cambio actualizados");
        } catch (error) {
            console.error("❌ Error actualizando tipos de cambio:", error);
            // Usar valores en caché
        }
    }
    
    convertir(monto: number, de: string, a: string): number {
        const monedaOrigen = this.monedas.get(de);
        const monedaDestino = this.monedas.get(a);
        
        if (!monedaOrigen || !monedaDestino) {
            throw new Error('Moneda no soportada: ${de} o ${a}');
        }
        
        // Convertir a MXN primero, luego a moneda destino
        const enMXN = monto / monedaOrigen.tipo_cambio;
        const resultado = enMXN * monedaDestino.tipo_cambio;
        
        return Math.round(resultado * 100) / 100;
    }
    
    obtenerMoneda(codigo: string): Moneda | undefined {
        return this.monedas.get(codigo);
    }
    
    listarMonedas(): Moneda[] {
        return Array.from(this.monedas.values()).filter(m => m.activa);
    }
    
    formatearMonto(monto: number, moneda: string): string {
        const monedaObj = this.monedas.get(moneda);
        if (!monedaObj) return '${monto}';
        
        return '${monedaObj.simbolo}${monto.toFixed(2)} ${monedaObj.codigo}';
    }
    
    async agregarMonedaPersonalizada(codigo: string, simbolo: string, nombre: string, tipo_cambio: number): Promise<void> {
        const nuevaMoneda: Moneda = {
            codigo: codigo.toUpperCase(),
            simbolo,
            nombre,
            tipo_cambio,
            fecha_actualizacion: new Date(),
            activa: true
        };
        
        this.monedas.set(nuevaMoneda.codigo, nuevaMoneda);
        console.log('✅ Moneda ${codigo} agregada');
    }
}

export default ServicioMonedas;
