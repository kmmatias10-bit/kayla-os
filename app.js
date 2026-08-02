
const SEED = window.KAYLA_OS_SEED || {inventory:[],recipes:[],recipeIngredients:[],shopping:[],mealPlan:[]};
const KEY = "kayla-os-v1-pastel";
const clone = x => JSON.parse(JSON.stringify(x));
let db = JSON.parse(localStorage.getItem(KEY) || "null") || clone(SEED);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const save = () => localStorage.setItem(KEY, JSON.stringify(db));
const yes = v => v===true || v==="TRUE" || v==="true";
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function showPage(name){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===name));
  $$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===name));
  const meta={
    dashboard:["Dashboard","Your kitchen, organized beautifully."],
    inventory:["Inventory","Everything in your pantry, refrigerator, and freezer."],
    recipes:["Recipes","Meals built around what you already own."],
    shopping:["Shopping List","Only buy what your kitchen needs."],
    planner:["Meal Planner","Make the week easier."],
    settings:["Settings","Backup and manage Kayla OS."]
  }[name];
  $("#pageTitle").textContent=meta[0];$("#pageSubtitle").textContent=meta[1];
  $("#sidebar").classList.remove("open");renderAll();
}
$$(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$$("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");

function renderDashboard(){
  const active=db.inventory.filter(i=>!i.Active || yes(i.Active));
  const noShop=db.recipes.filter(r=>yes(r.NoShop));
  $("#statItems").textContent=active.length;
  $("#statRecipes").textContent=noShop.length;
  $("#statSoon").textContent=active.filter(i=>i.Status==="Use Soon"||yes(i.UseSoon)).length;
  $("#statShopping").textContent=db.shopping.filter(i=>!yes(i.Purchased)).length;
  const hour=new Date().getHours();$("#daypart").textContent=hour<12?"MORNING":hour<17?"AFTERNOON":"EVENING";
  $("#heroText").textContent=`${active.length} items tracked and ${noShop.length} recipes ready without shopping.`;
  $("#tonight").innerHTML=noShop.sort((a,b)=>(a.TotalMinutes||99)-(b.TotalMinutes||99)).slice(0,5).map(r=>
    `<div class="list-row"><div><strong>${esc(r.RecipeName)}</strong><small>${esc(r.FlavorName)} · ${esc(r.TotalMinutes)} minutes</small></div><span class="pill">No shop</span></div>`
  ).join("") || "<p>No no-shop recipes yet.</p>";
  let rescue=active.filter(i=>i.Status==="Use Soon"||yes(i.UseSoon));
  if(!rescue.length) rescue=active.filter(i=>Number(i.Quantity)<=1).slice(0,5);
  $("#rescue").innerHTML=rescue.slice(0,5).map(i=>
    `<div class="list-row"><div><strong>${esc(i.ItemName)}</strong><small>${esc(i.LocationName)} · ${esc(i.Quantity)} ${esc(i.Unit)}</small></div><span class="pill">${esc(i.Status||"Use first")}</span></div>`
  ).join("") || "<p>Nothing urgent right now.</p>";
}

function populateFilters(){
  const locs=[...new Set(db.inventory.map(i=>i.LocationName).filter(Boolean))];
  $("#inventoryLocation").innerHTML='<option value="">All locations</option>'+locs.map(x=>`<option>${esc(x)}</option>`).join("");
  const meals=[...new Set(db.recipes.map(r=>r.MealType).filter(Boolean))];
  $("#recipeMeal").innerHTML='<option value="">All meal types</option>'+meals.map(x=>`<option>${esc(x)}</option>`).join("");
}
function renderInventory(){
  const q=$("#inventorySearch").value.toLowerCase(),loc=$("#inventoryLocation").value,status=$("#inventoryStatus").value;
  const rows=db.inventory.filter(i=>`${i.ItemName} ${i.CategoryName} ${i.LocationName}`.toLowerCase().includes(q)&&(!loc||i.LocationName===loc)&&(!status||i.Status===status)&&(!i.Active||yes(i.Active)));
  $("#inventoryGrid").innerHTML=rows.map(i=>`<article class="glass item-card">
    <span class="eyebrow">${esc(i.CategoryName)}</span><h3>${esc(i.ItemName)}</h3>
    <div class="meta"><span>${esc(i.LocationName)}</span><span>${esc(i.Quantity)} ${esc(i.Unit)}</span><span>${esc(i.Status)}</span></div>
    <div class="actions"><button class="mini" onclick="useItem('${i.ItemID}')">Use 1</button><button class="mini" onclick="editItem('${i.ItemID}')">Edit</button></div>
  </article>`).join("")||'<div class="glass panel">No items match.</div>';
}
["inventorySearch","inventoryLocation","inventoryStatus"].forEach(id=>$("#"+id).addEventListener("input",renderInventory));

function ingredientsFor(id){return db.recipeIngredients.filter(x=>x.RecipeID===id)}
function emoji(name){name=name.toLowerCase();if(name.includes("burger"))return"🍔";if(name.includes("ramen"))return"🍜";if(name.includes("oat"))return"🥣";if(name.includes("rice"))return"🍚";if(name.includes("pork"))return"🍖";if(name.includes("soup"))return"🥫";return"🍽️"}
function renderRecipes(){
  const q=$("#recipeSearch").value.toLowerCase(),meal=$("#recipeMeal").value,noShop=$("#noShopOnly").checked;
  const rows=db.recipes.filter(r=>`${r.RecipeName} ${r.FlavorName} ${ingredientsFor(r.RecipeID).map(i=>i.ItemName).join(" ")}`.toLowerCase().includes(q)&&(!meal||r.MealType===meal)&&(!noShop||yes(r.NoShop))&&(!r.Active||yes(r.Active)));
  $("#recipeGrid").innerHTML=rows.map(r=>`<article class="glass recipe-card">
    <div class="recipe-top">${emoji(r.RecipeName)}</div><span class="eyebrow">${esc(r.FlavorName)} · ${esc(r.MealType)}</span><h3>${esc(r.RecipeName)}</h3>
    <p>${esc(ingredientsFor(r.RecipeID).slice(0,5).map(i=>i.ItemName).join(", "))}</p>
    <button class="primary" onclick="viewRecipe('${r.RecipeID}')">View recipe</button>
  </article>`).join("")||'<div class="glass panel">No recipes match.</div>';
}
["recipeSearch","recipeMeal","noShopOnly"].forEach(id=>$("#"+id).addEventListener("input",renderRecipes));

function renderShopping(){
  const rows=[...db.shopping].sort((a,b)=>Number(yes(a.Purchased))-Number(yes(b.Purchased)));
  $("#shoppingList").innerHTML=rows.map(s=>`<div class="shopping-row ${yes(s.Purchased)?"done":""}">
    <input type="checkbox" ${yes(s.Purchased)?"checked":""} onchange="togglePurchased('${s.ShoppingID}',this.checked)">
    <div><strong>${esc(s.ItemName)}</strong><small>${esc(s.QuantityNeeded)} ${esc(s.Unit)} · ${esc(s.Reason||"")}</small></div>
    <span class="pill">${esc(s.Priority)}</span><button class="mini delete" onclick="deleteShopping('${s.ShoppingID}')">Delete</button>
  </div>`).join("");
  $("#shoppingProgress").textContent=`${rows.filter(x=>yes(x.Purchased)).length} of ${rows.length} purchased`;
}
function renderPlanner(){
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  $("#plannerGrid").innerHTML=days.map(day=>`<div class="glass day"><span class="eyebrow">${day.toUpperCase()}</span><h3>${day}</h3>${db.mealPlan.filter(m=>m.Day===day).map(m=>`<div class="meal"><small>${esc(m.MealType)}</small><strong>${esc(m.RecipeName)}</strong></div>`).join("")||"<p>Nothing planned.</p>"}</div>`).join("");
}
function renderAll(){renderDashboard();renderInventory();renderRecipes();renderShopping();renderPlanner()}

function modal(title,body,onSave,hideSave=false){
  $("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;$("#modalSave").style.display=hideSave?"none":"";
  $("#modalSave").onclick=e=>{e.preventDefault();onSave(new FormData($("#modalForm")));$("#modal").close()};
  $("#modal").showModal();
}
function itemForm(i={}){
  const cats=[...new Set(db.inventory.map(x=>x.CategoryName).filter(Boolean))];
  const locs=[...new Set(db.inventory.map(x=>x.LocationName).filter(Boolean))];
  return `<div class="form-grid">
    <label class="full">Item name<input class="field" name="name" required value="${esc(i.ItemName||"")}"></label>
    <label>Category<select name="category">${cats.map(x=>`<option ${x===i.CategoryName?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
    <label>Location<select name="location">${locs.map(x=>`<option ${x===i.LocationName?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
    <label>Quantity<input class="field" type="number" step=".01" name="qty" value="${esc(i.Quantity??1)}"></label>
    <label>Unit<input class="field" name="unit" value="${esc(i.Unit||"item")}"></label>
    <label>Status<select name="status">${["In Stock","Low","Use Soon","Out"].map(x=>`<option ${x===i.Status?"selected":""}>${x}</option>`).join("")}</select></label>
    <label class="full">Notes<textarea class="field" name="notes" rows="3">${esc(i.Notes||"")}</textarea></label>
  </div>`;
}
function addItem(){
  modal("Add inventory item",itemForm(),fd=>{
    db.inventory.push({ItemID:"ITEM"+Date.now(),ItemName:fd.get("name"),CategoryName:fd.get("category"),LocationName:fd.get("location"),Quantity:Number(fd.get("qty")),Unit:fd.get("unit"),Status:fd.get("status"),UseSoon:false,Active:true,Notes:fd.get("notes")});
    save();renderAll();toast("Item added");
  });
}
$("#quickAdd").onclick=$("#addInventory").onclick=addItem;
window.useItem=id=>{const i=db.inventory.find(x=>x.ItemID===id);i.Quantity=Math.max(0,Number(i.Quantity||0)-1);i.Status=i.Quantity===0?"Out":i.Quantity<=1?"Low":"In Stock";save();renderAll();toast("Inventory updated")};
window.editItem=id=>{const i=db.inventory.find(x=>x.ItemID===id);modal("Edit item",itemForm(i),fd=>{Object.assign(i,{ItemName:fd.get("name"),CategoryName:fd.get("category"),LocationName:fd.get("location"),Quantity:Number(fd.get("qty")),Unit:fd.get("unit"),Status:fd.get("status"),Notes:fd.get("notes")});save();renderAll();toast("Item saved")})};
window.viewRecipe=id=>{const r=db.recipes.find(x=>x.RecipeID===id),ings=ingredientsFor(id);modal(r.RecipeName,`<h4>Ingredients</h4>${ings.map(i=>`<div class="list-row"><strong>${esc(i.ItemName)}</strong><span>${esc(i.QuantityNeeded)} ${esc(i.Unit)}</span></div>`).join("")}<h4>Instructions</h4><p>${esc(r.Instructions)}</p>`,()=>{},true)};
window.togglePurchased=(id,v)=>{db.shopping.find(x=>x.ShoppingID===id).Purchased=v;save();renderShopping()};
window.deleteShopping=id=>{db.shopping=db.shopping.filter(x=>x.ShoppingID!==id);save();renderShopping()};
$("#addShopping").onclick=()=>{const n=$("#shoppingInput").value.trim();if(!n)return;db.shopping.push({ShoppingID:"SHOP"+Date.now(),ItemName:n,QuantityNeeded:1,Unit:"item",Priority:$("#shoppingPriority").value,Purchased:false,Reason:""});$("#shoppingInput").value="";save();renderShopping();toast("Added to shopping list")};
$("#clearPurchased").onclick=()=>{db.shopping=db.shopping.filter(x=>!yes(x.Purchased));save();renderShopping()};
$("#addMeal").onclick=()=>modal("Plan a meal",`<div class="form-grid"><label>Day<select name="day">${["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(x=>`<option>${x}</option>`).join("")}</select></label><label>Meal<select name="meal"><option>Breakfast</option><option>Lunch</option><option selected>Dinner</option><option>Snack</option></select></label><label class="full">Recipe<select name="recipe">${db.recipes.map(r=>`<option value="${r.RecipeID}">${esc(r.RecipeName)}</option>`).join("")}</select></label></div>`,fd=>{const r=db.recipes.find(x=>x.RecipeID===fd.get("recipe"));db.mealPlan.push({MealPlanID:"MP"+Date.now(),Day:fd.get("day"),MealType:fd.get("meal"),RecipeID:r.RecipeID,RecipeName:r.RecipeName});save();renderAll();toast("Meal planned")});
$("#surpriseBtn").onclick=()=>{const a=db.recipes.filter(r=>yes(r.NoShop));const r=a[Math.floor(Math.random()*a.length)];if(r)viewRecipe(r.RecipeID)};
$("#exportBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download="kayla-os-backup.json";a.click()};
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{db=JSON.parse(r.result);save();renderAll();toast("Backup imported")};r.readAsText(f)};
$("#resetBtn").onclick=()=>{if(confirm("Reset Kayla OS to the original pantry database?")){db=clone(SEED);save();renderAll();toast("App reset")}};

populateFilters();renderAll();
