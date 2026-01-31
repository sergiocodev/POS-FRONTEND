export interface InventoryReport {
    productName: string;
    productCode: string;
    brand: string;
    category: string;
    lotCode: string;
    expiryDate: string;
    quantity: number;
    costPrice: number;
    salesPrice: number;
    establishmentName: string;
    stockStatus: 'NORMAL' | 'LOW' | 'CRITICAL';
}

export interface PurchaseReport {
    id: number;
    issueDate: string;
    supplierName: string;
    documentType: string;
    series: string;
    number: string;
    total: number;
    status: string;
}

export interface SalesReport {
    id: number;
    date: string;
    documentType: string;
    series: string;
    number: string;
    customerName: string;
    total: number;
    paymentMethod: string;
    status: string;
}

export interface SalesSummary {
    totalSales: number;
    totalTax: number;
    totalRevenue: number;
    salesCount: number;
    dateStart: string;
    dateEnd: string;
}
