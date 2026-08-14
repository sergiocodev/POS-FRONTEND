import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../core/models/purchase.model';
import { PurchaseVoucherPreviewComponent } from './components/purchase-voucher-preview/purchase-voucher-preview.component';
import { PurchaseSidebarComponent } from './components/purchase-sidebar/purchase-sidebar.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule, PurchaseVoucherPreviewComponent, PurchaseSidebarComponent, DocumentToolbarComponent],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.scss',
})
export class PurchaseDetailComponent {
  @Input() purchase?: PurchaseResponse;
  @Output() close = new EventEmitter<void>();
  @Output() actionSuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<number>();
  @Output() receive = new EventEmitter<number>();

  selectedTab = signal<string>('document');
  selectedFormat = signal<string>('A4');

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
    const docType = this.purchase?.documentType ? this.purchase.documentType.toUpperCase() : 'COMPRA';
    const series = this.purchase?.series || '000';
    const number = this.purchase?.number || '000000';
    
    let docSupplier = '';
    if (this.purchase?.supplierName) {
      docSupplier = `_${this.purchase.supplierName.substring(0, 15)}`;
    }
    
    const baseName = `RECEPCION_${docType}_${series}-${number}${docSupplier}`.replace(/\s+/g, '_');
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

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'Recepción de Compra',
              text: `Adjunto el detalle de recepción de compra: ${this.purchase?.series}-${this.purchase?.number}`,
              files: [file]
            }).catch(err => console.log('Error o cancelación al compartir:', err));
          } else {
            let text = `Detalle de Recepción de Compra: ${this.purchase?.series}-${this.purchase?.number}\nProveedor: ${this.purchase?.supplierName}\nTotal: S/ ${this.purchase?.total}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
          }
        } else {
          let text = `Detalle de Recepción de Compra: ${this.purchase?.series}-${this.purchase?.number}\nProveedor: ${this.purchase?.supplierName}\nTotal: S/ ${this.purchase?.total}`;
          
          try {
            const ClipboardItemConstructor = (window as any).ClipboardItem;
            if (navigator.clipboard && navigator.clipboard.write && ClipboardItemConstructor) {
              const item = new ClipboardItemConstructor({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              text += `\n\n*(💡 Presiona Ctrl + V en este chat para enviar la imagen)*`;
            } else {
              throw new Error('Clipboard API no soportada en este navegador');
            }
          } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            text += `\n\n*(Se descargó la foto en tu PC)*`;
          }
          
          const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          window.open(whatsappWebUrl, '_blank');
        }
      }, 'image/png');
    }).catch(err => {
      console.error('Error generando imagen para compartir:', err);
    });
  }

  onReceive() {
    if (this.purchase) {
      this.receive.emit(this.purchase.id);
    }
  }

  onInvalidate() {
    if (this.purchase) {
      this.cancel.emit(this.purchase.id);
    }
  }
}
