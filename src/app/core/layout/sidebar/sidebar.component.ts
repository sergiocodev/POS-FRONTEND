import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    children?: MenuItem[];
    expanded?: boolean;
    isActive?: boolean;
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

    @Input() collapsed = false;
    @Output() collapsedChange = new EventEmitter<boolean>();

    menuItems: MenuItem[] = [
        {
            label: 'Inicio',
            icon: 'bi-house-door',
            route: '/home'
        },
        {
            label: 'Clientes',
            icon: 'bi-people',
            route: '/customers'
        },
        {
            label: 'Proveedores',
            icon: 'bi-truck',
            route: '/suppliers'
        },
        {
            label: 'Productos',
            icon: 'bi-box-seam',
            route: '/products'
        },
        {
            label: 'Empleados',
            icon: 'bi-person-badge',
            route: '/employees'
        },
        {
            label: 'Ventas',
            icon: 'bi-cart-check',
            route: '/sales'
        },
        {
            label: 'Compras',
            icon: 'bi-bag-check',
            route: '/purchases'
        },
        {
            label: 'Inventario',
            icon: 'bi-box-fill',
            route: '/inventory'
        },
        {
            label: 'Movimientos',
            icon: 'bi-arrow-left-right',
            route: '/inventory/movements'
        },
        {
            label: 'Cajas',
            icon: 'bi-cash-stack',
            route: '/cash'
        },
        {
            label: 'Reportes',
            icon: 'bi-bar-chart',
            expanded: false,
            children: [
                { label: 'Ventas', route: '/reports/sales', icon: 'bi-dot' },
                { label: 'Compras', route: '/reports/purchases', icon: 'bi-dot' },
                { label: 'Inventario', route: '/reports/inventory', icon: 'bi-dot' }
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
