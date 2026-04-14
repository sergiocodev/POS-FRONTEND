import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarData {
    label: string;
    value: number;
}

@Component({
    selector: 'app-bar-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent {
    data = input.required<BarData[]>();
    height = input(200);
    colors = input<string[]>(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']);
    padding = { top: 20, right: 20, bottom: 30, left: 50 };

    maxValue = computed(() => Math.max(...this.data().map(d => d.value), 1));
    viewBox = computed(() => `0 0 400 ${this.height()}`);
    chartWidthVal = computed(() => 400);

    bars = computed(() => {
        const d = this.data();
        if (!d.length) return [];
        const innerW = this.chartWidthVal() - this.padding.left - this.padding.right;
        const innerH = this.height() - this.padding.top - this.padding.bottom;
        const barW = Math.min(innerW / d.length * 0.7, 40);
        const gap = (innerW - barW * d.length) / (d.length + 1);
        const max = this.maxValue();
        const colors = this.colors();

        return d.map((item, i) => ({
            x: this.padding.left + gap + i * (barW + gap),
            y: this.height() - this.padding.bottom - (item.value / max) * innerH,
            width: barW,
            height: (item.value / max) * innerH,
            value: item.value,
            color: colors[i % colors.length]
        }));
    });

    formatValue(val: number): string {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        return val.toFixed(0);
    }
}
