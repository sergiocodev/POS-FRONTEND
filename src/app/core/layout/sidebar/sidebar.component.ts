import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { PermissionConstants } from '../../constants/permission-constants';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    children?: MenuItem[];
    expanded?: boolean;
    isActive?: boolean;
    routerLinkActiveOptions?: { exact: boolean };
    requiredPermissions?: string[];
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, LogoComponent],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    animations: [
        trigger('slideInOut', [
            state('true', style({ height: '*', opacity: 1, visibility: 'visible' })),
            state('false', style({ height: '0px', opacity: 0, visibility: 'hidden' })),
            transition('false <=> true', animate('350ms cubic-bezier(0.25, 1, 0.5, 1)'))
        ]),
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('250ms 150ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('100ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class SidebarComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    private router = inject(Router);

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
                { label: 'Nueva Venta', route: '/sales/pos', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS_POS] },
                { label: 'Ver Ventas', route: '/sales', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.VENTAS_LISTA] },
                { label: 'Clientes', route: '/customers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS_CLIENTES] },
                { label: 'Cuentas por cobrar', route: '/account-receivables', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS_CUENTAS_COBRAR] },
                { label: 'Ver Reportes', route: '/reports/sales', icon: 'bi-dot', requiredPermissions: [PermissionConstants.VENTAS_REPORTES] }
            ]
        },
        {
            label: 'Facturación Electrónica',
            icon: 'bi-receipt',
            expanded: false,
            requiredPermissions: [PermissionConstants.FACTURACION],
            children: [
                { label: 'Comprobantes', route: '/invoicing/documents', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION_COMPROBANTES] },
                { label: 'Comunicación de baja', route: '/invoicing/voided', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION_BAJAS] },
                { label: 'Notas de crédito/débito', route: '/invoicing/notes', icon: 'bi-dot', requiredPermissions: [PermissionConstants.FACTURACION_NOTAS] }
            ]
        },
        {
            label: 'Inventario',
            icon: 'bi-box-fill',
            expanded: false,
            requiredPermissions: [PermissionConstants.INVENTARIO],
            children: [
                { label: 'Catálogo de productos', route: '/products', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO_CATALOGO] },
                { label: 'Inventario actual', route: '/inventory', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.INVENTARIO_ACTUAL] },
                { label: 'Lotes y vencimientos', route: '/inventory/batches', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO_LOTES] },
                { label: 'Movimientos', route: '/inventory/movements', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO_MOVIMIENTOS] },
                { label: 'Transferencias', route: '/inventory/transfers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.INVENTARIO_TRANSFERENCIAS] }
            ]
        },
        {
            label: 'Compras',
            icon: 'bi-bag-check',
            expanded: false,
            requiredPermissions: [PermissionConstants.COMPRAS],
            children: [
                { label: 'Nueva Compra', route: '/purchases/new', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS_NUEVA] },
                { label: 'Ver compras', route: '/purchases', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.COMPRAS_LISTA] },
                { label: 'Proveedores', route: '/suppliers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS_PROVEEDORES] },
                { label: 'Cuentas por pagar', route: '/account-payables', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS_CUENTAS_PAGAR] },
                { label: 'Ver reportes', route: '/reports/purchases', icon: 'bi-dot', requiredPermissions: [PermissionConstants.COMPRAS_REPORTES] }
            ]
        },
        {
            label: 'Caja',
            icon: 'bi-cash-stack',
            expanded: false,
            requiredPermissions: [PermissionConstants.CAJA],
            children: [
                { label: 'Apertura y cierre', route: '/cash', icon: 'bi-dot', routerLinkActiveOptions: { exact: true }, requiredPermissions: [PermissionConstants.CAJA_APERTURA_CIERRE] },
                { label: 'Movimientos de caja', route: '/cash/movements', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CAJA_MOVIMIENTOS] },
                { label: 'Cajas registradoras', route: '/cash/registers', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CAJA_REGISTRADORAS] },
                { label: 'Reportes', route: '/reports/cash', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CAJA_REPORTES] }
            ]
        },
        {
            label: 'Gestión farmacéutica',
            icon: 'bi-capsule',
            route: '/pharmacy/catalog',
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
        },
        {
            label: 'Configuraciones',
            icon: 'bi-gear',
            expanded: false,
            requiredPermissions: [PermissionConstants.CONFIGURACION],
            children: [
                { label: 'Empresa', route: '/settings/company', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_EMPRESA] },
                { label: 'Usuarios', route: '/settings/users', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_USUARIOS] },
                { label: 'Roles y permisos', route: '/settings/roles', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_ROLES] },
                { label: 'Establecimientos', route: '/settings/establishments', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_ESTABLECIMIENTOS] },
                { label: 'Personal', route: '/settings/employees', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_PERSONAL] },
                { label: 'Impuestos', route: '/settings/taxes', icon: 'bi-dot', requiredPermissions: [PermissionConstants.CONFIGURACION_IMPUESTOS] }
            ]
        }
    ];


    menuItems = computed(() => {
        return this.filterMenuItems(this.allMenuItems);
    });


    private filterMenuItems(items: MenuItem[]): MenuItem[] {
        return items
            .map(item => {

                if (item.children) {
                    const filteredChildren = this.filterMenuItems(item.children);


                    if (filteredChildren.length === 0) {
                        return null;
                    }

                    return { ...item, children: filteredChildren };
                }


                if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
                    return item;
                }


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
                this.collapseAllExcept(item);
                item.expanded = !item.expanded;
            }, 300);
        } else {
            this.collapseAllExcept(item);
            item.expanded = !item.expanded;
        }
    }

    private collapseAllExcept(item: MenuItem) {
        // Aseguramos de colapsar la copia original para que persista al recomputar
        this.allMenuItems.forEach(m => {
            if (m.label !== item.label && m.expanded) {
                m.expanded = false;
            }
        });
        
        // Colapsar en la lista actual visible
        this.menuItems().forEach(m => {
            if (m !== item && m.expanded) {
                m.expanded = false;
            }
        });
    }

    closeOnMobile() {
        if (window.innerWidth <= 991.98) {
            setTimeout(() => {
                this.collapsed = true;
                this.collapsedChange.emit(this.collapsed);
            }, 150);
        }
    }

    navigateMobile(route: string | undefined, event: Event) {
        // En móviles, forzamos la navegación por JS para sortear el fallo del routerLink
        if (route && window.innerWidth <= 991.98) {
            event.preventDefault();
            this.router.navigateByUrl(route).then(() => {
                this.collapsed = true;
                this.collapsedChange.emit(this.collapsed);
            });
        }
    }

    onLogout() {
        this.authService.logout();
    }
}
