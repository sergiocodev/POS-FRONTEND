import { Injectable } from '@angular/core';
import {
    FullDashboardResponse,
    SalesByCategoryResponse,
    LowStockItemResponse,
    RecentTransactionResponse,
    ExpiringLotResponse,
    TopProductDashboard,
    CashflowChartResponse,
    SunatStatusDistribution,
    AccountPayableDashboardResponse
} from '../models/dashboard.model';

export interface KpiCard {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
    iconColor: string;
    iconBg?: string;
}

export interface WeeklyChartData {
    day: string;
    value: number;
    value2?: number;
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

export interface UpcomingPayableData {
    supplierName: string;
    documentNumber: string;
    amount: string;
    dueDate: string;
    isOverdue: boolean;
}

export interface DashboardUiModel {
    kpiCards: KpiCard[];
    weeklyData: WeeklyChartData[];
    donutSegments: DonutSegmentData[];
    lowStockItems: LowStockItemData[];
    topProducts: TopProductDashboard[];
    recentSales: RecentSaleData[];
    expirations: ExpirationData[];
    sunatSegments: DonutSegmentData[];
    upcomingPayables: UpcomingPayableData[];
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
            weeklyData: this.mapCashflowChart(data.cashflow_chart ?? []),
            donutSegments: this.mapDonutSegments(data.sales_by_category ?? []),
            lowStockItems: this.mapLowStock(data.low_stock ?? []),
            topProducts: data.top_products ?? [],
            recentSales: this.mapRecentTransactions(data.recent_transactions ?? []),
            expirations: this.mapExpirations(data.expiring_lots ?? []),
            sunatSegments: this.mapSunatSegments(data.sunat_status_distribution ?? []),
            upcomingPayables: this.mapUpcomingPayables(data.upcoming_payables ?? []),
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
        const stockAlerts = summary.stock_alerts;
        const totalStockIssues = (stockAlerts?.expired ?? 0) + (stockAlerts?.expiring_soon ?? 0) + (stockAlerts?.out_of_stock ?? 0);
        const sunatPending = summary.sunat_pending_docs ?? 0;
        const cashBalance = summary.cash_balance ?? 0;
        const accountsReceivable = summary.accounts_receivable ?? 0;

        return [
            {
                label: 'Ventas del Día',
                value: this.formatCurrency(salesValue),
                change: `${salesTrend} vs. ayer`,
                positive: salesTrend.startsWith('+'),
                icon: '💲',
                iconColor: '#00c897',
                iconBg: 'rgba(0, 200, 151, 0.12)'
            },
            {
                label: 'Caja Actual',
                value: this.formatCurrency(cashBalance),
                change: 'Saldo de caja abierta',
                positive: true,
                icon: '💵',
                iconColor: '#3b82f6',
                iconBg: 'rgba(59, 130, 246, 0.12)'
            },
            {
                label: 'Cuentas por Cobrar',
                value: this.formatCurrency(accountsReceivable),
                change: 'Por recuperar',
                positive: true,
                icon: '📋',
                iconColor: '#f59e0b',
                iconBg: 'rgba(245, 158, 11, 0.12)'
            },
            {
                label: 'Alertas Activas',
                value: (totalStockIssues + sunatPending).toString(),
                change: `${totalStockIssues} stock · ${sunatPending} SUNAT`,
                positive: (totalStockIssues + sunatPending) === 0,
                icon: '⚠️',
                iconColor: '#ef4444',
                iconBg: 'rgba(239, 68, 68, 0.12)'
            },
        ];
    }

    private mapCashflowChart(chart: CashflowChartResponse[]): WeeklyChartData[] {
        return chart.map(c => {
            const d = new Date(c.date + 'T00:00:00');
            return { day: this.DAY_NAMES[d.getDay()], value: c.income, value2: c.expense };
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

    private mapSunatSegments(statuses: SunatStatusDistribution[]): DonutSegmentData[] {
        return statuses.map((s, i) => ({
            label: s.status === 'ACCEPTED' ? 'Aceptados' : s.status === 'PENDING' ? 'Pendientes' : s.status === 'REJECTED' ? 'Rechazados' : s.status,
            color: s.status === 'ACCEPTED' ? '#00c897' : s.status === 'PENDING' ? '#f59e0b' : s.status === 'REJECTED' ? '#ef4444' : this.DONUT_COLORS[i % this.DONUT_COLORS.length],
            value: s.percentage,
            amount: s.count,
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

    private mapRecentTransactions(sales: RecentTransactionResponse[]): RecentSaleData[] {
        const now = new Date();
        return sales.map((s, i) => {
            const saleDate = new Date(s.date);
            const diffMin = Math.max(1, Math.round((now.getTime() - saleDate.getTime()) / 60000));
            const docTypeLabel = s.transactionType === 'VENTA' ? s.documentType : 'COMPRA - ' + s.documentType;
            return {
                initials: s.initials,
                name: s.entityName,
                type: docTypeLabel,
                products: s.productCount,
                minutes: diffMin,
                amount: this.formatCurrency(s.totalAmount),
                color: s.transactionType === 'VENTA' ? this.AVATAR_COLORS[i % this.AVATAR_COLORS.length] : '#f87171',
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

    private mapUpcomingPayables(payables: AccountPayableDashboardResponse[]): UpcomingPayableData[] {
        return payables.map(p => ({
            supplierName: p.supplierName,
            documentNumber: p.documentNumber,
            amount: this.formatCurrency(p.pendingBalance),
            dueDate: this.formatDate(p.dueDate),
            isOverdue: p.isOverdue,
        }));
    }
}
