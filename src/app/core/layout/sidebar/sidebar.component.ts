import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { PermissionConstants } from '../../constants/permission-constants';

interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    children?: MenuItem[];
    expanded?: boolean;
    isActive?: boolean;
    routerLinkActiveOptions?: { exact: boolean };
    requiredPermissions?: string[]; // Permisos necesarios para ver este item
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

    private allMenuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: 'bi-house-door',
            route: '/home',
            requiredPermissions: [PermissionConstants.DASHBOARD]
        },
        {
            label: 'Ventas',
            icon: 'bi-cart-check',
            expanded: false,
            requiredPermissions: [PermissionConstants.VENTAS],
            children: [
                { label: 'Nueva Venta', route: '/sales/pos', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS] },
                { label: 'Ver Ventas', route: '/sales', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.VENTAS] },
                { label: 'Clientes', route: '/customers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS] },
                { label: 'Ver Reportes', route: '/reports/sales', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS] }
            ]
        },
        {
            label: 'Facturación Electrónica',
            icon: 'bi-receipt',
            expanded: false,
            requiredPermissions: [PermissionConstants.FACTURACION],
            children: [
                { label: 'Comprobantes', route: '/invoicing/documents', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION] },
                { label: 'Comunicación de baja', route: '/invoicing/voided', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION] },
                { label: 'Notas de crédito/débito', route: '/invoicing/notes', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION] }
            ]
        },
        {
            label: 'Inventario',
            icon: 'bi-box-fill',
            expanded: false,
            requiredPermissions: [PermissionConstants.INVENTARIO],
            children: [
                { label: 'Catálogo de productos', route: '/products', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO] },
                { label: 'Inventario actual', route: '/inventory', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.INVENTARIO] },
                { label: 'Lotes y vencimientos', route: '/inventory/batches', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO] },
                { label: 'Movimientos', route: '/inventory/movements', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO] }
            ]
        },
        {
            label: 'Compras',
            icon: 'bi-bag-check',
            expanded: false,
            requiredPermissions: [PermissionConstants.COMPRAS],
            children: [
                { label: 'Nueva Compra', route: '/purchases/new', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS] },
                { label: 'Ver compras', route: '/purchases', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.COMPRAS] },
                { label: 'Proveedores', route: '/suppliers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS] },
                { label: 'Ver reportes', route: '/reports/purchases', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS] }
            ]
        },
        {
            label: 'Caja',
            icon: 'bi-cash-stack',
            expanded: false,
            requiredPermissions: [PermissionConstants.CAJA],
            children: [
                { label: 'Apertura y cierre', route: '/cash', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.CAJA] },
                { label: 'Cajas registradoras', route: '/cash/registers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CAJA] },
                { label: 'Reportes', route: '/reports/cash', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CAJA] }
            ]
        },
        {
            label: 'Gestión farmacéutica',
            icon: 'bi-capsule',
            expanded: false,
            requiredPermissions: [PermissionConstants.FARMACIA],
            children: [
                { label: 'Principios activos', route: '/pharmacy/active-ingredients', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FARMACIA] },
                { label: 'Laboratorios', route: '/pharmacy/labs', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FARMACIA] },
                { label: 'Marcas', route: '/pharmacy/brands', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FARMACIA] },
                { label: 'Categorias', route: '/pharmacy/categories', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FARMACIA] },
                { label: 'Presentaciones', route: '/pharmacy/presentations', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FARMACIA] }
            ]
        },
        {
            label: 'Configuraciones',
            icon: 'bi-gear',
            expanded: false,
            requiredPermissions: [PermissionConstants.CONFIGURACION],
            children: [
                { label: 'Usuarios', route: '/settings/users', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION] },
                { label: 'Roles y permisos', route: '/settings/roles', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION] },
                { label: 'Establecimientos', route: '/settings/establishments', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION] },
                { label: 'Personal', route: '/employees', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION] },
                { label: 'Impuestos', route: '/settings/taxes', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION] }
            ]
        }
    ];

    // Computed signal que filtra los items del menú según los permisos del usuario
    menuItems = computed(() => {
        return this.filterMenuItems(this.allMenuItems);
    });

    /**
     * Filtra los items del menú según los permisos del usuario
     */
    private filterMenuItems(items: MenuItem[]): MenuItem[] {
        return items
            .map(item => {
                // Si el item tiene hijos, filtrarlos recursivamente
                if (item.children) {
                    const filteredChildren = this.filterMenuItems(item.children);

                    // Si no hay hijos visibles, ocultar el item padre
                    if (filteredChildren.length === 0) {
                        return null;
                    }

                    return { ...item, children: filteredChildren };
                }

                // Si el item no tiene permisos requeridos, mostrarlo
                if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
                    return item;
                }

                // Verificar si el usuario tiene al menos uno de los permisos requeridos
                if (this.authService.hasAnyPermission(item.requiredPermissions)) {
                    return item;
                }

                return null;
            })
            .filter((item): item is MenuItem => item !== null);
    }

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
