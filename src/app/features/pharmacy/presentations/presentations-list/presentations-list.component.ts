import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { PresentationResponse } from '../../../../core/models/presentation.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { PresentationFormComponent } from '../presentation-form/presentation-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-presentations-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        PresentationFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './presentations-list.component.html',
    styleUrl: './presentations-list.component.scss'
})
export class PresentationsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'description', label: 'Presentación', type: 'text' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    presentations = signal<PresentationResponse[]>([]);
    filteredPresentations = signal<PresentationResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');

    // Modal de Formulario
    showPresentationModal = signal(false);
    selectedPresentationId = signal<number | null>(null);

    // Pagination
    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getPresentations().subscribe({
            next: (response) => {
                const presentations = response.data;
                this.presentations.set(presentations);
                this.filteredPresentations.set(presentations);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading presentations:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.presentations();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(pres =>
                pres.description.toLowerCase().includes(search)
            );
        }

        this.filteredPresentations.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: PresentationResponse }) {
        if (e.action === 'edit') {
            this.editPresentation(e.row.id);
        } else if (e.action === 'delete') {
            this.deletePresentation(e.row);
        }
    }

    createPresentation() {
        this.selectedPresentationId.set(null);
        this.showPresentationModal.set(true);
    }

    editPresentation(id: number) {
        this.selectedPresentationId.set(id);
        this.showPresentationModal.set(true);
    }

    onPresentationSaved() {
        this.showPresentationModal.set(false);
        this.loadData();
    }

    onPresentationCancelled() {
        this.showPresentationModal.set(false);
    }

    deletePresentation(presentation: PresentationResponse) {
        if (confirm(`¿Está seguro de eliminar la presentación "${presentation.description}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deletePresentation(presentation.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting presentation:', error);
                    alert('Error al eliminar la presentación');
                }
            });
        }
    }

    trackByPresentationId(index: number, presentation: PresentationResponse): number {
        return presentation.id;
    }
}
