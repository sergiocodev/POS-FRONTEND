export interface RecentCustomerItem {
    id: number;
    name: string;
    initials: string;
    avatarColor: string;
    contact: string;
    email: string;
    lastPurchaseDate: string;
    totalPurchases: number;
    status: 'VIP' | 'Activo' | 'Nuevo' | 'Inactivo';
    documentNumber: string;
}

export interface TopCustomerItem {
    id: number;
    name: string;
    totalAmount: number;
    salesCount: number;
    percentage: number;
}

export interface ActivityPoint {
    date: string;
    newCustomers: number;
    activeCustomers: number;
}

export interface AgeRangeItem {
    range: string;
    count: number;
}

export interface CustomerDashboardResponse {
    // KPIs
    totalCustomers: number;
    activeCustomers: number;
    totalSalesAmount: number;
    averageTicket: number;
    averageFrequency: number;

    // Trends
    totalCustomersTrend: number;
    activeCustomersTrend: number;
    salesAmountTrend: number;
    averageTicketTrend: number;
    frequencyTrend: number;

    // Recent customers
    recentCustomers: RecentCustomerItem[];

    // Segmentation
    frequentCount: number;
    occasionalCount: number;
    newCount: number;
    inactiveCount: number;
    vipCount: number;

    // Top customers
    topCustomers: TopCustomerItem[];

    // Activity series
    activitySeries: ActivityPoint[];

    // Age ranges (points proxy)
    ageRanges: AgeRangeItem[];
}
