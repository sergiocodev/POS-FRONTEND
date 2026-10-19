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
      return html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
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
    const element = document.getElementById('voucher-preview-content');
    if (!element) {
      console.error('No se encontró el elemento para imprimir');
      window.print();
      return;
    }

    const clone = element.cloneNode(true) as HTMLElement;

    const originalCanvases = element.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    originalCanvases.forEach((orig, index) => {
      const dest = clonedCanvases[index];
      if (dest) {
        const img = document.createElement('img');
        img.src = orig.toDataURL('image/png');
        img.style.width = orig.style.width || `${orig.width}px`;
        img.style.height = orig.style.height || `${orig.height}px`;
        dest.parentNode?.replaceChild(img, dest);
      }
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const format = this.selectedFormat();
    let pageSize = '80mm auto';
    let contentWidth = '80mm';

    if (format === 'TICKET') {
      pageSize = '58mm auto';
      contentWidth = '58mm';
    } else if (format === 'A4') {
      pageSize = 'A4 portrait';
      contentWidth = '210mm';
    }

    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const thermalPrintStyles = `
      <style>
        @page {
          size: ${pageSize};
          margin: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        body * {
          visibility: visible !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          width: ${contentWidth} !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
        }
        #voucher-preview-content {
          border: none !important;
          box-shadow: none !important;
          margin: 0 auto !important;
          padding: ${format === 'A4' ? '12mm' : '2mm 4mm'} !important;
          width: ${contentWidth} !important;
          max-width: ${contentWidth} !important;
          background: #ffffff !important;
          position: static !important;
        }

        ${format !== 'A4' ? `
          .voucher-80mm-content, .w-100 {
            width: 100% !important;
            max-width: 100% !important;
          }
          .voucher-header-gradient {
            background: transparent !important;
            color: #000000 !important;
            padding: 4px 0 10px 0 !important;
            border-bottom: 1px dashed #000000 !important;
          }
          .voucher-header-gradient h5,
          .voucher-header-gradient h6,
          .voucher-header-gradient p,
          .voucher-header-gradient span,
          .voucher-header-gradient div {
            color: #000000 !important;
            text-shadow: none !important;
          }
          .voucher-header-gradient .logo-placeholder {
            background-color: transparent !important;
            box-shadow: none !important;
            margin-bottom: 5px !important;
            border: none !important;
          }
          .voucher-header-gradient .ruc-badge {
            background: transparent !important;
            border: 1px solid #000000 !important;
            color: #000000 !important;
            box-shadow: none !important;
            padding: 1px 10px !important;
            margin: 2px auto 6px !important;
          }
          .voucher-header-gradient .info-icon {
            display: none !important;
          }
          .voucher-body {
            padding: 8px 0 !important;
          }
          h1, h2, h3, h4, h5, h6, p, span, td, th, div, strong, b, small {
            color: #000000 !important;
            text-shadow: none !important;
          }
          .text-primary-custom, .text-danger, .text-muted, [style*="color: #666"], [style*="color: #333"] {
            color: #000000 !important;
          }
          .totals-box {
            background-color: transparent !important;
            border-top: 1px dashed #000000 !important;
            border-bottom: 1px dashed #000000 !important;
            border-radius: 0 !important;
            padding: 8px 0 !important;
            box-shadow: none !important;
          }
          .totals-box .total-row-main {
            border-top: 1px solid #000000 !important;
            color: #000000 !important;
            font-size: 16px !important;
            font-weight: 800 !important;
          }
          table {
            color: #000000 !important;
            width: 100% !important;
          }
          th, td {
            color: #000000 !important;
            border-color: #000000 !important;
          }
          .dashed-line {
            border-top: 1px dashed #000000 !important;
            margin: 6px 0 !important;
          }
          .border-top, .border-bottom {
            border-color: #000000 !important;
          }
          .qr-placeholder {
            border: none !important;
          }
          img, svg {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
          }
        ` : ''}
      </style>
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${this.getProfessionalFileName('print')}</title>
          ${headStyles}
          ${thermalPrintStyles}
        </head>
        <body>
          <div id="voucher-preview-content">
            ${clone.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error al imprimir:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 300);
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
