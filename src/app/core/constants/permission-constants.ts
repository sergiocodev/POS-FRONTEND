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

    // Submódulos de VENTAS
    static readonly VENTAS_POS = 'VENTAS_POS';
    static readonly VENTAS_LISTA = 'VENTAS_LISTA';
    static readonly VENTAS_CLIENTES = 'VENTAS_CLIENTES';
    static readonly VENTAS_CUENTAS_COBRAR = 'VENTAS_CUENTAS_COBRAR';
    static readonly VENTAS_REPORTES = 'VENTAS_REPORTES';

    // Submódulos de FACTURACION
    static readonly FACTURACION_COMPROBANTES = 'FACTURACION_COMPROBANTES';
    static readonly FACTURACION_BAJAS = 'FACTURACION_BAJAS';
    static readonly FACTURACION_NOTAS = 'FACTURACION_NOTAS';

    // Submódulos de INVENTARIO
    static readonly INVENTARIO_CATALOGO = 'INVENTARIO_CATALOGO';
    static readonly INVENTARIO_ACTUAL = 'INVENTARIO_ACTUAL';
    static readonly INVENTARIO_LOTES = 'INVENTARIO_LOTES';
    static readonly INVENTARIO_MOVIMIENTOS = 'INVENTARIO_MOVIMIENTOS';
    static readonly INVENTARIO_TRANSFERENCIAS = 'INVENTARIO_TRANSFERENCIAS';

    // Submódulos de COMPRAS
    static readonly COMPRAS_NUEVA = 'COMPRAS_NUEVA';
    static readonly COMPRAS_LISTA = 'COMPRAS_LISTA';
    static readonly COMPRAS_PROVEEDORES = 'COMPRAS_PROVEEDORES';
    static readonly COMPRAS_CUENTAS_PAGAR = 'COMPRAS_CUENTAS_PAGAR';
    static readonly COMPRAS_REPORTES = 'COMPRAS_REPORTES';

    // Submódulos de CAJA
    static readonly CAJA_APERTURA_CIERRE = 'CAJA_APERTURA_CIERRE';
    static readonly CAJA_MOVIMIENTOS = 'CAJA_MOVIMIENTOS';
    static readonly CAJA_REGISTRADORAS = 'CAJA_REGISTRADORAS';
    static readonly CAJA_REPORTES = 'CAJA_REPORTES';

    // Submódulos de FARMACIA
    static readonly FARMACIA_PRINCIPIOS_ACTIVOS = 'FARMACIA_PRINCIPIOS_ACTIVOS';
    static readonly FARMACIA_LABORATORIOS = 'FARMACIA_LABORATORIOS';
    static readonly FARMACIA_MARCAS = 'FARMACIA_MARCAS';
    static readonly FARMACIA_CATEGORIAS = 'FARMACIA_CATEGORIAS';
    static readonly FARMACIA_PRESENTACIONES = 'FARMACIA_PRESENTACIONES';
    static readonly FARMACIA_FORMAS = 'FARMACIA_FORMAS';
    static readonly FARMACIA_ACCIONES = 'FARMACIA_ACCIONES';

    // Submódulos de CONFIGURACION
    static readonly CONFIGURACION_USUARIOS = 'CONFIGURACION_USUARIOS';
    static readonly CONFIGURACION_ROLES = 'CONFIGURACION_ROLES';
    static readonly CONFIGURACION_ESTABLECIMIENTOS = 'CONFIGURACION_ESTABLECIMIENTOS';
    static readonly CONFIGURACION_PERSONAL = 'CONFIGURACION_PERSONAL';
    static readonly CONFIGURACION_IMPUESTOS = 'CONFIGURACION_IMPUESTOS';
}
