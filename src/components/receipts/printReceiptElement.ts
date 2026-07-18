export async function printReceiptElement(
  receiptElement: HTMLDivElement,
  documentTitle = ''
) {
  const contentHeightPx = Math.ceil(Math.max(
    receiptElement.scrollHeight,
    receiptElement.getBoundingClientRect().height
  ));
  const contentHeightMm = Math.max(
    1,
    Math.ceil((contentHeightPx * 25.4 / 96) * 10) / 10
  );

  const printWindow = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');

  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${documentTitle}</title>
        <style>
          :root {
            --receipt-width: 80mm;
            --receipt-height: ${contentHeightMm}mm;
          }

          @page {
            size: 80mm ${contentHeightMm}mm;
            margin: 0 !important;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            width: var(--receipt-width) !important;
            min-width: var(--receipt-width) !important;
            height: var(--receipt-height) !important;
            min-height: var(--receipt-height) !important;
            max-height: var(--receipt-height) !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff;
          }

          #print-root {
            position: absolute;
            inset: 0 auto auto 0;
            width: var(--receipt-width);
            height: auto;
            min-height: 0;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          .awsom-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            color: #000;
          }

          .awsom-icon > svg {
            display: block;
            width: 1em;
            height: 1em;
            overflow: visible;
            fill: currentColor;
          }

          @media print {
            @page {
              size: 80mm ${contentHeightMm}mm;
              margin: 0 !important;
            }

            html, body {
              width: var(--receipt-width) !important;
              height: var(--receipt-height) !important;
              min-height: var(--receipt-height) !important;
              max-height: var(--receipt-height) !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }

            #print-root {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: var(--receipt-width) !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }

            #print-root > * {
              margin-top: 0 !important;
              margin-bottom: 0 !important;
            }

            #print-root > div > div {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body><div id="print-root">${receiptElement.innerHTML}</div></body>
    </html>
  `);

  printWindow.document.close();
  printWindow.document.title = documentTitle;

  await new Promise<void>((resolve) => {
    printWindow.addEventListener('load', () => resolve(), { once: true });
  });

  const images = Array.from(printWindow.document.images);
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
  }));

  await printWindow.document.fonts?.ready;
  await new Promise<void>((resolve) => {
    printWindow.requestAnimationFrame(() => resolve());
  });

  printWindow.addEventListener('afterprint', () => {
    printWindow.close();
  }, { once: true });

  printWindow.focus();
  printWindow.print();
}