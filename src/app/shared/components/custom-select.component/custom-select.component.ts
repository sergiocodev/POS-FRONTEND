import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
})
export class CustomSelectComponent implements OnInit, OnChanges {
  @Input() options: any[] = [];
  @Input() value: any = null; // Valor inicial
  @Input() labelKey: string = ''; // Dejar vacío si es array de strings
  @Input() valueKey: string = ''; // Dejar vacío si es array de strings
  @Input() placeholder: string = 'Selecciona...';
  @Input() customClass: string = '';

  @Output() selectionChange = new EventEmitter<any>();

  isOpen: boolean = false;
  selectedOption: any = null;

  constructor(private eRef: ElementRef) { }

  ngOnInit() {
    this.syncValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['options']) {
      this.syncValue();
    }
  }

  private syncValue() {
    if (this.value !== null && this.value !== undefined) {
      if (this.labelKey && this.valueKey) {
        this.selectedOption = this.options.find(o => o[this.valueKey] === this.value);
      } else {
        this.selectedOption = this.options.find(o => o === this.value);
      }
    } else {
      this.selectedOption = null;
    }
  }

  getDisplayLabel(option: any): string {
    if (!option) return this.placeholder;
    return (this.labelKey && typeof option === 'object') ? option[this.labelKey] : option;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: any) {
    this.selectedOption = option;
    this.isOpen = false;
    const valueToEmit = (this.valueKey && typeof option === 'object') ? option[this.valueKey] : option;
    this.selectionChange.emit(valueToEmit);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
