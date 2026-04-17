export function printViaIframe(htmlContent: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      resolve();
      return;
    }

    let cleaned = false;

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch (_) {
        // noop
      }
      resolve();
    }

    const fallbackTimer = setTimeout(cleanup, 60000);

    try {
      iframe.contentWindow?.addEventListener('afterprint', () => {
        clearTimeout(fallbackTimer);
        cleanup();
      });
    } catch (_) {
      // some browsers restrict cross-origin iframe events
    }

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 8px;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
              color: #000;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  });
}
