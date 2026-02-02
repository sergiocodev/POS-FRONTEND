import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding, Input,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-form-accordion',
    standalone: true,
    imports: [CommonModule, NgIf],
    templateUrl: './form-accordion.component.html',
    styleUrl: './form-accordion.component.scss',
    animations: [
        trigger('expandCollapse', [
            state('expanded', style({ height: '*', opacity: 1 })),
            state('collapsed', style({ height: '0px', opacity: 0 })),
            transition('expanded <=> collapsed', [animate('300ms ease-in-out')])
        ])
    ]
})
export class FormAccordionComponent implements OnInit {
    @Input() title: string = '';
    @Input() numeration: string = '';

    @HostBinding('class.is-expanded')
    @Input() isExpanded: boolean = false;

    // Resumen simplificado
    @Input() summaryFields: any[] | null = null;

    @Input() status: 'valid' | 'invalid' | 'neutral' | null = null;
    @Input() statusMessage?: string;

    @Input() set validate(value: boolean | null) {
        if (value === true) this.status = 'valid';
        else if (value === false) this.status = 'invalid';
        else this.status = null;
    }

    @Output() cambioExpansion = new EventEmitter<boolean>();

    @ViewChild('accordionRef') accordionRef!: ElementRef;

    constructor(private cd: ChangeDetectorRef) { }

    get currentStatusMessage(): string {
        if (this.statusMessage) {
            return this.statusMessage;
        }
        if (this.status === 'valid') {
            return 'Se completó los campos requeridos correctamente';
        }
        if (this.status === 'invalid') {
            return 'Completar los campos requeridos correctamente';
        }
        return '';
    }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isExpanded']) {
            const value = changes['isExpanded'].currentValue;
            this.toggleAccordion(value);
        }
    }

    toggleAccordion(state: boolean): void {
        this.isExpanded = state;
        this.cambioExpansion.emit(this.isExpanded);
    }

    OpenAccordion(): void {
        this.toggleAccordion(true);
    }

    closeAccordion(): void {
        this.toggleAccordion(false);
    }

    getTargetId(): string {
        return 'collapse-' + (this.title || 'accordion').replace(/\s+/g, '-').toLowerCase();
    }

    setNumeration(index: number | null) {
        this.numeration = index != null ? String(index) : '';
        try { this.cd.detectChanges(); } catch { }
    }
}
