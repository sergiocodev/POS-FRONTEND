import { NgIf } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [NgIf],
    templateUrl: './file-upload.component.html',
    styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @Output() fileSelected = new EventEmitter<File>();
    @Output() fileCleared = new EventEmitter<void>();

    isUploading = false;
    message = '';
    messageType: 'success' | 'error' | '' = '';
    selectedFile: File | null = null;

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
        const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();

        if (file.size > maxSize || !allowedExtensions.includes(extension)) {
            this.message = 'Archivo inválido. Tamaño máximo 10MB y tipo permitido (.pdf, .doc, etc.)';
            this.messageType = 'error';
            this.resetNativeInput();
            this.selectedFile = null;
            return;
        }

        this.selectedFile = file;
        this.message = 'Archivo listo para subir.';
        this.messageType = 'success';
        this.fileSelected.emit(file);
    }

    clearFile(): void {
        this.selectedFile = null;
        this.resetNativeInput();
        this.message = 'Archivo quitado.';
        this.messageType = '';
        this.fileCleared.emit();
    }

    private resetNativeInput(): void {
        if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }
}
