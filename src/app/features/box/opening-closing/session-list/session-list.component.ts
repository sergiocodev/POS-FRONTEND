import { Component, Input, Output, EventEmitter, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashSessionResponse, SessionStatus } from '../../../../core/models/cash.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-session-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent],
    templateUrl: './session-list.component.html',
    styleUrl: './session-list.component.scss'
})
export class SessionListComponent implements OnInit {
    @Input() sessions: CashSessionResponse[] = [];
    @Input() isLoading: boolean = false;
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 8;

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
    @ViewChild('boxUserTpl', { static: true }) boxUserTpl!: TemplateRef<any>;
    @ViewChild('openingBalanceTpl', { static: true }) openingBalanceTpl!: TemplateRef<any>;
    @ViewChild('expectedBalanceTpl', { static: true }) expectedBalanceTpl!: TemplateRef<any>;
    @ViewChild('closingBalanceTpl', { static: true }) closingBalanceTpl!: TemplateRef<any>;
    @ViewChild('diffTpl', { static: true }) diffTpl!: TemplateRef<any>;

    tableColumns: TableColumn[] = [];

    ngOnInit(): void {
        this.tableColumns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            { key: 'openedAt', label: 'Fecha / Hora', type: 'template', templateRef: this.dateTpl },
            { key: 'cashRegisterName', label: 'Caja / Responsable', type: 'template', templateRef: this.boxUserTpl },
            { key: 'openingBalance', label: 'Saldo Inicial', type: 'template', templateRef: this.openingBalanceTpl, align: 'right' },
            { key: 'calculatedBalance', label: 'Saldo Esperado', type: 'template', templateRef: this.expectedBalanceTpl, align: 'right' },
            { key: 'closingBalance', label: 'Saldo Final', type: 'template', templateRef: this.closingBalanceTpl, align: 'right' },
            { key: 'diffAmount', label: 'Diferencia', type: 'template', templateRef: this.diffTpl, align: 'right' },
            {
                key: 'status',
                label: 'Estado',
                type: 'badge',
                align: 'center',
                classCallback: (val: SessionStatus) => this.getStatusBadgeClass(val) + ' px-3 py-2',
                format: (val: SessionStatus) => val === SessionStatus.OPEN ? 'ABIERTA' : 'CERRADA'
            }
        ];
    }

    handlePageChange(page: number): void {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number): void {
        this.pageSizeChange.emit(size);
    }

    getStatusBadgeClass(status: SessionStatus): string {
        return status === SessionStatus.OPEN ? 'bg-success' : 'bg-secondary';
    }
}
