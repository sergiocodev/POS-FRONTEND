import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from './service/modal.service';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {

  constructor(public modalService: ModalService) { }

  onAction(result: boolean) {
    this.modalService.close(result);
  }

}
