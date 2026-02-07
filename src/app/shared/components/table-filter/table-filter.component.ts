import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-filter',
  imports: [FormsModule, CommonModule],
  templateUrl: './table-filter.component.html',
  styleUrl: './table-filter.component.scss',
})
export class TableFilterComponent {
  // 'model' permite [(searchQuery)] en el padre. Sincroniza lectura/escritura.
  searchQuery = model<string>('');

  // Configuraciones visuales
  placeholder = input<string>('Buscar...');

  // Para saber cuándo deshabilitar el botón (recibido del padre)
  disableClear = input<boolean>(true);

  // Evento cuando hacen click en limpiar
  clear = output<void>();

  emitClear() {
    this.searchQuery.set(''); // Limpia el buscador internamente
    this.clear.emit();        // Avisa al padre para limpiar los selects
  }

}
