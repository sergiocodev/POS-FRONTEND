import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { BrandResponse } from '../../../../core/models/brand.model';

@Component({
    selector: 'app-brands-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './brands-list.component.html',
    styleUrl: './brands-list.component.scss'
})
export class BrandsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    brands = signal<BrandResponse[]>([]);
    filteredBrands = signal<BrandResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getBrands().subscribe({
            next: (brands) => {
                this.brands.set(brands);
                this.filteredBrands.set(brands);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading brands:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.brands();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(brand =>
                brand.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(brand => brand.active === this.selectedStatusFilter());
        }

        this.filteredBrands.set(filtered);
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

    createBrand() {
        this.router.navigate(['/pharmacy/brands/new']);
    }

    editBrand(id: number) {
        this.router.navigate(['/pharmacy/brands', id, 'edit']);
    }

    toggleBrandStatus(brand: BrandResponse) {
        if (confirm(`¿Está seguro de ${brand.active ? 'desactivar' : 'activar'} la marca "${brand.name}"?`)) {
            this.maintenanceService.updateBrand(brand.id, brand.name, !brand.active).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling brand status:', error);
                    alert('Error al cambiar el estado de la marca');
                }
            });
        }
    }

    deleteBrand(brand: BrandResponse) {
        if (confirm(`¿Está seguro de eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteBrand(brand.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting brand:', error);
                    alert('Error al eliminar la marca');
                }
            });
        }
    }

    trackByBrandId(index: number, brand: BrandResponse): number {
        return brand.id;
    }
}
