import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { UploadService } from '../../../core/services/upload.service';
import {
    BrandResponse,
    CategoryResponse,
    LaboratoryResponse,
    PresentationResponse,
    TaxTypeResponse,
    ActiveIngredientResponse
} from '../../../core/models/product.model';
import { PharmaceuticalFormResponse } from '../../../core/models/pharmaceutical-form.model';
import { TherapeuticActionResponse } from '../../../core/models/therapeutic-action.model';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private productService = inject(ProductService);
    private maintenanceService = inject(MaintenanceService);
    private uploadService = inject(UploadService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    @Input() set idProduct(value: number | null) {
        this._productId.set(value);
        this.checkEditModeFromInput();
    }
    get idProduct(): number | null {
        return this._productId();
    }
    private _productId = signal<number | null>(null);

    @Input() isModal: boolean = false;

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    productForm: FormGroup;
    isEditMode = signal<boolean>(false);
    productId = signal<number | null>(null);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    imageError = signal<boolean>(false);


    brands = signal<BrandResponse[]>([]);
    categories = signal<CategoryResponse[]>([]);
    laboratories = signal<LaboratoryResponse[]>([]);
    presentations = signal<PresentationResponse[]>([]);
    taxTypes = signal<TaxTypeResponse[]>([]);
    activeIngredients = signal<ActiveIngredientResponse[]>([]);
    pharmaceuticalForms = signal<PharmaceuticalFormResponse[]>([]);
    therapeuticActions = signal<TherapeuticActionResponse[]>([]);

    unitTypes = ['UNI', 'CAJ', 'BLI', 'FRA', 'SOB', 'AMP'];

    constructor() {
        this.productForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(50)]],
            barcode: ['', [Validators.maxLength(50)]],
            digemidCode: ['', [Validators.maxLength(50)]],
            tradeName: ['', [Validators.required, Validators.maxLength(255)]],
            genericName: ['', [Validators.maxLength(255)]],
            description: [''],
            brandId: [null, [Validators.required]],
            categoryId: [null, [Validators.required]],
            laboratoryId: [null, [Validators.required]],
            presentationId: [null, [Validators.required]],
            pharmaceuticalFormId: [null, [Validators.required]],
            taxTypeId: [null, [Validators.required]],
            requiresPrescription: [false],
            isGeneric: [false],
            unitType: ['UNI', [Validators.required]],
            purchaseFactor: [1, [Validators.required, Validators.min(1)]],
            fractionLabel: [''],
            active: [true],
            imageUrl: [''],
            therapeuticActionIds: [[]],
            ingredients: this.fb.array([])
        });

        this.productForm.get('imageUrl')?.valueChanges.subscribe(() => {
            this.imageError.set(false);
        });
    }

    ngOnInit(): void {
        this.loadLookupData();
        this.checkEditModeFromRoute();
    }

    checkEditModeFromRoute(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.productId.set(+id);
            this.loadProduct(+id);
        }
    }

    checkEditModeFromInput(): void {
        const id = this.idProduct;
        if (id) {
            this.isEditMode.set(true);
            this.productId.set(id);
            this.loadProduct(id);
        } else {
            this.isEditMode.set(false);
            this.productId.set(null);
            if (this.productForm) {
                this.productForm.reset({
                    unitType: 'UNI',
                    purchaseFactor: 1,
                    active: true,
                    therapeuticActionIds: [],
                    ingredients: []
                });
                // Clear FormArray
                while (this.ingredients.length !== 0) {
                    this.ingredients.removeAt(0);
                }
            }
        }
    }

    get ingredients(): FormArray {
        return this.productForm.get('ingredients') as FormArray;
    }

    addIngredient(): void {
        const ingredientForm = this.fb.group({
            activeIngredientId: [null, Validators.required],
            concentration: ['', Validators.maxLength(50)]
        });
        this.ingredients.push(ingredientForm);
    }

    removeIngredient(index: number): void {
        this.ingredients.removeAt(index);
    }

    loadLookupData(): void {
        this.isLoading.set(true);
        forkJoin({
            brands: this.maintenanceService.getBrands(),
            categories: this.maintenanceService.getCategories(),
            laboratories: this.maintenanceService.getLaboratories(),
            presentations: this.maintenanceService.getPresentations(),
            taxTypes: this.maintenanceService.getTaxTypes(),
            activeIngredients: this.maintenanceService.getActiveIngredients(),
            pharmaceuticalForms: this.maintenanceService.getPharmaceuticalForms(),
            therapeuticActions: this.maintenanceService.getTherapeuticActions()
        }).subscribe({
            next: (data) => {
                this.brands.set(data.brands.data);
                this.categories.set(data.categories.data);
                this.laboratories.set(data.laboratories.data);
                this.presentations.set(data.presentations.data);
                this.taxTypes.set(data.taxTypes.data);
                this.activeIngredients.set(data.activeIngredients.data);
                this.pharmaceuticalForms.set(data.pharmaceuticalForms.data);
                this.therapeuticActions.set(data.therapeuticActions.data);
                if (!this.isEditMode()) this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar datos referenciales.');
                this.isLoading.set(false);
            }
        });
    }

    loadProduct(id: number): void {
        this.productService.getById(id).subscribe({
            next: (response) => {
                const product = response.data;
                this.productForm.patchValue({
                    code: product.code,
                    barcode: product.barcode,
                    digemidCode: product.digemidCode,
                    tradeName: product.tradeName,
                    genericName: product.genericName,
                    description: product.description,
                    brandId: this.brands().find(b => b.name === product.brandName)?.id,
                    categoryId: this.categories().find(c => c.name === product.categoryName)?.id,
                    laboratoryId: this.laboratories().find(l => l.name === product.laboratoryName)?.id,
                    presentationId: this.presentations().find(p => p.description === product.presentationDescription)?.id,
                    pharmaceuticalFormId: this.pharmaceuticalForms().find(p => p.name === product.pharmaceuticalFormName)?.id,
                    taxTypeId: this.taxTypes().find(t => t.name === product.taxTypeName)?.id,
                    requiresPrescription: product.requiresPrescription,
                    isGeneric: product.isGeneric,
                    unitType: product.unitType,
                    purchaseFactor: product.purchaseFactor,
                    fractionLabel: product.fractionLabel,
                    active: product.active,
                    imageUrl: product.imageUrl,
                    therapeuticActionIds: product.therapeuticActionIds || []
                });


                if (product.ingredients) {
                    product.ingredients.forEach(i => {
                        this.ingredients.push(this.fb.group({
                            activeIngredientId: [i.activeIngredientId, Validators.required],
                            concentration: [i.concentration]
                        }));
                    });
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar el producto.');
                this.isLoading.set(false);
            }
        });
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isLoading.set(true);
            this.uploadService.upload(file, 'productos').subscribe({
                next: (res) => {
                    this.productForm.patchValue({ imageUrl: res.data.url });
                    this.imageError.set(false);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Error uploading file:', err);
                    this.errorMessage.set('No se pudo subir la imagen del producto.');
                    this.isLoading.set(false);
                }
            });
        }
    }

    onSubmit(): void {
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        const productData = this.productForm.value;

        const request$ = this.isEditMode()
            ? this.productService.update(this.productId()!, productData)
            : this.productService.create(productData);

        request$.subscribe({
            next: () => {
                this.isLoading.set(false);
                this.saved.emit();
                if (!this.isModal) {
                    this.router.navigate(['/products']);
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Error al guardar el producto.');
            }
        });
    }

    onCancel(): void {
        this.cancelled.emit();
        if (!this.isModal) {
            this.router.navigate(['/products']);
        }
    }

    onActionChange(event: any, id: number): void {
        const checked = event.target.checked;
        const current = this.productForm.get('therapeuticActionIds')?.value || [];
        if (checked) {
            this.productForm.patchValue({ therapeuticActionIds: [...current, id] });
        } else {
            this.productForm.patchValue({ therapeuticActionIds: current.filter((x: number) => x !== id) });
        }
    }

    isActionChecked(id: number): boolean {
        const current = this.productForm.get('therapeuticActionIds')?.value || [];
        return current.includes(id);
    }
}
