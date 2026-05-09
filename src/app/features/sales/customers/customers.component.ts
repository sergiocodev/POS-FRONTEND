import { Component, OnInit, inject, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerResponse } from '../../../core/models/customer.model';
import { CustomerDashboardResponse, RecentCustomerItem, TopCustomerItem } from '../../../core/models/customer-dashboard.model';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';


@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [
        CommonModule,
        CustomerListComponent,
        CustomerFormComponent,
        ModalGenericComponent,
        ModuleHeaderComponent,
        SmartKpiCardsComponent,
        ModalAlertComponent,
        ConfirmModalComponent,
        SpinnerComponent
    ],
    templateUrl: './customers.component.html',
    styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit, AfterViewInit {
    private customerService = inject(CustomerService);
    private modalService = inject(ModalService);


    // State
    customers = signal<CustomerResponse[]>([]);
    isLoading = signal<boolean>(false);
    isImagesLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    dashboardLoading = signal<boolean>(false);
    dashboard = signal<CustomerDashboardResponse | null>(null);

    // Modal State
    isModalOpen = signal<boolean>(false);
    selectedCustomerId = signal<number | null>(null);

    // Table Pagination & Filter State
    totalItems = signal<number>(0);
    totalPages = signal<number>(0);
    currentPage = signal<number>(0);
    pageSize = signal<number>(10);
    tableFilters = signal<any>({});



    kpiItems = computed<SmartKpiItem[]>(() => {
        const d = this.dashboard();
        if (!d) return [];

        return [
            {
                label: 'Clientes Totales',
                value: this.formatNumber(d.totalCustomers),
                icon: 'bi-people-fill',
                color: 'blue',
                trendValue: this.formatTrend(d.totalCustomersTrend),
                trendDirection: d.totalCustomersTrend >= 0 ? 'up' : 'down',
                trendText: 'vs. mes ant.'
            },
            {
                label: 'Clientes Activos',
                value: this.formatNumber(d.activeCustomers),
                icon: 'bi-person-check-fill',
                color: 'green',
                trendValue: this.formatTrend(d.activeCustomersTrend),
                trendDirection: d.activeCustomersTrend >= 0 ? 'up' : 'down',
                trendText: 'vs. mes ant.'
            },
            {
                label: 'Ventas a Clientes',
                value: this.formatCurrency(d.totalSalesAmount),
                icon: 'bi-bag-fill',
                color: 'purple',
                trendValue: this.formatTrend(d.salesAmountTrend),
                trendDirection: d.salesAmountTrend >= 0 ? 'up' : 'down',
                trendText: 'vs. mes ant.'
            },
            {
                label: 'Ticket Promedio',
                value: this.formatCurrency(d.averageTicket),
                icon: 'bi-star-fill',
                color: 'orange',
                trendValue: this.formatTrend(d.averageTicketTrend),
                trendDirection: d.averageTicketTrend >= 0 ? 'up' : 'down',
                trendText: 'vs. mes ant.'
            }
        ];
    });


    topMaxAmount = computed(() => {
        const d = this.dashboard();
        if (!d || !d.topCustomers.length) return 1;
        return Math.max(...d.topCustomers.map(c => c.totalAmount));
    });

    ngOnInit(): void {
        this.loadDashboard();
        this.loadCustomers();
    }

    ngAfterViewInit(): void {
    }

    loadDashboard(): void {
        this.dashboardLoading.set(true);
        this.customerService.getDashboard().subscribe({
            next: (resp) => {
                this.dashboard.set(resp.data);
                this.dashboardLoading.set(false);
            },
            error: () => {
                this.dashboardLoading.set(false);
            }
        });
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.customerService.getAllPaged(
            this.currentPage(),
            this.pageSize(),
            this.tableFilters()
        ).subscribe({
            next: (response) => {
                this.customers.set(response.data.content);
                this.totalItems.set(response.data.totalElements);
                this.totalPages.set(response.data.totalPages);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.modalService.alert({ title: 'Error', message: 'Error al cargar clientes. Intenta de nuevo.', type: 'error' });
                this.isLoading.set(false);
                console.error('Error loading customers:', error);
            }
        });
    }

    // Table Event Handlers
    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadCustomers();
    }

    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0); // Reset to first page
        this.loadCustomers();
    }

    onTableFilter(filters: any): void {
        this.tableFilters.set(filters);
        this.currentPage.set(0); // Reset to first page
        this.loadCustomers();
    }


    // Modal
    onNew(): void {
        this.selectedCustomerId.set(null);
        this.isModalOpen.set(true);
    }

    onEdit(id: number): void {
        this.selectedCustomerId.set(id);
        this.isModalOpen.set(true);
    }

    onDelete(customer: CustomerResponse): void {
        this.modalService.confirm({
            title: 'Eliminar Cliente',
            message: `¿Estás seguro de eliminar al cliente "${customer.name}"?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            btnColor: 'danger'
        }).then(confirmed => {
            if (confirmed) {
                this.isLoading.set(true);
                this.customerService.delete(customer.id).subscribe({
                    next: () => {
                        this.isLoading.set(false);
                        this.modalService.alert({ title: 'Éxito', message: 'Cliente eliminado correctamente', type: 'success' });
                        this.loadCustomers();
                        this.loadDashboard();
                        this.customerService.invalidateCache();
                    },
                    error: (error) => {
                        this.isLoading.set(false);
                        this.modalService.alert({ title: 'Error', message: 'Error al eliminar el cliente. Intenta de nuevo.', type: 'error' });
                        console.error('Error deleting customer:', error);
                    }
                });
            }
        });
    }

    closeModal(): void {
        this.isModalOpen.set(false);
        this.selectedCustomerId.set(null);
    }

    handleSaveSuccess(): void {
        this.closeModal();
        this.modalService.alert({ title: 'Éxito', message: 'Cliente guardado correctamente', type: 'success' });
        this.customerService.invalidateCache();
        this.loadCustomers();
        this.loadDashboard();
    }

    // KPI helpers
    formatTrend(val: number): string {
        return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
    }

    formatCurrency(val: number): string {
        return 'S/ ' + val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    formatNumber(val: number): string {
        return val.toLocaleString('es-PE');
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'VIP': return 'badge-vip';
            case 'Activo': return 'badge-active';
            case 'Nuevo': return 'badge-new';
            case 'Inactivo': return 'badge-inactive';
            default: return 'badge-secondary';
        }
    }

    trackById(_: number, item: any): number { return item.id; }
}
