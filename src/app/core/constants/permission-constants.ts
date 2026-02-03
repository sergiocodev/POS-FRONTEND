/**
 * Constantes de permisos del sistema
 * Sincronizadas con PermissionConstants.java del backend
 * Sistema basado en módulos - cada permiso da acceso completo a un módulo
 */
export class PermissionConstants {
    // Módulos principales del sistema
    static readonly DASHBOARD = 'DASHBOARD';
    static readonly VENTAS = 'VENTAS';
    static readonly FACTURACION = 'FACTURACION';
    static readonly INVENTARIO = 'INVENTARIO';
    static readonly COMPRAS = 'COMPRAS';
    static readonly CAJA = 'CAJA';
    static readonly FARMACIA = 'FARMACIA';
    static readonly CONFIGURACION = 'CONFIGURACION';
}
