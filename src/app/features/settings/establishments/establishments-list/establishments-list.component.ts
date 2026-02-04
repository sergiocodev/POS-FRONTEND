import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-establishments-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],
    templateUrl: './establishments-list.component.html',
    styleUrl: './establishments-list.component.scss'
})
export class EstablishmentsListComponent implements OnInit {
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Data Signals
    establishments = signal<EstablishmentResponse[]>([]);
    filteredEstablishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal(false);

    // Filters
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination & Sorting
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof EstablishmentResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Modal & Alerts
    showConfirmModal = false;
    modalMessage = '';
    modalActionType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.establishmentService.getAll().subscribe({
            next: (establishments) => {
                this.establishments.set(establishments);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishments:', error);
                this.showAlert('Error', 'No se pudieron cargar los datos', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.establishments();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(est =>
                est.name.toLowerCase().includes(search) ||
                (est.address && est.address.toLowerCase().includes(search)) ||
                est.codeSunat.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(est => est.active === this.selectedStatusFilter());
        }

        this.filteredEstablishments.set(filtered);
        this.currentPage = 1;
        this.sortData(this.sortColumn as any, false);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Pagination & Sorting ---

    get paginatedEstablishments(): EstablishmentResponse[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredEstablishments().slice(startIndex, startIndex + this.pageSize);
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= Math.ceil(this.filteredEstablishments().length / this.pageSize)) {
            this.currentPage = newPage;
        }
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }

    sortData(column: keyof EstablishmentResponse, toggle = true) {
        if (!column) return;

        if (toggle) {
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
        }

        const sorted = [...this.filteredEstablishments()].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA == null) return 1;
            if (valB == null) return -1;

            const comparison = valA.toString().localeCompare(valB.toString());
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.filteredEstablishments.set(sorted);
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'bi-arrow-down-up opacity-25';
        return this.sortDirection === 'asc' ? 'bi-arrow-up text-primary' : 'bi-arrow-down text-primary';
    }

    // --- Actions ---

    createEstablishment() {
        this.create.emit();
    }

    editEstablishment(id: number) {
        this.edit.emit(id);
    }

    // --- Modal Logic ---

    confirmToggleStatus(est: EstablishmentResponse) {
        this.modalActionType = 'status';
        this.modalMessage = `¿Está seguro de ${est.active ? 'desactivar' : 'activar'} el establecimiento <b>${est.name}</b>?`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            const request = {
                name: est.name,
                address: est.address,
                codeSunat: est.codeSunat,
                active: !est.active
            };

            this.establishmentService.update(est.id, request).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Éxito', `Establecimiento ${est.active ? 'desactivado' : 'activado'} correctamente`, 'success');
                },
                error: (error) => {
                    console.error('Error toggling status:', error);
                    this.showAlert('Error', 'No se pudo cambiar el estado', 'danger');
                }
            });
        };
    }

    confirmDelete(est: EstablishmentResponse) {
        this.modalActionType = 'delete';
        this.modalMessage = `¿Está seguro de eliminar el establecimiento <b>${est.name}</b>? Esta acción no se puede deshacer.`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            this.establishmentService.delete(est.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Eliminado', 'Establecimiento eliminado correctamente', 'success');
                },
                error: (error) => {
                    console.error('Error deleting establishment:', error);
                    this.showAlert('Error', 'No se pudo eliminar el establecimiento', 'danger');
                }
            });
        };
    }

    closeModal() {
        this.showConfirmModal = false;
        this.pendingAction = null;
    }

    executePendingAction() {
        if (this.pendingAction) this.pendingAction();
        this.closeModal();
    }

    // --- Alert Logic ---

    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 3000);
    }

    closeAlert() {
        this.alertMessage = '';
    }

    trackById(index: number, est: EstablishmentResponse): number {
        return est.id;
    }
}