import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { LaboratoryResponse } from '../../../../core/models/laboratory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { LaboratoryFormComponent } from '../laboratory-form/laboratory-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-laboratories-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        LaboratoryFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './laboratories-list.component.html',
    styleUrl: './laboratories-list.component.scss'
})
export class LaboratoriesListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Laboratorio', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    laboratories = signal<LaboratoryResponse[]>([]);
    filteredLaboratories = signal<LaboratoryResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario
    showLaboratoryModal = signal(false);
    selectedLaboratoryId = signal<number | null>(null);

    // Pagination
    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getLaboratories().subscribe({
            next: (response) => {
                const laboratories = response.data;
                this.laboratories.set(laboratories);
                this.filteredLaboratories.set(laboratories);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading laboratories:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.laboratories();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(lab =>
                lab.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(lab => lab.active === this.selectedStatusFilter());
        }

        this.filteredLaboratories.set(filtered);
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

    // --- Actions ---

    handleTableAction(e: { action: string, row: LaboratoryResponse }) {
        if (e.action === 'edit') {
            this.editLaboratory(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteLaboratory(e.row);
        }
    }

    handleStatusToggle(e: { row: LaboratoryResponse, key: string, checked: boolean }) {
        this.toggleLaboratoryStatus(e.row);
    }

    createLaboratory() {
        this.selectedLaboratoryId.set(null);
        this.showLaboratoryModal.set(true);
    }

    editLaboratory(id: number) {
        this.selectedLaboratoryId.set(id);
        this.showLaboratoryModal.set(true);
    }

    onLaboratorySaved() {
        this.showLaboratoryModal.set(false);
        this.loadData();
    }

    onLaboratoryCancelled() {
        this.showLaboratoryModal.set(false);
    }

    toggleLaboratoryStatus(laboratory: LaboratoryResponse) {
        if (confirm(`¿Está seguro de ${laboratory.active ? 'desactivar' : 'activar'} el laboratorio "${laboratory.name}"?`)) {
            this.maintenanceService.updateLaboratory(
                laboratory.id,
                laboratory.name,
                !laboratory.active
            ).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling laboratory status:', error);
                    alert('Error al cambiar el estado del laboratorio');
                }
            });
        }
    }

    deleteLaboratory(laboratory: LaboratoryResponse) {
        if (confirm(`¿Está seguro de eliminar el laboratorio "${laboratory.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteLaboratory(laboratory.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting laboratory:', error);
                    alert('Error al eliminar el laboratorio');
                }
            });
        }
    }

    trackByLaboratoryId(index: number, laboratory: LaboratoryResponse): number {
        return laboratory.id;
    }
}
