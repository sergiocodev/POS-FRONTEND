import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { MovementListComponent } from './movement-list/movement-list.component';
import { MovementFormComponent } from './movement-form/movement-form.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';

@Component({
  selector: 'app-cash-flows',
  standalone: true,
  imports: [CommonModule, ModuleHeaderComponent, MovementListComponent, MovementFormComponent, ModalGenericComponent],
  templateUrl: './cash-flows.component.html',
  styleUrl: './cash-flows.component.scss',
})
export class CashFlowsComponent implements OnInit {
  showModal = signal<boolean>(false);
  selectedType = signal<'inflow' | 'outflow'>('inflow');
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'inflow') {
        this.openModal('inflow');
      } else if (params['action'] === 'outflow') {
        this.openModal('outflow');
      }
    });
  }

  openModal(type: 'inflow' | 'outflow'): void {
    this.selectedType.set(type);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
  }

  onMovementSaved(): void {
    this.closeModal();
  }
}
