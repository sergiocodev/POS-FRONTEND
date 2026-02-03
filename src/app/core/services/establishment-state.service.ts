import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentStateService {
    
    selectedEstablishmentId = signal<number | null>(null);

    setSelectedEstablishment(id: number) {
        this.selectedEstablishmentId.set(id);
    }

    getSelectedEstablishment(): number | null {
        return this.selectedEstablishmentId();
    }
}
