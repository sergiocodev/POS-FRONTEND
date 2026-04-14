import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentStateService {
    private readonly STORAGE_KEY = 'selectedEstablishmentId';

    selectedEstablishmentId = signal<number | null>(
        this.loadFromStorage()
    );

    private loadFromStorage(): number | null {
        try {
            const val = localStorage.getItem(this.STORAGE_KEY);
            return val ? parseInt(val, 10) : null;
        } catch {
            return null;
        }
    }

    selectEstablishment(id: number | null): void {
        this.selectedEstablishmentId.set(id);
        try {
            if (id !== null) {
                localStorage.setItem(this.STORAGE_KEY, String(id));
            } else {
                localStorage.removeItem(this.STORAGE_KEY);
            }
        } catch {
            // localStorage not available
        }
    }

    /** @deprecated Use selectEstablishment() instead */
    setSelectedEstablishment(id: number) {
        this.selectEstablishment(id);
    }

    getSelectedEstablishment(): number | null {
        return this.selectedEstablishmentId();
    }
}
