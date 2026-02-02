import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentStateService {
    // Shared signal for the selected establishment ID
    selectedEstablishmentId = signal<number | null>(null);

    setSelectedEstablishment(id: number) {
        this.selectedEstablishmentId.set(id);
    }

    getSelectedEstablishment(): number | null {
        return this.selectedEstablishmentId();
    }
}
