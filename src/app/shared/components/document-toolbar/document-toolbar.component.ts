import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-toolbar.component.html',
  styleUrl: './document-toolbar.component.scss',
})
export class DocumentToolbarComponent {
  @Input() selectedFormat: string = 'TICKET';
  
  @Output() formatChange = new EventEmitter<any>();
  @Output() print = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
}
