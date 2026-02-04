import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
// Eliminado: import { DialogModule } from 'primeng/dialog';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RoleFormComponent } from './role-form/role-form.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [
        CommonModule,
        RolesListComponent,
        RoleFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent {
    displayForm = signal(false);
    selectedRoleId = signal<number | null>(null);
    isEditMode = signal(false);

    @ViewChild(RolesListComponent) rolesList!: RolesListComponent;

    onOpenForm(roleId: number | null = null) {
        this.selectedRoleId.set(roleId);
        this.isEditMode.set(!!roleId);
        this.displayForm.set(true);
    }

    onFormSaved() {
        this.displayForm.set(false);
        this.selectedRoleId.set(null);
        this.rolesList.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
        this.selectedRoleId.set(null);
    }
}