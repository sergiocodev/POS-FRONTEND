import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-custom-form-container',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-form-container.component.html',
    styleUrl: './custom-form-container.component.scss'
})
export class CustomFormContainerComponent {
    @Input() id: string = '';
    @Input() title: string = '';
    @Input() numeration?: number;
    @Input() icono?: string;
    @Input() isSummary: boolean = false;
    @Input() isUnvalidatedSummary: boolean = false;
    @Input() validate: boolean | null = null;
}
