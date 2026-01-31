# Pharmacy POS - Frontend (Angular)

Interfaz de usuario moderna para la gestión farmacéutica, enfocada en la rapidez operativa y la integridad de datos.

## Tecnologías
- **Angular 19**: Uso de **Signals** para un manejo de estado reactivo y eficiente.
- **Bootstrap 5 & SCSS**: Diseño profesional, limpio y totalmente responsivo.
- **HttpClient**: Integración con interceptores para inyección automática de tokens JWT.

## Módulos Implementados
- **POS (Punto de Venta)**: Venta rápida con búsqueda de productos y clientes.
- **Cajas**: Control estricto de sesiones de apertura y cierre de caja.
- **Inventario**: Visualización de stock real por lote y establecimiento.
- **Compras**: Gestión de abastecimiento con ingreso de nuevas existencias.
- **Reportes**: Análisis visual de ventas, ingresos y salud del inventario.

## Estructura de Carpetas
- `src/app/core`: Guardias, interceptores, modelos globales y servicios base.
- `src/app/features`: Módulos funcionales organizados por dominio (clientes, ventas, etc.).
- `src/app/shared`: Componentes y utilidades reutilizables en toda la aplicación.
