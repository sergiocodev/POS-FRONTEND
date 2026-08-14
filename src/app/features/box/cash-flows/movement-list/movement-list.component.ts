import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { CashMovementService } from '../../../../core/services/cash-movement.service';
import { CashMovement } from '../../../../core/models/cash-movement.model';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../../shared/components/modal-alert/modal-alert.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-movement-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, ConfirmModalComponent, ModalAlertComponent, SpinnerComponent],
    providers: [CurrencyPipe, DatePipe],
    templateUrl: './movement-list.component.html',
    styleUrl: './movement-list.component.scss'
})
export class MovementListComponent implements OnInit {
    private movementService = inject(CashMovementService);
    private establishmentStateService = inject(EstablishmentStateService);
    private currencyPipe = inject(CurrencyPipe);
    private datePipe = inject(DatePipe);
    private modalService = inject(ModalService);
    private authService = inject(AuthService);

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    movements = signal<CashMovement[]>([]);
    isLoading = signal<boolean>(false);

    currentPage = signal(0);
    pageSize = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);
    tableFilters = signal<any>({});

    columns: TableColumn[] = [];

    private initColumns(): void {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            {
                key: 'createdAt',
                label: 'Fecha',
                format: (val) => this.datePipe.transform(val, 'dd/MM/yyyy HH:mm') || '', filterable: true
            },
            { key: 'conceptName', label: 'Concepto', filterable: true },
            { key: 'description', label: 'Descripción', filterable: true },
            {
                key: 'type',
                label: 'Tipo',
                type: 'badge',
                classCallback: (val) => val === 'IN' ? 'bg-success text-white' : 'bg-danger text-white',
                format: (val) => val === 'IN' ? 'INGRESO' : 'EGRESO', filterable: true
            },
            {
                key: 'amount',
                label: 'Monto',
                format: (val) => this.currencyPipe.transform(val, 'PEN', 'S/. ') || ''
            },
            { key: 'reference', label: 'Referencia', filterable: true },
            { key: 'username', label: 'Usuario', filterable: this.authService.isAdmin() }
        ];

        if (this.authService.isAdmin()) {
            this.columns.push({
                key: 'actions',
                label: 'Acciones',
                type: 'action',
                align: 'right'
            });
        }
    }

    constructor() {
        this.initColumns();
        effect(() => {
            this.selectedEstablishmentId(); // track
            untracked(() => {
                this.currentPage.set(0);
                this.loadMovements();
            });
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        // loadMovements called by effect
    }

    loadMovements(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) return;

        this.isLoading.set(true);
        const filters = { ...this.tableFilters(), establishmentId: estId };
        this.movementService.getAll(this.currentPage(), this.pageSize(), filters).subscribe({
            next: (response) => {
                const page = response.data;
                const isAdmin = this.authService.isAdmin();
                const content = (page.content || []).map((m: any) => ({
                    ...m,
                    actions: isAdmin ? [
                        { id: 'delete', icon: 'bi-trash', class: 'btn-delete', title: 'Anular Movimiento' }
                    ] : []
                }));
                this.movements.set(content);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading movements:', err);
                this.isLoading.set(false);
            }
        });
    }

    handleAction(event: { action: string, row: any }): void {
        if (event.action === 'delete') {
            this.onDelete(event.row.id);
        }
    }

    handlePageChange(page: number): void {
        this.currentPage.set(page);
        this.loadMovements();
    }

    handlePageSizeChangeValue(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadMovements();
    }

    onTableFilter(filters: any): void {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadMovements();
    }

    async onDelete(id: number) {
        if (!this.authService.isAdmin()) {
            this.modalService.alert({
                title: 'Acceso Denegado',
                message: 'Solo los administradores tienen permiso para anular movimientos de caja.',
                type: 'error'
            });
            return;
        }

        const confirmed = await this.modalService.confirm({
            title: 'Anular Movimiento',
            message: '¿Está seguro de anular este movimiento? Esto revertirá el saldo en la sesión de caja.',
            btnColor: 'danger',
            confirmText: 'Anular'
        });

        if (confirmed) {
            this.movementService.delete(id).subscribe({
                next: () => {
                    this.loadMovements();
                    this.modalService.alert({ title: 'Anulado', message: 'Movimiento anulado correctamente', type: 'success' });
                },
                error: (err: any) => {
                    this.modalService.alert({ title: 'Error', message: 'Error al anular movimiento: ' + (err.error?.message || err.message), type: 'error' });
                }
            });
        }
    }
}
