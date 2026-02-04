import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
// Eliminado: import { DialogModule } ...
import { EmployeesListComponent } from './employees-list/employees-list.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [
        CommonModule,
        EmployeesListComponent,
        EmployeeFormComponent
        // Eliminado: DialogModule
    ],
    templateUrl: './employees.component.html',
    styleUrl: './employees.component.scss'
})
export class EmployeesComponent {
    displayForm = signal(false);
    selectedEmployeeId = signal<number | null>(null);
    isEditMode = signal(false);

    @ViewChild(EmployeesListComponent) employeesList!: EmployeesListComponent;

    onOpenForm(employeeId: number | null = null) {
        this.selectedEmployeeId.set(employeeId);
        this.isEditMode.set(!!employeeId);
        this.displayForm.set(true);
    }

    onFormSaved() {
        this.displayForm.set(false);
        this.selectedEmployeeId.set(null); // Limpiar ID al guardar
        this.employeesList.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
        this.selectedEmployeeId.set(null); // Limpiar ID al cancelar
    }
}