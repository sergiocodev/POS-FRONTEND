import { Injectable } from '@angular/core';
import {
    FullDashboardResponse,
    SalesChartResponse,
    SalesByCategoryResponse,
    LowStockItemResponse,
    RecentSaleResponse,
    ExpiringLotResponse,
    TopProductDashboard,
    PaymentMethodDistribution
} from '../models/dashboard.model';

export interface KpiCard {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
    iconColor: string;
}

export interface WeeklyChartData {
    day: string;
    value: number;
}

export interface DonutSegmentData {
    label: string;
    color: string;
    value: number;
    amount?: number;
}

export interface PaymentSegmentData {
    label: string;
    color: string;
    value: number;
    amount?: number;
    count?: number;
}

export interface LowStockItemData {
    name: string;
    category: string;
    units: number;
    min: number;
    level: number;
    critical: boolean;
}

export interface RecentSaleData {
    initials: string;
    name: string;
    type: string;
    products: number;
    minutes: number;
    amount: string;
    color: string;
}

export interface ExpirationData {
    name: string;
    lot: string;
    daysLeft: number;
    date: string;
    urgent: boolean;
}

export interface DashboardUiModel {
    kpiCards: KpiCard[];
    weeklyData: WeeklyChartData[];
    donutSegments: DonutSegmentData[];
    paymentSegments: PaymentSegmentData[];
    lowStockItems: LowStockItemData[];
    topProducts: TopProductDashboard[];
    recentSales: RecentSaleData[];
    expirations: ExpirationData[];
}

/**
 * Transforms raw backend dashboard data into UI-ready models.
 * Keeps the component thin and testable.
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
    private readonly DONUT_COLORS = ['#00c897', '#3b82f6', '#f59e0b', '#f87171', '#a78bfa', '#ec4899', '#14b8a6', '#6366f1'];
    private readonly AVATAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f87171', '#6366f1'];
    private readonly PAYMENT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ff22f8ff'];
    private readonly DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    private readonly MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    transform(data: FullDashboardResponse): DashboardUiModel {
        return {
            kpiCards: this.mapKpiCards(data),
            weeklyData: this.mapSalesChart(data.sales_chart ?? []),
            donutSegments: this.mapDonutSegments(data.sales_by_category ?? []),
            paymentSegments: this.mapPaymentSegments(data.payment_methods ?? []),
            lowStockItems: this.mapLowStock(data.low_stock ?? []),
            topProducts: data.top_products ?? [],
            recentSales: this.mapRecentSales(data.recent_sales ?? []),
            expirations: this.mapExpirations(data.expiring_lots ?? []),
        };
    }

    formatCurrency(value: number): string {
        return 'S/ ' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    formatDate(dateStr: string): string {
        const d = new Date(dateStr + 'T00:00:00');
        return `${d.getDate().toString().padStart(2, '0')} ${this.MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }

    getStockBarColor(level: number, critical: boolean): string {
        if (critical) return '#ef4444';
        if (level < 0.5) return '#f59e0b';
        return '#00c897';
    }

    // ── Private mapping methods ──

    private mapKpiCards(data: FullDashboardResponse): KpiCard[] {
        const summary = data.summary?.data;
        if (!summary) return [];

        const salesValue = summary.total_sales?.value ?? 0;
        const salesTrend = summary.total_sales?.trend ?? '0%';
        const txCount = summary.transactions?.value ?? 0;
        const txTrend = summary.transactions?.trend ?? '0%';
        const stockAlerts = summary.stock_alerts;
        const totalStockIssues = (stockAlerts?.expired ?? 0) + (stockAlerts?.expiring_soon ?? 0) + (stockAlerts?.out_of_stock ?? 0);
        const sunatPending = summary.sunat_pending_docs ?? 0;

        return [
            { label: 'Ventas del Día', value: this.formatCurrency(salesValue), change: `${salesTrend} vs. ayer`, positive: salesTrend.startsWith('+'), icon: '💲', iconColor: '#00c897' },
            { label: 'Transacciones', value: txCount.toString(), change: `${txTrend} vs. ayer`, positive: txTrend.startsWith('+'), icon: '🛒', iconColor: '#00c897' },
            { label: 'Productos en Stock', value: summary.total_products.toString(), change: 'Total de productos', positive: true, icon: '📦', iconColor: '#00c897' },
            { label: 'Alertas Activas', value: (totalStockIssues + sunatPending).toString(), change: `${totalStockIssues} requieren atención`, positive: (totalStockIssues + sunatPending) === 0, icon: '⚠️', iconColor: '#f59e0b' },
        ];
    }

    private mapSalesChart(chart: SalesChartResponse[]): WeeklyChartData[] {
        return chart.map(c => {
            const d = new Date(c.date + 'T00:00:00');
            return { day: this.DAY_NAMES[d.getDay()], value: c.total };
        });
    }

    private mapDonutSegments(categories: SalesByCategoryResponse[]): DonutSegmentData[] {
        return categories.map((cat, i) => ({
            label: cat.categoryName,
            color: this.DONUT_COLORS[i % this.DONUT_COLORS.length],
            value: cat.percentage,
            amount: cat.totalAmount,
        }));
    }

    private mapPaymentSegments(methods: PaymentMethodDistribution[]): PaymentSegmentData[] {
        return methods.map((m, i) => ({
            label: m.payment_method,
            color: this.PAYMENT_COLORS[i % this.PAYMENT_COLORS.length],
            value: m.percentage,
            amount: m.amount,
            count: m.count,
        }));
    }

    private mapLowStock(items: LowStockItemResponse[]): LowStockItemData[] {
        return items.map(item => ({
            name: item.product_name,
            category: item.category_name,
            units: item.current_stock,
            min: item.min_stock,
            level: item.stock_level,
            critical: item.critical,
        }));
    }

    private mapRecentSales(sales: RecentSaleResponse[]): RecentSaleData[] {
        const now = new Date();
        return sales.map((s, i) => {
            const saleDate = new Date(s.sale_date);
            const diffMin = Math.max(1, Math.round((now.getTime() - saleDate.getTime()) / 60000));
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

    private mapExpirations(lots: ExpiringLotResponse[]): ExpirationData[] {
        return lots.map(lot => ({
            name: lot.product_name,
            lot: `${lot.lot_code} · ${lot.quantity} uds`,
            daysLeft: lot.days_until_expiry,
            date: this.formatDate(lot.expiry_date),
            urgent: lot.urgent,
        }));
    }
}
