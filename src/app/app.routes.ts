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
