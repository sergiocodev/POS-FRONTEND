import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UsersListComponent, UserFormComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  displayForm = signal(false);
  selectedUserId = signal<number | null>(null);
  isEditMode = signal(false);

  @ViewChild(UsersListComponent) usersList!: UsersListComponent;

  onOpenForm(userId: number | null = null) {
    this.selectedUserId.set(userId);
    this.isEditMode.set(!!userId);
    this.displayForm.set(true);
  }

  onFormSaved() {
    this.displayForm.set(false);
    this.selectedUserId.set(null);
    this.usersList.loadData();
  }

  onFormCancelled() {
    this.displayForm.set(false);
    this.selectedUserId.set(null);
  }
}