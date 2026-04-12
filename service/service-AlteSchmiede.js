

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,        // 🔥 NEU
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc,
  enableIndexedDbPersistence,
  onSnapshot     // 🔥 NEU
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const categoryColors = {
  "Getränke": "#056bd1",
  "Salate": "#2ecc71",
  "kleine Snacks": "#f39c12",
  "Hauptgerichte": "#e74c3c",
  "Extras": "#95a5a6",
  "Dessert": "#9b59b6"
};



const firebaseConfig = {
  apiKey: "AIzaSyBFJ6n7f3U3qpfezvqTgx9vugOpMSp284o",
  authDomain: "oberkellner-app.firebaseapp.com",
  projectId: "oberkellner-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const restaurantId = "AlteSchmiede";

enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Offline aktiv ✅");
  })
  .catch((err) => {
    console.log("Offline Fehler:", err);
  });



// DOM
const catDiv = document.getElementById("categories");
const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");
const tablesDiv = document.getElementById("tables");
const tableSelect = document.getElementById("table");

function calculateItemTotal(item) {
  const price = Number(item.price || 0);
  const qty = Number(item.qty || 1);

  let extrasTotal = 0;

  if (item.extras?.length) {
    extrasTotal = item.extras.reduce(
      (sum, e) => sum + Number(e.price || 0),
      0
    );
  }

  return (price + extrasTotal) * qty;
}

// STATE
let cart = {};
let paymentList = [];   // 🔥 HIER HIN
let selectedItemId = null;

// ----------------------
// 🍽️ MENÜ LADEN
// ----------------------

async function loadMenu() {

  catDiv.innerHTML = "";

  const catSnap = await getDocs(
    collection(db, "restaurants", "AlteSchmiede", "kategorien")
  );

  let categories = [];

  catSnap.forEach(doc => {
    categories.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // 🔥 SORTIERUNG (NUR EINMAL!)
  const order = ["Getränke", "Salate", "kleine Snacks", "Hauptgerichte", "Extras", "Dessert"];

  categories.sort((a, b) => {
    let indexA = order.indexOf(a.name);
    let indexB = order.indexOf(b.name);

    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;

    return indexA - indexB;
  });

  // 🔥 ANZEIGE
  for (const cat of categories) {

    const prodSnap = await getDocs(
      collection(db, "restaurants", "AlteSchmiede", "kategorien", cat.id, "produkte")
    );

    let items = [];

    prodSnap.forEach(doc => {

      const data = doc.data();

      // 🔥 RICHTIGER FILTER
      if (data.active === true) return;

      items.push({
        id: doc.id,
        ...data,
        category: cat.name
      });

    });
    // 🔥 SORTIEREN
items.sort((a, b) => {

  let orderA = a.order ?? 999;
  let orderB = b.order ?? 999;

  // 🔥 zuerst nach ORDER
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  // 🔥 dann alphabetisch innerhalb gleicher Order
  return a.name.localeCompare(b.name, "de", { sensitivity: "base" });

});

    // 🔥 WICHTIG: LEERE KATEGORIE ÜBERSPRINGEN
    if (items.length === 0) continue;

    // 👉 ERST JETZT DIV + TITEL
let container = document.createElement("div");

// 👉 Kategorie
let title = document.createElement("h4");
title.innerText = cat.name;
title.style.textAlign = "center";
title.style.margin = "15px 0 5px 10px";

container.appendChild(title);

// 👉 GRID
let grid = document.createElement("div");
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
grid.style.columnGap = "1px";
grid.style.rowGap = "1px";
grid.style.justifyContent = "strech";

container.appendChild(grid);

// 🔥 BUTTONS
items.forEach(item => {

  let btn = document.createElement("button");

  let color = categoryColors[cat.name] || "#bdc3c7";

btn.style.background = cat.color || "#f8f9fa";
btn.style.color = "white";
btn.style.border = "none";
  // btn.style.border = "1px solid #ccc";
  btn.style.cursor = "pointer";
btn.style.boxSizing = "border-box";
btn.style.width = "100%";
  btn.style.width = "100%";
  btn.style.height = "70px";
  btn.style.display = "flex";
  btn.style.flexDirection = "column";
  btn.style.justifyContent = "center";
  btn.style.alignItems = "center";
  btn.style.textAlign = "center";
  btn.style.whiteSpace = "normal";
  btn.style.wordBreak = "break-word";
  btn.style.color = getTextColor(cat.color);
btn.onmouseover = () => btn.style.opacity = "0.8";
btn.onmouseout = () => btn.style.opacity = "1";

  btn.innerHTML = `
    <div style="font-size:12px;">
      ${item.name}
    </div>
    <div style="font-size:12px; margin-top:4px;">
      ${Number(item.price).toFixed(2)}€
    </div>
  `;

  if (cat.name === "Extras") {
    btn.onclick = () => addExtraToItem(item);
  } else {
    btn.onclick = () => addToCart(item);
  }

  grid.appendChild(btn);
});

// 👉 richtig!
catDiv.appendChild(container);
  }
  
}

function addToCart(item) {

  let id = Date.now() + Math.random();

  cart[id] = {
    name: item.name,
    price: Number(item.price),
    qty: 1,
    category: item.category,
    extras: []
  };

  selectedItemId = id;

  renderCart();
}

function addExtraToItem(extra) {

  if (!selectedItemId || !cart[selectedItemId]) {
    alert("Bitte zuerst ein Gericht wählen");
    return;
  }

  cart[selectedItemId].extras.push({
    name: extra.name,
    price: Number(extra.price)
  });

  renderCart();
}

function renderCart() {

  cartDiv.innerHTML = "";
  let total = 0;

  for (let key in cart) {

    let item = cart[key];

    let div = document.createElement("div");

    let extrasText = "";

    if (item.extras.length > 0) {
      extrasText = "<br>" + item.extras.map(e => "➕ " + e.name).join("<br>");
    }

    let itemTotal = item.price;

    if (item.extras.length > 0) {
      let extrasTotal = item.extras.reduce((s, e) => s + Number(e.price || 0), 0);
      itemTotal += extrasTotal;
    }

    total += itemTotal * item.qty;

div.innerHTML = `
  <div style="
    text-align:center;
    font-weight:bold;
    margin-bottom:5px;
  ">
    ${item.qty}x ${item.name}
    <span style="margin-left:10px;">
      ${(itemTotal * item.qty).toFixed(2)}€
    </span>
  </div>

  <div style="
    font-size:12px;
    text-align:center;
    margin-bottom:5px;
  ">
    ${extrasText}
  </div>

  <button onclick="changeQty('${key}', -1)">➖</button>
  <button onclick="changeQty('${key}', 1)">➕</button>
`;

    cartDiv.appendChild(div);
  }

  totalDiv.innerText = "Neue Bestellung: " + total.toFixed(2) + "€";
}
window.toggleSales = function() {

  const box = document.getElementById("salesBox");
  const btn = document.getElementById("salesToggleBtn");

  // 👉 aktuell versteckt
  if (box.style.display === "none") {

    let pw = prompt("Passwort eingeben:");

    if (pw === "2903") {

      box.style.display = "block";
      btn.innerText = "🔓 Umsatz ausblenden";

    } else {
      alert("Falsches Passwort!");
    }

  } else {

    // 👉 wieder ausblenden
    box.style.display = "none";
    btn.innerText = "🔒 Umsatz anzeigen";

  }

};

// 👉 wichtig für Buttons
window.changeQty = function(id, delta) {

  cart[id].qty += delta;

  if (cart[id].qty <= 0) delete cart[id];

  renderCart();
};

function changeQty(id, delta) {

  if (!cart[id]) return;

  cart[id].qty += delta;

  // 🔥 wenn 0 → löschen
  if (cart[id].qty <= 0) {
    delete cart[id];
  }

  renderCart();
}
// ----------------------
// 🪑 TISCHE
// ----------------------
async function renderTables() {

  renderTableSelect();

  const start = document.getElementById("rangeStart").value;
  const end = document.getElementById("rangeEnd").value;

    // 🔥 SPEICHERN
  localStorage.setItem("tableStart", start);
  localStorage.setItem("tableEnd", end);

  const tablesDiv = document.getElementById("tables");
  tablesDiv.innerHTML = "";
  tablesDiv.style.display = "grid";
tablesDiv.style.gridTemplateColumns = "repeat(auto-fit, minmax(140px, 1fr))";
tablesDiv.style.gap = "6px";

  // let start = parseInt(document.getElementById("rangeStart").value);
  // let end = parseInt(document.getElementById("rangeEnd").value);

  for (let i = start; i <= end; i++) {

    const tableId = i.toString();

    let btn = document.createElement("div");

    btn.setAttribute("data-table", tableId);
    btn.style.background = "#bdc3c7";
    btn.style.padding = "30px";
    btn.style.borderRadius = "6px";
    btn.style.color = "white";
    btn.style.fontSize = "20px";
    btn.style.cursor = "pointer";
    btn.style.textAlign = "center";
    btn.style.boxSizing = "border-box";  // 🔥 verhindert Überlauf
    btn.style.width = "100%";            // 🔥 passt sich an Grid an
    btn.style.padding = "15px 5px";          // 🔥 kleiner

    btn.innerHTML = `
      🪑 Tisch ${tableId}<br>
      frei
      <div style="font-size:18px;"></div>
    `;

    btn.onclick = () => {
      document.getElementById("table").value = tableId;
      openTableDetails(tableId);
    };

    tablesDiv.appendChild(btn);

    // 🔥 initial laden
    updateSingleTable(tableId);
  }
}
function renderTableSelect() {

  const tableSelect = document.getElementById("table");
  tableSelect.innerHTML = "";

  let start = parseInt(document.getElementById("rangeStart").value);
  let end = parseInt(document.getElementById("rangeEnd").value);

  if (start > end) return;

  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Tisch wählen";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  tableSelect.appendChild(defaultOption);

  for (let i = start; i <= end; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.text = "Tisch " + i;
    tableSelect.appendChild(option);
  }
}
async function loadFullPayment(tableId) {

  paymentList = [];

  const div = document.getElementById("payment");
  div.innerHTML = `<h3>🪑 Tisch ${tableId}</h3>`;

  let total = 0;

  const snapshot = await getDocs(
    collection(db, "restaurants", restaurantId, "tables", tableId, "orders")
  );

  snapshot.forEach(orderDoc => {

    const data = orderDoc.data();

    data.items.forEach((item, itemIndex) => {

     for (let i = 0; i < item.qty; i++) {

  let entry = {
    id: orderDoc.id + "_" + itemIndex + "_" + i,
    tableId: tableId,
    orderId: orderDoc.id,
    name: item.name,
    price: item.price,     // 🔥 BASISPREIS!
    qty: 1,
    extras: item.extras || []
  };

  let itemPrice = calculateItemTotal(entry);
  total += itemPrice;

  let extrasText = "";
  if (item.extras?.length) {
    extrasText = " + " + item.extras.map(e => e.name).join(", ");
  }

  // 🔥 IN LISTE
  paymentList.push(entry);

  // 👉 UI
  let row = document.createElement("div");

row.innerHTML = `
  <div class="pay-row">
    <span class="pay-name">
      ${item.name}${extrasText}
    </span>

    <span class="pay-price">
      ${itemPrice.toFixed(2)}€
    </span>

    <button class="pay-remove">❌</button>
  </div>
`;

// 🔥 REMOVE BUTTON
row.querySelector(".pay-remove").onclick = () => {
  paymentList = paymentList.filter(p => p.id !== entry.id);
  row.remove();
  updateSelectedTotal();
};

div.appendChild(row);
}
    });

  });

  document.getElementById("payTotal").innerText = total.toFixed(2) + "€";
}
// ----------------------
// 📦 SENDEN (noch ohne DB)
// ----------------------

async function sendOrder() {

  let table = document.getElementById("table").value;

  if (!table || Object.keys(cart).length === 0) {
    alert("Tisch & Bestellung nötig!");
    return;
  }

  let allItems = Object.values(cart).map(item => ({
  name: item.name,
  price: Number(item.price),
  qty: Number(item.qty),
  category: item.category,
  extras: item.extras || []   // 🔥 WICHTIG!
}));

  let kitchenItems = [];
  let barItems = [];

  // 🔥 Trennung Küche / Bar
  allItems.forEach(item => {

    if (item.category === "Getränke") {
      barItems.push(item);
    } else {
      kitchenItems.push(item);
    }

  });

  // 🔥 ID erzeugen
  let orderId = Date.now().toString();

  // 🔥 Gesamtpreis berechnen
let total = 0;

allItems.forEach(item => {
  total += calculateItemTotal(item);
});

  // =========================
  // 👉 TABLES (HAUPTORDNER)
  // =========================

  await setDoc(
    doc(db, "restaurants", restaurantId, "tables", table),
    { active: true }   // 🔥 WICHTIG!
  );

  await setDoc(
    doc(db, "restaurants", restaurantId, "tables", table, "orders", orderId),
    {
      items: allItems,
      total: total,
      status: "offen",
      time: Date.now()
    }
  );

  // =========================
  // 👉 BAR
  // =========================

 // 👉 BAR
if (barItems.length > 0) {

      // 🔥 Dokument anlegen (FIX!)
  await setDoc(
      doc(db, "restaurants", restaurantId, "bar", table),
      { active: true }
      
    );
  await setDoc(
    doc(db, "restaurants", restaurantId, "bar", table, "orders", orderId),
    {
      items: barItems,
      status: "offen",
      time: Date.now()
    }
  );
  await setDoc(
  doc(db, "restaurants", restaurantId, "bar", table),
  {
    active: true,
    status: "offen",   // 🔥 NEU
    updated: Date.now() // 🔥 TRIGGER
  },
  { merge: true }
);
}

  // =========================
  // 👉 KÜCHE
  // =========================

  if (kitchenItems.length > 0) {

    // 🔥 Dokument anlegen (FIX!)
    await setDoc(
      doc(db, "restaurants", restaurantId, "kitchen", table),
      { active: true }
    );

    await setDoc(
      doc(db, "restaurants", restaurantId, "kitchen", table, "orders", orderId),
      {
        items: kitchenItems,
        status: "offen",
        time: Date.now()
      }
    );
      await setDoc(
  doc(db, "restaurants", restaurantId, "kitchen", table),
  {
    active: true,
    status: "offen",   // 🔥 NEU
    updated: Date.now() // 🔥 TRIGGER
  },
  { merge: true }
);
  }

  // 🔄 Warenkorb leeren
  cart = {};
  renderCart();

  // alert("✅ Bestellung gesendet!");
  // 🔄 Warenkorb leeren
cart = {};
renderCart();

// 🔥 NUR DIESER TISCH
await updateSingleTable(table);

// 🔥 rechte Seite neu laden
await openTableDetails(table);
}

// ----------------------
// 🚀 START
// ----------------------

document.addEventListener("DOMContentLoaded", () => {

  // 🔥 gespeicherte Werte laden
  const savedStart = localStorage.getItem("tableStart");
  const savedEnd = localStorage.getItem("tableEnd");

  if (savedStart) {
    document.getElementById("rangeStart").value = savedStart;
  }

  if (savedEnd) {
    document.getElementById("rangeEnd").value = savedEnd;
  }

  // 🔥 starten
  loadMenu();
  renderTables();
  loadSales();

  


  // 🔥 Events
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  // 🔥 Initial
  updateConnectionStatus();

  // =========================
  // 🔥 LIVE UPDATES
  // =========================

  onSnapshot(
    collection(db, "restaurants", restaurantId, "bar"),
    (snapshot) => {
      snapshot.docChanges().forEach(change => {
        updateSingleTable(change.doc.id);
      });
    }
  );

  onSnapshot(
    collection(db, "restaurants", restaurantId, "kitchen"),
    (snapshot) => {
      snapshot.docChanges().forEach(change => {
        updateSingleTable(change.doc.id);
      });
    }
  );

});



async function openTableDetails(tableId) {

  paymentList = [];

  const paymentDiv = document.getElementById("payment");
  paymentDiv.innerHTML = `<h3>🪑 Tisch ${tableId}</h3>`;

  const snapshot = await getDocs(
    collection(db, "restaurants", restaurantId, "tables", tableId, "orders")
  );

  snapshot.forEach(orderDoc => {

    const data = orderDoc.data();

    data.items.forEach((item, itemIndex) => {

      for (let i = 0; i < item.qty; i++) {



        let btn = document.createElement("button");
btn.style.display = "block";
btn.style.width = "100%";
btn.style.maxWidth = "500px";
btn.style.margin = "6px auto";
btn.style.padding = "10px";
btn.style.borderRadius = "10px";
btn.style.border = "1px solid #ddd";
btn.style.background = "#fff";

        let extrasText = "";

        if (item.extras && item.extras.length > 0) {
          extrasText = item.extras
            .map(e => "➕ " + e.name)
            .join("<br>");
        }
        let displayPrice = calculateItemTotal({
        price: item.price,
        qty: 1,
        extras: item.extras || []
});
btn.innerHTML = `
  <div style="display:flex; justify-content:space-between; font-weight:bold;">
    <span>${item.name}</span>
    <span>${displayPrice.toFixed(2)}€</span>
  </div>

  <div style="font-size:11px; text-align:left;">
    ${extrasText}
  </div>
`;
// btn.style.padding = "10px";
//btn.style.borderBottom = "1px solid #eee";

        let uniqueId = orderDoc.id + "_" + itemIndex + "_" + i;

        btn.onclick = () => {

          let extrasLabel = "";

          if (item.extras && item.extras.length > 0) {
            extrasLabel = " + " + item.extras.map(e => e.name).join(", ");
          }

let entry = {
  id: uniqueId,
  tableId: tableId,
  orderId: orderDoc.id,
  name: item.name,
  price: item.price,
  qty: 1,
  extras: item.extras || []   // 🔥 DAS IST NEU
};

          let index = paymentList.findIndex(p => p.id === entry.id);

          if (index !== -1) {
            paymentList.splice(index, 1);
            btn.style.background = "#ffffff";
            btn.style.color = "black";
          } else {
            paymentList.push(entry);
            btn.style.background = "#2ecc71";
            btn.style.color = "white";
          }

          updateSelectedTotal();
        };

        paymentDiv.appendChild(btn);
      }
    });

  });

  updateSelectedTotal();
}
function updateSelectedTotal() {
  let total = 0;

  paymentList.forEach(item => {
    total += calculateItemTotal(item);
  });

  document.getElementById("payTotal").innerText = total.toFixed(2) + "€";
}
async function confirmPayment() {

  if (paymentList.length === 0) {
    alert("Keine Zahlung ausgewählt!");
    return;
  }

  const tableId = paymentList[0].tableId;

  // 🔥 Gesamtbetrag berechnen
let totalPaid = 0;

paymentList.forEach(item => {
  totalPaid += calculateItemTotal(item);
});

  // 🔥 Umsatz speichern
  await addDoc(collection(db, "restaurants", restaurantId, "sales"), {
    amount: totalPaid,
    time: Date.now()
  });

  // 🔥 ITEMS VERARBEITEN
  for (let item of paymentList) {

    const ref = doc(
      db,
      "restaurants",
      restaurantId,
      "tables",
      item.tableId,
      "orders",
      item.orderId
    );

    const snap = await getDoc(ref);
    const data = snap.data();

    if (!data) continue;

    // 🔍 Item finden (inkl. Extras Vergleich)
    const index = data.items.findIndex(i => {

      if (i.name !== item.name) return false;

      const extras1 = (i.extras || []).map(e => e.name).sort();
      const extras2 = (item.extras || []).map(e => e.name).sort();

      if (extras1.length !== extras2.length) return false;

      return extras1.every((e, idx) => e === extras2[idx]);
    });

    // 🔥 Menge reduzieren
    if (index !== -1) {
      data.items[index].qty--;

      if (data.items[index].qty <= 0) {
        data.items.splice(index, 1);
      }
    }

    // 🔥 Total neu berechnen
    let newTotal = 0;

data.items.forEach(i => {
  newTotal += calculateItemTotal(i);
});

data.total = newTotal;

    // 🔥 Update oder löschen
if (data.items.length === 0) {
  await deleteDoc(ref);

  // 🔥 BAR löschen
  try {
    await deleteDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "bar",
        item.tableId,
        "orders",
        item.orderId
      )
    );
  } catch (e) {}

  // 🔥 KITCHEN löschen (NEU!)
  try {
    await deleteDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "kitchen",
        item.tableId,
        "orders",
        item.orderId
      )
    );
  } catch (e) {}
}
     else {
      await setDoc(ref, data);
    }
  }

  // =========================
  // 🔥 CLEANUP (NUR EINMAL!)
  // =========================

  // 👉 BAR prüfen
  const barOrdersSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "bar", tableId, "orders")
  );

  if (barOrdersSnap.empty) {
    await deleteDoc(
      doc(db, "restaurants", restaurantId, "bar", tableId)
    );
  } else {
    // 🔄 Trigger für Live Update
    await setDoc(
      doc(db, "restaurants", restaurantId, "bar", tableId),
      { updated: Date.now() },
      { merge: true }
    );
  }

  // 👉 KITCHEN prüfen
    const kitchenOrdersSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "kitchen", tableId, "orders")
  );

  if (kitchenOrdersSnap.empty) {
    await deleteDoc(
      doc(db, "restaurants", restaurantId, "kitchen", tableId)
    );
  } else {
    // 🔄 Trigger für Live Update
    await setDoc(
      doc(db, "restaurants", restaurantId, "kitchen", tableId),
      { updated: Date.now() },
      { merge: true }
    );
  }

  // =========================
  // 🔥 UI RESET
  // =========================

  paymentList = [];
  updateSelectedTotal();



paymentList = [];
updateSelectedTotal();

// 🔥 NUR rechte Seite neu laden
await openTableDetails(tableId);

// 🔥 nur diesen Tisch aktualisieren
await updateSingleTable(tableId);

loadSales();
  loadSales();
}

async function loadSales() {

  const snapshot = await getDocs(
    collection(db, "restaurants", restaurantId, "sales")
  );

  let todayTotal = 0;
  let monthTotal = 0;

  let now = new Date();

  let startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  let startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();

  snapshot.forEach(doc => {

    let data = doc.data();

    let amount = Number(data.amount) || 0;
    let time = Number(data.time) || 0;

    if (time >= startOfDay) {
      todayTotal += amount;
    }

    if (time >= startOfMonth) {
      monthTotal += amount;
    }
  });

  document.getElementById("salesToday").innerText = todayTotal.toFixed(2) + "€";
  document.getElementById("salesMonth").innerText = monthTotal.toFixed(2) + "€";
}


async function updateSingleTable(tableId) {

  let total = 0;
  let hasOrders = false;

  let barOpen = false;
  let kitchenOpen = false;

  // 🔥 ORDERS (Preis)
  const ordersSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "tables", tableId, "orders")
  );

  ordersSnap.forEach(doc => {
    const data = doc.data();
    hasOrders = true;

    data.items.forEach(item => {
      total += calculateItemTotal(item);
    });
  });

  // 🔥 BAR STATUS (NEU - einfach!)
  const barDoc = await getDoc(
    doc(db, "restaurants", restaurantId, "bar", tableId)
  );

  if (barDoc.exists() && barDoc.data().status !== "fertig") {
    barOpen = true;
  }

  // 🔥 KITCHEN STATUS
  const kitchenDoc = await getDoc(
    doc(db, "restaurants", restaurantId, "kitchen", tableId)
  );

  if (kitchenDoc.exists() && kitchenDoc.data().status !== "fertig") {
    kitchenOpen = true;
  }

  // 🔥 ICONS
  let icons = getTableIcons(barOpen, kitchenOpen);

  // 🔥 BUTTON UPDATE
  let btn = document.querySelector(`[data-table="${tableId}"]`);
  if (!btn) return;

  btn.innerHTML = `
    🪑 Tisch ${tableId}<br>
    ${hasOrders ? total.toFixed(2) + "€" : "frei"}
    <div style="font-size:18px;">${icons}</div>
    ${hasOrders ? `<br><button onclick="loadFullPayment('${tableId}'); event.stopPropagation();">💰 Alles</button>` : ""}
  `;

  // 🔥 FARBE
  if (!hasOrders) {
    btn.style.background = "#bdc3c7";
  } else {
    btn.style.background = (barOpen || kitchenOpen)
      ? "#e74c3c"
      : "#2ecc71";
  }
}
function getTableIcons(barOpen, kitchenOpen) {
  let icons = "";

  if (barOpen) icons += "🍺 ";
  if (kitchenOpen) icons += "🍳 ";

  return icons;
}

function calculateTotal(items) {
  return items.reduce((sum, i) => sum + calculateItemTotal(i), 0);
}

window.unlockSales = function() {

  let pw = prompt("Passwort eingeben:");

  if (pw === "1234") {   // 🔥 DEIN PASSWORT
    document.getElementById("salesBox").style.display = "block";
  } else {
    alert("Falsches Passwort!");
  }

};
// 🔥 STATUS FUNKTION
function updateConnectionStatus() {
  const el = document.getElementById("connectionStatus");

  if (navigator.onLine) {
    el.style.background = "green";
  } else {
    el.style.background = "red";
  }
}
function getTextColor(bgColor) {
  if (!bgColor) return "black"; // 🔥 Absicherung

  let c = bgColor.substring(1);
  let rgb = parseInt(c, 16);

  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = (rgb >> 0) & 0xff;

  // 👉 Helligkeit berechnen
  let brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 👉 Entscheidung
  return brightness > 150 ? "black" : "white";
}
function validateTableRange() {
  let start = parseInt(rangeStart.value);
  let end = parseInt(rangeEnd.value);

  if (end < start) {
    rangeEnd.style.border = "2px solid red";
  } else {
    rangeEnd.style.border = "";
  }
}
// Funktionen global machen (für Buttons)
window.confirmPayment = confirmPayment;
window.renderTables = renderTables;
window.openTableDetails = openTableDetails;
window.loadFullPayment = loadFullPayment;
window.sendOrder = sendOrder;
window.changeQty = changeQty;

