export interface DashboardSummaryResponse {
    period: string;
    data: SummaryData;
}

export interface SummaryData {
    total_sales: ValueTrend;
    transactions: ValueTrendLong;
    sunat_pending_docs: number;
    stock_alerts: StockAlertsData;
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

export interface SalesChartResponse {
    date: string;
    total: number;
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

export interface PaymentMethodDistribution {
    payment_method: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface TopProductDashboard {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_amount: number;
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

export interface RecentSaleResponse {
    sale_id: number;
    customer_name: string;
    customer_initials: string;
    document_type: string;
    product_count: number;
    sale_date: string;
    total: number;
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

export interface FullDashboardResponse {
    summary: DashboardSummaryResponse;
    sales_chart: SalesChartResponse[];
    sales_by_category: SalesByCategoryResponse[];
    payment_methods: PaymentMethodDistribution[];
    top_products: TopProductDashboard[];
    employee_performance: EmployeePerformanceDashboard[];
    recent_sales: RecentSaleResponse[];
    low_stock: LowStockItemResponse[];
    expiring_lots: ExpiringLotResponse[];
}
