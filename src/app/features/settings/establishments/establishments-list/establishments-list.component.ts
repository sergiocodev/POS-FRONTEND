import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-establishments-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './establishments-list.component.html',
    styleUrl: './establishments-list.component.scss'
})
export class EstablishmentsListComponent implements OnInit {
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);

    establishments = signal<EstablishmentResponse[]>([]);
    filteredEstablishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal(false);

    // Filters
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.establishmentService.getAll().subscribe({
            next: (establishments) => {
                this.establishments.set(establishments);
                this.filteredEstablishments.set(establishments);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishments:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.establishments();

        // Search filter
        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(est =>
                est.name.toLowerCase().includes(search) ||
                (est.address && est.address.toLowerCase().includes(search)) ||
                est.codeSunat.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(est => est.active === this.selectedStatusFilter());
        }

        this.filteredEstablishments.set(filtered);
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

    createEstablishment() {
        this.router.navigate(['/settings/establishments/new']);
    }

    editEstablishment(id: number) {
        this.router.navigate(['/settings/establishments', id, 'edit']);
    }

    toggleEstablishmentStatus(establishment: EstablishmentResponse) {
        if (confirm(`¿Está seguro de ${establishment.active ? 'desactivar' : 'activar'} el establecimiento ${establishment.name}?`)) {
            // Update using the existing update method
            const request = {
                name: establishment.name,
                address: establishment.address,
                codeSunat: establishment.codeSunat,
                active: !establishment.active
            };

            this.establishmentService.update(establishment.id, request).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling establishment status:', error);
                    alert('Error al cambiar el estado del establecimiento');
                }
            });
        }
    }

    deleteEstablishment(establishment: EstablishmentResponse) {
        if (confirm(`¿Está seguro de eliminar el establecimiento ${establishment.name}? Esta acción no se puede deshacer.`)) {
            this.establishmentService.delete(establishment.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting establishment:', error);
                    alert('Error al eliminar el establecimiento');
                }
            });
        }
    }

    trackByEstablishmentId(index: number, establishment: EstablishmentResponse): number {
        return establishment.id;
    }
}
