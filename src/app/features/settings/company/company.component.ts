import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService, CompanyRequest } from '../../../core/services/company.service';
import { UploadService } from '../../../core/services/upload.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalAlertComponent, ConfirmModalComponent, SpinnerComponent, ModuleHeaderComponent],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private uploadService = inject(UploadService);
  private modalService = inject(ModalService);

  companyForm: FormGroup;
  
  isLoading = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);
  logoPreviewUrl = signal<string | null>(null);

  selectedFile: File | null = null;

  constructor() {
    this.companyForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      name: ['', Validators.required],
      address: [''],
      ubigeo: [''],
      urbanization: [''],
      phone: [''],
      email: ['', Validators.email],
      logoUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadCompany();
  }

  loadCompany(): void {
    this.isLoading.set(true);
    this.companyService.getCompany().subscribe({
      next: (company) => {
        if (company) {
          this.companyForm.patchValue({
            ruc: company.ruc,
            name: company.name,
            address: company.address,
            ubigeo: company.ubigeo,
            urbanization: company.urbanization,
            phone: company.phone,
            email: company.email,
            logoUrl: company.logoUrl
          });
          this.logoPreviewUrl.set(company.logoUrl || null);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading company data', err);
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    if (this.selectedFile) {
      this.isUploading.set(true);
      this.uploadService.upload(this.selectedFile, 'company').subscribe({
        next: (res) => {
          this.isUploading.set(false);
          const logoUrl = res.data?.url;
          this.companyForm.patchValue({ logoUrl });
          this.updateCompanyData();
        },
        error: (err: any) => {
          this.isUploading.set(false);
          this.isSaving.set(false);
          this.modalService.alert({ title: 'Error', message: 'Error al subir el logo de la empresa.', type: 'error' });
          console.error(err);
        }
      });
    } else {
      this.updateCompanyData();
    }
  }

  private updateCompanyData(): void {
    const request: CompanyRequest = this.companyForm.value;
    this.companyService.updateCompany(request).subscribe({
      next: (response) => {
        this.modalService.alert({ title: 'Éxito', message: 'Empresa actualizada correctamente.', type: 'success' });
        this.isSaving.set(false);
        this.selectedFile = null;
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.modalService.alert({ title: 'Error', message: 'Error al actualizar la información de la empresa.', type: 'error' });
        console.error(err);
      }
    });
  }
}
