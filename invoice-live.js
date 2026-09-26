/* Shivam Kirana Store - Invoice v2 */
(function(){
  function invEscape(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }
  function invMoney(value){
    return "₹" + Number(value || 0).toFixed(2);
  }
  function buildInvoiceData(order, items){
    return {
      invoiceNo:"INV-"+String(order?.id||"").slice(0,8).toUpperCase(),
      tracking:order?.tracking_code || "Not generated",
      date:order?.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString(),
      customer:order?.customer_name || "Customer",
      phone:order?.customer_phone || "",
      type:order?.order_type==="pickup" ? "Store Pickup" : "Home Delivery",
      address:order?.address || "",
      pin:order?.pin_code || "",
      payment:order?.payment_method || "",
      items:Array.isArray(items)?items:[],
      total:Number(order?.total_amount || 0)
    };
  }
  function invoiceHtml(d){
    const rows = d.items.length ? d.items.map(function(i){
      const q=Number(i.quantity||0);
      const u=Number(i.unit_price ?? i.price ?? 0);
      const t=Number(i.line_total ?? (u*q));
      return "<tr><td>"+invEscape(i.product_name || i.name || i.product?.name || "Product")+
        "</td><td>"+q+"</td><td>"+invMoney(u)+"</td><td>"+invMoney(t)+"</td></tr>";
    }).join("") : "<tr><td colspan='4' style='text-align:center'>No item details available</td></tr>";
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${invEscape(d.invoiceNo)} - Shivam Kirana Store</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:24px;background:#f3f4f6;color:#111827}
      .invoice{max-width:760px;margin:auto;background:#fff;padding:28px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
      h1{margin:0 0 4px;font-size:26px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f8fafc}
      .total{text-align:right;font-size:21px;font-weight:900;margin-top:18px}.actions{margin-top:24px;display:flex;gap:10px}
      button{padding:12px 18px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:800;cursor:pointer}
      @media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}.actions{display:none}}
    </style></head><body><div class="invoice">
      <h1>🛒 Shivam Kirana Store</h1><div class="muted">Customer Invoice</div><hr>
      <p><b>Invoice:</b> ${invEscape(d.invoiceNo)}<br><b>Tracking ID:</b> ${invEscape(d.tracking)}<br><b>Date:</b> ${invEscape(d.date)}</p>
      <p><b>Customer:</b> ${invEscape(d.customer)}<br><b>Phone:</b> ${invEscape(d.phone)}<br><b>Order:</b> ${invEscape(d.type)}
      ${d.address ? "<br><b>Address:</b> "+invEscape(d.address) : ""}${d.pin ? "<br><b>PIN:</b> "+invEscape(d.pin) : ""}
      <br><b>Payment:</b> ${invEscape(d.payment)}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total">Total: ${invMoney(d.total)}</div><p class="muted">Thank you for shopping with Shivam Kirana Store!</p>
      <div class="actions"><button onclick="window.print()">🖨️ Print / Save as PDF</button><button onclick="window.close()">✕ Close</button></div>
    </div></body></html>`;
  }
  async function getInvoiceOrder(orderId){
    if(!shopkeeperUser || !supabaseClient){
      alert("Please login as shopkeeper first."); return null;
    }
    const a=await window.supabaseClient.from("orders").select("*").eq("id",orderId).single();
    if(a.error || !a.data){console.error(a.error);alert("Could not load the order.");return null;}
    const b=await window.supabaseClient.from("order_items").select("*").eq("order_id",orderId);
    if(b.error){console.error(b.error);alert("Could not load invoice items: "+b.error.message);return null;}
    let items=b.data||[];
    const ids=[...new Set(items.map(i=>i.product_id).filter(Boolean))];
    if(ids.length){
      const p=await window.supabaseClient.from("products").select("id,name").in("id",ids);
      if(!p.error){
        const names=new Map((p.data||[]).map(x=>[String(x.id),x.name]));
        items=items.map(i=>({...i,product_name:names.get(String(i.product_id))||i.product_name||"Product"}));
      }
    }
    return {order:a.data,items};
  }
  window.generateInvoice=async function(orderId){
    const r=await getInvoiceOrder(orderId); if(!r)return;
    const html=invoiceHtml(buildInvoiceData(r.order,r.items));
    const w=window.open("about:blank","_blank");
    if(!w){alert("Please allow pop-ups for Shivam Kirana Store to open the invoice.");return;}
    w.document.open(); w.document.write(html); w.document.close(); w.focus();
  };
  window.sendInvoiceWhatsApp=async function(orderId){
    const r=await getInvoiceOrder(orderId); if(!r)return;
    if(String(r.order.status||"")!=="out_for_delivery"){
      alert("Invoice WhatsApp is available when the order is Out for Delivery.");return;
    }
    const phone=String(r.order.customer_phone||"").replace(/[^0-9]/g,"");
    if(!phone){alert("Customer phone number is missing.");return;}
    const d=buildInvoiceData(r.order,r.items);
    const lines=d.items.map(function(i){
      const q=Number(i.quantity||0),u=Number(i.unit_price ?? i.price ?? 0),t=Number(i.line_total ?? u*q);
      return "• "+(i.product_name||"Product")+" × "+q+" = "+invMoney(t);
    }).join("\n");
    const msg="🧾 INVOICE - Shivam Kirana Store\n\nInvoice: "+d.invoiceNo+"\nTracking ID: "+d.tracking+"\nDate: "+d.date+"\n\nCustomer: "+d.customer+"\n\nProducts:\n"+lines+"\n\nTotal: "+invMoney(d.total)+"\nPayment: "+d.payment+"\n\n🚚 Your order is out for delivery and will arrive soon.";
    window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
  };
})();