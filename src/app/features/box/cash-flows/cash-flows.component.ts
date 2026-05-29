import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class CashFlowsComponent {
  showModal = signal<boolean>(false);
  selectedType = signal<'inflow' | 'outflow'>('inflow');

  openModal(type: 'inflow' | 'outflow'): void {
    this.selectedType.set(type);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onMovementSaved(): void {
    this.closeModal();
  }
}
