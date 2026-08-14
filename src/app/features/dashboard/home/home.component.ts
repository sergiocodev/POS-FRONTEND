import { Component, inject, OnInit, OnDestroy, computed, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardDataService, KpiCard, LowStockItemData, RecentSaleData, ExpirationData, UpcomingPayableData } from '../../../core/services/dashboard-data.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LineChartComponent, ChartPoint } from '../../../shared/components/charts/line-chart/line-chart.component';
import { DonutChartComponent, DonutSegment } from '../../../shared/components/charts/donut-chart/donut-chart.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import {
    FullDashboardResponse,
    TopProductDashboard
} from '../../../core/models/dashboard.model';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, NgxEchartsDirective, DonutChartComponent, SpinnerComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
    authService = inject(AuthService);
    private dashboardService = inject(DashboardService);
    private dashboardDataService = inject(DashboardDataService);
    private establishmentState = inject(EstablishmentStateService);
    private themeService = inject(ThemeService);
    private subscription?: Subscription;

    isDarkMode = this.themeService.isDarkMode;
    selectedEstablishmentId = this.establishmentState.selectedEstablishmentId;

    constructor() {
        effect(() => {
            this.selectedEstablishmentId(); // track signal
            untracked(() => this.loadDashboard());
        }, { allowSignalWrites: true });
    }

    // KPI cards
    kpiCards: KpiCard[] = [];

    // Weekly chart data — signal para que computed() reaccione
    weeklyData = signal<{ day: string; value: number; value2?: number }[]>([]);

    // Donut chart segments — signals para reactividad
    donutSegments = signal<{ label: string; color: string; value: number; amount?: number }[]>([]);
    sunatSegments = signal<{ label: string; color: string; value: number; amount?: number }[]>([]);

    // Computed signals para los componentes de chart
    echartsOption = computed<EChartsOption>(() => {
        const data = this.weeklyData();
        const xAxisData = data.map(d => d.day);
        const seriesIncome = data.map(d => d.value);
        const seriesExpense = data.map(d => d.value2 ?? 0);
        const isDark = this.isDarkMode();

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                textStyle: { color: isDark ? '#f8fafc' : '#0f172a' }
            },
            legend: {
                data: ['Ingresos', 'Egresos'],
                textStyle: { color: isDark ? '#94a3b8' : '#64748b' },
                top: 0
            },
            grid: {
                left: '3%', right: '4%', bottom: '3%', containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
                axisLabel: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
                splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } }
            },
            series: [
                {
                    name: 'Ingresos',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 3, color: '#10b981' },
                    itemStyle: { color: '#10b981' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }]
                        }
                    },
                    data: seriesIncome
                },
                {
                    name: 'Egresos',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 3, color: '#ef4444' },
                    itemStyle: { color: '#ef4444' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0)' }]
                        }
                    },
                    data: seriesExpense
                }
            ]
        };
    });

    donutChartData = computed<DonutSegment[]>(() =>
        this.donutSegments().map(s => ({
            label: s.label,
            value: s.value,
            color: s.color,
            extra: this.formatCurrency(s.amount ?? 0)
        }))
    );

    sunatChartData = computed<DonutSegment[]>(() =>
        this.sunatSegments().map(s => ({
            label: s.label,
            value: s.value,
            color: s.color,
            extra: `${s.amount} comp.`
        }))
    );

    loading = true;

    // Low stock table
    lowStockItems: LowStockItemData[] = [];

    // Top products
    topSoldProducts: TopProductDashboard[] = [];

    // Recent sales
    recentSales: RecentSaleData[] = [];

    // Upcoming expirations
    expirations: ExpirationData[] = [];

    // Upcoming payables
    upcomingPayables: UpcomingPayableData[] = [];

    ngOnInit() {
        // loadDashboard is called by effect
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private loadDashboard() {
        const estId = this.selectedEstablishmentId() ?? 1;
        this.loading = true;

        this.subscription = this.dashboardService.getFullDashboard(estId).subscribe({
            next: (res) => {
                if (res.data) {
                    const ui = this.dashboardDataService.transform(res.data);
                    this.kpiCards = ui.kpiCards;
                    this.weeklyData.set(ui.weeklyData);
                    this.donutSegments.set(ui.donutSegments);
                    this.sunatSegments.set(ui.sunatSegments);
                    this.lowStockItems = ui.lowStockItems;
                    this.topSoldProducts = ui.topProducts;
                    this.recentSales = ui.recentSales;
                    this.expirations = ui.expirations;
                    this.upcomingPayables = ui.upcomingPayables;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    public formatCurrency(value: number): string {
        return this.dashboardDataService.formatCurrency(value);
    }

    getStockBarColor(level: number, critical: boolean): string {
        return this.dashboardDataService.getStockBarColor(level, critical);
    }

    getBadgeColor(type: string): string {
        return type === 'receta' ? '#10b981' : '#3b82f6';
    }

    getExpirationColor(days: number): string {
        if (days <= 7) return '#ef4444';
        if (days <= 14) return '#f59e0b';
        return '#6b7280';
    }

    getExpirationIcon(days: number): string {
        if (days <= 7) return '🔴';
        return '🟡';
    }
}
