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
    saleId: number;
    customerName: string;
    employeeName: string;
    documentType: string;
    documentNumber: string;
    date: string;
    subTotal: number;
    tax: number;
    total: number;
    status: string;
    sunatStatus: string | null;
    isVoided: boolean;
}

export interface SalesSummary {
    startDate: string;
    endDate: string;
    totalTransactions: number;
    totalRevenue: number;
    totalTax: number;
    voidedCount: number;
    voidedAmount: number;
    countByDocumentType: Record<string, number>;
    amountByDocumentType: Record<string, number>;
}

export interface SalesBySeriesReport {
    documentType: string;
    series: string;
    transactionCount: number;
    totalSubTotal: number;
    totalTax: number;
    totalAmount: number;
    voidedCount: number;
    voidedAmount: number;
}

export interface SalesByPaymentMethodReport {
    paymentMethod: string;
    transactionCount: number;
    totalAmount: number;
    percentage: number;
}

export interface SalesByLaboratoryReport {
    laboratoryId: number;
    laboratoryName: string;
    totalRevenue: number;
    quantitySold: number;
    productCount: number;
}

export interface SalesByEmployeeCategoryReport {
    userId: number;
    userName: string;
    categoryName: string;
    totalRevenue: number;
    quantitySold: number;
    transactionCount: number;
}

export interface CategorySalesReport {
    categoryId: number;
    categoryName: string;
    totalRevenue: number;
    quantitySold: number;
}

export interface SalesByProductReport {
    productId: number;
    productName: string;
    categoryName: string;
    laboratoryName: string;
    quantitySold: number;
    totalRevenue: number;
}

export interface EmployeeSalesReport {
    userId: number;
    userName: string;
    totalRevenue: number;
    quantitySold: number;
    transactionCount: number;
}

export interface SalesByCategoryDetailReport {
    categoryId: number;
    categoryName: string;
    totalRevenue: number;
    quantitySold: number;
    productCount: number;
    products: ProductDetail[];
}

export interface ProductDetail {
    productId: number;
    productName: string;
    laboratoryName: string;
    quantitySold: number;
    revenue: number;
}

export interface SalesByCustomerReport {
    customerId: number;
    customerName: string;
    documentNumber: string;
    transactionCount: number;
    totalRevenue: number;
}
