import { TestBed } from '@angular/core/testing';
import { DashboardDataService, KpiCard, WeeklyChartData, DonutSegmentData, PaymentSegmentData, LowStockItemData, RecentSaleData, ExpirationData, DashboardUiModel } from './dashboard-data.service';
import { FullDashboardResponse } from '../models/dashboard.model';

describe('DashboardDataService', () => {
    let service: DashboardDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DashboardDataService);
    });

    describe('formatCurrency', () => {
        it('should format with S/ prefix and 2 decimal places', () => {
            expect(service.formatCurrency(1000)).toBe('S/ 1,000.00');
        });

        it('should handle zero', () => {
            expect(service.formatCurrency(0)).toBe('S/ 0.00');
        });

        it('should handle decimals', () => {
            expect(service.formatCurrency(123.456)).toBe('S/ 123.46');
        });

        it('should handle negative values', () => {
            expect(service.formatCurrency(-500)).toBe('S/ -500.00');
        });

        it('should handle large numbers with proper comma separation', () => {
            expect(service.formatCurrency(1000000)).toBe('S/ 1,000,000.00');
        });
    });

    describe('formatDate', () => {
        it('should format date string into readable format', () => {
            expect(service.formatDate('2024-01-15')).toBe('15 Ene 2024');
        });

        it('should format date with single digit day correctly', () => {
            expect(service.formatDate('2024-03-05')).toBe('05 Mar 2024');
        });
    });

    describe('getStockBarColor', () => {
        it('should return red when critical is true', () => {
            expect(service.getStockBarColor(0.8, true)).toBe('#ef4444');
        });

        it('should return yellow when level is below 0.5', () => {
            expect(service.getStockBarColor(0.3, false)).toBe('#f59e0b');
        });

        it('should return green when level is above 0.5 and not critical', () => {
            expect(service.getStockBarColor(0.7, false)).toBe('#00c897');
        });

        it('should return yellow when level is exactly 0.5', () => {
            expect(service.getStockBarColor(0.5, false)).toBe('#f59e0b');
        });
    });

    describe('transform', () => {
        it('should return empty arrays for empty/null response properties', () => {
            const result = service.transform({} as FullDashboardResponse);
            expect(result.kpiCards).toEqual([]);
            expect(result.weeklyData).toEqual([]);
            expect(result.donutSegments).toEqual([]);
            expect(result.paymentSegments).toEqual([]);
            expect(result.lowStockItems).toEqual([]);
            expect(result.topProducts).toEqual([]);
            expect(result.recentSales).toEqual([]);
            expect(result.expirations).toEqual([]);
        });

        it('should map KPI cards from summary data', () => {
            const mockData: Partial<FullDashboardResponse> = {
                summary: {
                    period: 'today',
                    data: {
                        total_sales: { value: 5000, trend: '+15%', currency: 'PEN' },
                        transactions: { value: 42, trend: '-5%' },
                        total_products: 150,
                        sunat_pending_docs: 3,
                        stock_alerts: { expired: 2, expiring_soon: 5, out_of_stock: 1 }
                    }
                },
                sales_chart: [],
                sales_by_category: [],
                payment_methods: [],
                top_products: [],
                recent_sales: [],
                low_stock: [],
                expiring_lots: []
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.kpiCards.length).toBe(4);
            expect(result.kpiCards[0].label).toBe('Ventas del D\u00eda');
            expect(result.kpiCards[0].value).toBe('S/ 5,000.00');
            expect(result.kpiCards[0].positive).toBeTrue();
            expect(result.kpiCards[1].label).toBe('Transacciones');
            expect(result.kpiCards[1].value).toBe('42');
            expect(result.kpiCards[1].positive).toBeFalse();
            expect(result.kpiCards[2].label).toBe('Productos en Stock');
            expect(result.kpiCards[2].value).toBe('150');
            expect(result.kpiCards[3].label).toBe('Alertas Activas');
            expect(result.kpiCards[3].value).toBe('11');
            expect(result.kpiCards[3].positive).toBeFalse();
        });

        it('should map sales chart data to weekly format', () => {
            const mockData: Partial<FullDashboardResponse> = {
                sales_chart: [
                    { date: '2024-01-15', total: 1000 },
                    { date: '2024-01-16', total: 2000 }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.weeklyData.length).toBe(2);
            expect(result.weeklyData[0].day).toBe('Lun');
            expect(result.weeklyData[0].value).toBe(1000);
            expect(result.weeklyData[1].day).toBe('Mar');
            expect(result.weeklyData[1].value).toBe(2000);
        });

        it('should map donut segments from category data', () => {
            const mockData: Partial<FullDashboardResponse> = {
                sales_by_category: [
                    { categoryId: 1, categoryName: 'Medicamentos', totalAmount: 5000, percentage: 60 },
                    { categoryId: 2, categoryName: 'Cosmeticos', totalAmount: 3000, percentage: 40 }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.donutSegments.length).toBe(2);
            expect(result.donutSegments[0].label).toBe('Medicamentos');
            expect(result.donutSegments[0].value).toBe(60);
            expect(result.donutSegments[0].amount).toBe(5000);
            expect(result.donutSegments[0].color).toBe('#00c897');
            expect(result.donutSegments[1].label).toBe('Cosmeticos');
            expect(result.donutSegments[1].value).toBe(40);
            expect(result.donutSegments[1].color).toBe('#3b82f6');
        });

        it('should map payment segments from payment methods', () => {
            const mockData: Partial<FullDashboardResponse> = {
                payment_methods: [
                    { payment_method: 'EFECTIVO', amount: 3000, count: 25, percentage: 50 },
                    { payment_method: 'TARJETA', amount: 2000, count: 10, percentage: 33 }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.paymentSegments.length).toBe(2);
            expect(result.paymentSegments[0].label).toBe('EFECTIVO');
            expect(result.paymentSegments[0].value).toBe(50);
            expect(result.paymentSegments[0].amount).toBe(3000);
            expect(result.paymentSegments[0].count).toBe(25);
            expect(result.paymentSegments[0].color).toBe('#10b981');
            expect(result.paymentSegments[1].label).toBe('TARJETA');
            expect(result.paymentSegments[1].color).toBe('#3b82f6');
        });

        it('should map low stock items', () => {
            const mockData: Partial<FullDashboardResponse> = {
                low_stock: [
                    { product_id: 1, product_name: 'Paracetamol', category_name: 'Medicamentos', current_stock: 5, min_stock: 10, stock_level: 0.5, critical: true }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.lowStockItems.length).toBe(1);
            expect(result.lowStockItems[0].name).toBe('Paracetamol');
            expect(result.lowStockItems[0].category).toBe('Medicamentos');
            expect(result.lowStockItems[0].units).toBe(5);
            expect(result.lowStockItems[0].min).toBe(10);
            expect(result.lowStockItems[0].level).toBe(0.5);
            expect(result.lowStockItems[0].critical).toBeTrue();
        });

        it('should map top products directly', () => {
            const topProducts = [
                { product_id: 1, product_name: 'Product A', category_name: 'Cat A', quantity_sold: 100, total_amount: 5000, trend_label: '+10%' }
            ];
            const mockData: Partial<FullDashboardResponse> = { top_products: topProducts };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.topProducts).toEqual(topProducts);
        });

        it('should map recent sales with calculated minutes ago', () => {
            const saleDate = new Date();
            saleDate.setMinutes(saleDate.getMinutes() - 15);
            const dateStr = saleDate.toISOString().slice(0, 19);

            const mockData: Partial<FullDashboardResponse> = {
                recent_sales: [
                    {
                        sale_id: 1,
                        customer_name: 'John Doe',
                        customer_initials: 'JD',
                        document_type: 'BOLETA',
                        product_count: 3,
                        sale_date: dateStr,
                        total: 150.50
                    }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.recentSales.length).toBe(1);
            expect(result.recentSales[0].name).toBe('John Doe');
            expect(result.recentSales[0].initials).toBe('JD');
            expect(result.recentSales[0].type).toBe('venta');
            expect(result.recentSales[0].products).toBe(3);
            expect(result.recentSales[0].amount).toBe('S/ 150.50');
            expect(result.recentSales[0].color).toBe('#10b981');
        });

        it('should map recent sales with receta type for non-boleta/factura documents', () => {
            const saleDate = new Date();
            saleDate.setMinutes(saleDate.getMinutes() - 5);

            const mockData: Partial<FullDashboardResponse> = {
                recent_sales: [
                    {
                        sale_id: 2,
                        customer_name: 'Jane Smith',
                        customer_initials: 'JS',
                        document_type: 'RECETA',
                        product_count: 1,
                        sale_date: saleDate.toISOString().slice(0, 19),
                        total: 50
                    }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.recentSales[0].type).toBe('receta');
        });

        it('should map expirations with formatted dates', () => {
            const mockData: Partial<FullDashboardResponse> = {
                expiring_lots: [
                    {
                        inventory_id: 1,
                        product_name: 'Aspirina',
                        lot_code: 'LOT-001',
                        quantity: 50,
                        expiry_date: '2024-06-15',
                        days_until_expiry: 30,
                        urgent: false
                    }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.expirations.length).toBe(1);
            expect(result.expirations[0].name).toBe('Aspirina');
            expect(result.expirations[0].lot).toBe('LOT-001 \u00b7 50 uds');
            expect(result.expirations[0].daysLeft).toBe(30);
            expect(result.expirations[0].date).toBe('15 Jun 2024');
            expect(result.expirations[0].urgent).toBeFalse();
        });

        it('should handle KPI cards with default values when summary data is missing', () => {
            const mockData: Partial<FullDashboardResponse> = {
                summary: {
                    period: 'today',
                    data: {
                        total_sales: { value: 0, trend: '0%', currency: 'PEN' },
                        transactions: { value: 0, trend: '0%' },
                        total_products: 0,
                        sunat_pending_docs: 0,
                        stock_alerts: { expired: 0, expiring_soon: 0, out_of_stock: 0 }
                    }
                }
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.kpiCards.length).toBe(4);
            expect(result.kpiCards[0].value).toBe('S/ 0.00');
            expect(result.kpiCards[0].positive).toBeTrue();
            expect(result.kpiCards[3].value).toBe('0');
            expect(result.kpiCards[3].positive).toBeTrue();
        });

        it('should handle missing summary data gracefully', () => {
            const mockData: Partial<FullDashboardResponse> = {
                summary: undefined as unknown as FullDashboardResponse['summary']
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.kpiCards).toEqual([]);
        });

        it('should cycle through donut colors when there are more categories than colors', () => {
            const categories = Array.from({ length: 10 }, (_, i) => ({
                categoryId: i + 1,
                categoryName: `Category ${i + 1}`,
                totalAmount: 1000,
                percentage: 10
            }));

            const mockData: Partial<FullDashboardResponse> = {
                sales_by_category: categories
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.donutSegments.length).toBe(10);
            expect(result.donutSegments[8].color).toBe('#00c897');
            expect(result.donutSegments[9].color).toBe('#3b82f6');
        });

        it('should use minimum of 1 for minutes ago when sale is in the future', () => {
            const futureDate = new Date();
            futureDate.setMinutes(futureDate.getMinutes() + 5);

            const mockData: Partial<FullDashboardResponse> = {
                recent_sales: [
                    {
                        sale_id: 1,
                        customer_name: 'Test',
                        customer_initials: 'T',
                        document_type: 'BOLETA',
                        product_count: 1,
                        sale_date: futureDate.toISOString().slice(0, 19),
                        total: 100
                    }
                ]
            };

            const result = service.transform(mockData as FullDashboardResponse);
            expect(result.recentSales[0].minutes).toBe(1);
        });
    });
});
