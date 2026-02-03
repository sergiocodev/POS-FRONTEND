import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { LaboratoryResponse } from '../../../../core/models/laboratory.model';

@Component({
    selector: 'app-laboratories-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './laboratories-list.component.html',
    styleUrl: './laboratories-list.component.scss'
})
export class LaboratoriesListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    laboratories = signal<LaboratoryResponse[]>([]);
    filteredLaboratories = signal<LaboratoryResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getLaboratories().subscribe({
            next: (laboratories) => {
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

    onStatusFilterChange(status: string) {
        if (status === '') {
            this.selectedStatusFilter.set(null);
        } else {
            this.selectedStatusFilter.set(status === 'true');
        }
        this.applyFilters();
    }

    createLaboratory() {
        this.router.navigate(['/pharmacy/labs/new']);
    }

    editLaboratory(id: number) {
        this.router.navigate(['/pharmacy/labs', id, 'edit']);
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
