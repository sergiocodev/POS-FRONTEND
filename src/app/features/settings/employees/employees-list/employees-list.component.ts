import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeResponse } from '../../../../core/models/employee.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit, OnChanges {
    @Input() employees: EmployeeResponse[] = [];
    @Input() isLoading: boolean = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<EmployeeResponse>();
    @Output() toggleStatus = new EventEmitter<EmployeeResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'fullName', label: 'Nombre', type: 'text' },
        { key: 'documentNumber', label: 'Documento', type: 'text' },
        {
            key: 'username',
            label: 'Usuario',
            type: 'text',
            format: (v: any) => v || 'Sin cuenta'
        },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Data Signals
    localEmployees = signal<EmployeeResponse[]>([]);
    filteredEmployees = signal<EmployeeResponse[]>([]);

    // Filtros
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    pageSize = 10;

    constructor() { }

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['employees']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localEmployees.set(this.employees);
        this.applyFilters();
    }

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.localEmployees();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(emp =>
                emp.firstName.toLowerCase().includes(search) ||
                (emp.lastName && emp.lastName.toLowerCase().includes(search)) ||
                (emp.documentNumber && emp.documentNumber.includes(search))
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(emp => emp.active === this.selectedStatusFilter());
        }

        this.filteredEmployees.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: EmployeeResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: EmployeeResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
    }

    createEmployee() {
        this.create.emit();
    }

    getFullName(employee: EmployeeResponse): string {
        return `${employee.firstName} ${employee.lastName || ''}`.trim();
    }



    trackByEmployeeId(index: number, employee: EmployeeResponse): number {
        return employee.id;
    }
}