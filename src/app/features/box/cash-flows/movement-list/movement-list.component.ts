import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { CashMovementService } from '../../../../core/services/cash-movement.service';
import { CashMovement } from '../../../../core/models/cash-movement.model';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';


@Component({
    selector: 'app-movement-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent],
    providers: [CurrencyPipe, DatePipe],
    templateUrl: './movement-list.component.html',
    styleUrl: './movement-list.component.scss'
})
export class MovementListComponent implements OnInit {
    private movementService = inject(CashMovementService);
    private establishmentStateService = inject(EstablishmentStateService);
    private currencyPipe = inject(CurrencyPipe);
    private datePipe = inject(DatePipe);

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    movements = signal<CashMovement[]>([]);
    isLoading = signal<boolean>(false);

    currentPage = signal(0);
    pageSize = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);
    tableFilters = signal<any>({});

    columns: TableColumn[] = [
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
        { key: 'username', label: 'Usuario', filterable: true },
        {
            key: 'actions',
            label: 'Acciones',
            type: 'action',
            // Simple action definition for custom-table
        }
    ];

    constructor() {
        effect(() => {
            this.selectedEstablishmentId(); // track
            this.currentPage.set(0);
            this.loadMovements();
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
                this.movements.set(page.content || []);
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

    onDelete(id: number): void {
        if (confirm('¿Está seguro de anular este movimiento? Esto revertirá el saldo en la sesión de caja.')) {
            this.movementService.delete(id).subscribe({
                next: () => this.loadMovements(),
                error: (err) => alert('Error al anular movimiento: ' + (err.error?.message || err.message))
            });
        }
    }
}
