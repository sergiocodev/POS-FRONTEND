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
      return html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
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
    const element = document.getElementById('voucher-preview-content');
    if (!element) {
      console.error('No se encontró el elemento para imprimir');
      window.print();
      return;
    }

    // Clonar el contenido para manipularlo sin alterar la pantalla
    const clone = element.cloneNode(true) as HTMLElement;

    // Si existen elementos canvas (como QR o gráficos), copiar su mapa de bits a una imagen para no perderlo
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
              // 1. Fondo blanco puro obligatorio para que la transparencia no se imprima negra ni tramada
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(orig, 0, 0);

              // 2. Para formato térmico (80MM y TICKET 58mm): Binarización a Blanco y Negro puro (1-bit)
              // Las impresoras térmicas no tienen color ni tonos continuos de gris.
              // Cualquier color (rojo, azul) o gris intermedio hace que el driver aplique tramado de puntos (dithering).
              // Al convertir los píxeles a negro puro (#000000) o blanco puro (#FFFFFF), el logo se imprime 100% nítido y sólido.
              if (format !== 'A4') {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const a = data[i + 3];

                  // Cálculo estándar de luminancia percibida
                  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                  // Todo píxel con color o trazo visible (alfa > 30 y luminancia < 205) se convierte a negro sólido puro
                  if (a > 30 && luminance < 205) {
                    data[i] = 0;       // R
                    data[i + 1] = 0;   // G
                    data[i + 2] = 0;   // B
                    data[i + 3] = 255; // Alpha
                  } else {
                    data[i] = 255;     // R
                    data[i + 1] = 255; // G
                    data[i + 2] = 255; // B
                    data[i + 3] = 255; // Alpha
                  }
                }
                ctx.putImageData(imgData, 0, 0);
              }

              dest.src = canvas.toDataURL('image/png');
            }
          } catch (e) {
            console.warn('Fallback imagen normal:', e);
            dest.src = orig.currentSrc || orig.src;
          }
        } else {
          dest.src = orig.currentSrc || orig.src;
        }
      }
    });

    // En formatos térmicos (80MM y TICKET 58mm), forzar estilo en línea a negro puro (#000000)
    // para sobreescribir cualquier especificidad Scoped de Angular o clases previas
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
        seriesEl.style.setProperty('letter-spacing', '0.8px', 'important');
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

      // Aplicar exactamente las 4 líneas divisorias punteadas solicitadas:
      // 1. Debajo del encabezado de la tabla (Cant. Descripción P.U. Total)
      clone.querySelectorAll<HTMLElement>('table th').forEach(th => {
        th.style.setProperty('border', 'none', 'important');
        th.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        th.style.setProperty('padding-bottom', '3px', 'important');
      });

      // 2. Debajo de la tabla de productos (separando productos de los totales)
      const tableEl = clone.querySelector<HTMLElement>('table');
      if (tableEl) {
        tableEl.style.setProperty('border', 'none', 'important');
        tableEl.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        tableEl.style.setProperty('margin-bottom', '4px', 'important');
      }

      // 3. Debajo de Observación (separando observación del código QR)
      const amountWordsBox = clone.querySelector<HTMLElement>('.amount-words-box');
      if (amountWordsBox) {
        amountWordsBox.style.setProperty('border', 'none', 'important');
        amountWordsBox.style.setProperty('border-bottom', '1px dashed #000000', 'important');
        amountWordsBox.style.setProperty('padding-bottom', '4px', 'important');
        amountWordsBox.style.setProperty('margin-bottom', '4px', 'important');
      }

      // 4. Encima de Sistema Integral de Operaciones Comerciales
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

    let pageSize = 'auto';
    let contentWidth = '80mm';

    if (format === 'TICKET') {
      pageSize = 'auto';
      contentWidth = '58mm';
    } else if (format === 'A4') {
      pageSize = 'A4 portrait';
      contentWidth = '210mm';
    }

    // Capturar todos los estilos cargados en la aplicación (Bootstrap, temas, fuentes)
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    // Estilos de impresión de alta definición optimizados para papel continuo e impresoras térmicas
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
          width: 100% !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
        }
        #voucher-preview-content {
          border: none !important;
          box-shadow: none !important;
          margin: 0 auto !important;
          padding: ${format === 'A4' ? '12mm' : '2mm 3mm'} !important;
          width: 100% !important;
          max-width: ${contentWidth} !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          position: static !important;
        }

        app-voucher-80mm, app-voucher-ticket, app-voucher-a4 {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          box-sizing: border-box !important;
        }

        /* Optimizaciones térmicas para formato TICKET (58mm) y 80MM */
        ${format !== 'A4' ? `
          .voucher-80mm-content, .w-100 {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .voucher-body .px-3 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          /* Reemplazar degradado oscuro por fondo blanco y texto negro para no sobrecalentar el cabezal ni empastar el texto */
          .voucher-header-gradient {
            background: transparent !important;
            color: #000000 !important;
            padding: 2px 0 4px 0 !important;
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
            margin: 0 auto 5px auto !important;
            border: none !important;
            width: auto !important;
            max-width: 160px !important;
            height: auto !important;
            max-height: 80px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .voucher-header-gradient .company-logo,
          .company-logo {
            max-width: 160px !important;
            max-height: 80px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
            filter: grayscale(100%) contrast(300%) !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
            image-rendering: pixelated !important;
          }
          .voucher-header-gradient .company-name {
            font-size: 13px !important;
            margin-bottom: 1px !important;
            line-height: 1.15 !important;
          }
          .voucher-header-gradient .company-secondary,
          .voucher-header-gradient .contact-line {
            font-size: 9.5px !important;
            line-height: 1.15 !important;
          }
          .voucher-header-gradient .ruc-text {
            background: transparent !important;
            border: none !important;
            color: #000000 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 1px auto 3px !important;
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }
          .voucher-header-gradient .info-icon {
            display: none !important;
          }
          .voucher-body {
            padding: 4px 0 !important;
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }
          .doc-title-header {
            font-size: 11px !important;
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
          .customer-info {
            padding: 2px 0 !important;
            margin-bottom: 3px !important;
            border: none !important;
            border-top: none !important;
            border-bottom: none !important;
          }
          .customer-info p {
            margin-bottom: 1px !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          /* Todo texto forzado a negro puro (#000000) para evitar que la impresora térmica use tramado de puntos (dithering) */
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
            font-size: 10px !important;
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
            padding: 3px 0 !important;
            margin-top: 3px !important;
            box-shadow: none !important;
          }
          .totals-box .totals-row {
            font-size: 10px !important;
            margin-bottom: 1px !important;
          }
          .totals-box .total-row-main {
            border: none !important;
            color: #000000 !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            margin-top: 2px !important;
            padding-top: 2px !important;
          }

          /* 3. Debajo de Observación (separando observación del código QR) */
          .amount-words-box {
            border: none !important;
            border-bottom: 1px dashed #000000 !important;
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
          }

          /* 4. Encima de Sistema Integral de Operaciones Comerciales */
          .footer-box .border-top,
          .footer-box > div:last-child {
            border: none !important;
            border-top: 1px dashed #000000 !important;
            padding-top: 4px !important;
            margin-top: 4px !important;
          }
          .qr-placeholder {
            border: none !important;
            width: 95px !important;
            height: 95px !important;
            margin: 4px auto !important;
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
          <base href="${document.baseURI}">
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

    // Esperar a que el iframe y todas sus imágenes estén 100% listas antes de invocar la impresión
    const printWindow = iframe.contentWindow;
    if (!printWindow) return;

    const executePrint = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.error('Error al imprimir:', err);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 150);
    };

    const iframeImages = Array.from(doc.querySelectorAll('img'));
    if (iframeImages.length === 0) {
      executePrint();
    } else {
      let loaded = 0;
      const total = iframeImages.length;
      const onDone = () => {
        loaded++;
        if (loaded >= total) {
          executePrint();
        }
      };

      iframeImages.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          onDone();
        } else {
          img.onload = onDone;
          img.onerror = onDone;
        }
      });

      // Timeout de seguridad en caso de que alguna imagen demore
      setTimeout(() => {
        if (loaded < total) {
          executePrint();
        }
      }, 1500);
    }
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
