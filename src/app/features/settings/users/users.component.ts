import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, DialogModule, UsersListComponent, UserFormComponent],
    template: `
    <div class="users-page">
      <app-users-list 
        (create)="onOpenForm()" 
        (edit)="onOpenForm($event)">
      </app-users-list>

      <p-dialog 
        [header]="isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'" 
        [(visible)]="displayForm" 
        [modal]="true" 
        [style]="{ width: '50vw' }" 
        [breakpoints]="{ '960px': '75vw', '641px': '100vw' }"
        [draggable]="false" 
        [resizable]="false">
        
        @if (displayForm()) {
          <app-user-form 
            [userId]="selectedUserId()" 
            (saved)="onFormSaved()" 
            (cancelled)="onFormCancelled()">
          </app-user-form>
        }
      </p-dialog>
    </div>
  `,
    styles: [`
    .users-page {
      padding: 0;
    }
  `]
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
        this.usersList.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
    }
}
