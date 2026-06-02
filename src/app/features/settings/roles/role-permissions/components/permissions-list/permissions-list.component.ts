import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionResponse } from '../../../../../../core/models/maintenance.model';
import { PermissionConstants } from '../../../../../../core/constants/permission-constants';

@Component({
    selector: 'app-permissions-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './permissions-list.component.html',
    styleUrl: './permissions-list.component.scss'
})
export class PermissionsListComponent {
    @Input() modules: string[] = [];
    @Input() groupedPermissions: { [module: string]: PermissionResponse[] } = {};
    @Input() selectedPermissions: number[] = [];
    @Input() expandedModules: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() isSaving: boolean = false;
    @Input() showActions: boolean = false;

    @Output() toggleModuleExpand = new EventEmitter<string>();
    @Output() toggleModuleSelect = new EventEmitter<string>();
    @Output() togglePermission = new EventEmitter<number>();
    @Output() save = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    isModuleExpanded(module: string): boolean {
        return this.expandedModules.includes(module);
    }

    isModuleSelected(module: string): boolean {
        const perms = this.groupedPermissions[module] || [];
        if (perms.length === 0) return false;
        return perms.every(p => this.selectedPermissions.includes(p.id));
    }

    isPermissionSelected(permissionId: number): boolean {
        return this.selectedPermissions.includes(permissionId);
    }

    getFilteredPermissions(module: string): PermissionResponse[] {
        return this.groupedPermissions[module] || [];
    }

    getLabel(key: string): string {
        return PermissionConstants.LABELS[key] ?? key.replaceAll('_', ' ');
    }
}
