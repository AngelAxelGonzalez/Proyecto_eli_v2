import { SolanaClient } from './client';
import { ServicioMonedas } from './monedas';

export interface Prediccion {
    producto: string;
    fecha: Date;
    ventas_estimadas: number;
    ingresos_estimados: number;
    confianza: number;
    factores: Factor[];
}

export interface Factor {
    nombre: string;
    impacto: number;
    descripcion: string;
}

export interface Recomendacion {
    tipo: string;
    titulo: string;
    descripcion: string;
    prioridad: number;
    impacto_estimado: number;
}

export class IAPredictor {
    private client: SolanaClient;
    private monedas: ServicioMonedas;
    private datosHistoricos: Map<string, any[]> = new Map();

    constructor(client: SolanaClient, monedas: ServicioMonedas) {
        this.client = client;
        this.monedas = monedas;
        console.log("🧠 Motor de IA inicializado");
    }

    async cargarDatosHistoricos(): Promise<void> {
        console.log("📊 Cargando datos históricos para IA...");
        
        try {
            const ventas = await this.client.obtenerTodasVentas();
            const productos = await this.client.obtenerTodosProductos();
            
            for (const producto of productos) {
                const productoObj = producto as any;
                const codigo = productoObj.codigo;
                
                // Filtrar ventas de este producto
                const ventasProducto = ventas.filter((v: any) => {
                    if (!v.items) return false;
                    return v.items.some((item: any) => item.codigo === codigo);
                });
                
                // Procesar datos
                const datosProcesados = ventasProducto.map((v: any) => {
                    // Obtener cantidad vendida de este producto
                    let cantidad = 0;
                    if (v.items) {
                        const item = v.items.find((i: any) => i.codigo === codigo);
                        if (item) {
                            if (typeof item.cantidad === 'object' && item.cantidad.toNumber) {
                                cantidad = item.cantidad.toNumber();
                            } else {
                                cantidad = Number(item.cantidad);
                            }
                        }
                    }
                    
                    // Obtener total de la venta
                    let total = 0;
                    if (v.total) {
                        if (typeof v.total === 'object' && v.total.toNumber) {
                            total = v.total.toNumber();
                        } else {
                            total = Number(v.total);
                        }
                    }
                    
                    // Obtener fecha
                    let fecha = new Date();
                    if (v.fecha) {
                        if (typeof v.fecha === 'object' && v.fecha.toNumber) {
                            fecha = new Date(v.fecha.toNumber() * 1000);
                        } else {
                            fecha = new Date(Number(v.fecha) * 1000);
                        }
                    }
                    
                    return {
                        fecha: fecha,
                        total: total,
                        cantidad: cantidad,
                        dia_semana: fecha.getDay(),
                        mes: fecha.getMonth(),
                        año: fecha.getFullYear()
                    };
                });
                
                this.datosHistoricos.set(codigo, datosProcesados);
            }
            
            console.log('✅ Datos cargados para ${this.datosHistoricos.size} productos');
        } catch (error) {
            console.error("❌ Error cargando datos históricos:", error);
        }
    }

    async predecirVentas(productoCodigo: string, dias: number = 7): Promise<Prediccion[]> {
        try {
            const datos = this.datosHistoricos.get(productoCodigo);
            
            if (!datos || datos.length < 3) {
                return [{
                    producto: productoCodigo,
                    fecha: new Date(),
                    ventas_estimadas: 0,
                    ingresos_estimados: 0,
                    confianza: 20,
                    factores: [{ 
                        nombre: "Datos insuficientes", 
                        impacto: -0.5, 
                        descripcion: "No hay suficientes datos históricos para hacer predicciones precisas" 
                    }]
                }];
            }
            
            const predicciones: Prediccion[] = [];
            
            // Calcular promedios
            const ventasPromedio = datos.reduce((sum, d) => sum + d.cantidad, 0) / datos.length;
            const ingresosPromedio = datos.reduce((sum, d) => sum + d.total, 0) / datos.length;
            
            // Generar predicciones para los próximos días
            for (let i = 1; i <= dias; i++) {
                const fechaPrediccion = new Date();
                fechaPrediccion.setDate(fechaPrediccion.getDate() + i);
                
                predicciones.push({
                    producto: productoCodigo,
                    fecha: fechaPrediccion,
                    ventas_estimadas: Math.round(ventasPromedio),
                    ingresos_estimados: Math.round(ingresosPromedio),
                    confianza: Math.min(95, Math.max(50, 75 - (i * 2))),
                    factores: []
                });
            }
            
            return predicciones;
        } catch (error) {
            console.error("Error en predecirVentas:", error);
            return [];
        }
    }

    async generarRecomendaciones(): Promise<Recomendacion[]> {
        try {
            const recomendaciones: Recomendacion[] = [];
            const productos = await this.client.obtenerTodosProductos();
            
            for (const producto of productos) {
                const productoObj = producto as any;
                const nombre = productoObj.nombre || "Producto";
                const codigo = productoObj.codigo;
                
                // Obtener stock de forma segura
                let stock = 0;
                if (productoObj.cantidad) {
                    if (typeof productoObj.cantidad === 'object' && productoObj.cantidad.toNumber) {
                        stock = productoObj.cantidad.toNumber();
                    } else {
                        stock = Number(productoObj.cantidad);
                    }
                }
                
                // Verificar stock bajo
                if (stock <= 5 && stock > 0) {
                    recomendaciones.push({
                        tipo: "inventario",
                        titulo: '⚠️ Reabastecer ${nombre}',
                        descripcion: 'Stock bajo: solo ${stock} unidades disponibles. Se recomienda reabastecer pronto.',
                        prioridad: stock <= 2 ? 10 : 8,
                        impacto_estimado: 15
                    });
                }
                
                // Verificar si el producto se está vendiendo bien
                const datos = this.datosHistoricos.get(codigo);
                if (datos && datos.length >= 5) {
                    const ventasRecientes = datos.slice(-5).reduce((sum, d) => sum + d.cantidad, 0);
                    if (ventasRecientes > 10) {
                        recomendaciones.push({
                            tipo: "producto",
                            titulo: '📈 Promocionar ${nombre}',
                            descripcion: 'Este producto tiene alta demanda (${ventasRecientes} ventas recientes). Considera una promoción.',
                            prioridad: 7,
                            impacto_estimado: 20
                        });
                    }
                }
            }
            
            return recomendaciones;
        } catch (error) {
            console.error("Error generando recomendaciones:", error);
            return [];
        }
    }

    async obtenerMetricasIA(): Promise<any> {
        try {
            const productos = await this.client.obtenerTodosProductos();
            let totalPredicciones = 0;
            
            for (const producto of productos) {
                const codigo = (producto as any).codigo;
                const datos = this.datosHistoricos.get(codigo);
                if (datos && datos.length >= 3) {
                    totalPredicciones += 7;
                }
            }
            
            return {
                productos_analizados: productos.length,
                total_predicciones: totalPredicciones,
                ventas_estimadas_7dias: productos.length * 3,
                confianza_promedio: 75,
                ultima_actualizacion: new Date()
            };
        } catch (error) {
            console.error("Error obteniendo métricas:", error);
            return {
                productos_analizados: 0,
                total_predicciones: 0,
                ventas_estimadas_7dias: 0,
                confianza_promedio: 0,
                ultima_actualizacion: new Date()
            };
        }
    }
}

export default IAPredictor;