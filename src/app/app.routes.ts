import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'customers',
                loadComponent: () => import('./features/sales/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent)
            },
            {
                path: 'customers/new',
                loadComponent: () => import('./features/sales/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
            },
            {
                path: 'customers/edit/:id',
                loadComponent: () => import('./features/sales/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
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
                loadComponent: () => import('./features/inventory/product-catalog/product-catalog.component').then(m => m.ProductCatalogComponent)
            },
            {
                path: 'sales',
                loadComponent: () => import('./features/sales/view-sales/sale-list/sale-list.component').then(m => m.SaleListComponent)
            },
            {
                path: 'sales/pos',
                loadComponent: () => import('./features/sales/new-sale/pos/pos.component').then(m => m.PosComponent)
            },
            {
                path: 'purchases',
                loadComponent: () => import('./features/purchases/purchase-list/purchase-list.component').then(m => m.PurchaseListComponent)
            },
            {
                path: 'account-payables',
                loadComponent: () => import('./features/account-payables/account-payable-list/account-payable-list.component').then(m => m.AccountPayableListComponent)
            },
            {
                path: 'account-receivables',
                loadComponent: () => import('./features/account-receivables/account-receivable-list/account-receivable-list.component').then(m => m.AccountReceivableListComponent)
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
                path: 'cash/registers',
                loadComponent: () => import('./features/cash/registers-list/registers-list.component').then(m => m.RegistersListComponent)
            },
            {
                path: 'cash/registers/new',
                loadComponent: () => import('./features/cash/register-form/register-form.component').then(m => m.RegisterFormComponent)
            },
            {
                path: 'cash/registers/edit/:id',
                loadComponent: () => import('./features/cash/register-form/register-form.component').then(m => m.RegisterFormComponent)
            },
            {
                path: 'reports/inventory',
                loadComponent: () => import('./features/reports/inventory-report/inventory-report.component').then(m => m.InventoryReportComponent)
            },
            {
                path: 'reports/sales',
                loadComponent: () => import('./features/sales/view-reports/sales-report/sales-report.component').then(m => m.SalesReportComponent)
            },
            {
                path: 'reports/purchases',
                loadComponent: () => import('./features/reports/purchase-report/purchase-report.component').then(m => m.PurchaseReportComponent)
            },
            {
                path: 'reports/cash',
                loadComponent: () => import('./features/reports/cash-report/cash-report.component').then(m => m.CashReportComponent)
            },
            {
                path: 'settings/users',
                loadComponent: () => import('./features/settings/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'settings/roles',
                loadComponent: () => import('./features/settings/roles/roles.component').then(m => m.RolesComponent)
            },
            {
                path: 'settings/roles/:id/permissions',
                loadComponent: () => import('./features/settings/roles/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent)
            },
            {
                path: 'settings/establishments',
                loadComponent: () => import('./features/settings/establishments/establishments.component').then(m => m.EstablishmentsComponent)
            },
            {
                path: 'settings/employees',
                loadComponent: () => import('./features/settings/employees/employees.component').then(m => m.EmployeesComponent)
            },

            {
                path: 'pharmacy/active-ingredients',
                loadComponent: () => import('./features/pharmacy/active-ingredients/active-ingredients.component').then(m => m.ActiveIngredientsComponent)
            },
            {
                path: 'pharmacy/labs',
                loadComponent: () => import('./features/pharmacy/laboratories/laboratories.component').then(m => m.LaboratoriesComponent)
            },
            {
                path: 'pharmacy/brands',
                loadComponent: () => import('./features/pharmacy/brands/brands.component').then(m => m.BrandsComponent)
            },
            {
                path: 'pharmacy/categories',
                loadComponent: () => import('./features/pharmacy/categories/categories.component').then(m => m.CategoriesComponent)
            },
            {
                path: 'pharmacy/presentations',
                loadComponent: () => import('./features/pharmacy/presentations/presentations.component').then(m => m.PresentationsComponent)
            },
            {
                path: 'pharmacy/pharmaceutical-forms',
                loadComponent: () => import('./features/pharmacy/pharmaceutical-forms/pharmaceutical-forms.component').then(m => m.PharmaceuticalFormsComponent)
            },
            {
                path: 'pharmacy/therapeutic-actions',
                loadComponent: () => import('./features/pharmacy/therapeutic-actions/therapeutic-actions.component').then(m => m.TherapeuticActionsComponent)
            },
            {
                path: 'inventory',
                loadComponent: () => import('./features/inventory/current-inventory/current-inventory').then(m => m.CurrentInventoryComponent)
            },
            {
                path: 'inventory/batches',
                loadComponent: () => import('./features/inventory/batches-expiration-date/batches-expiration-date').then(m => m.BatchesExpirationDateComponent)
            },
            {
                path: 'inventory/movements',
                loadComponent: () => import('./features/inventory/movements/movements').then(m => m.MovementsComponent)
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
