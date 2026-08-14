import { Component, OnInit, inject, signal, effect, untracked, ViewChild, TemplateRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { RegisterFormComponent } from './register-form/register-form.component';
import { CashRegisterResponse } from '../../../core/models/cash.model';

@Component({
    selector: 'app-box-registers',
    standalone: true,
    imports: [CommonModule, ModuleHeaderComponent, CustomTableComponent, ModalGenericComponent, RegisterFormComponent, ConfirmModalComponent, ModalAlertComponent, SpinnerComponent],
    templateUrl: './box-registers.component.html',
    styleUrl: './box-registers.component.scss'
})
export class BoxRegistersComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private modalService = inject(ModalService);
    private destroyRef = inject(DestroyRef);

    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;

    registers = signal<(CashRegisterResponse & { actions?: any[] })[]>([]);
    filteredRegisters = signal<(CashRegisterResponse & { actions?: any[] })[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    showRegisterModal = signal<boolean>(false);
    selectedRegisterId = signal<number | null>(null);

    tableColumns: TableColumn<CashRegisterResponse & { actions?: any[] }>[] = [];

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                untracked(() => this.loadRegisters());
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
        const estId = this.selectedEstablishmentId();
        this.cashService.getRegisters(estId).pipe(
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

    onAction(event: { action: string, row: CashRegisterResponse }): void {
        if (event.action === 'edit') {
            this.openEditRegisterModal(event.row.id);
        } else if (event.action === 'delete') {
            this.onDelete(event.row.id);
        }
    }

    async onDelete(id: number) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Caja Registradora',
            message: '¿Está seguro de eliminar esta caja registradora? Esta acción no se puede deshacer.',
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.cashService.deleteRegister(id).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe({
                next: () => {
                    this.loadRegisters();
                    this.modalService.alert({ title: 'Éxito', message: 'Caja eliminada correctamente', type: 'success' });
                },
                error: (err) => {
                    this.modalService.alert({ title: 'Error', message: 'No se pudo eliminar la caja', type: 'error' });
                }
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
