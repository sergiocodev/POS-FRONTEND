import { Component, OnInit, inject, signal } from '@angular/core';
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

    unitTypes = ['UNI', 'CAJ', 'BLI', 'FRA', 'SOB', 'AMP'];

    constructor() {
        this.productForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(50)]],
            digemidCode: ['', [Validators.maxLength(50)]],
            name: ['', [Validators.required, Validators.maxLength(255)]],
            description: [''],
            brandId: [null, [Validators.required]],
            categoryId: [null, [Validators.required]],
            laboratoryId: [null, [Validators.required]],
            presentationId: [null, [Validators.required]],
            taxTypeId: [null, [Validators.required]],
            requiresPrescription: [false],
            isGeneric: [false],
            unitType: ['UNI', [Validators.required]],
            purchaseFactor: [1, [Validators.required, Validators.min(1)]],
            fractionLabel: [''],
            active: [true],
            imageUrl: [''],
            ingredients: this.fb.array([])
        });

        this.productForm.get('imageUrl')?.valueChanges.subscribe(() => {
            this.imageError.set(false);
        });
    }

    ngOnInit(): void {
        this.loadLookupData();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.productId.set(+id);
            this.loadProduct(+id);
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
            activeIngredients: this.maintenanceService.getActiveIngredients()
        }).subscribe({
            next: (data) => {
                this.brands.set(data.brands);
                this.categories.set(data.categories);
                this.laboratories.set(data.laboratories);
                this.presentations.set(data.presentations);
                this.taxTypes.set(data.taxTypes);
                this.activeIngredients.set(data.activeIngredients);
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
            next: (product) => {
                this.productForm.patchValue({
                    code: product.code,
                    digemidCode: product.digemidCode,
                    name: product.name,
                    description: product.description,
                    brandId: this.brands().find(b => b.name === product.brandName)?.id,
                    categoryId: this.categories().find(c => c.name === product.categoryName)?.id,
                    laboratoryId: this.laboratories().find(l => l.name === product.laboratoryName)?.id,
                    presentationId: this.presentations().find(p => p.description === product.presentationDescription)?.id,
                    taxTypeId: this.taxTypes().find(t => t.name === product.taxTypeName)?.id,
                    requiresPrescription: product.requiresPrescription,
                    isGeneric: product.isGeneric,
                    unitType: product.unitType,
                    purchaseFactor: product.purchaseFactor,
                    fractionLabel: product.fractionLabel,
                    active: product.active,
                    imageUrl: product.imageUrl
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
                    this.productForm.patchValue({ imageUrl: res.url });
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
            next: () => this.router.navigate(['/products']),
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Error al guardar el producto.');
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/products']);
    }
}
