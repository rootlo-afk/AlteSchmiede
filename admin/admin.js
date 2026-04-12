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
const isActive = item.active !== false;

items.forEach(item => {

  let wrapper = document.createElement("div");
  wrapper.className = "item";

  let inner = document.createElement("div");

  inner.style.display = "flex";
  inner.style.justifyContent = "space-between";
  inner.style.alignItems = "center";
  inner.style.border = "1px solid #ddd";
  inner.style.borderRadius = "8px";
  inner.style.padding = "8px 10px";
  inner.style.margin = "6px 0";
  inner.style.background = "#fff";

  // 🔥 HIER STEUERST DU GRAU / HELL
  inner.style.opacity = item.active ? "0.4" : "1";

  // LINKS (Order + Name)
  let left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "10px";
  left.style.fontWeight = "bold";

  let input = document.createElement("input");
  input.type = "number";
  input.value = item.order ?? 0;
  input.style.width = "60px";
  input.onchange = () => updateOrder(cat.id, item.id, input.value);

  let name = document.createElement("span");
  name.innerText = item.name;

  left.appendChild(input);
  left.appendChild(name);

  // RECHTS (Preis + Buttons)
  let right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "6px";

  let price = document.createElement("span");
  price.innerText = item.price.toFixed(2) + "€";
  price.style.minWidth = "70px";
  price.style.textAlign = "right";

  let btnEdit = document.createElement("button");
  btnEdit.innerText = "✏️";
  btnEdit.onclick = () => editItem(cat.id, item.id, item.name, item.price);

  let btnDelete = document.createElement("button");
  btnDelete.innerText = "❌";
  btnDelete.onclick = () => deleteItem(cat.id, item.id);

  let btnToggle = document.createElement("button");
  btnToggle.innerText = item.active ? "🚫" : "👁️‍🗨️";
  btnToggle.onclick = () => toggleActive(cat.id, item.id, item.active);

  right.appendChild(price);
  right.appendChild(btnEdit);
  right.appendChild(btnDelete);
  right.appendChild(btnToggle);

  inner.appendChild(left);
  inner.appendChild(right);
  wrapper.appendChild(inner);

  menuDiv.appendChild(wrapper);
});
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
