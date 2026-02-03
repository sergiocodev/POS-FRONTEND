import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CashRegisterResponse } from '../../../core/models/cash.model';

@Component({
    selector: 'app-registers-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './registers-list.component.html',
    styleUrl: './registers-list.component.scss'
})
export class RegistersListComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);

    registers = signal<CashRegisterResponse[]>([]);
    filteredRegisters = signal<CashRegisterResponse[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadRegisters();
            }
        });
    }

    ngOnInit(): void {
        this.loadRegisters();
    }

    loadRegisters(): void {
        this.isLoading.set(true);
        this.cashService.getRegisters().subscribe({
            next: (data) => {
                this.registers.set(data);
                this.applyFilter();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading registers:', err);
                this.isLoading.set(false);
            }
        });
    }

    applyFilter(): void {
        const estId = this.selectedEstablishmentId();
        if (estId) {
            this.filteredRegisters.set(this.registers().filter(r => r.establishmentId === estId));
        } else {
            this.filteredRegisters.set(this.registers());
        }
    }

    onToggleStatus(register: CashRegisterResponse): void {
        
        this.cashService.updateRegister(register.id, {
            name: register.name,
            establishmentId: register.establishmentId,
            active: !register.active
        }).subscribe({
            next: () => this.loadRegisters()
        });
    }

    onDelete(id: number): void {
        if (confirm('¿Está seguro de eliminar esta caja registradora?')) {
            this.cashService.deleteRegister(id).subscribe({
                next: () => this.loadRegisters()
            });
        }
    }
}
