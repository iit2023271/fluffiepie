// Invoice PDF generation utility using browser print
interface InvoiceItem {
  name: string;
  weight?: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    full_name?: string;
    address_line?: string;
    city?: string;
    pincode?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliverySlot?: string;
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}${item.weight ? ` (${item.weight})` : ""}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${data.orderId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #333; background: #fff; padding: 40px; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #d4a373; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #d4a373; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #333; margin-bottom: 8px; }
    .invoice-number { color: #666; font-size: 14px; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .info-block { width: 48%; }
    .info-block h3 { color: #d4a373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .info-block p { margin-bottom: 4px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8f4f0; padding: 14px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals-row.total { border-bottom: none; border-top: 2px solid #d4a373; font-size: 18px; font-weight: bold; padding-top: 12px; margin-top: 8px; }
    .footer { margin-top: 60px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">${data.storeName}</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="invoice-number">#${data.orderId.slice(0, 8).toUpperCase()}</p>
        <p class="invoice-number">${new Date(data.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-block">
        <h3>Bill To</h3>
        <p><strong>${data.deliveryAddress.full_name || data.customerName}</strong></p>
        <p>${data.deliveryAddress.address_line || ""}</p>
        <p>${data.deliveryAddress.city || ""}${data.deliveryAddress.pincode ? ` - ${data.deliveryAddress.pincode}` : ""}</p>
        <p>${data.customerPhone}</p>
        <p>${data.customerEmail}</p>
      </div>
      <div class="info-block" style="text-align: right;">
        <h3>Delivery Info</h3>
        ${data.deliverySlot ? `<p><strong>Slot:</strong> ${data.deliverySlot}</p>` : ""}
        ${data.storePhone ? `<p><strong>Support:</strong> ${data.storePhone}</p>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>₹${data.subtotal.toLocaleString()}</span>
      </div>
      ${data.discount > 0 ? `
      <div class="totals-row" style="color: #16a34a;">
        <span>Discount</span>
        <span>-₹${data.discount.toLocaleString()}</span>
      </div>
      ` : ""}
      <div class="totals-row">
        <span>Delivery</span>
        <span>${data.deliveryFee > 0 ? `₹${data.deliveryFee.toLocaleString()}` : "FREE"}</span>
      </div>
      <div class="totals-row total">
        <span>Total</span>
        <span>₹${data.total.toLocaleString()}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your order!</p>
      <p style="margin-top: 8px;">${data.storeName}${data.storeEmail ? ` • ${data.storeEmail}` : ""}${data.storePhone ? ` • ${data.storePhone}` : ""}</p>
    </div>
  </div>

  <script>
    // Auto-print on load
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;
}

export function downloadInvoice(data: InvoiceData) {
  const html = generateInvoiceHTML(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
