import { Component, OnInit, inject, signal, effect, ViewChild, TemplateRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { RegisterFormComponent } from './register-form/register-form.component';

@Component({
    selector: 'app-box-registers',
    standalone: true,
    imports: [CommonModule, ModuleHeaderComponent, CustomTableComponent, ModalGenericComponent, RegisterFormComponent],
    templateUrl: './box-registers.component.html',
    styleUrl: './box-registers.component.scss'
})
export class BoxRegistersComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private destroyRef = inject(DestroyRef);

    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;

    registers = signal<any[]>([]);
    filteredRegisters = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    showRegisterModal = signal<boolean>(false);
    selectedRegisterId = signal<number | null>(null);

    tableColumns: TableColumn[] = [];

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadRegisters();
            }
        });
    }

    ngOnInit(): void {
        this.tableColumns = [
            { key: 'index', label: 'N°', type: 'index', width: '60px' },
            { key: 'name', label: 'Nombre de la Caja', type: 'template', templateRef: this.nameTpl },
            { key: 'establishmentName', label: 'Establecimiento' },
            { key: 'actions', label: 'Acciones', type: 'action', align: 'center' }
        ];

        this.loadRegisters();
    }

    loadRegisters(): void {
        this.isLoading.set(true);
        this.cashService.getRegisters().pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.isLoading.set(false))
        ).subscribe({
            next: (response) => {
                const mappedData = response.data.map(item => ({
                    ...item,
                    actions: [
                        { id: 'edit', icon: 'bi-pencil', class: 'btn-outline-info', title: 'Editar' },
                        { id: 'delete', icon: 'bi-trash', class: 'btn-outline-danger', title: 'Eliminar' }
                    ]
                }));
                this.registers.set(mappedData);
                this.applyFilter();
            },
            error: (err) => {
                console.error('Error loading registers:', err);
            }
        });
    }

    applyFilter(): void {
        const estId = this.selectedEstablishmentId();
        if (estId) {
            this.filteredRegisters.set(this.registers().filter(r => r.establishmentId === estId));
        } else {
            this.filteredRegisters.set(this.registers());
        }
    }

    onAction(event: { action: string, row: any }) {
        if (event.action === 'edit') {
            this.openEditRegisterModal(event.row.id);
        } else if (event.action === 'delete') {
            this.onDelete(event.row.id);
        }
    }

    onDelete(id: number): void {
        if (confirm('¿Está seguro de eliminar esta caja registradora?')) {
            this.cashService.deleteRegister(id).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe({
                next: () => this.loadRegisters()
            });
        }
    }

    openNewRegisterModal(): void {
        this.selectedRegisterId.set(null);
        this.showRegisterModal.set(true);
    }

    openEditRegisterModal(id: number): void {
        this.selectedRegisterId.set(id);
        this.showRegisterModal.set(true);
    }

    closeRegisterModal(): void {
        this.showRegisterModal.set(false);
    }

    onRegisterSaved(): void {
        this.closeRegisterModal();
        this.loadRegisters();
    }
}
