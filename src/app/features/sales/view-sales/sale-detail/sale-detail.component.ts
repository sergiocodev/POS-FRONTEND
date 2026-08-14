import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../core/models/sale.model';
import { SaleVoucherPreview } from './components/sale-voucher-preview/sale-voucher-preview';
import { SaleSidebar } from './components/sale-sidebar/sale-sidebar';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, SaleVoucherPreview, SaleSidebar, DocumentToolbarComponent],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss',
})
export class SaleDetailComponent {
  @Input() sale?: SaleResponse;
  @Output() close = new EventEmitter<void>();
  @Output() actionSuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<number>();

  selectedTab = signal<string>('document');
  selectedFormat = signal<string>('80MM');

  onClose() {
    this.close.emit();
  }

  selectTab(tab: string) {
    this.selectedTab.set(tab);
  }

  onFormatChange(event: any) {
    this.selectedFormat.set(event.target.value);
  }

  private generateCanvas(): Promise<any> {
    const element = document.getElementById('voucher-preview-content');
    if (!element) {
      return Promise.reject('No se encontró el elemento para capturar');
    }

    return import('html2canvas').then(({ default: html2canvas }) => {
      return html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    });
  }

  private getProfessionalFileName(extension: string): string {
    const docType = this.sale?.documentType ? this.sale.documentType.toUpperCase() : 'COMPROBANTE';
    const series = this.sale?.series || '000';
    const number = this.sale?.number || '000000';
    
    // Incluir RUC/DNI si existe para mayor formalidad contable
    let docCliente = '';
    if (this.sale?.customerDocumentNumber && this.sale.customerDocumentNumber !== '00000000') {
      docCliente = `_${this.sale.customerDocumentNumber}`;
    }
    
    // Reemplazar espacios por guiones bajos y armar el nombre final
    const baseName = `${docType}_${series}-${number}${docCliente}`.replace(/\s+/g, '_');
    return `${baseName}.${extension}`;
  }

  onPrint() {
    this.generateCanvas().then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const format = this.selectedFormat();
      let printStyle = '';

      if (format === 'A4') {
        printStyle = `
          @page { size: A4 portrait; margin: 0; }
          img { width: 100%; height: auto; display: block; }
        `;
      } else if (format === '80MM') {
        printStyle = `
          @page { size: 80mm auto; margin: 0; }
          img { width: 80mm; height: auto; display: block; margin: 0; }
        `;
      } else if (format === 'TICKET') {
        printStyle = `
          @page { size: 58mm auto; margin: 0; }
          img { width: 58mm; height: auto; display: block; margin: 0; }
        `;
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; text-align: left; }
                ${printStyle}
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print(); window.onafterprint = function(){ window.parent.document.body.removeChild(window.frameElement); }" />
            </body>
          </html>
        `);
        doc.close();
      }
    }).catch(err => {
      console.error('Error al intentar imprimir:', err);
      window.print(); // Fallback
    });
  }

  onDownload() {
    this.generateCanvas().then(canvas => {
      import('jspdf').then(({ default: jsPDF }) => {
        const imgData = canvas.toDataURL('image/png');
        
        let pdf: any;
        const format = this.selectedFormat();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        if (format === 'A4') {
          pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } else {
          // Para TICKET (58mm) o 80MM, creamos un PDF con el ancho respectivo y alto dinámico
          const pdfWidth = format === 'TICKET' ? 58 : 80;
          const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
          pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        const fileName = this.getProfessionalFileName('pdf');
        pdf.save(fileName);
      });
    }).catch(err => {
      console.error('Error generando PDF:', err);
    });
  }

  onShare() {
    this.generateCanvas().then(canvas => {
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        
        const fileName = this.getProfessionalFileName('png');
        const file = new File([blob], fileName, { type: 'image/png' });

        // Detectar si estamos en un dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
          // LÓGICA MÓVIL
          // Intentar usar la API nativa de compartir (requiere HTTPS o localhost)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'Comprobante de Venta',
              text: `Adjunto tu comprobante de venta: ${this.sale?.series}-${this.sale?.number}`,
              files: [file]
            }).catch(err => console.log('Error o cancelación al compartir:', err));
          } else {
            // Si el móvil no soporta compartir archivos (ej: por estar en red local HTTP sin SSL)
            // Abrimos WhatsApp con texto, SIN DESCARGAR el archivo.
            let text = `¡Hola! Aquí tienes el detalle de tu compra: ${this.sale?.series}-${this.sale?.number}`;
            if (this.sale?.pdfUrl) {
              text += `\n\nDescarga tu comprobante aquí:\n${this.sale.pdfUrl}`;
            } else {
              text += `\n\nTotal pagado: S/ ${this.sale?.total}\nGracias por tu preferencia.`;
            }
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
          }
        } else {
          // LÓGICA ESCRITORIO (WhatsApp Web + Truco del Portapapeles)
          let text = `¡Hola! Aquí tienes el comprobante de tu compra: ${this.sale?.series}-${this.sale?.number}`;
          if (this.sale?.pdfUrl) {
            text += `\n\nPuedes descargarlo en este enlace:\n${this.sale.pdfUrl}`;
          } else {
            text += `\n\nTotal pagado: S/ ${this.sale?.total}\nGracias por tu preferencia.`;
          }
          
          try {
            const ClipboardItemConstructor = (window as any).ClipboardItem;
            if (navigator.clipboard && navigator.clipboard.write && ClipboardItemConstructor) {
              const item = new ClipboardItemConstructor({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              text += `\n\n*(💡 Presiona Ctrl + V en este chat para enviar la imagen del comprobante)*`;
            } else {
              throw new Error('Clipboard API no soportada en este navegador');
            }
          } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            // Solo en escritorio descargamos la foto si falla el portapapeles
            const link = document.createElement('a');
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            text += `\n\n*(Se descargó la foto en tu PC para que la adjuntes a este chat)*`;
          }
          
          const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          window.open(whatsappWebUrl, '_blank');
        }
      }, 'image/png');
    }).catch(err => {
      console.error('Error generando imagen para compartir:', err);
      const text = `Comprobante de Venta ${this.sale?.series}-${this.sale?.number} \nLink: ${this.sale?.pdfUrl || ''}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    });
  }

  onClone() {
    console.log('Cloning sale:', this.sale?.id);
  }

  onInvalidate() {
    if (this.sale) {
      this.cancel.emit(this.sale.id);
    }
  }
}
