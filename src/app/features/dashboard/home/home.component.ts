import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LineChartComponent, ChartPoint } from '../../../shared/components/charts/line-chart/line-chart.component';
import { DonutChartComponent, DonutSegment } from '../../../shared/components/charts/donut-chart/donut-chart.component';
import {
    FullDashboardResponse,
    TopProductDashboard
} from '../../../core/models/dashboard.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, LineChartComponent, DonutChartComponent],
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

    // KPI cards
    kpiCards: { label: string; value: string; change: string; positive: boolean; icon: string; iconColor: string }[] = [];

    // Weekly chart data — signal para que computed() reaccione
    weeklyData = signal<{ day: string; value: number }[]>([]);

    // Donut chart segments — signals para reactividad
    donutSegments = signal<{ label: string; color: string; value: number; amount?: number }[]>([]);
    paymentSegments = signal<{ label: string; color: string; value: number; amount?: number; count?: number }[]>([]);

    // Computed signals para los componentes de chart
    lineChartData = computed<ChartPoint[]>(() =>
        this.weeklyData().map(d => ({ label: d.day, value: d.value }))
    );

    donutChartData = computed<DonutSegment[]>(() =>
        this.donutSegments().map(s => ({
            label: s.label,
            value: s.value,
            color: s.color,
            extra: this.formatCurrency(s.amount ?? 0)
        }))
    );

    paymentChartData = computed<DonutSegment[]>(() =>
        this.paymentSegments().map(s => ({
            label: s.label,
            value: s.value,
            color: s.color,
            extra: this.formatCurrency(s.amount ?? 0)
        }))
    );

    loading = true;

    // Low stock table
    lowStockItems: { name: string; category: string; units: number; min: number; level: number; critical: boolean }[] = [];

    // Top products
    topSoldProducts: TopProductDashboard[] = [];

    // Recent sales
    recentSales: { initials: string; name: string; type: string; products: number; minutes: number; amount: string; color: string }[] = [];

    // Upcoming expirations
    expirations: { name: string; lot: string; daysLeft: number; date: string; urgent: boolean }[] = [];

    ngOnInit() {
        this.loadDashboard();
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private loadDashboard() {
        const estId = this.establishmentState.getSelectedEstablishment() ?? 1;
        this.loading = true;

        this.subscription = this.dashboardService.getFullDashboard(estId).subscribe({
            next: (res) => {
                if (res.data) {
                    const ui = this.dashboardDataService.transform(res.data);
                    this.kpiCards = ui.kpiCards;
                    this.weeklyData.set(ui.weeklyData);
                    this.donutSegments.set(ui.donutSegments);
                    this.paymentSegments.set(ui.paymentSegments);
                    this.lowStockItems = ui.lowStockItems;
                    this.topSoldProducts = ui.topProducts;
                    this.recentSales = ui.recentSales;
                    this.expirations = ui.expirations;
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
