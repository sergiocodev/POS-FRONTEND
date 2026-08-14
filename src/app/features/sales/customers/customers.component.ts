import { Component, OnInit, inject, signal, computed, ViewChild, TemplateRef, AfterViewInit, effect, untracked } from '@angular/core';
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
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';


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
    private establishmentStateService = inject(EstablishmentStateService);

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    // State
    customers = signal<CustomerResponse[]>([]);
    isLoading = signal<boolean>(false);
    isImagesLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    dashboardLoading = signal<boolean>(false);
    kpiItems = signal<SmartKpiItem[]>([]);

    // Modal State
    isModalOpen = signal<boolean>(false);
    selectedCustomerId = signal<number | null>(null);

    // Table Pagination & Filter State
    totalItems = signal<number>(0);
    totalPages = signal<number>(0);
    currentPage = signal<number>(0);
    pageSize = signal<number>(10);
    tableFilters = signal<any>({});



    constructor() {
        effect(() => {
            this.selectedEstablishmentId(); // track
            
            untracked(() => {
                this.currentPage.set(0);
                this.loadDashboard();
                this.loadCustomers();
            });
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
    }

    loadDashboard(): void {
        if (!this.selectedEstablishmentId()) return;
        this.dashboardLoading.set(true);
        this.customerService.getSummary(this.selectedEstablishmentId()!).subscribe({
            next: (resp: any) => {
                const data = resp.data ? resp.data : resp;
                const styles: any = {
                    'CLIENTES TOTALES': { icon: 'bi-people-fill', color: 'blue' },
                    'CLIENTES ACTIVOS': { icon: 'bi-person-check-fill', color: 'green' },
                    'VENTAS A CLIENTES': { icon: 'bi-bag-fill', color: 'purple' },
                    'TICKET PROMEDIO': { icon: 'bi-star-fill', color: 'orange' }
                };

                const mappedData = data.map((item: any) => ({
                    ...item,
                    ...(styles[item.label] || { icon: 'bi-info-circle', color: 'blue' })
                }));

                this.kpiItems.set(mappedData);
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
