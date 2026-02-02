import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private activeModals = new BehaviorSubject<string[]>([]);
    public activeModals$ = this.activeModals.asObservable();

    open(id: string) {
        const current = this.activeModals.value;
        if (!current.includes(id)) {
            this.activeModals.next([...current, id]);
        }
    }

    close(id: string) {
        const current = this.activeModals.value;
        this.activeModals.next(current.filter(m => m !== id));
    }

    isModalOpen(id: string): boolean {
        return this.activeModals.value.includes(id);
    }

    closeAll() {
        this.activeModals.next([]);
    }
}
