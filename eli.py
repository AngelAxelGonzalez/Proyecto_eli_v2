import json
import os
from datetime import datetime
import getpass
import hashlib
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Usar backend no interactivo
import numpy as np
from io import BytesIO
import base64

class ProyectoEli:
    def __init__(self):
        self.archivos = {
            'inventario': 'inventario.json',
            'ventas': 'ventas.json',
            'clientes': 'clientes.json',
            'ganancias': 'ganancias.json',
            'usuarios': 'usuarios.json'
        }
        self.usuario_actual = None
        self.cargar_datos()
        
    def cargar_datos(self):
        """Carga los datos desde los archivos JSON"""
        self.inventario = self.cargar_archivo('inventario', {})
        self.ventas = self.cargar_archivo('ventas', [])
        self.clientes = self.cargar_archivo('clientes', {})
        self.ganancias = self.cargar_archivo('ganancias', {'total': 0, 'historial': [], 'por_mes': {}})
        self.usuarios = self.cargar_archivo('usuarios', {})
        
        # Crear usuario admin por defecto si no hay usuarios
        if not self.usuarios:
            self.crear_admin_inicial()
    
    def crear_admin_inicial(self):
        """Crea un usuario administrador inicial"""
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        self.usuarios['admin'] = {
            'password': password_hash,
            'nombre': 'Administrador',
            'rol': 'admin',
            'fecha_creacion': datetime.now().strftime('%d/%m/%Y %H:%M')
        }
        self.guardar_datos()
    
    def cargar_archivo(self, nombre, default):
        """Carga un archivo JSON específico"""
        try:
            with open(self.archivos[nombre], 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            return default
    
    def guardar_datos(self):
        """Guarda todos los datos en sus respectivos archivos"""
        for nombre, archivo in self.archivos.items():
            with open(archivo, 'w', encoding='utf-8') as file:
                json.dump(getattr(self, nombre), file, indent=4, ensure_ascii=False)
    
    # ===== SISTEMA DE USUARIOS =====
    def login(self):
        """Sistema de login de usuarios"""
        os.system('cls' if os.name == 'nt' else 'clear')
        print("\n" + "="*50)
        print("🔐 SISTEMA DE LOGIN - PROYECTO ELI")
        print("="*50)
        
        intentos = 3
        while intentos > 0:
            usuario = input("\nUsuario: ")
            password = getpass.getpass("Contraseña: ")
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if usuario in self.usuarios and self.usuarios[usuario]['password'] == password_hash:
                self.usuario_actual = {
                    'username': usuario,
                    'nombre': self.usuarios[usuario]['nombre'],
                    'rol': self.usuarios[usuario]['rol']
                }
                print(f"\n✅ ¡Bienvenido {self.usuario_actual['nombre']}!")
                self.mostrar_saludo()
                return True
            else:
                intentos -= 1
                print(f"❌ Usuario o contraseña incorrectos. Intentos restantes: {intentos}")
        
        print("\n❌ Demasiados intentos fallidos. Saliendo del sistema...")
        return False
    
    def cambiar_password(self):
        """Permite al usuario cambiar su contraseña"""
        print("\n🔐 CAMBIAR CONTRASEÑA")
        password_actual = getpass.getpass("Contraseña actual: ")
        password_hash = hashlib.sha256(password_actual.encode()).hexdigest()
        
        if self.usuarios[self.usuario_actual['username']]['password'] != password_hash:
            print("❌ Contraseña actual incorrecta")
            return
        
        nueva = getpass.getpass("Nueva contraseña: ")
        confirmar = getpass.getpass("Confirmar nueva contraseña: ")
        
        if nueva != confirmar:
            print("❌ Las contraseñas no coinciden")
            return
        
        self.usuarios[self.usuario_actual['username']]['password'] = hashlib.sha256(nueva.encode()).hexdigest()
        self.guardar_datos()
        print("✅ Contraseña cambiada exitosamente")
    
    def crear_usuario(self):
        """Crea un nuevo usuario (solo admin)"""
        if self.usuario_actual['rol'] != 'admin':
            print("❌ No tienes permisos para crear usuarios")
            return
        
        print("\n👤 CREAR NUEVO USUARIO")
        username = input("Nombre de usuario: ")
        
        if username in self.usuarios:
            print("❌ El usuario ya existe")
            return
        
        nombre = input("Nombre completo: ")
        password = getpass.getpass("Contraseña: ")
        confirmar = getpass.getpass("Confirmar contraseña: ")
        
        if password != confirmar:
            print("❌ Las contraseñas no coinciden")
            return
        
        print("\nRol del usuario:")
        print("1. Administrador")
        print("2. Usuario normal")
        rol_opcion = input("Selecciona una opción (1-2): ")
        rol = 'admin' if rol_opcion == '1' else 'user'
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        self.usuarios[username] = {
            'password': password_hash,
            'nombre': nombre,
            'rol': rol,
            'fecha_creacion': datetime.now().strftime('%d/%m/%Y %H:%M'),
            'creado_por': self.usuario_actual['username']
        }
        
        self.guardar_datos()
        print(f"✅ Usuario '{username}' creado exitosamente")
    
    def mostrar_saludo(self):
        """Muestra un saludo personalizado según la hora"""
        hora = datetime.now().hour
        if hora < 12:
            saludo = "¡Buenos días!"
        elif hora < 18:
            saludo = "¡Buenas tardes!"
        else:
            saludo = "¡Buenas noches!"
        
        print("\n" + "="*50)
        print(f"🤖 {saludo} Soy Eli, tu asistente de negocios")
        print(f"👤 Usuario: {self.usuario_actual['nombre']} ({self.usuario_actual['rol']})")
        print("="*50)
        print(f"📅 Fecha: {datetime.now().strftime('%d/%m/%Y')}")
        print(f"⏰ Hora: {datetime.now().strftime('%H:%M')}")
        print("="*50 + "\n")
    
    # ===== FUNCIONALIDADES DE INVENTARIO =====
    def agregar_producto(self):
        """Agrega un nuevo producto al inventario"""
        print("\n📦 AGREGAR PRODUCTO AL INVENTARIO")
        nombre = input("Nombre del producto: ").capitalize()
        
        if nombre in self.inventario:
            print("❌ El producto ya existe en el inventario")
            return
        
        cantidad = int(input("Cantidad: "))
        precio_compra = float(input("Precio de compra: $"))
        precio_venta = float(input("Precio de venta: $"))
        categoria = input("Categoría del producto: ").capitalize()
        
        self.inventario[nombre] = {
            'cantidad': cantidad,
            'precio_compra': precio_compra,
            'precio_venta': precio_venta,
            'categoria': categoria,
            'fecha_agregado': datetime.now().strftime('%d/%m/%Y %H:%M'),
            'ultima_actualizacion': datetime.now().strftime('%d/%m/%Y %H:%M')
        }
        
        self.guardar_datos()
        print(f"✅ Producto '{nombre}' agregado exitosamente!")
    
    def editar_producto(self):
        """Edita un producto existente"""
        print("\n📝 EDITAR PRODUCTO")
        nombre = input("Nombre del producto a editar: ").capitalize()
        
        if nombre not in self.inventario:
            print("❌ Producto no encontrado")
            return
        
        print(f"\nProducto actual: {nombre}")
        print(f"Cantidad: {self.inventario[nombre]['cantidad']}")
        print(f"Precio compra: ${self.inventario[nombre]['precio_compra']}")
        print(f"Precio venta: ${self.inventario[nombre]['precio_venta']}")
        print(f"Categoría: {self.inventario[nombre]['categoria']}")
        
        print("\nDeja en blanco los campos que no quieras modificar")
        
        nueva_cantidad = input("Nueva cantidad: ")
        if nueva_cantidad:
            self.inventario[nombre]['cantidad'] = int(nueva_cantidad)
        
        nuevo_precio_compra = input("Nuevo precio de compra: $")
        if nuevo_precio_compra:
            self.inventario[nombre]['precio_compra'] = float(nuevo_precio_compra)
        
        nuevo_precio_venta = input("Nuevo precio de venta: $")
        if nuevo_precio_venta:
            self.inventario[nombre]['precio_venta'] = float(nuevo_precio_venta)
        
        nueva_categoria = input("Nueva categoría: ")
        if nueva_categoria:
            self.inventario[nombre]['categoria'] = nueva_categoria.capitalize()
        
        self.inventario[nombre]['ultima_actualizacion'] = datetime.now().strftime('%d/%m/%Y %H:%M')
        self.guardar_datos()
        print(f"✅ Producto '{nombre}' actualizado exitosamente!")
    
    def eliminar_producto(self):
        """Elimina un producto del inventario"""
        print("\n🗑️ ELIMINAR PRODUCTO")
        nombre = input("Nombre del producto a eliminar: ").capitalize()
        
        if nombre not in self.inventario:
            print("❌ Producto no encontrado")
            return
        
        confirmacion = input(f"¿Estás seguro de eliminar '{nombre}'? (s/n): ")
        if confirmacion.lower() == 's':
            del self.inventario[nombre]
            self.guardar_datos()
            print(f"✅ Producto '{nombre}' eliminado exitosamente!")
    
    def buscar_producto(self):
        """Busca productos por nombre o categoría"""
        print("\n🔍 BUSCAR PRODUCTOS")
        print("1. Buscar por nombre")
        print("2. Buscar por categoría")
        print("3. Ver productos con stock bajo")
        
        opcion = input("Selecciona una opción (1-3): ")
        
        if opcion == '1':
            termino = input("Ingresa el nombre del producto: ").lower()
            resultados = {k: v for k, v in self.inventario.items() if termino in k.lower()}
            
            if resultados:
                print(f"\n📦 Productos encontrados ({len(resultados)}):")
                for nombre, datos in resultados.items():
                    print(f"\n📌 {nombre}:")
                    print(f"   Cantidad: {datos['cantidad']} unidades")
                    print(f"   Precio: ${datos['precio_venta']:.2f}")
                    print(f"   Categoría: {datos['categoria']}")
            else:
                print("❌ No se encontraron productos")
        
        elif opcion == '2':
            categoria = input("Ingresa la categoría: ").lower()
            resultados = {k: v for k, v in self.inventario.items() 
                         if v['categoria'].lower() == categoria}
            
            if resultados:
                print(f"\n📦 Productos en categoría '{categoria}' ({len(resultados)}):")
                for nombre, datos in resultados.items():
                    print(f"\n📌 {nombre}:")
                    print(f"   Cantidad: {datos['cantidad']} unidades")
                    print(f"   Precio: ${datos['precio_venta']:.2f}")
            else:
                print(f"❌ No se encontraron productos en la categoría '{categoria}'")
        
        elif opcion == '3':
            print("\n⚠️ PRODUCTOS CON STOCK BAJO (menos de 10 unidades):")
            productos_bajos = {k: v for k, v in self.inventario.items() if v['cantidad'] < 10}
            
            if productos_bajos:
                for nombre, datos in productos_bajos.items():
                    print(f"\n📌 {nombre}: {datos['cantidad']} unidades")
            else:
                print("✅ Todos los productos tienen stock suficiente")
    
    def ver_inventario(self):
        """Muestra todo el inventario"""
        if not self.inventario:
            print("\n📦 El inventario está vacío")
            return
        
        print("\n" + "="*70)
        print("📦 INVENTARIO ACTUAL")
        print("="*70)
        total_valor = 0
        total_productos = 0
        
        # Agrupar por categoría
        categorias = {}
        for producto, datos in self.inventario.items():
            cat = datos['categoria']
            if cat not in categorias:
                categorias[cat] = []
            categorias[cat].append((producto, datos))
        
        for categoria, productos in categorias.items():
            print(f"\n📂 CATEGORÍA: {categoria}")
            print("-"*50)
            
            for producto, datos in productos:
                valor_total = datos['cantidad'] * datos['precio_venta']
                total_valor += valor_total
                total_productos += datos['cantidad']
                
                print(f"\n   📌 {producto}:")
                print(f"      Cantidad: {datos['cantidad']} unidades")
                print(f"      Precio compra: ${datos['precio_compra']:.2f}")
                print(f"      Precio venta: ${datos['precio_venta']:.2f}")
                print(f"      Valor total: ${valor_total:.2f}")
        
        print("\n" + "-"*70)
        print(f"📊 RESUMEN DEL INVENTARIO:")
        print(f"   Total productos en stock: {total_productos} unidades")
        print(f"   Total categorías: {len(categorias)}")
        print(f"   Total productos diferentes: {len(self.inventario)}")
        print(f"💰 VALOR TOTAL DEL INVENTARIO: ${total_valor:.2f}")
        print("="*70)
    
    # ===== FUNCIONALIDADES DE VENTAS =====
    def registrar_venta(self):
        """Registra una nueva venta"""
        print("\n💰 REGISTRAR NUEVA VENTA")
        
        # Buscar cliente
        cliente_nombre = input("Nombre del cliente: ").capitalize()
        if cliente_nombre not in self.clientes:
            print("⚠️ Cliente no registrado. Se agregará automáticamente.")
            telefono = input("Teléfono del cliente: ")
            email = input("Email del cliente (opcional): ")
            self.clientes[cliente_nombre] = {
                'telefono': telefono,
                'email': email,
                'compras_totales': 0,
                'compras_realizadas': 0,
                'ultima_compra': None,
                'fecha_registro': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
        
        # Mostrar inventario disponible
        self.ver_inventario()
        
        # Registrar productos vendidos
        productos_vendidos = []
        total_venta = 0
        costo_total = 0
        
        while True:
            print("\n" + "-"*40)
            producto = input("Nombre del producto vendido (o 'fin' para terminar): ").capitalize()
            if producto.lower() == 'fin':
                break
            
            if producto not in self.inventario:
                print("❌ Producto no encontrado en inventario")
                continue
            
            print(f"Disponible: {self.inventario[producto]['cantidad']} unidades")
            cantidad = int(input(f"Cantidad de {producto}: "))
            
            if cantidad <= 0:
                print("❌ La cantidad debe ser mayor a 0")
                continue
                
            if cantidad > self.inventario[producto]['cantidad']:
                print(f"❌ Solo hay {self.inventario[producto]['cantidad']} unidades disponibles")
                continue
            
            # Calcular precios
            precio_unitario = self.inventario[producto]['precio_venta']
            costo_unitario = self.inventario[producto]['precio_compra']
            subtotal = cantidad * precio_unitario
            
            print(f"Subtotal: ${subtotal:.2f}")
            
            productos_vendidos.append({
                'producto': producto,
                'cantidad': cantidad,
                'precio_unitario': precio_unitario,
                'costo_unitario': costo_unitario,
                'subtotal': subtotal
            })
            
            total_venta += subtotal
            costo_total += cantidad * costo_unitario
            
            # Actualizar inventario
            self.inventario[producto]['cantidad'] -= cantidad
        
        if productos_vendidos:
            ganancia_venta = total_venta - costo_total
            
            # Registrar venta
            venta = {
                'fecha': datetime.now().strftime('%d/%m/%Y %H:%M'),
                'cliente': cliente_nombre,
                'productos': productos_vendidos,
                'total': total_venta,
                'ganancia': ganancia_venta,
                'vendedor': self.usuario_actual['nombre']
            }
            
            self.ventas.append(venta)
            
            # Actualizar ganancias
            self.ganancias['total'] += ganancia_venta
            self.ganancias['historial'].append({
                'fecha': venta['fecha'],
                'cliente': cliente_nombre,
                'ganancia': ganancia_venta,
                'total_venta': total_venta
            })
            
            # Actualizar cliente
            self.clientes[cliente_nombre]['compras_totales'] += total_venta
            self.clientes[cliente_nombre]['compras_realizadas'] += 1
            self.clientes[cliente_nombre]['ultima_compra'] = venta['fecha']
            
            self.guardar_datos()
            
            print("\n" + "="*50)
            print("✅ VENTA REGISTRADA EXITOSAMENTE")
            print("="*50)
            print(f"🧾 Total de venta: ${total_venta:.2f}")
            print(f"📈 Ganancia: ${ganancia_venta:.2f}")
            print("="*50)
            
            # Preguntar si quiere generar factura
            if input("\n¿Generar factura en PDF? (s/n): ").lower() == 's':
                self.generar_factura_pdf(venta)
    
    def ver_ventas(self):
        """Muestra el historial de ventas"""
        if not self.ventas:
            print("\n📊 No hay ventas registradas")
            return
        
        print("\n" + "="*70)
        print("📊 HISTORIAL DE VENTAS")
        print("="*70)
        
        total_general = 0
        ganancia_general = 0
        ventas_hoy = 0
        hoy = datetime.now().strftime('%d/%m/%Y')
        
        # Mostrar últimas ventas
        for i, venta in enumerate(self.ventas[-10:], 1):
            print(f"\n📌 Venta #{len(self.ventas) - len(self.ventas) + i}")
            print(f"   Fecha: {venta['fecha']}")
            print(f"   Cliente: {venta['cliente']}")
            print(f"   Vendedor: {venta.get('vendedor', 'N/A')}")
            print(f"   Total: ${venta['total']:.2f}")
            print(f"   Ganancia: ${venta['ganancia']:.2f}")
            print(f"   Productos: {len(venta['productos'])} items")
            
            total_general += venta['total']
            ganancia_general += venta['ganancia']
            
            if venta['fecha'].startswith(hoy):
                ventas_hoy += 1
        
        print("\n" + "-"*70)
        print(f"📊 RESUMEN DE VENTAS:")
        print(f"   Ventas hoy: {ventas_hoy}")
        print(f"   Total ventas registradas: {len(self.ventas)}")
        print(f"💰 TOTAL VENTAS: ${total_general:.2f}")
        print(f"📈 GANANCIA TOTAL: ${ganancia_general:.2f}")
        print("="*70)
    
    # ===== FUNCIONALIDADES DE CLIENTES =====
    def ver_clientes(self):
        """Muestra la lista de clientes"""
        if not self.clientes:
            print("\n👥 No hay clientes registrados")
            return
        
        print("\n" + "="*70)
        print("👥 LISTA DE CLIENTES")
        print("="*70)
        
        # Ordenar por total de compras
    def menu_principal(self):
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            self.mostrar_saludo()
            print("1. 📦 Inventario")
            print("2. 💰 Ventas")
            print("3. 👥 Clientes")
            print("4. 👤 Usuarios (Solo Admin)")
            print("5. 🔐 Cambiar Contraseña")
            print("0. 🚪 Salir")
            
            opcion = input("\nSelecciona una opción: ")
            
            if opcion == '1':
                self.buscar_producto() # O ver_inventario()
                input("\nPresiona Enter para continuar...")
            elif opcion == '2':
                self.registrar_venta()
                input("\nPresiona Enter para continuar...")
            elif opcion == '0':
                print("👋 ¡Hasta pronto!")
                break
            # Agrega aquí las demás llamadas a tus funciones

# === ESTO ES LO QUE FALTA PARA QUE ARRANQUE ===
if __name__ == "__main__":
    asistente = ProyectoEli()
    if asistente.login():
        asistente.menu_principal()

