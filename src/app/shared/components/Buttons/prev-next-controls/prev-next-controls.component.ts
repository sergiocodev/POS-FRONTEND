import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-prev-next-controls',
    standalone: true,
    imports: [],
    templateUrl: './prev-next-controls.component.html',
    styleUrl: './prev-next-controls.component.scss'
})
export class PrevNextControlsComponent {
    @Output() BtnNext = new EventEmitter<any>();
    @Output() BtnPrev = new EventEmitter<any>();
    @Input() btnCollapsed: string | null = '#defaultTarget';

    constructor(private cdRef: ChangeDetectorRef) { }

    onNextClick() {
        this.BtnNext.emit();
        this.cdRef.detectChanges();
        this.btnCollapsed = '#defaultTarget';
    }

    onPrevClick() {
        this.BtnPrev.emit();
    }
}
