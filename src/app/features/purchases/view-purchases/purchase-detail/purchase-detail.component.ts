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

    const format = this.selectedFormat();

    // Copiar imágenes ya cargadas en pantalla directamente como DataURL optimizada para impresión
    const originalImages = element.querySelectorAll('img');
    const clonedImages = clone.querySelectorAll('img');
    originalImages.forEach((orig, index) => {
      const dest = clonedImages[index];
      if (dest) {
        if (orig.complete && orig.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = orig.naturalWidth;
            canvas.height = orig.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(orig, 0, 0);

              if (format !== 'A4') {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const a = data[i + 3];

                  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                  if (a > 30 && luminance < 205) {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 255;
                  } else {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                    data[i + 3] = 255;
                  }
                }
                ctx.putImageData(imgData, 0, 0);
              }

              dest.src = canvas.toDataURL('image/png');
            }
          } catch (e) {
            console.warn('Fallback imagen:', e);
            dest.src = orig.currentSrc || orig.src;
          }
        } else {
          dest.src = orig.currentSrc || orig.src;
        }
      }
    });

    if (format !== 'A4') {
      const coloredElements = clone.querySelectorAll<HTMLElement>(
        '.text-primary-custom, .doc-series-number, .text-danger, .text-muted, [class*="text-primary"], .totals-row, .total-row-main'
      );
      coloredElements.forEach(el => {
        el.classList.remove('text-primary-custom', 'text-muted');
        el.style.setProperty('color', '#000000', 'important');
        el.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
      });

      const seriesEl = clone.querySelector<HTMLElement>('.doc-series-number');
      if (seriesEl) {
        seriesEl.style.setProperty('color', '#000000', 'important');
        seriesEl.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
        seriesEl.style.setProperty('font-weight', '800', 'important');
        seriesEl.style.setProperty('font-size', '15px', 'important');
      }

      // Reset general de bordes y líneas no deseadas en el DOM clonado
      const borderedElements = clone.querySelectorAll<HTMLElement>(
        '.border, .border-top, .border-bottom, .border-start, .border-end, .customer-info, .totals-box, .total-row-main, .voucher-header-gradient, .table, tbody, tr, td, .dashed-line, hr'
      );
      borderedElements.forEach(el => {
        el.classList.remove('border', 'border-top', 'border-bottom', 'border-start', 'border-end');
        el.style.setProperty('border', 'none', 'important');
        el.style.setProperty('border-top', 'none', 'important');
        el.style.setProperty('border-bottom', 'none', 'important');
        el.style.setProperty('border-left', 'none', 'important');
        el.style.setProperty('border-right', 'none', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
      });

      clone.querySelectorAll<HTMLElement>('.dashed-line, hr').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });

      // 4 líneas divisorias punteadas
      clone.querySelectorAll<HTMLElement>('table th').forEach(th => {
        th.style.setProperty('border', 'none', 'important');
        th.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        th.style.setProperty('padding-bottom', '3px', 'important');
      });

      const tableEl = clone.querySelector<HTMLElement>('table');
      if (tableEl) {
        tableEl.style.setProperty('border', 'none', 'important');
        tableEl.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        tableEl.style.setProperty('margin-bottom', '4px', 'important');
      }

      const amountWordsBox = clone.querySelector<HTMLElement>('.amount-words-box');
      if (amountWordsBox) {
        amountWordsBox.style.setProperty('border', 'none', 'important');
        amountWordsBox.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        amountWordsBox.style.setProperty('padding-bottom', '4px', 'important');
        amountWordsBox.style.setProperty('margin-bottom', '4px', 'important');
      }

      const footerDivider = clone.querySelector<HTMLElement>('.footer-box .border-top, .footer-box > div:last-child');
      if (footerDivider) {
        footerDivider.style.setProperty('border', 'none', 'important');
        footerDivider.style.setProperty('border-top', '1px dashed #000000', 'important');
        footerDivider.style.setProperty('padding-top', '4px', 'important');
        footerDivider.style.setProperty('margin-top', '4px', 'important');
      }
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

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
            border: none !important;
            border-bottom: none !important;
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
            border: none !important;
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
          .doc-series-number,
          #voucher-preview-content .doc-series-number,
          #voucher-preview-content .text-primary-custom,
          .text-primary-custom {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            font-size: 15.5px !important;
            font-weight: 800 !important;
            letter-spacing: 0.8px !important;
            margin: 1px 0 !important;
            text-shadow: none !important;
          }
          #voucher-preview-content,
          #voucher-preview-content *,
          h1, h2, h3, h4, h5, h6, p, span, td, th, div, strong, b, small {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            text-shadow: none !important;
          }
          .text-primary-custom, .text-danger, .text-muted, [style*="color: #666"], [style*="color: #333"] {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          .company-logo,
          .logo-placeholder img,
          #voucher-preview-content img {
            filter: grayscale(100%) contrast(300%) !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
            image-rendering: pixelated !important;
          }

          /* Reset general de bordes no deseados para asegurar fondo limpio */
          .border, .border-start, .border-end,
          .customer-info, .totals-box, .total-row-main, .voucher-header-gradient,
          tbody, tr, td, .qr-placeholder {
            border: none !important;
            border-top: none !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            box-shadow: none !important;
          }
          .table > :not(caption) > * > * {
            border-bottom-width: 0 !important;
            border-top-width: 0 !important;
            box-shadow: none !important;
          }
          .dashed-line, hr {
            display: none !important;
            border: none !important;
          }

          /* === 4 LÍNEAS DIVISORIAS PUNTEADAS === */
          /* 1. Debajo del encabezado de la tabla (Cant. Descripción P.U. Total) */
          table th {
            border: none !important;
            border-bottom: 1px dashed #000000 !important;
            padding: 3px 2px !important;
          }

          /* 2. Debajo de la tabla de productos (separando productos de los totales) */
          table {
            color: #000000 !important;
            width: 100% !important;
            border: none !important;
            border-bottom: 1px dashed #000000 !important;
            margin-bottom: 4px !important;
            border-collapse: collapse !important;
          }
          th, td {
            color: #000000 !important;
            padding: 2px 2px !important;
          }
          td {
            border: none !important;
          }

          .totals-box {
            background-color: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 8px 0 !important;
            box-shadow: none !important;
          }
          .totals-box .total-row-main {
            border: none !important;
            color: #000000 !important;
            font-size: 16px !important;
            font-weight: 800 !important;
          }

          /* 3. Debajo de Observación (separando observación del código QR) */
          .amount-words-box {
            border: none !important;
            border-bottom: 1px dashed #000000 !important;
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
          }

          /* 4. Encima de pie de página */
          .footer-box .border-top,
          .footer-box > div:last-child {
            border: none !important;
            border-top: 1px dashed #000000 !important;
            padding-top: 4px !important;
            margin-top: 4px !important;
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
