import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../core/services/product.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { BulkImportResult, BulkImportRowError } from '../../../../core/models/bulk-import.model';

type ImportStep = 'upload' | 'processing' | 'results';

@Component({
    selector: 'app-product-bulk-import',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-bulk-import.component.html',
    styleUrl: './product-bulk-import.component.scss'
})
export class ProductBulkImportComponent {
    private productService = inject(ProductService);
    private modalService = inject(ModalService);

    saved = output<void>();
    cancelled = output<void>();

    // State
    currentStep = signal<ImportStep>('upload');
    selectedFile = signal<File | null>(null);
    isDragOver = signal(false);
    isUploading = signal(false);
    importResult = signal<BulkImportResult | null>(null);

    // File validation
    readonly maxFileSize = 10 * 1024 * 1024; // 10MB
    readonly acceptedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.validateAndSetFile(files[0]);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.validateAndSetFile(input.files[0]);
        }
    }

    private validateAndSetFile(file: File) {
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            this.modalService.alert({
                title: 'Formato no válido',
                message: 'Solo se aceptan archivos Excel (.xlsx)',
                type: 'error'
            });
            return;
        }

        if (file.size > this.maxFileSize) {
            this.modalService.alert({
                title: 'Archivo muy grande',
                message: 'El archivo no debe superar los 10MB',
                type: 'error'
            });
            return;
        }

        this.selectedFile.set(file);
    }

    removeFile() {
        this.selectedFile.set(null);
    }

    downloadTemplate() {
        this.productService.downloadTemplate().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plantilla_productos.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudo descargar la plantilla',
                    type: 'error'
                });
            }
        });
    }

    startImport() {
        const file = this.selectedFile();
        if (!file) return;

        this.currentStep.set('processing');
        this.isUploading.set(true);

        this.productService.bulkImport(file).subscribe({
            next: (res) => {
                this.importResult.set(res.data);
                this.currentStep.set('results');
                this.isUploading.set(false);
            },
            error: (err) => {
                this.isUploading.set(false);
                this.currentStep.set('upload');
                const msg = err?.error?.message || 'Error al importar el archivo';
                this.modalService.alert({
                    title: 'Error de importación',
                    message: msg,
                    type: 'error'
                });
            }
        });
    }

    finishImport() {
        const result = this.importResult();
        if (result && (result.createdCount > 0 || result.updatedCount > 0)) {
            this.saved.emit();
        } else {
            this.cancelled.emit();
        }
    }

    resetImport() {
        this.selectedFile.set(null);
        this.importResult.set(null);
        this.currentStep.set('upload');
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getSuccessRate(): number {
        const result = this.importResult();
        if (!result || result.totalRows === 0) return 0;
        return Math.round(((result.createdCount + result.updatedCount) / result.totalRows) * 100);
    }
}
