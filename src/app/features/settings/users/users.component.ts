import { Component, signal, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { UserResponse } from '../../../core/models/user.model';
import { RoleResponse } from '../../../core/models/maintenance.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    UsersListComponent,
    UserFormComponent,
    ConfirmModalComponent,
    ModalAlertComponent,
    ModalGenericComponent,
    ModuleHeaderComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private modalService = inject(ModalService);

  // State
  users = signal<UserResponse[]>([]);
  roles = signal<RoleResponse[]>([]);
  isLoading = signal(false);

  // Modal State
  showUserForm = signal(false);
  selectedUserId = signal<number | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Load Roles (needed for list filters)
    this.roleService.getAll().subscribe({
      next: (response) => this.roles.set(response.data),
      error: (err) => console.error('Error loading roles:', err)
    });

    // Load Users
    this.userService.getAll().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.modalService.alert({
          title: 'Error',
          message: 'No se pudieron cargar los usuarios',
          type: 'error'
        });
        this.isLoading.set(false);
      }
    });
  }

  onOpenForm(userId: number | null = null) {
    this.selectedUserId.set(userId);
    this.showUserForm.set(true);
  }

  onFormSaved() {
    this.showUserForm.set(false);
    this.selectedUserId.set(null);
    this.loadData();
  }

  onFormCancelled() {
    this.showUserForm.set(false);
    this.selectedUserId.set(null);
  }

  async onDeleteUser(user: UserResponse) {
    const confirmed = await this.modalService.confirm({
      title: 'Eliminar Usuario',
      message: `¿Está seguro de eliminar al usuario <b>${user.username}</b>? Esta acción no se puede deshacer.`,
      btnColor: 'danger',
      confirmText: 'Eliminar'
    });

    if (confirmed) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.loadData();
          this.modalService.alert({ title: 'Eliminado', message: 'Usuario eliminado correctamente', type: 'success' });
        },
        error: (error) => {
          console.error(error);
          this.modalService.alert({ title: 'Error', message: 'Error al eliminar el usuario', type: 'error' });
        }
      });
    }
  }

  async onToggleStatus(user: UserResponse) {
    const confirmed = await this.modalService.confirm({
      title: 'Confirmación',
      message: `¿Está seguro de <b>${user.active ? 'desactivar' : 'activar'}</b> al usuario ${user.username}?`,
      btnColor: 'warning',
      confirmText: user.active ? 'Desactivar' : 'Activar'
    });

    if (confirmed) {
      this.userService.toggleActive(user.id).subscribe({
        next: () => {
          this.loadData();
          this.modalService.alert({ title: 'Éxito', message: `Usuario ${user.active ? 'desactivado' : 'activado'} correctamente`, type: 'success' });
        },
        error: (error) => {
          console.error(error);
          this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
        }
      });
    }
  }
}