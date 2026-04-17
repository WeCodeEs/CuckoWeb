export function printViaIframe(ticketHtml: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return false;
  }

  doc.write(`<!DOCTYPE html>
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
  <body>${ticketHtml}</body>
</html>`);
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallbackTimer);
    try {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    } catch (_) {}
  };

  const fallbackTimer = setTimeout(cleanup, 60000);

  try {
    iframe.contentWindow?.addEventListener('afterprint', cleanup);
  } catch (_) {}

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  return true;
}
