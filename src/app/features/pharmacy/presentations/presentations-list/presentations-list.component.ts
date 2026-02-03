import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { PresentationResponse } from '../../../../core/models/presentation.model';

@Component({
    selector: 'app-presentations-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './presentations-list.component.html',
    styleUrl: './presentations-list.component.scss'
})
export class PresentationsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    presentations = signal<PresentationResponse[]>([]);
    filteredPresentations = signal<PresentationResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getPresentations().subscribe({
            next: (presentations) => {
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

    createPresentation() {
        this.router.navigate(['/pharmacy/presentations/new']);
    }

    editPresentation(id: number) {
        this.router.navigate(['/pharmacy/presentations', id, 'edit']);
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
