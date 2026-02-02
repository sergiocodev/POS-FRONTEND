import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';

export interface DropdownOption {
    id: number;
    name: string;
    [key: string]: any;
}

@Component({
    selector: 'app-dropdown-search',
    standalone: true,
    imports: [NgFor, NgIf, NgClass],
    templateUrl: './dropdown-search.component.html',
    styleUrls: ['./dropdown-search.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => DropdownSearchComponent),
        multi: true
    }]
})
export class DropdownSearchComponent implements ControlValueAccessor, OnChanges, OnInit {

    @Input() rawOptions: DropdownOption[] = [];
    @Input() placeholder = "Seleccionar opción...";
    @Input() showSearch = true;
    @Input() emptyMessage = "No se encontraron resultados.";
    @Input() disabled = false;
    @Input() multiple = false;
    @Input() allOptionId: number | null = null;
    @Input() emitId = true;

    @Output() selectionChange = new EventEmitter<any>();
    @Output() multiSelectionChange = new EventEmitter<number[]>();
    @Output() touched = new EventEmitter<void>();

    isOpen = false;
    searchText = "";
    selectedId: number | null = null;
    selectedIds: number[] = [];
    filteredOptions: DropdownOption[] = [];
    idNameMap = new Map<number, string>();

    private onChange: any = () => { };
    private onTouched: any = () => { };

    constructor(private elementRef: ElementRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['rawOptions']) {
            this.filteredOptions = [...this.rawOptions];
            this.searchText = "";
            this.buildIdNameMap();
        }
    }

    ngOnInit() {
        this.filteredOptions = [...this.rawOptions];
        this.buildIdNameMap();
    }

    buildIdNameMap(): void {
        this.idNameMap.clear();
        this.rawOptions.forEach(opt => this.idNameMap.set(opt.id, opt.name));
    }

    @HostListener("document:click", ["$event"])
    clickOutside(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    toggleDropdown() {
        if (!this.disabled) {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.searchText = "";
                this.filterOptions();
                this.onTouched();
                this.touched.emit();
            }
        }
    }

    filterOptions() {
        if (!this.searchText.trim()) {
            this.filteredOptions = [...this.rawOptions];
        } else {
            const searchLower = this.searchText.toLowerCase();
            this.filteredOptions = this.rawOptions.filter((option) =>
                (option.name || '').toLowerCase().includes(searchLower)
            );
        }
    }

    selectOption(value: DropdownOption) {
        if (this.disabled) return;

        if (this.multiple) {
            if (this.allOptionId !== null && value.id === this.allOptionId) {
                this.selectedIds = [this.allOptionId];
            } else {
                if (this.allOptionId !== null) {
                    this.selectedIds = this.selectedIds.filter(id => id !== this.allOptionId);
                }

                const index = this.selectedIds.indexOf(value.id);
                if (index >= 0) {
                    this.selectedIds.splice(index, 1);
                } else {
                    this.selectedIds.push(value.id);
                }

                if (this.selectedIds.length === 0 && this.allOptionId !== null) {
                    this.selectedIds = [this.allOptionId];
                }
            }

            this.onChange(this.selectedIds);
            this.multiSelectionChange.emit([...this.selectedIds]);
        } else {
            this.selectedId = value.id;
            const valToEmit = this.emitId ? value.id : value;
            this.onChange(valToEmit);
            this.selectionChange.emit(valToEmit);
            this.isOpen = false;
        }
    }

    isPlaceholder(): boolean {
        if (this.multiple) {
            return this.selectedIds.length === 0;
        } else {
            return this.selectedId === null;
        }
    }

    getSelectedLabel(): string {
        if (this.multiple) {
            return this.selectedIds.length === 0 ? this.placeholder : '';
        } else {
            const selected = this.rawOptions.find(o => o.id === this.selectedId);
            return selected ? selected.name : this.placeholder;
        }
    }

    onSearch(event: Event) {
        this.searchText = (event.target as HTMLInputElement).value;
        this.filterOptions();
        event.stopPropagation();
    }

    writeValue(value: any): void {
        if (this.multiple) {
            this.selectedIds = Array.isArray(value) ? value : [];
        } else {
            this.selectedId = value;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    removeSelected(id: number) {
        if (this.multiple) {
            this.selectedIds = this.selectedIds.filter(x => x !== id);
            if (this.selectedIds.length === 0 && this.allOptionId !== null) {
                this.selectedIds = [this.allOptionId];
            }
            this.onChange(this.selectedIds);
            this.multiSelectionChange.emit([...this.selectedIds]);
        }
    }
}
