export interface BulkImportRowError {
    rowNumber: number;
    code: string;
    tradeName: string;
    errorMessage: string;
}

export interface BulkImportResult {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    errors: BulkImportRowError[];
}
