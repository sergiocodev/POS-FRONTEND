import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-module-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './module-header.component.html',
    styleUrls: ['./module-header.component.scss']
})
export class ModuleHeaderComponent {
    @Input() title: string = '';
    @Input() iconClass: string = '';
}
