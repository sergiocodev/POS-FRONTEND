import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

@Component({
    selector: 'app-establishments-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        TooltipModule,
        InputIconModule,
        IconFieldModule
    ],
    templateUrl: './establishments-list.component.html',
    styleUrl: './establishments-list.component.scss'
})
export class EstablishmentsListComponent implements OnInit {
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    establishments = signal<EstablishmentResponse[]>([]);
    filteredEstablishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    statusOptions = [
        { label: 'Todos', value: null },
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false }
    ];

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
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        this.selectedStatusFilter.set(event.value);
        this.applyFilters();
    }

    createEstablishment() {
        this.create.emit();
    }

    editEstablishment(id: number) {
        this.edit.emit(id);
    }

    toggleEstablishmentStatus(establishment: EstablishmentResponse) {
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
            }
        });
    }

    deleteEstablishment(establishment: EstablishmentResponse) {
        if (confirm(`¿Está seguro de eliminar el establecimiento ${establishment.name}? Esta acción no se puede deshacer.`)) {
            this.establishmentService.delete(establishment.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting establishment:', error);
                }
            });
        }
    }
}
