import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../../../core/models/sale.model';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-voucher-80mm',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './voucher-80mm.component.html',
  styleUrl: './voucher-80mm.component.scss'
})
export class Voucher80mmComponent {
  @Input() sale!: SaleResponse;

  get qrData(): string {
    if (!this.sale) return '';
    const ruc = this.sale.company?.ruc || '20000000000';
    const tipoDoc = this.sale.documentType === 'FACTURA' ? '01' : '03';
    const docCli = this.sale.documentType === 'FACTURA' ? '6' : (this.sale.customerDocumentNumber?.length === 11 ? '6' : '1');
    const dateStr = this.sale.date ? new Date(this.sale.date).toISOString().substring(0, 10) : '';
    const hash = this.sale.hashCpe || '';
    return `${ruc}|${tipoDoc}|${this.sale.series}|${this.sale.number}|${this.sale.tax}|${this.sale.total}|${dateStr}|${docCli}|${this.sale.customerDocumentNumber || '-'}|${hash}`;
  }

  numeroALetras(num: number): string {
    if (!num) return 'CERO CON 00/100 SOLES';
    const enteros = Math.floor(num);
    const centavos = Math.round((num - enteros) * 100).toString().padStart(2, '0');
    return this.millones(enteros) + ' CON ' + centavos + '/100 SOLES';
  }

  private unidades(num: number): string {
    switch (num) {
      case 1: return 'UN';
      case 2: return 'DOS';
      case 3: return 'TRES';
      case 4: return 'CUATRO';
      case 5: return 'CINCO';
      case 6: return 'SEIS';
      case 7: return 'SIETE';
      case 8: return 'OCHO';
      case 9: return 'NUEVE';
      default: return '';
    }
  }

  private decenas(num: number): string {
    const decena = Math.floor(num / 10);
    const unidad = num - (decena * 10);
    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return 'DIEZ';
          case 1: return 'ONCE';
          case 2: return 'DOCE';
          case 3: return 'TRECE';
          case 4: return 'CATORCE';
          case 5: return 'QUINCE';
          default: return 'DIECI' + this.unidades(unidad);
        }
      case 2: return unidad === 0 ? 'VEINTE' : 'VEINTI' + this.unidades(unidad);
      case 3: return this.decenasY('TREINTA', unidad);
      case 4: return this.decenasY('CUARENTA', unidad);
      case 5: return this.decenasY('CINCUENTA', unidad);
      case 6: return this.decenasY('SESENTA', unidad);
      case 7: return this.decenasY('SETENTA', unidad);
      case 8: return this.decenasY('OCHENTA', unidad);
      case 9: return this.decenasY('NOVENTA', unidad);
      case 0: return this.unidades(unidad);
      default: return '';
    }
  }

  private decenasY(strSin: string, numUnidades: number): string {
    if (numUnidades > 0) return strSin + ' Y ' + this.unidades(numUnidades);
    return strSin;
  }

  private centenas(num: number): string {
    const centenas = Math.floor(num / 100);
    const decenas = num - (centenas * 100);
    switch (centenas) {
      case 1: return decenas > 0 ? 'CIENTO ' + this.decenas(decenas) : 'CIEN';
      case 2: return 'DOSCIENTOS ' + this.decenas(decenas);
      case 3: return 'TRESCIENTOS ' + this.decenas(decenas);
      case 4: return 'CUATROCIENTOS ' + this.decenas(decenas);
      case 5: return 'QUINIENTOS ' + this.decenas(decenas);
      case 6: return 'SEISCIENTOS ' + this.decenas(decenas);
      case 7: return 'SETECIENTOS ' + this.decenas(decenas);
      case 8: return 'OCHOCIENTOS ' + this.decenas(decenas);
      case 9: return 'NOVECIENTOS ' + this.decenas(decenas);
      default: return this.decenas(decenas);
    }
  }

  private miles(num: number): string {
    const divisor = 1000;
    const miles = Math.floor(num / divisor);
    const resto = num - (miles * divisor);
    const strMiles = this.centenas(miles);
    const strResto = this.centenas(resto);
    if (miles === 0) return strResto;
    if (miles === 1) return 'MIL ' + strResto;
    return strMiles + ' MIL ' + strResto;
  }

  private millones(num: number): string {
    const divisor = 1000000;
    const millones = Math.floor(num / divisor);
    const resto = num - (millones * divisor);
    if (millones === 0) return this.miles(resto);
    const strMillones = millones === 1 ? 'UN MILLON ' : this.miles(millones) + ' MILLONES ';
    return strMillones + this.miles(resto);
  }
}
