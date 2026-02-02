import { Component, Input } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-input-validation-message',
    standalone: true,
    imports: [NgIf, NgFor],
    templateUrl: './input-validation-message.component.html',
    styleUrl: './input-validation-message.component.scss'
})
export class InputValidationMessageComponent {
    @Input() messages: string[] = [];
}
