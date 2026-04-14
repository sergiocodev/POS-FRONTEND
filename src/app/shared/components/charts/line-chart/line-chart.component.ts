import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartPoint {
    label: string;
    value: number;
}

@Component({
    selector: 'app-line-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent {
    data = input.required<ChartPoint[]>();
    height = input(200);
    padding = { top: 20, right: 20, bottom: 30, left: 50 };

    chartWidth = computed(() => 600);
    innerWidth = computed(() => this.chartWidth() - this.padding.left - this.padding.right);
    innerHeight = computed(() => this.height() - this.padding.top - this.padding.bottom);
    viewBox = computed(() => `0 0 ${this.chartWidth()} ${this.height()}`);

    maxValue = computed(() => {
        const d = this.data();
        if (!d.length) return 10;
        const max = Math.max(...d.map(x => x.value), 1);
        // Si el valor es mayor a 10, redondeamos al siguiente múltiplo de 10
        // Si es menor, usamos el valor exacto con un pequeño margen del 10%
        return max > 10 ? Math.ceil(max * 1.1 / 10) * 10 : max * 1.2;
    });

    gridLines = computed(() => {
        const lines: { y: number; label: string }[] = [];
        const steps = 4;
        const max = this.maxValue();
        for (let i = 0; i <= steps; i++) {
            const val = (max / steps) * i;
            const y = this.height() - this.padding.bottom - (this.innerHeight() * (val / max));
            lines.push({ y, label: this.formatAxisValue(val) });
        }
        return lines;
    });

    points = computed(() => {
        const d = this.data();
        if (!d.length) return [];
        const max = this.maxValue();
        return d.map((item, i) => ({
            x: this.padding.left + (this.innerWidth() / Math.max(d.length - 1, 1)) * i,
            y: this.height() - this.padding.bottom - (this.innerHeight() * (item.value / max))
        }));
    });

    linePath = computed(() => {
        const pts = this.points();
        if (!pts.length) return '';
        return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    });

    areaPath = computed(() => {
        const pts = this.points();
        if (!pts.length) return '';
        const bottom = this.height() - this.padding.bottom;
        const line = this.linePath();
        return `${line} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
    });

    formatValue(val: number): string {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        // Para los puntos del gráfico, mostramos 2 decimales si el número no es entero
        if (val % 1 !== 0) return val.toFixed(2);
        return val.toFixed(0);
    }

    formatAxisValue(val: number): string {
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
        // Para el eje lateral, siempre redondeamos al entero más cercano
        return Math.round(val).toString();
    }
}
