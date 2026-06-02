import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleDetailResponse } from '../../../../../../core/models/maintenance.model';

@Component({
    selector: 'app-role-info-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './role-info-card.component.html',
    styleUrl: './role-info-card.component.scss'
})
export class RoleInfoCardComponent {
    @Input() role: RoleDetailResponse | null = null;
    @Input() roleName: string = '';
}
