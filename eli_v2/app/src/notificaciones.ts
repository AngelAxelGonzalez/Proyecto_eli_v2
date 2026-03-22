import { SolanaClient } from './client';

export interface Notificacion {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: number; // 0=Info, 1=Éxito, 2=Advertencia, 3=Error
    fecha: Date;
    leida: boolean;
}

export class NotificacionesService {
    private client: SolanaClient;
    private notificaciones: Notificacion[] = [];
    private listeners: Array<(notificacion: Notificacion) => void> = [];

    constructor(client: SolanaClient) {
        this.client = client;
        console.log("✅ Servicio de notificaciones inicializado");
    }

    /**
     * Enviar una nueva notificación
     */
    async enviarNotificacion(
        titulo: string,
        mensaje: string,
        tipo: number = 0
    ): Promise<Notificacion | null> {
        try {
            // Crear notificación local
            const idGenerada = 'NOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}';
            
            const notificacion: Notificacion = {
                id: idGenerada,
                titulo: titulo,
                mensaje: mensaje,
                tipo: tipo,
                fecha: new Date(),
                leida: false,
            };
            
            // Guardar localmente
            this.notificaciones.unshift(notificacion);
            
            // Notificar a los listeners
            this.listeners.forEach(listener => listener(notificacion));
            
            // Mostrar en consola
            this.mostrarNotificacion(notificacion);
            
            // Intentar guardar en blockchain (opcional)
            try {
                const resultado = await this.client.crearNotificacion(titulo, mensaje, tipo);
                if (resultado.success) {
                    console.log("   📡 Notificación guardada en blockchain");
                }
            } catch (error) {
                // No es crítico si falla guardar en blockchain
                console.log("   ⚠️ Notificación solo guardada localmente");
            }
            
            return notificacion;
        } catch (error) {
            console.error("❌ Error enviando notificación:", error);
            return null;
        }
    }

    /**
     * Mostrar notificación en consola con colores
     */
    private mostrarNotificacion(notificacion: Notificacion): void {
        const iconos = ["ℹ️", "✅", "⚠️", "❌"];
        const colores = ["\x1b[36m", "\x1b[32m", "\x1b[33m", "\x1b[31m"];
        const reset = "\x1b[0m";
        
        const icono = iconos[notificacion.tipo] || "📢";
        const color = colores[notificacion.tipo] || "\x1b[37m";
        
        console.log('\n${color}${icono} NOTIFICACIÓN: ${notificacion.titulo}${reset}');
        console.log(`   ${notificacion.mensaje}`);
        console.log(`   📅 ${notificacion.fecha.toLocaleString()}`);
    }

    /**
     * Suscribirse a nuevas notificaciones
     */
    suscribir(callback: (notificacion: Notificacion) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Obtener todas las notificaciones
     */
    obtenerTodas(): Notificacion[] {
        return this.notificaciones;
    }

    /**
     * Obtener notificaciones no leídas
     */
    obtenerNoLeidas(): Notificacion[] {
        return this.notificaciones.filter(n => !n.leida);
    }

    /**
     * Marcar notificación como leída
     */
    marcarComoLeida(id: string): boolean {
        const notificacion = this.notificaciones.find(n => n.id === id);
        if (notificacion) {
            notificacion.leida = true;
            return true;
        }
        return false;
    }

    /**
     * Marcar todas como leídas
     */
    marcarTodasComoLeidas(): void {
        this.notificaciones.forEach(n => n.leida = true);
    }

    /**
     * Verificar stock bajo automáticamente
     */
    async verificarStockBajo(): Promise<void> {
        try {
            const reporte = await this.client.generarReporteInventario();
            if (reporte && reporte.stockBajo > 0) {
                await this.enviarNotificacion(
                    "⚠️ ALERTA DE STOCK BAJO",
                    'Hay ${reporte.stockBajo} productos con stock bajo. ¡Revisar inventario!',
                    2 // Advertencia
                );
            } else {
                console.log("✅ No hay productos con stock bajo");
            }
        } catch (error) {
            console.error("Error verificando stock bajo:", error);
        }
    }

    /**
     * Verificar productos por caducar
     */
    async verificarCaducidad(): Promise<void> {
        try {
            const reporte = await this.client.generarReporteInventario();
            if (reporte && reporte.productosPorCaducar > 0) {
                await this.enviarNotificacion(
                    "📅 PRODUCTOS POR CADUCAR",
                    '${reporte.productosPorCaducar} productos caducan en los próximos 30 días.',
                    2
                );
            }
        } catch (error) {
            console.error("Error verificando caducidad:", error);
        }
    }

    /**
     * Notificar cumpleaños de clientes
     */
    async verificarCumpleaños(clientes: any[]): Promise<void> {
        const hoy = new Date();
        const hoyStr = '${hoy.getDate()}/${hoy.getMonth() + 1}';

        console.log('🎂 Verificando cumpleaños para hoy: ${hoyStr}');
        
        for (const cliente of clientes) {
            if (cliente && cliente.fechaNacimiento) {
                try{
                    const fechaNac = new Date(cliente.fechaNacimiento);
                    const cumpleStr = '${fechaNac.getDate()}/${fechaNac.getMonth() + 1}';
                

                    if (cumpleStr === hoyStr) {
                       await this.enviarNotificacion(
                           "🎂 CUMPLEAÑOS",
                           '¡El cliente ${cliente.nombre} cumple años hoy! Envíale un saludo especial.',
                           1
                       );
                       console.log('Cumpleaños detectado: ${cliente.nombre}');
                   }
                
                }catch (error){
                   console.error('Error verificando cumpleaños para ${cliente.nombre]');
                }
            }
        }
    }

    /**
     * Iniciar monitoreo automático
     */
    iniciarMonitoreo(intervaloMs: number = 60000): NodeJS.Timeout {
        console.log('🔔 Monitoreo iniciado (intervalo: ${intervaloMs / 1000}s)');
        
        // Verificar cada intervalo
        const interval = setInterval(async () => {
            await this.verificarStockBajo();
            await this.verificarCaducidad();
        }, intervaloMs);
        
        return interval;
    }

    /**
     * Detener monitoreo
     */
    detenerMonitoreo(interval: NodeJS.Timeout): void {
        clearInterval(interval);
        console.log("⏹️ Monitoreo detenido");
    }

    /**
     * Mostrar todas las notificaciones en consola
     */
    mostrarTodas(): void {
        console.log("\n" + "=".repeat(60));
        console.log("📢 HISTORIAL DE NOTIFICACIONES");
        console.log("=".repeat(60));
        
        if (this.notificaciones.length === 0) {
            console.log("   No hay notificaciones");
            return;
        }
        
        this.notificaciones.forEach((n, i) => {
            const estado = n.leida ? "✓" : "○";
            const iconos = ["ℹ️", "✅", "⚠️", "❌"];
            const icono = iconos[n.tipo] || "📢";
            
            console.log('\n${estado} [${i + 1}] ${icono} ${n.titulo}');
            console.log(`   ${n.mensaje}`);
            console.log(`   📅 ${n.fecha.toLocaleString()}`);
        });
        
        const noLeidas = this.obtenerNoLeidas().length;
        console.log('\n📊 Total: ${this.notificaciones.length} | No leídas: ${noLeidas}');
    }
}

export default NotificacionesService;