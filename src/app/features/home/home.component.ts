import { Component, inject, AfterViewInit, ElementRef, ViewChild, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EstablishmentStateService } from '../../core/services/establishment-state.service';
import { ThemeService } from '../../core/services/theme.service';
import {
    FullDashboardResponse,
    SalesChartResponse,
    SalesByCategoryResponse,
    LowStockItemResponse,
    RecentSaleResponse,
    ExpiringLotResponse
} from '../../core/models/dashboard.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
    authService = inject(AuthService);
    private dashboardService = inject(DashboardService);
    private establishmentState = inject(EstablishmentStateService);
    private themeService = inject(ThemeService);
    private subscription?: Subscription;

    isDarkMode = this.themeService.isDarkMode;

    constructor() {
        effect(() => {
            // Depend on isDarkMode to trigger a re-draw when theme changes
            this.isDarkMode();
            setTimeout(() => {
                if (!this.loading) {
                    this.drawLineChart();
                    this.drawDonutChart();
                }
            }, 50);
        });
    }

    @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;

    loading = true;
    hoverIndex: number | null = null;
    private chartPoints: { x: number, y: number, value: number, day: string }[] = [];

    // KPI cards
    kpiCards: { label: string; value: string; change: string; positive: boolean; icon: string; iconColor: string }[] = [];

    // Weekly chart data
    weeklyData: { day: string; value: number }[] = [];

    // Donut chart segments
    donutSegments: { label: string; color: string; value: number }[] = [];

    // Low stock table
    lowStockItems: { name: string; category: string; units: number; min: number; level: number; critical: boolean }[] = [];

    // Recent sales
    recentSales: { initials: string; name: string; type: string; products: number; minutes: number; amount: string; color: string }[] = [];

    // Upcoming expirations
    expirations: { name: string; lot: string; daysLeft: number; date: string; urgent: boolean }[] = [];

    private readonly DONUT_COLORS = ['#00c897', '#3b82f6', '#f59e0b', '#f87171', '#a78bfa', '#ec4899', '#14b8a6', '#6366f1'];
    private readonly AVATAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f87171', '#6366f1'];

    ngOnInit() {
        this.loadDashboard();
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    onMouseMove(e: MouseEvent) {
        if (!this.chartPoints.length) return;
        const canvas = this.lineChartRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        
        let closestIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < this.chartPoints.length; i++) {
            const diff = Math.abs(x - this.chartPoints[i].x);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
            }
        }
        
        const padL = 50, padR = 20;
        if (x >= padL - 20 && x <= canvas.width - padR + 20) {
            if (this.hoverIndex !== closestIdx) {
                this.hoverIndex = closestIdx;
                this.drawLineChart();
            }
        } else {
            this.onMouseLeave();
        }
    }

    onMouseLeave() {
        if (this.hoverIndex !== null) {
            this.hoverIndex = null;
            this.drawLineChart();
        }
    }

    private loadDashboard() {
        const estId = this.establishmentState.getSelectedEstablishment() ?? 1;
        this.loading = true;

        this.subscription = this.dashboardService.getFullDashboard(estId).subscribe({
            next: (res) => {
                if (res.data) {
                    this.mapFullDashboard(res.data);
                }
                this.loading = false;
                setTimeout(() => {
                    this.drawLineChart();
                    this.drawDonutChart();
                }, 100);
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private mapFullDashboard(data: FullDashboardResponse) {
        // ── KPI Cards ──
        const summary = data.summary?.data;
        if (summary) {
            const salesValue = summary.total_sales?.value ?? 0;
            const salesTrend = summary.total_sales?.trend ?? '0%';
            const salesPositive = salesTrend.startsWith('+');

            const txCount = summary.transactions?.value ?? 0;
            const txTrend = summary.transactions?.trend ?? '0%';
            const txPositive = txTrend.startsWith('+');

            const stockAlerts = summary.stock_alerts;
            const totalStockIssues = (stockAlerts?.expired ?? 0) + (stockAlerts?.expiring_soon ?? 0) + (stockAlerts?.out_of_stock ?? 0);

            const sunatPending = summary.sunat_pending_docs ?? 0;

            this.kpiCards = [
                {
                    label: 'Ventas del Día',
                    value: this.formatCurrency(salesValue),
                    change: `${salesTrend} vs. ayer`,
                    positive: salesPositive,
                    icon: '💲',
                    iconColor: '#00c897',
                },
                {
                    label: 'Pedidos',
                    value: txCount.toString(),
                    change: `${txTrend} vs. ayer`,
                    positive: txPositive,
                    icon: '🛒',
                    iconColor: '#00c897',
                },
                {
                    label: 'Productos en Stock',
                    value: (data.low_stock?.length ?? 0).toString(),
                    change: `${totalStockIssues} alerta${totalStockIssues !== 1 ? 's' : ''} activa${totalStockIssues !== 1 ? 's' : ''}`,
                    positive: totalStockIssues === 0,
                    icon: '📦',
                    iconColor: '#00c897',
                },
                {
                    label: 'Alertas Activas',
                    value: (totalStockIssues + sunatPending).toString(),
                    change: `${sunatPending > 0 ? sunatPending + ' SUNAT pendiente' + (sunatPending > 1 ? 's' : '') : 'Sin alertas SUNAT'}`,
                    positive: (totalStockIssues + sunatPending) === 0,
                    icon: '⚠️',
                    iconColor: '#f59e0b',
                },
            ];
        }

        // ── Weekly Sales Chart ──
        if (data.sales_chart?.length) {
            this.mapSalesChart(data.sales_chart);
        }

        // ── Donut: Sales by Category ──
        if (data.sales_by_category?.length) {
            this.mapDonutSegments(data.sales_by_category);
        }

        // ── Low Stock ──
        if (data.low_stock?.length) {
            this.mapLowStock(data.low_stock);
        }

        // ── Recent Sales ──
        if (data.recent_sales?.length) {
            this.mapRecentSales(data.recent_sales);
        }

        // ── Expiring Lots ──
        if (data.expiring_lots?.length) {
            this.mapExpirations(data.expiring_lots);
        }
    }

    private mapSalesChart(chart: SalesChartResponse[]) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        this.weeklyData = chart.map(c => {
            const d = new Date(c.date + 'T00:00:00');
            return { day: dayNames[d.getDay()], value: c.total };
        });
    }

    private mapDonutSegments(categories: SalesByCategoryResponse[]) {
        this.donutSegments = categories.map((cat, i) => ({
            label: cat.categoryName,
            color: this.DONUT_COLORS[i % this.DONUT_COLORS.length],
            value: cat.percentage,
        }));
    }

    private mapLowStock(items: LowStockItemResponse[]) {
        this.lowStockItems = items.map(item => ({
            name: item.product_name,
            category: item.category_name,
            units: item.current_stock,
            min: item.min_stock,
            level: item.stock_level,
            critical: item.critical,
        }));
    }

    private mapRecentSales(sales: RecentSaleResponse[]) {
        const now = new Date();
        this.recentSales = sales.map((s, i) => {
            const saleDate = new Date(s.sale_date);
            const diffMs = now.getTime() - saleDate.getTime();
            const diffMin = Math.max(1, Math.round(diffMs / 60000));
            const docTypeLabel = s.document_type === 'BOLETA' || s.document_type === 'FACTURA' ? 'venta' : 'receta';
            return {
                initials: s.customer_initials,
                name: s.customer_name,
                type: docTypeLabel,
                products: s.product_count,
                minutes: diffMin,
                amount: this.formatCurrency(s.total),
                color: this.AVATAR_COLORS[i % this.AVATAR_COLORS.length],
            };
        });
    }

    private mapExpirations(lots: ExpiringLotResponse[]) {
        this.expirations = lots.map(lot => ({
            name: lot.product_name,
            lot: `${lot.lot_code} · ${lot.quantity} uds`,
            daysLeft: lot.days_until_expiry,
            date: this.formatDate(lot.expiry_date),
            urgent: lot.urgent,
        }));
    }

    private formatCurrency(value: number): string {
        return 'S/ ' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private formatDate(dateStr: string): string {
        const d = new Date(dateStr + 'T00:00:00');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    // ── Chart Drawing ──────────────────────────────

    drawLineChart() {
        const canvas = this.lineChartRef?.nativeElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const padL = 50, padR = 20, padT = 20, padB = 40;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        ctx.clearRect(0, 0, W, H);

        if (!this.weeklyData.length) return;

        const values = this.weeklyData.map((d) => d.value);
        const maxVal = Math.max(...values, 1000);
        const roundedMax = Math.ceil(maxVal / 1000) * 1000;
        const gridSteps = 5;
        const gridLines: number[] = [];
        for (let i = 0; i <= gridSteps; i++) {
            gridLines.push((roundedMax / gridSteps) * i);
        }

        // Grid lines
        ctx.strokeStyle = this.isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        gridLines.forEach((v) => {
            const y = padT + chartH - (v / roundedMax) * chartH;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(padL + chartW, y);
            ctx.stroke();

            ctx.fillStyle = this.isDarkMode() ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            
            let text = '';
            if (v === 0) text = 'S/ 0';
            else if (v >= 1000) text = `S/ ${(v / 1000).toFixed(1).replace('.0', '')}k`;
            else text = `S/ ${v}`;
            
            ctx.fillText(text, padL - 8, y + 4);
        });

        // X axis labels
        this.weeklyData.forEach((d, i) => {
            const x = padL + (i / (values.length - 1)) * chartW;
            ctx.fillStyle = this.isDarkMode() ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.day, x, H - 8);
        });

        // Points
        const points = values.map((v, i) => ({
            x: padL + (i / (values.length - 1)) * chartW,
            y: padT + chartH - (v / roundedMax) * chartH,
        }));

        // Gradient fill
        const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
        grad.addColorStop(0, 'rgba(0, 200, 150, 0.45)');
        grad.addColorStop(1, 'rgba(0, 200, 150, 0.00)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i - 1].x + points[i].x) / 2;
            ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, padT + chartH);
        ctx.lineTo(points[0].x, padT + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i - 1].x + points[i].x) / 2;
            ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#00c897';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        this.chartPoints = points.map((p, i) => ({
            x: p.x,
            y: p.y,
            value: values[i],
            day: this.weeklyData[i].day
        }));

        if (this.hoverIndex !== null && this.chartPoints[this.hoverIndex]) {
            const p = this.chartPoints[this.hoverIndex];

            ctx.beginPath();
            ctx.moveTo(p.x, padT);
            ctx.lineTo(p.x, padT + chartH);
            ctx.strokeStyle = this.isDarkMode() ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const textVentas = `Ventas : S/ ${p.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            ctx.font = '500 12.5px Inter, sans-serif';
            const textDay = p.day;
            
            const m1 = ctx.measureText(textVentas).width;
            ctx.font = '600 13px Inter, sans-serif';
            const m2 = ctx.measureText(textDay).width;
            
            const boxW = Math.max(m1, m2) + 26;
            const boxH = 50;
            
            let boxX = p.x + 12;
            if (boxX + boxW > W) boxX = p.x - boxW - 12;
            let boxY = p.y + 12;
            if (boxY + boxH > H - padB) boxY = p.y - boxH - 12;

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            
            const radius = 6;
            ctx.fillStyle = this.isDarkMode() ? '#1a1a2e' : '#ffffff';
            
            ctx.beginPath();
            ctx.moveTo(boxX + radius, boxY);
            ctx.lineTo(boxX + boxW - radius, boxY);
            ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
            ctx.lineTo(boxX + boxW, boxY + boxH - radius);
            ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
            ctx.lineTo(boxX + radius, boxY + boxH);
            ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
            ctx.lineTo(boxX, boxY + radius);
            ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(boxX + radius, boxY);
            ctx.lineTo(boxX + boxW - radius, boxY);
            ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
            ctx.lineTo(boxX + boxW, boxY + boxH - radius);
            ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
            ctx.lineTo(boxX + radius, boxY + boxH);
            ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
            ctx.lineTo(boxX, boxY + radius);
            ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
            ctx.strokeStyle = this.isDarkMode() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = this.isDarkMode() ? '#ffffff' : '#111111';
            ctx.textAlign = 'left';
            ctx.font = '600 13px Inter, sans-serif';
            ctx.fillText(textDay, boxX + 13, boxY + 20);

            ctx.fillStyle = '#00c897';
            ctx.font = '500 12.5px Inter, sans-serif';
            ctx.fillText(textVentas, boxX + 13, boxY + 39);

            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#00c897';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = this.isDarkMode() ? '#13131f' : '#ffffff';
            ctx.stroke();
        }
    }

    drawDonutChart() {
        const canvas = this.donutChartRef?.nativeElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const outerR = Math.min(W, H) / 2 - 10;
        const innerR = outerR * 0.58;

        ctx.clearRect(0, 0, W, H);

        if (!this.donutSegments.length) return;

        const total = this.donutSegments.reduce((s, d) => s + d.value, 0);
        let startAngle = -Math.PI / 2;

        this.donutSegments.forEach((seg) => {
            const sliceAngle = (seg.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Donut hole
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
        ctx.fillStyle = this.isDarkMode() ? '#181a26' : '#ffffff';
        ctx.fill();
    }

    getStockBarColor(level: number, critical: boolean): string {
        if (critical) return '#ef4444';
        if (level < 0.5) return '#f59e0b';
        return '#00c897';
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
