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
                loadComponent: () => import('./features/employees/employees-list/employees-list.component').then(m => m.EmployeesListComponent)
            },
            {
                path: 'employees/new',
                loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
            },
            {
                path: 'employees/:id/edit',
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
                path: 'settings/users',
                loadComponent: () => import('./features/settings/users/users-list/users-list.component').then(m => m.UsersListComponent)
            },
            {
                path: 'settings/users/new',
                loadComponent: () => import('./features/settings/users/user-form/user-form.component').then(m => m.UserFormComponent)
            },
            {
                path: 'settings/users/:id/edit',
                loadComponent: () => import('./features/settings/users/user-form/user-form.component').then(m => m.UserFormComponent)
            },
            {
                path: 'settings/roles',
                loadComponent: () => import('./features/settings/roles/roles-list/roles-list.component').then(m => m.RolesListComponent)
            },
            {
                path: 'settings/roles/new',
                loadComponent: () => import('./features/settings/roles/role-form/role-form.component').then(m => m.RoleFormComponent)
            },
            {
                path: 'settings/roles/:id/edit',
                loadComponent: () => import('./features/settings/roles/role-form/role-form.component').then(m => m.RoleFormComponent)
            },
            {
                path: 'settings/roles/:id/permissions',
                loadComponent: () => import('./features/settings/roles/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent)
            },
            {
                path: 'settings/establishments',
                loadComponent: () => import('./features/settings/establishments/establishments-list/establishments-list.component').then(m => m.EstablishmentsListComponent)
            },
            {
                path: 'settings/establishments/new',
                loadComponent: () => import('./features/settings/establishments/establishment-form/establishment-form.component').then(m => m.EstablishmentFormComponent)
            },
            {
                path: 'settings/establishments/:id/edit',
                loadComponent: () => import('./features/settings/establishments/establishment-form/establishment-form.component').then(m => m.EstablishmentFormComponent)
            },
            // Pharmacy Routes
            {
                path: 'pharmacy/active-ingredients',
                loadComponent: () => import('./features/pharmacy/active-ingredients/active-ingredients-list/active-ingredients-list.component').then(m => m.ActiveIngredientsListComponent)
            },
            {
                path: 'pharmacy/active-ingredients/new',
                loadComponent: () => import('./features/pharmacy/active-ingredients/active-ingredient-form/active-ingredient-form.component').then(m => m.ActiveIngredientFormComponent)
            },
            {
                path: 'pharmacy/active-ingredients/:id/edit',
                loadComponent: () => import('./features/pharmacy/active-ingredients/active-ingredient-form/active-ingredient-form.component').then(m => m.ActiveIngredientFormComponent)
            },
            {
                path: 'pharmacy/labs',
                loadComponent: () => import('./features/pharmacy/laboratories/laboratories-list/laboratories-list.component').then(m => m.LaboratoriesListComponent)
            },
            {
                path: 'pharmacy/labs/new',
                loadComponent: () => import('./features/pharmacy/laboratories/laboratory-form/laboratory-form.component').then(m => m.LaboratoryFormComponent)
            },
            {
                path: 'pharmacy/labs/:id/edit',
                loadComponent: () => import('./features/pharmacy/laboratories/laboratory-form/laboratory-form.component').then(m => m.LaboratoryFormComponent)
            },
            {
                path: 'pharmacy/brands',
                loadComponent: () => import('./features/pharmacy/brands/brands-list/brands-list.component').then(m => m.BrandsListComponent)
            },
            {
                path: 'pharmacy/brands/new',
                loadComponent: () => import('./features/pharmacy/brands/brand-form/brand-form.component').then(m => m.BrandFormComponent)
            },
            {
                path: 'pharmacy/brands/:id/edit',
                loadComponent: () => import('./features/pharmacy/brands/brand-form/brand-form.component').then(m => m.BrandFormComponent)
            },
            {
                path: 'pharmacy/categories',
                loadComponent: () => import('./features/pharmacy/categories/categories-list/categories-list.component').then(m => m.CategoriesListComponent)
            },
            {
                path: 'pharmacy/categories/new',
                loadComponent: () => import('./features/pharmacy/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
            },
            {
                path: 'pharmacy/categories/:id/edit',
                loadComponent: () => import('./features/pharmacy/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
            },
            {
                path: 'pharmacy/presentations',
                loadComponent: () => import('./features/pharmacy/presentations/presentations-list/presentations-list.component').then(m => m.PresentationsListComponent)
            },
            {
                path: 'pharmacy/presentations/new',
                loadComponent: () => import('./features/pharmacy/presentations/presentation-form/presentation-form.component').then(m => m.PresentationFormComponent)
            },
            {
                path: 'pharmacy/presentations/:id/edit',
                loadComponent: () => import('./features/pharmacy/presentations/presentation-form/presentation-form.component').then(m => m.PresentationFormComponent)
            },
            {
                path: 'inventory',
                loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
            },
            {
                path: 'inventory/adjust/:id',
                loadComponent: () => import('./features/inventory/inventory-adjustment-form/inventory-adjustment-form.component').then(m => m.InventoryAdjustmentFormComponent)
            },
            {
                path: 'inventory/batches',
                loadComponent: () => import('./features/inventory/batch-list/batch-list.component').then(m => m.BatchListComponent)
            },
            {
                path: 'inventory/batches/new',
                loadComponent: () => import('./features/inventory/batch-form/batch-form.component').then(m => m.BatchFormComponent)
            },
            {
                path: 'inventory/movements',
                loadComponent: () => import('./features/inventory/movement-list/movement-list.component').then(m => m.MovementListComponent)
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
