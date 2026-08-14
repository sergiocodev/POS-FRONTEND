export interface DashboardSummaryResponse {
    period: string;
    data: SummaryData;
}

export interface SummaryData {
    total_sales: ValueTrend;
    transactions: ValueTrendLong;
    sunat_pending_docs: number;
    stock_alerts: StockAlertsData;
    total_products: number;
    cash_balance: number;
    accounts_receivable: number;
}

export interface ValueTrend {
    value: number;
    currency: string;
    trend: string;
}

export interface ValueTrendLong {
    value: number;
    trend: string;
}

export interface StockAlertsData {
    expired: number;
    expiring_soon: number;
    out_of_stock: number;
}

export interface CashflowChartResponse {
    date: string;
    income: number;
    expense: number;
}

export interface DashboardAlertsResponse {
    stock: StockAlert[];
    sunat: SunatAlert[];
}

export interface StockAlert {
    product_name: string;
    lot_code: string;
    expiry_date: string;
    quantity: number;
    status: 'EXPIRED' | 'EXPIRING_SOON' | 'OUT_OF_STOCK';
}

export interface SunatAlert {
    sale_id: number;
    document_type: string;
    series: string;
    number: string;
    status: string;
    message: string;
}


export interface TopProductDashboard {
    product_id: number;
    product_name: string;
    category_name: string;
    quantity_sold: number;
    total_amount: number;
    trend_label: string;
}

export interface EmployeePerformanceDashboard {
    user_id: number;
    username: string;
    full_name: string;
    sales_count: number;
    total_amount: number;
}

// ── Nuevos DTOs ──────────────────────────────

export interface SalesByCategoryResponse {
    categoryId: number;
    categoryName: string;
    totalAmount: number;
    percentage: number;
}

export interface RecentTransactionResponse {
    id: number;
    entityName: string;
    initials: string;
    transactionType: string;
    documentType: string;
    productCount: number;
    date: string;
    totalAmount: number;
}

export interface ExpiringLotResponse {
    inventory_id: number;
    product_name: string;
    lot_code: string;
    quantity: number;
    expiry_date: string;
    days_until_expiry: number;
    urgent: boolean;
}

export interface LowStockItemResponse {
    product_id: number;
    product_name: string;
    category_name: string;
    current_stock: number;
    min_stock: number;
    stock_level: number;
    critical: boolean;
}

export interface SunatStatusDistribution {
    status: string;
    count: number;
    amount: number;
    percentage: number;
}

export interface AccountPayableDashboardResponse {
    accountPayableId: number;
    supplierName: string;
    documentNumber: string;
    pendingBalance: number;
    dueDate: string;
    isOverdue: boolean;
}

export interface FullDashboardResponse {
    summary: DashboardSummaryResponse;
    cashflow_chart: CashflowChartResponse[];
    sales_by_category: SalesByCategoryResponse[];
    top_products: TopProductDashboard[];
    employee_performance: EmployeePerformanceDashboard[];
    recent_transactions: RecentTransactionResponse[];
    low_stock: LowStockItemResponse[];
    expiring_lots: ExpiringLotResponse[];
    sunat_status_distribution: SunatStatusDistribution[];
    upcoming_payables: AccountPayableDashboardResponse[];
}
