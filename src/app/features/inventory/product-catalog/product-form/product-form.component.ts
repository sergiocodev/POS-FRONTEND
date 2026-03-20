import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { UploadService } from '../../../../core/services/upload.service';
import {
    BrandResponse,
    CategoryResponse,
    LaboratoryResponse,
    PresentationResponse,
    TaxTypeResponse,
    ActiveIngredientResponse,
    ProductUnitRequest
} from '../../../../core/models/product.model';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { PharmaceuticalFormResponse } from '../../../../core/models/pharmaceutical-form.model';
import { TherapeuticActionResponse } from '../../../../core/models/therapeutic-action.model';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private productService = inject(ProductService);
    private maintenanceService = inject(MaintenanceService);
    private uploadService = inject(UploadService);
    private productUnitService = inject(ProductUnitService);

    @Input() idProduct: number | null = null;
    @Input() isModal: boolean = false;

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    productForm: FormGroup;
    isEditMode = signal<boolean>(false);
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

    constructor() {
        this.productForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(50)]],
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
            imageUrl: [''],
            therapeuticActionIds: [[]],
            ingredients: this.fb.array([]),
            units: this.fb.array([])
        });

        this.productForm.get('imageUrl')?.valueChanges.subscribe(() => {
            this.imageError.set(false);
        });
    }

    ngOnInit(): void {
        this.loadLookupData();
        this.checkEditMode();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['idProduct'] && !changes['idProduct'].firstChange) {
            this.checkEditMode();
        }
    }

    checkEditMode(): void {
        const id = this.idProduct;
        if (id) {
            this.isEditMode.set(true);
            this.loadProduct(id);
        } else {
            this.isEditMode.set(false);
            if (this.productForm) {
                this.productForm.reset({
                    therapeuticActionIds: [],
                    ingredients: [],
                    units: []
                });
                while (this.ingredients.length !== 0) {
                    this.ingredients.removeAt(0);
                }
                while (this.units.length !== 0) {
                    this.units.removeAt(0);
                }
                this.addUnit(); // Add at least one unit initially
            }
        }
    }

    get ingredients(): FormArray {
        return this.productForm.get('ingredients') as FormArray;
    }

    get units(): FormArray {
        return this.productForm.get('units') as FormArray;
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

    addUnit(): void {
        const unitForm = this.fb.group({
            id: [null],
            unitName: ['UNI', Validators.required],
            factor: [1, [Validators.required, Validators.min(1)]],
            barcode: [''],
            sunatCode: [''],
            price: [0, [Validators.required, Validators.min(0)]],
            isBaseUnit: [this.units.length === 0]
        });
        this.units.push(unitForm);
    }

    removeUnit(index: number): void {
        this.units.removeAt(index);
    }

    loadLookupData(): void {
        this.isLoading.set(true);
        forkJoin({
            brands: this.maintenanceService.getAllBrands(),
            categories: this.maintenanceService.getAllCategory(),
            laboratories: this.maintenanceService.getAllLaboratory(),
            presentations: this.maintenanceService.getAllPresentations(),
            taxTypes: this.maintenanceService.getAllTaxTypes(),
            activeIngredients: this.maintenanceService.getAllActiveIngredients(),
            pharmaceuticalForms: this.maintenanceService.getAllPharmaceuticalForms(),
            therapeuticActions: this.maintenanceService.getAllTherapeuticActions()
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
        this.isLoading.set(true);
        this.productService.getById(id).subscribe({
            next: (response) => {
                const product = response.data;
                this.productForm.patchValue({
                    code: product.code,
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
                    imageUrl: product.imageUrl,
                    therapeuticActionIds: product.therapeuticActionIds || []
                });

                while (this.ingredients.length !== 0) {
                    this.ingredients.removeAt(0);
                }

                if (product.ingredients) {
                    product.ingredients.forEach(i => {
                        this.ingredients.push(this.fb.group({
                            activeIngredientId: [i.activeIngredientId, Validators.required],
                            concentration: [i.concentration]
                        }));
                    });
                }
                
                // Fetch units dynamically
                this.productUnitService.getByProductId(product.id).subscribe({
                    next: (units) => {
                        while(this.units.length !== 0) this.units.removeAt(0);
                        units.forEach(u => {
                            this.units.push(this.fb.group({
                                id: [u.id],
                                unitName: [u.unitName, Validators.required],
                                factor: [u.factor, [Validators.required, Validators.min(1)]],
                                barcode: [u.barcode],
                                sunatCode: [u.sunatCode],
                                price: [u.price, [Validators.required, Validators.min(0)]],
                                isBaseUnit: [u.isBaseUnit]
                            }));
                        });
                        this.isLoading.set(false);
                    },
                    error: () => {
                        this.isLoading.set(false);
                    }
                });
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
        const formValue = this.productForm.value;
        const productData = { ...formValue };
        delete productData.units;

        const request$ = this.isEditMode()
            ? this.productService.update(this.idProduct!, productData)
            : this.productService.create(productData);

        request$.subscribe({
            next: (res) => {
                const productId = this.isEditMode() ? this.idProduct! : res.data.id;
                this.saveUnits(productId).then(() => {
                    this.isLoading.set(false);
                    this.saved.emit();
                }).catch(() => {
                    this.isLoading.set(false);
                    this.errorMessage.set('Producto guardado, pero hubo error al guardar las unidades.');
                    this.saved.emit();
                });
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Error al guardar el producto.');
            }
        });
    }

    private async saveUnits(productId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const units: any[] = this.productForm.value.units || [];
            
            const unitObv$ = units.map(u => {
                const req: ProductUnitRequest = {
                    productId: productId,
                    unitName: u.unitName,
                    factor: u.factor,
                    barcode: u.barcode,
                    sunatCode: u.sunatCode,
                    price: u.price,
                    isBaseUnit: u.isBaseUnit || false
                };
                if (u.id) {
                    return this.productUnitService.update(u.id, req);
                } else {
                    return this.productUnitService.create(req);
                }
            });

            if (unitObv$.length === 0) {
                resolve();
                return;
            }

            forkJoin(unitObv$).subscribe({
                next: () => resolve(),
                error: (err) => reject(err)
            });
        });
    }

    onCancel(): void {
        this.cancelled.emit();
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
