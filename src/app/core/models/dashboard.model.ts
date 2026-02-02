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
    productName: string;
    lotCode: string;
    expiryDate: string;
    quantity: number;
    status: 'EXPIRED' | 'EXPIRING_SOON' | 'OUT_OF_STOCK';
}

export interface SunatAlert {
    saleId: number;
    documentType: string;
    series: string;
    number: string;
    status: string;
    message: string;
}

export interface PaymentMethodDistribution {
    paymentMethod: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface TopProductDashboard {
    productId: number;
    productName: string;
    quantitySold: number;
    totalAmount: number;
}

export interface EmployeePerformanceDashboard {
    userId: number;
    username: string;
    fullName: string;
    salesCount: number;
    totalAmount: number;
}
