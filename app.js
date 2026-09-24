const products=[
{id:1,name:"Rice 5 kg",price:320,cat:"Staples",emoji:"🍚"},
{id:2,name:"Wheat Flour 5 kg",price:260,cat:"Staples",emoji:"🌾"},
{id:3,name:"Sugar 1 kg",price:48,cat:"Staples",emoji:"🧂"},
{id:4,name:"Toor Dal 1 kg",price:140,cat:"Staples",emoji:"🫘"},
{id:5,name:"Milk 1 L",price:60,cat:"Dairy",emoji:"🥛"},
{id:6,name:"Bread",price:40,cat:"Dairy",emoji:"🍞"},
{id:7,name:"Biscuits",price:30,cat:"Snacks",emoji:"🍪"},
{id:8,name:"Tea 250 g",price:120,cat:"Beverages",emoji:"🍵"},
{id:9,name:"Cooking Oil 1 L",price:150,cat:"Staples",emoji:"🫗"},
{id:10,name:"Bath Soap",price:45,cat:"Household",emoji:"🧼"},
{id:11,name:"Shampoo",price:90,cat:"Personal Care",emoji:"🧴"},
{id:12,name:"Cold Drink",price:50,cat:"Beverages",emoji:"🥤"}
];
let cart=JSON.parse(localStorage.getItem("shivamCart")||"{}"), category="All";
const $=id=>document.getElementById(id);
function save(){localStorage.setItem("shivamCart",JSON.stringify(cart));renderCart();$("cartCount").textContent=Object.values(cart).reduce((a,b)=>a+b,0)}
function renderCategories(){let cats=["All",...new Set(products.map(p=>p.cat))];$("categories").innerHTML=cats.map(c=>`<button class="chip ${c===category?"active":""}" onclick="setCat('${c}')">${c}</button>`).join("")}
function setCat(c){category=c;renderCategories();renderProducts()}
function renderProducts(){let q=$("search").value.toLowerCase();let list=products.filter(p=>(category==="All"||p.cat===category)&&p.name.toLowerCase().includes(q));$("products").innerHTML=list.map(p=>`<article class="card"><div class="emoji">${p.emoji}</div><h3>${p.name}</h3><div class="price">₹${p.price}</div><button class="add" onclick="add(${p.id})">Add to Cart</button></article>`).join("")||"<p>No products found.</p>"}
function add(id){cart[id]=(cart[id]||0)+1;save()}
function change(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];save()}
function renderCart(){let ids=Object.keys(cart);$("cartItems").innerHTML=ids.length?ids.map(id=>{let p=products.find(x=>x.id==id);return `<div class="item"><div><b>${p.emoji} ${p.name}</b><br>₹${p.price*cart[id]}</div><div class="qty"><button onclick="change(${id},-1)">−</button> ${cart[id]} <button onclick="change(${id},1)">+</button></div></div>`}).join(""):"<p>Your cart is empty.</p>";$("total").textContent="₹"+ids.reduce((s,id)=>s+products.find(p=>p.id==id).price*cart[id],0)}
function openCart(){$("cartPanel").classList.remove("hidden");renderCart()}
function closeCart(){$("cartPanel").classList.add("hidden")}
$("search").oninput=renderProducts;
$("cartBtn").onclick=openCart;
$("closeCart").onclick=closeCart;
$("orderBtn").onclick=()=>{if(!Object.keys(cart).length)return alert("Please add products first.");$("checkout").classList.remove("hidden")};
$("closeCheckout").onclick=()=>$("checkout").classList.add("hidden");
$("sendOrder").onclick=()=>{let name=$("name").value.trim(),phone=$("phone").value.trim(),address=$("address").value.trim();if(!name||!phone||!address)return alert("Please fill all details.");let lines=Object.keys(cart).map(id=>{let p=products.find(x=>x.id==id);return `${p.name} x ${cart[id]} = ₹${p.price*cart[id]}`});let total=Object.keys(cart).reduce((s,id)=>s+products.find(p=>p.id==id).price*cart[id],0);let msg=`Hello Shivam Kirana Store,%0A%0AOrder from: ${name}%0APhone: ${phone}%0AAddress: ${address}%0A%0A${lines.join("%0A")}%0A%0ATotal: ₹${total}`;window.open("https://wa.me/?text="+msg,"_blank")};
renderCategories();
renderProducts();
save();
