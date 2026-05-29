import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountReceivableService } from '../../../core/services/account-receivable.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { AccountReceivableResponse, ReceivablePaymentMethod, AccountReceivablePaymentRequest, AccountReceivablePaymentResponse } from '../../../core/models/account-receivable.model';
import { AccountReceivableListComponent } from './account-receivable-list/account-receivable-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';
import { RegisterPayComponent } from './register-pay/register-pay.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';

@Component({
    selector: 'app-account-receivables',
    standalone: true,
    imports: [
        CommonModule,
        AccountReceivableListComponent,
        ModalGenericComponent,
        ModalAlertComponent,
        ModuleHeaderComponent,
        SmartKpiCardsComponent,
        RegisterPayComponent,
        PaymentHistoryComponent,
    ],
    templateUrl: './account-receivables.component.html',
    styleUrl: './account-receivables.component.scss'
})
export class AccountReceivablesComponent implements OnInit {
    private accountReceivableService = inject(AccountReceivableService);
    private cashSessionService = inject(CashSessionService);
    private modalService = inject(ModalService);

    // State
    receivables = signal<AccountReceivableResponse[]>([]);
    isLoading = signal<boolean>(false);
    kpiItems = signal<SmartKpiItem[]>([]);

    // Pagination & Filtering
    totalElements = signal<number>(0);
    pageSize = signal<number>(10);
    currentPage = signal<number>(0);
    filterValues = signal<any>({});

    // Modal State for Payment
    showPaymentModal = signal<boolean>(false);
    selectedReceivable = signal<AccountReceivableResponse | null>(null);

    // Modal State for History
    showHistoryModal = signal<boolean>(false);

    ngOnInit(): void {
        this.loadDashboard();
        this.loadReceivables();
    }

    loadReceivables() {
        this.isLoading.set(true);
        const params = {
            page: this.currentPage(),
            size: this.pageSize(),
            customerName: this.filterValues().customerName || '',
            saleIdentifier: this.filterValues().saleIdentifier || '',
            createdAt: this.filterValues().createdAt || '',
            status: this.filterValues().status || '',
            dueDate: this.filterValues().dueDate || ''
        };

        this.accountReceivableService.getAllPaged(params).subscribe({
            next: (response: any) => {
                const data = response.data;
                const mappedData = data.content.map((item: AccountReceivableResponse) => ({
                    ...item,
                    actions: [
                        { id: 'pay', icon: 'bi-cash-stack', class: 'btn-success', title: 'Cobrar' },
                        { id: 'view', icon: 'bi-search', class: 'btn-primary', title: 'Ver Historial' }
                    ]
                }));
                this.receivables.set(mappedData);
                this.totalElements.set(data.totalElements);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar las cuentas por cobrar', type: 'error' });
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadReceivables();
    }

    onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadReceivables();
    }

    onFilterChange(filters: any) {
        this.filterValues.set(filters);
        this.currentPage.set(0);
        this.loadReceivables();
    }

    loadDashboard() {
        this.accountReceivableService.getDashboard().subscribe({
            next: (response: any) => {
                const data = response.data ? response.data : response;

                const styles: any = {
                    'TOTAL PENDIENTE': { icon: 'bi-cash', color: 'blue' },
                    'MONTO VENCIDO': { icon: 'bi-exclamation-triangle', color: 'orange' },
                    'POR VENCER': { icon: 'bi-clock', color: 'purple' },
                    'TASA EFECTIVA': { icon: 'bi-check-circle', color: 'green' }
                };

                const mappedData = data.map((item: any) => ({
                    ...item,
                    ...(styles[item.label] || { icon: 'bi-info-circle', color: 'blue' })
                }));

                this.kpiItems.set(mappedData);
            },
            error: (err: any) => {
                console.error("Error loading dashboard KPIs", err);
            }
        });
    }



    onPayAction(receivable: AccountReceivableResponse) {
        if (receivable.status === 'PAID') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta ya está totalmente cobrada.', type: 'warning' });
            return;
        }
        if (receivable.status === 'CANCELED') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta está anulada.', type: 'warning' });
            return;
        }
        this.selectedReceivable.set(receivable);
        this.showPaymentModal.set(true);
    }

    closePaymentModal() {
        this.showPaymentModal.set(false);
        this.selectedReceivable.set(null);
    }

    onPaymentSuccess() {
        this.closePaymentModal();
        this.loadReceivables();
    }

    onViewAction(receivable: AccountReceivableResponse) {
        this.selectedReceivable.set(receivable);
        this.showHistoryModal.set(true);
    }

    closeHistoryModal() {
        this.showHistoryModal.set(false);
        if (!this.showPaymentModal()) {
            this.selectedReceivable.set(null);
        }
    }
}
