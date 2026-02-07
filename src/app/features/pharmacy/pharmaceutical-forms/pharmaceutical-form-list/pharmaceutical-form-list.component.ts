import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { PharmaceuticalFormResponse } from '../../../../core/models/pharmaceutical-form.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { PharmaceuticalFormFormComponent } from '../pharmaceutical-form-form/pharmaceutical-form-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-pharmaceutical-form-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        PharmaceuticalFormFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './pharmaceutical-form-list.component.html',
    styleUrl: './pharmaceutical-form-list.component.scss'
})
export class PharmaceuticalFormListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    pharmaceuticalForms = signal<PharmaceuticalFormResponse[]>([]);
    filteredPharmaceuticalForms = signal<PharmaceuticalFormResponse[]>([]);
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
        this.maintenanceService.getPharmaceuticalForms().subscribe({
            next: (response) => {
                const forms = response.data;
                this.pharmaceuticalForms.set(forms);
                this.filteredPharmaceuticalForms.set(forms);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading pharmaceutical forms:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.pharmaceuticalForms();

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

        this.filteredPharmaceuticalForms.set(filtered);
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

    handleTableAction(e: { action: string, row: PharmaceuticalFormResponse }) {
        if (e.action === 'edit') {
            this.editForm(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteForm(e.row);
        }
    }

    handleStatusToggle(e: { row: PharmaceuticalFormResponse, key: string, checked: boolean }) {
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

    toggleFormStatus(item: PharmaceuticalFormResponse) {
        if (confirm(`¿Está seguro de ${item.active ? 'desactivar' : 'activar'} la forma farmacéutica "${item.name}"?`)) {
            this.maintenanceService.updatePharmaceuticalForm(
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

    deleteForm(item: PharmaceuticalFormResponse) {
        if (confirm(`¿Está seguro de eliminar la forma farmacéutica "${item.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deletePharmaceuticalForm(item.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting form:', error);
                    alert('Error al eliminar el registro');
                }
            });
        }
    }
}
