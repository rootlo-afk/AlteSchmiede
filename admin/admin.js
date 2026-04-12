import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFJ6n7f3U3qpfezvqTgx9vugOpMSp284o",
  authDomain: "oberkellner-app.firebaseapp.com",
  projectId: "oberkellner-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const restaurantId = "AlteSchmiede";

const menuDiv = document.getElementById("menuList");

let isLoading = false;

// 🔥 ICONS
function getCategoryIcon(name) {
  switch (name) {
    case "Getränke": return "🍺";
    case "Salate": return "🥗";
    case "Hauptgerichte": return "🍽️";
    case "Extras": return "➕";
    case "Dessert": return "🍰";
    default: return "📦";
  }
}

// 🔥 DROPDOWN
async function loadCategoriesDropdown() {

  const select = document.getElementById("category");
  if (!select) return;

  select.innerHTML = "";

  const snap = await getDocs(
    collection(db, "restaurants", restaurantId, "kategorien")
  );

  snap.forEach(docSnap => {
    let data = docSnap.data();

    let option = document.createElement("option");
    option.value = docSnap.id;
    option.text = getCategoryIcon(data.name) + " " + data.name;

    select.appendChild(option);
  });
}

// 🔥 MENU
async function loadMenu() {

  if (isLoading) return;
  isLoading = true;

  menuDiv.innerHTML = "";

  const catSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "kategorien")
  );

  for (const catDoc of catSnap.docs) {

    const cat = {
      id: catDoc.id,
      ...catDoc.data()
    };

    // 🔹 Titel
    let catTitle = document.createElement("div");

    catTitle.style.display = "flex";
    catTitle.style.alignItems = "center";
    catTitle.style.justifyContent = "center";
    catTitle.style.gap = "10px";
    catTitle.style.marginTop = "20px";
    catTitle.style.background = cat.color || "#eee";
    catTitle.style.padding = "5px 10px";
    catTitle.style.borderRadius = "8px";
    catTitle.style.cursor = "pointer";

    let titleText = document.createElement("span");
    titleText.innerText = getCategoryIcon(cat.name) + " " + cat.name;
    titleText.style.fontWeight = "bold";

    catTitle.appendChild(titleText);

    // 🔥 Farbe ändern
    catTitle.onclick = () => {
      let picker = document.createElement("input");
      picker.type = "color";
      picker.value = cat.color || "#3498db";

      picker.onchange = async () => {
        await updateDoc(
          doc(db, "restaurants", restaurantId, "kategorien", cat.id),
          { color: picker.value }
        );
        loadMenu();
      };

      picker.click();
    };

    menuDiv.appendChild(catTitle);

    // 🔹 Produkte
    const prodSnap = await getDocs(
      collection(db, "restaurants", restaurantId, "kategorien", cat.id, "produkte")
    );

    prodSnap.forEach(p => {

      const item = {
        id: p.id,
        ...p.data()
      };

      let div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <div style="
          display:flex;
          justify-content: space-between;
          align-items:center;
          border:1px solid #ddd;
          border-radius:8px;
          padding:8px 10px;
          margin:6px 0;
          background:#fff;
          ${item.active === false ? "opacity:0.4;" : ""}
        ">

          <div style="
            display:flex;
            justify-content: space-between;
            align-items:center;
            flex:1;
            font-weight:bold;
            gap:15px;
          ">

            <div style="display:flex; align-items:center; gap:10px;">
              <input 
                type="number" 
                value="${item.order ?? 0}" 
                style="width:60px;"
                onchange="updateOrder('${cat.id}', '${item.id}', this.value)"
              >
              <span>${item.name}</span>
            </div>

            <span style="min-width:70px; text-align:right;">
              ${item.price.toFixed(2)}€
            </span>

          </div>

          <div style="display:flex; gap:6px; margin-left:10px;">
            <button onclick="editItem('${cat.id}', '${item.id}', '${item.name}', ${item.price})">✏️</button>
            <button onclick="deleteItem('${cat.id}', '${item.id}')">❌</button>
            <button onclick="toggleActive('${cat.id}', '${item.id}', ${item.active !== false})">
              ${item.active === false ? "👁️‍🗨️" : "🚫"}
            </button>
          </div>

        </div>
      `;

      menuDiv.appendChild(div);
    });
  }

  isLoading = false;
}

// 🔥 GLOBAL (WICHTIG!)
window.addCategory = async function() {

  const name = document.getElementById("catName").value;

  if (!name) return;

  await addDoc(
    collection(db, "restaurants", restaurantId, "kategorien"),
    { name }
  );

  loadMenu();
  loadCategoriesDropdown();
};

window.addItem = async function() {

  let name = document.getElementById("name").value;
  let price = parseFloat(document.getElementById("price").value);
  let category = document.getElementById("category").value;

  if (!name || !price) return;

  await addDoc(
    collection(db, "restaurants", restaurantId, "kategorien", category, "produkte"),
    {
      name,
      price,
      order: Date.now(),
      active: true
    }
  );

  loadMenu();
};

window.deleteItem = async function(category, id) {
  await deleteDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id)
  );
  loadMenu();
};

window.editItem = async function(category, id, name, price) {

  let newName = prompt("Name:", name);
  let newPrice = prompt("Preis:", price);

  if (!newName || !newPrice) return;

  await updateDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id),
    {
      name: newName,
      price: parseFloat(newPrice)
    }
  );

  loadMenu();
};

window.toggleActive = async function(category, id, current) {

  await updateDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id),
    {
      active: !current
    }
  );

  loadMenu();
};

window.updateOrder = async function(category, id, newOrder) {

  await updateDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id),
    {
      order: Number(newOrder)
    }
  );

  loadMenu();
};

// 🔥 START
document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  loadCategoriesDropdown();
});
