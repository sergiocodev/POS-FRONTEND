import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { requireOpenCajaGuard } from './core/guards/require-open-caja.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PermissionConstants } from './core/constants/permission-constants';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'home',
                loadComponent: () => import('./features/dashboard/home/home.component').then(m => m.HomeComponent)
            },
            // --- VENTAS ---
            {
                path: 'customers',
                loadComponent: () => import('./features/sales/customers/customers.component').then(m => m.CustomersComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_CLIENTES] }
            },
            {
                path: 'customers/new',
                loadComponent: () => import('./features/sales/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_CLIENTES] }
            },
            {
                path: 'customers/edit/:id',
                loadComponent: () => import('./features/sales/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_CLIENTES] }
            },
            {
                path: 'sales',
                loadComponent: () => import('./features/sales/view-sales/view-sales.component').then(m => m.ViewSalesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_LISTA] }
            },
            {
                path: 'sales/pos',
                loadComponent: () => import('./features/sales/new-sale/new-sale.component').then(m => m.NewSaleComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_POS] }
            },
            {
                path: 'account-receivables/history',
                loadComponent: () => import('./features/sales/account-receivables/account-receivable-history/account-receivable-history.component').then(m => m.AccountReceivableHistoryComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_CUENTAS_COBRAR] }
            },
            {
                path: 'account-receivables',
                loadComponent: () => import('./features/sales/account-receivables/account-receivables.component').then(m => m.AccountReceivablesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_CUENTAS_COBRAR] }
            },
            {
                path: 'reports/sales',
                loadComponent: () => import('./features/sales/view-reports/view-reports.component').then(m => m.ViewReportsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.VENTAS_REPORTES] }
            },

            // --- COMPRAS ---
            {
                path: 'suppliers',
                loadComponent: () => import('./features/purchases/suppliers/suppliers.component').then(m => m.SuppliersComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_PROVEEDORES] }
            },
            {
                path: 'purchases',
                loadComponent: () => import('./features/purchases/view-purchases/view-purchases.component').then(m => m.ViewPurchasesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_LISTA] }
            },
            {
                path: 'purchases/new',
                loadComponent: () => import('./features/purchases/new-purchase/new-purchase.component').then(m => m.NewPurchaseComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_NUEVA] }
            },
            {
                path: 'purchases/edit/:id',
                loadComponent: () => import('./features/purchases/new-purchase/new-purchase.component').then(m => m.NewPurchaseComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_NUEVA] }
            },
            {
                path: 'account-payables',
                loadComponent: () => import('./features/purchases/account-payables/account-payables.component').then(m => m.AccountPayablesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_CUENTAS_PAGAR] }
            },
            {
                path: 'account-payables/history',
                loadComponent: () => import('./features/purchases/account-payables/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_CUENTAS_PAGAR] }
            },
            {
                path: 'reports/purchases',
                loadComponent: () => import('./features/purchases/view-reports/view-reports.component').then(m => m.ViewReportsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.COMPRAS_REPORTES] }
            },

            // --- INVENTARIO ---
            {
                path: 'products',
                loadComponent: () => import('./features/inventory/product-catalog/product-catalog.component').then(m => m.ProductCatalogComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_CATALOGO] }
            },
            {
                path: 'inventory',
                loadComponent: () => import('./features/inventory/current-inventory/current-inventory').then(m => m.CurrentInventoryComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_ACTUAL] }
            },
            {
                path: 'inventory/batches',
                loadComponent: () => import('./features/inventory/batches-expiration-date/batches-expiration-date').then(m => m.BatchesExpirationDateComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_LOTES] }
            },
            {
                path: 'inventory/movements',
                loadComponent: () => import('./features/inventory/movements/movements').then(m => m.MovementsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_MOVIMIENTOS] }
            },
            {
                path: 'inventory/transfers',
                loadComponent: () => import('./features/inventory/stock-transfers/stock-transfers.component').then(m => m.StockTransfersComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_TRANSFERENCIAS] }
            },
            {
                path: 'reports/inventory',
                loadComponent: () => import('./features/reports/inventory-report/inventory-report.component').then(m => m.InventoryReportComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.INVENTARIO_REPORTES] }
            },

            // --- CAJA ---
            {
                path: 'cash',
                loadComponent: () => import('./features/box/opening-closing/opening-closing.component').then(m => m.OpeningClosingComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_APERTURA_CIERRE] }
            },
            {
                path: 'cash/open',
                loadComponent: () => import('./features/box/opening-closing/box-details/cash-open/cash-open.component').then(m => m.CashOpenComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_APERTURA_CIERRE] }
            },
            {
                path: 'cash/close/:id',
                loadComponent: () => import('./features/box/opening-closing/box-details/cash-close/cash-close.component').then(m => m.CashCloseComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_APERTURA_CIERRE] }
            },
            {
                path: 'cash/movements',
                loadComponent: () => import('./features/box/cash-flows/cash-flows.component').then(m => m.CashFlowsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_MOVIMIENTOS] }
            },
            {
                path: 'cash/registers',
                loadComponent: () => import('./features/box/box-registers/box-registers.component').then(m => m.BoxRegistersComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_REGISTRADORAS] }
            },

            {
                path: 'reports/cash',
                loadComponent: () => import('./features/box/view-reports/view-reports.component').then(m => m.ViewReportsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CAJA_REPORTES] }
            },

            // --- CONFIGURACION ---
            {
                path: 'settings/company',
                loadComponent: () => import('./features/settings/company/company.component').then(m => m.CompanyComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_ESTABLECIMIENTOS] }
            },
            {
                path: 'settings/users',
                loadComponent: () => import('./features/settings/users/users.component').then(m => m.UsersComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_USUARIOS] }
            },
            {
                path: 'settings/roles',
                loadComponent: () => import('./features/settings/roles/roles.component').then(m => m.RolesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_ROLES] }
            },
            {
                path: 'settings/roles/:id/permissions',
                loadComponent: () => import('./features/settings/roles/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_ROLES] }
            },
            {
                path: 'settings/establishments',
                loadComponent: () => import('./features/settings/establishments/establishments.component').then(m => m.EstablishmentsComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_ESTABLECIMIENTOS] }
            },
            {
                path: 'settings/employees',
                loadComponent: () => import('./features/settings/employees/employees.component').then(m => m.EmployeesComponent),
                canActivate: [permissionGuard],
                data: { requiredPermissions: [PermissionConstants.CONFIGURACION_PERSONAL] }
            },

            // --- FARMACIA ---
            {
                path: 'pharmacy/catalog',
                loadComponent: () => import('./features/pharmacy-catalog/pharmacy-catalog.component').then(m => m.PharmacyCatalogComponent),
                canActivate: [permissionGuard],
                data: {
                    requiredPermissions: [
                        PermissionConstants.FARMACIA,
                        PermissionConstants.FARMACIA_PRINCIPIOS_ACTIVOS,
                        PermissionConstants.FARMACIA_LABORATORIOS,
                        PermissionConstants.FARMACIA_MARCAS,
                        PermissionConstants.FARMACIA_CATEGORIAS,
                        PermissionConstants.FARMACIA_PRESENTACIONES,
                        PermissionConstants.FARMACIA_FORMAS,
                        PermissionConstants.FARMACIA_ACCIONES
                    ]
                }
            },
            {
                path: 'pharmacy',
                redirectTo: 'pharmacy/catalog',
                pathMatch: 'full'
            },

            // --- REDIRECTS ---
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
