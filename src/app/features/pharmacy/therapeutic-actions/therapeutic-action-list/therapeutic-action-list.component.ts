
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { TherapeuticActionResponse } from '../../../../core/models/therapeutic-action.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { TherapeuticActionFormComponent } from '../therapeutic-action-form/therapeutic-action-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-therapeutic-action-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        TherapeuticActionFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './therapeutic-action-list.component.html',
    styleUrl: './therapeutic-action-list.component.scss'
})
export class TherapeuticActionListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    therapeuticActions = signal<TherapeuticActionResponse[]>([]);
    filteredTherapeuticActions = signal<TherapeuticActionResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal
    showFormModal = signal(false);
    selectedFormId = signal<number | null>(null);

    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getTherapeuticActions().subscribe({
            next: (response) => {
                const actions = response.data;
                this.therapeuticActions.set(actions);
                this.filteredTherapeuticActions.set(actions);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading therapeutic actions:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.therapeuticActions();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(search) ||
                (item.description && item.description.toLowerCase().includes(search))
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(item => item.active === this.selectedStatusFilter());
        }

        this.filteredTherapeuticActions.set(filtered);
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

    handleTableAction(e: { action: string, row: TherapeuticActionResponse }) {
        if (e.action === 'edit') {
            this.editForm(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteForm(e.row);
        }
    }

    handleStatusToggle(e: { row: TherapeuticActionResponse, key: string, checked: boolean }) {
        this.toggleFormStatus(e.row);
    }

    createForm() {
        this.selectedFormId.set(null);
        this.showFormModal.set(true);
    }

    editForm(id: number) {
        this.selectedFormId.set(id);
        this.showFormModal.set(true);
    }

    onFormSaved() {
        this.showFormModal.set(false);
        this.loadData();
    }

    onFormCancelled() {
        this.showFormModal.set(false);
    }

    toggleFormStatus(item: TherapeuticActionResponse) {
        if (confirm(`¿Está seguro de ${item.active ? 'desactivar' : 'activar'} la acción terapéutica "${item.name}"?`)) {
            this.maintenanceService.updateTherapeuticAction(
                item.id,
                item.name,
                item.description,
                !item.active
            ).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling status:', error);
                    alert('Error al cambiar el estado');
                }
            });
        }
    }

    deleteForm(item: TherapeuticActionResponse) {
        if (confirm(`¿Está seguro de eliminar la acción terapéutica "${item.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteTherapeuticAction(item.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting action:', error);
                    alert('Error al eliminar el registro');
                }
            });
        }
    }
}
