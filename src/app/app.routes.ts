import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'home',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'customers',
                loadComponent: () => import('./features/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent)
            },
            {
                path: 'customers/new',
                loadComponent: () => import('./features/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
            },
            {
                path: 'customers/edit/:id',
                loadComponent: () => import('./features/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
            },
            {
                path: 'suppliers',
                loadComponent: () => import('./features/suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
            },
            {
                path: 'suppliers/new',
                loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
            },
            {
                path: 'suppliers/edit/:id',
                loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
            },
            {
                path: 'products/new',
                loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
            },
            {
                path: 'products/edit/:id',
                loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
            },
            {
                path: 'employees',
                loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
            },
            {
                path: 'employees/new',
                loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
            },
            {
                path: 'employees/edit/:id',
                loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
            },
            {
                path: 'sales',
                loadComponent: () => import('./features/sales/sale-list/sale-list.component').then(m => m.SaleListComponent)
            },
            {
                path: 'sales/pos',
                loadComponent: () => import('./features/sales/pos/pos.component').then(m => m.PosComponent)
            },
            {
                path: 'inventory',
                loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
            },
            {
                path: 'inventory/movements',
                loadComponent: () => import('./features/inventory/stock-movements/stock-movement-list.component').then(m => m.StockMovementListComponent)
            },
            {
                path: 'purchases',
                loadComponent: () => import('./features/purchases/purchase-list/purchase-list.component').then(m => m.PurchaseListComponent)
            },
            {
                path: 'purchases/new',
                loadComponent: () => import('./features/purchases/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent)
            },
            {
                path: 'purchases/edit/:id',
                loadComponent: () => import('./features/purchases/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent)
            },
            {
                path: 'cash',
                loadComponent: () => import('./features/cash/session-list/session-list.component').then(m => m.SessionListComponent)
            },
            {
                path: 'cash/open',
                loadComponent: () => import('./features/cash/session-form/session-form.component').then(m => m.SessionFormComponent)
            },
            {
                path: 'cash/close/:id',
                loadComponent: () => import('./features/cash/session-form/session-form.component').then(m => m.SessionFormComponent)
            },
            {
                path: 'reports/inventory',
                loadComponent: () => import('./features/reports/inventory-report/inventory-report.component').then(m => m.InventoryReportComponent)
            },
            {
                path: 'reports/sales',
                loadComponent: () => import('./features/reports/sales-report/sales-report.component').then(m => m.SalesReportComponent)
            },
            {
                path: 'reports/purchases',
                loadComponent: () => import('./features/reports/purchase-report/purchase-report.component').then(m => m.PurchaseReportComponent)
            },
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
