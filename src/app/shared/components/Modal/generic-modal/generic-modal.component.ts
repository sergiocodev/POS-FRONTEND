import { Component, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-generic-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './generic-modal.component.html',
    styleUrl: './generic-modal.component.scss'
})
export class GenericModalComponent implements OnInit, OnDestroy {
    @Input() id: string = 'generic_modal_' + Math.random().toString(36).substr(2, 9);
    @Input() title: string = '';
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
    @Input() showCloseButton: boolean = true;
    @Input() isOpen: boolean = false;
    @Input() modalFooter: boolean = true;

    @Output() onClose = new EventEmitter<void>();

    private modalSubscription?: Subscription;

    constructor(private modalService: ModalService) { }

    ngOnInit(): void {
        this.modalSubscription = this.modalService.activeModals$.subscribe(modals => {
            this.isOpen = modals.includes(this.id);
            if (this.isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        if (this.isOpen) {
            this.modalService.open(this.id);
        }
    }

    closeModal() {
        this.modalService.close(this.id);
        this.onClose.emit();
    }

    get sizeClass(): string {
        return {
            'sm': 'modal-sm',
            'md': '',
            'lg': 'modal-lg',
            'xl': 'modal-xl'
        }[this.size];
    }

    ngOnDestroy(): void {
        this.modalSubscription?.unsubscribe();
        this.modalService.close(this.id);
        document.body.style.overflow = '';
    }
}
