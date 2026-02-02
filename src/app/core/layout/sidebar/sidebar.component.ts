import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    children?: MenuItem[];
    expanded?: boolean;
    isActive?: boolean;
    routerLinkActiveOptions?: { exact: boolean };
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    animations: [
        trigger('slideInOut', [
            state('true', style({ height: '*', opacity: 1 })),
            state('false', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
            transition('false <=> true', animate('300ms ease-in-out'))
        ]),
        trigger('rotate', [
            state('true', style({ transform: 'rotate(180deg)' })),
            state('false', style({ transform: 'rotate(0deg)' })),
            transition('false <=> true', animate('300ms ease'))
        ])
    ]
})
export class SidebarComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);

    get isDarkMode() {
        return this.themeService.isDarkMode();
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    @Input() collapsed = false;
    @Output() collapsedChange = new EventEmitter<boolean>();

    menuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: 'bi-house-door',
            route: '/home'
        },
        {
            label: 'Ventas',
            icon: 'bi-cart-check',
            expanded: false,
            children: [
                { label: 'Nueva Venta', route: '/sales/pos', icon: 'bi-dot' },
                { label: 'Ver Ventas', route: '/sales', icon: 'bi-dot', routerLinkActiveOptions: { exact: true } },
                { label: 'Clientes', route: '/customers', icon: 'bi-dot' },
                { label: 'Ver Reportes', route: '/reports/sales', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Facturación Electrónica',
            icon: 'bi-receipt',
            expanded: false,
            children: [
                { label: 'Comprobantes', route: '/invoicing/documents', icon: 'bi-dot' },
                { label: 'Comunicación de baja', route: '/invoicing/voided', icon: 'bi-dot' },
                { label: 'Notas de crédito/débito', route: '/invoicing/notes', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Inventario',
            icon: 'bi-box-fill',
            expanded: false,
            children: [
                { label: 'Catálogo de productos', route: '/products', icon: 'bi-dot' },
                { label: 'Inventario actual', route: '/inventory', icon: 'bi-dot', routerLinkActiveOptions: { exact: true } },
                { label: 'Lotes y vencimientos', route: '/inventory/batches', icon: 'bi-dot' },
                { label: 'Movimientos', route: '/inventory/movements', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Compras',
            icon: 'bi-bag-check',
            expanded: false,
            children: [
                { label: 'Nueva Compra', route: '/purchases/new', icon: 'bi-dot' },
                { label: 'Ver compras', route: '/purchases', icon: 'bi-dot', routerLinkActiveOptions: { exact: true } },
                { label: 'Proveedores', route: '/suppliers', icon: 'bi-dot' },
                { label: 'Ver reportes', route: '/reports/purchases', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Caja',
            icon: 'bi-cash-stack',
            expanded: false,
            children: [
                { label: 'Apertura y cierre', route: '/cash', icon: 'bi-dot', routerLinkActiveOptions: { exact: true } },
                { label: 'Cajas registradoras', route: '/cash/registers', icon: 'bi-dot' },
                { label: 'Reportes', route: '/reports/cash', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Gestión farmacéutica',
            icon: 'bi-capsule',
            expanded: false,
            children: [
                { label: 'Principios activos', route: '/pharmacy/active-ingredients', icon: 'bi-dot' },
                { label: 'Laboratorios', route: '/pharmacy/labs', icon: 'bi-dot' },
                { label: 'Marcas', route: '/pharmacy/brands', icon: 'bi-dot' },
                { label: 'Categorias', route: '/pharmacy/categories', icon: 'bi-dot' },
                { label: 'Presentaciones', route: '/pharmacy/presentations', icon: 'bi-dot' }
            ]
        },
        {
            label: 'Configuraciones',
            icon: 'bi-gear',
            expanded: false,
            children: [
                { label: 'Usuarios', route: '/settings/users', icon: 'bi-dot' },
                { label: 'Roles y permisos', route: '/settings/roles', icon: 'bi-dot' },
                { label: 'Sucursales', route: '/settings/branches', icon: 'bi-dot' },
                { label: 'Personal', route: '/employees', icon: 'bi-dot' },
                { label: 'Impuestos', route: '/settings/taxes', icon: 'bi-dot' }
            ]
        }
    ];

    toggleSidebar() {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
    }

    toggleSubmenu(item: MenuItem) {
        if (this.collapsed) {
            this.collapsed = false;
            this.collapsedChange.emit(false);
            setTimeout(() => {
                item.expanded = !item.expanded;
            }, 300);
        } else {
            item.expanded = !item.expanded;
        }
    }

    onLogout() {
        this.authService.logout();
    }
}
