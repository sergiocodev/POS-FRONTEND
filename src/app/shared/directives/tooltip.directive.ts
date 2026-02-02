import { Directive, ElementRef, Input, Renderer2, HostListener } from '@angular/core';

@Directive({
    selector: '[appTooltip]',
    standalone: true
})
export class TooltipDirective {
    @Input('appTooltip') tooltipText: string = '';
    tooltipElement: HTMLElement | null = null;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    @HostListener('mouseenter') onMouseEnter() {
        if (!this.tooltipText.trim()) {
            return;
        }

        if (!this.tooltipElement) {
            this.tooltipElement = this.renderer.createElement('span');
            this.renderer.addClass(this.tooltipElement, 'tooltip-custom');
            this.renderer.appendChild(
                this.tooltipElement,
                this.renderer.createText(this.tooltipText)
            );

            this.renderer.appendChild(this.el.nativeElement, this.tooltipElement);
        }
    }

    @HostListener('mouseleave') onMouseLeave() {
        if (this.tooltipElement) {
            this.renderer.removeChild(this.el.nativeElement, this.tooltipElement);
            this.tooltipElement = null;
        }
    }
}
