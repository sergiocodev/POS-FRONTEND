import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
    label: string;
    value: number;
    color: string;
    extra?: string;
}

@Component({
    selector: 'app-donut-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './donut-chart.component.html',
    styleUrls: ['./donut-chart.component.scss']
})
export class DonutChartComponent {
    data = input.required<DonutSegment[]>();
    center = 75;
    radius = 60;
    innerRadius = 35;
    viewBox = '0 0 150 150';

    // Tooltip state
    activeSegment = signal<DonutSegment | null>(null);
    tooltipPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });

    total = computed(() => this.data().reduce((s, d) => s + d.value, 0));

    segments = computed(() => {
        const d = this.data();
        const total = this.total();
        if (!total || !d.length) return [];

        const segments: { path: string; color: string; data: DonutSegment }[] = [];
        let startAngle = -Math.PI / 2;

        for (const seg of d) {
            const angle = (seg.value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;

            const x1 = this.center + this.radius * Math.cos(startAngle);
            const y1 = this.center + this.radius * Math.sin(startAngle);
            const x2 = this.center + this.radius * Math.cos(endAngle);
            const y2 = this.center + this.radius * Math.sin(endAngle);
            const ix1 = this.center + this.innerRadius * Math.cos(endAngle);
            const iy1 = this.center + this.innerRadius * Math.sin(endAngle);
            const ix2 = this.center + this.innerRadius * Math.cos(startAngle);
            const iy2 = this.center + this.innerRadius * Math.sin(startAngle);

            const largeArc = angle > Math.PI ? 1 : 0;

            const path = `M ${x1} ${y1} A ${this.radius} ${this.radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${this.innerRadius} ${this.innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
            segments.push({ path, color: seg.color, data: seg });
            startAngle = endAngle;
        }
        return segments;
    });

    onMouseEnter(event: MouseEvent, segment: DonutSegment) {
        this.activeSegment.set(segment);
        this.updateTooltipPosition(event);
    }

    onMouseMove(event: MouseEvent) {
        this.updateTooltipPosition(event);
    }

    onMouseLeave() {
        this.activeSegment.set(null);
    }

    private updateTooltipPosition(event: MouseEvent) {
        this.tooltipPosition.set({
            x: event.offsetX,
            y: event.offsetY
        });
    }

    percentage(val: number): number {
        const t = this.total();
        return t ? Math.round((val / t) * 100) : 0;
    }

    formatValue(val: number): string {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        
        // Redondeamos a 2 decimales para evitar problemas de precisión de punto flotante
        const rounded = Number(val.toFixed(2));
        
        // Si el número redondeado no tiene parte decimal, lo mostramos sin decimales
        if (rounded % 1 !== 0) return rounded.toFixed(2);
        return rounded.toFixed(0);
    }
}
