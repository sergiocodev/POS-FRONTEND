import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { EstablishmentsListComponent } from './establishments-list/establishments-list.component';
import { EstablishmentFormComponent } from './establishment-form/establishment-form.component';

import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-establishments',
    standalone: true,
    imports: [CommonModule, DialogModule, EstablishmentsListComponent, EstablishmentFormComponent, ModuleHeaderComponent],
    templateUrl: './establishments.component.html',
    styleUrl: './establishments.component.scss'
})
export class EstablishmentsComponent {
    displayForm = signal(false);
    selectedEstablishmentId = signal<number | null>(null);
    isEditMode = signal(false);

    @ViewChild(EstablishmentsListComponent) establishmentsList!: EstablishmentsListComponent;

    onOpenForm(establishmentId: number | null = null) {
        this.selectedEstablishmentId.set(establishmentId);
        this.isEditMode.set(!!establishmentId);
        this.displayForm.set(true);
    }

    onFormSaved() {
        this.displayForm.set(false);
        this.establishmentsList.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
    }
}
