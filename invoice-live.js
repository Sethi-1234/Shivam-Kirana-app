/* Shivam Kirana Store - Invoice */
function buildInvoiceData(order, items) {
  items = Array.isArray(items) ? items : [];
  return { invoiceNo:"INV-"+String(order.id||"").slice(0,8).toUpperCase(), tracking:order.tracking_code||"Not generated", date:order.created_at?new Date(order.created_at).toLocaleString():new Date().toLocaleString(), customer:order.customer_name||"Customer", phone:order.customer_phone||"", type:order.order_type==="pickup"?"Store Pickup":"Home Delivery", address:order.address||"", pin:order.pin_code||"", payment:order.payment_method||"", items:items, total:Number(order.total_amount||0) };
}
function invoiceHtml(d) {
  const rows=d.items.map(function(i){const q=Number(i.quantity||0),u=Number(i.unit_price??i.price??0),t=Number(i.line_total??u*q);return "<tr><td>"+escapeHtml(i.product_name||"Product")+"</td><td>"+q+"</td><td>"+money(u)+"</td><td>"+money(t)+"</td></tr>";}).join("");
  return "<!doctype html><html><head><meta charset=\"utf-8\"><title>"+escapeHtml(d.invoiceNo)+" - Shivam Kirana Store</title><style>body{font-family:Arial;margin:0;padding:24px;color:#111827;background:#f3f4f6}.invoice{max-width:760px;margin:auto;background:#fff;padding:28px;border-radius:16px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}.total{text-align:right;font-size:20px;font-weight:900;margin-top:18px}@media print{body{background:#fff;padding:0}.invoice{box-shadow:none}.actions{display:none}}</style></head><body><div class=\"invoice\"><h1>🛒 Shivam Kirana Store</h1><p>Invoice: <b>"+escapeHtml(d.invoiceNo)+"</b><br>Tracking ID: <b>"+escapeHtml(d.tracking)+"</b><br>Date: "+escapeHtml(d.date)+"</p><hr><p><b>Customer:</b> "+escapeHtml(d.customer)+"<br><b>Phone:</b> "+escapeHtml(d.phone)+"<br><b>Order:</b> "+escapeHtml(d.type)+(d.address?"<br><b>Address:</b> "+escapeHtml(d.address):"")+(d.pin?"<br><b>PIN:</b> "+escapeHtml(d.pin):"")+"<br><b>Payment:</b> "+escapeHtml(d.payment)+"</p><table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>"+rows+"</tbody></table><div class=\"total\">Total: "+money(d.total)+"</div><p>Thank you for shopping with Shivam Kirana Store!</p><div class=\"actions\"><button onclick=\"window.print()\" style=\"padding:12px 18px;border:0;border-radius:10px;background:#111827;color:white;font-weight:800\">🖨️ Print / Save as PDF</button></div></div></body></html>";
}
async function getInvoiceOrder(orderId) {
  if(!shopkeeperUser||!supabaseClient){alert("Please login as shopkeeper first.");return null;}
  const a=await supabaseClient.from("orders").select("*").eq("id",orderId).single();
  if(a.error||!a.data){alert("Could not load the order.");return null;}
  const b=await supabaseClient.from("order_items").select("*").eq("order_id",orderId);
  if(b.error){alert("Could not load invoice items.");return null;}
  return {order:a.data,items:b.data||[]};
}
async function generateInvoice(orderId) {
  const r=await getInvoiceOrder(orderId);if(!r)return;
  const w=window.open("","_blank");if(!w){alert("Please allow pop-ups for the invoice.");return;}
  w.document.write(invoiceHtml(buildInvoiceData(r.order,r.items)));w.document.close();
}
async function sendInvoiceWhatsApp(orderId) {
  const r=await getInvoiceOrder(orderId);if(!r)return;
  if(String(r.order.status||"")!=="out_for_delivery"){alert("Invoice WhatsApp is available when the order is Out for Delivery.");return;}
  const phone=String(r.order.customer_phone||"").replace(/[^0-9]/g,"");if(!phone){alert("Customer phone number is missing.");return;}
  const d=buildInvoiceData(r.order,r.items);
  const lines=d.items.map(function(i){const q=Number(i.quantity||0),u=Number(i.unit_price??i.price??0),t=Number(i.line_total??u*q);return "• "+(i.product_name||"Product")+" × "+q+" = "+money(t);}).join("\n");
  const msg="🧾 INVOICE - Shivam Kirana Store\n\nInvoice: "+d.invoiceNo+"\nTracking ID: "+d.tracking+"\nDate: "+d.date+"\n\nCustomer: "+d.customer+"\n\nProducts:\n"+lines+"\n\nTotal: "+money(d.total)+"\nPayment: "+d.payment+"\n\n🚚 Your order is out for delivery and will arrive soon.\n\nThank you for shopping with Shivam Kirana Store!";
  window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
}