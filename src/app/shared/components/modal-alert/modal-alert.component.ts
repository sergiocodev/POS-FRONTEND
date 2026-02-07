import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../confirm-modal/service/modal.service';

export type ModalAlertType = 'success' | 'error' | 'warning';

@Component({
  selector: 'app-modal-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-alert.component.html',
  styleUrl: './modal-alert.component.scss',
})
export class ModalAlertComponent {

  constructor(public modalService: ModalService) { }

  /** Función interna llamada al hacer clic en el botón */
  onClose() {
    this.modalService.closeAlert();
  }
}
