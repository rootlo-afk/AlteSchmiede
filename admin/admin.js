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

let menuDiv;
let isLoading = false;

document.addEventListener("DOMContentLoaded", () => {
  menuDiv = document.getElementById("menuList");
  loadMenu();
  loadCategoriesDropdown();
});

// --------------------
// 🔥 MENU LADEN
// --------------------
async function loadMenu() {

  if (isLoading) return;
  isLoading = true;

  menuDiv.innerHTML = "";

  const catSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "kategorien")
  );

  let categories = [];

  catSnap.forEach(docSnap => {
    categories.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  for (const cat of categories) {

    // 👉 Kategorie Titel
    let catTitle = document.createElement("div");
    catTitle.innerText = cat.name;
    catTitle.style.background = cat.color || "#eee";
    catTitle.style.padding = "10px";
    catTitle.style.marginTop = "20px";
    catTitle.style.borderRadius = "8px";
    catTitle.style.cursor = "pointer";

    // 🔥 COLOR PICKER FIX (kein oninput → kein Spam!)
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

    // 👉 Produkte
    const prodSnap = await getDocs(
      collection(db, "restaurants", restaurantId, "kategorien", cat.id, "produkte")
    );

    prodSnap.forEach(p => {
      let item = p.data();

      let div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <b>${item.name}</b> - ${item.price.toFixed(2)}€
        <br><br>
        <button onclick="editItem('${cat.id}','${p.id}','${item.name}',${item.price})">✏️</button>
        <button onclick="deleteItem('${cat.id}','${p.id}')">❌</button>
      `;

      menuDiv.appendChild(div);
    });
  }

  isLoading = false;
}

// --------------------
// ➕ KATEGORIE
// --------------------
window.addCategory = async function () {

  let name = document.getElementById("catName").value;

  if (!name) {
    alert("Name fehlt!");
    return;
  }

  await addDoc(
    collection(db, "restaurants", restaurantId, "kategorien"),
    {
      name: name,
      color: "#3498db"
    }
  );

  document.getElementById("catName").value = "";

  loadMenu();
  loadCategoriesDropdown();
};

// --------------------
// ➕ ITEM
// --------------------
window.addItem = async function () {

  let name = document.getElementById("name").value;
  let price = parseFloat(document.getElementById("price").value);
  let category = document.getElementById("category").value;

  if (!name || !price) {
    alert("Name & Preis nötig!");
    return;
  }

  await addDoc(
    collection(db, "restaurants", restaurantId, "kategorien", category, "produkte"),
    {
      name: name,
      price: price,
      order: Date.now(),
      active: true
    }
  );

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";

  loadMenu();
};

// --------------------
// ❌ DELETE
// --------------------
window.deleteItem = async function (category, id) {

  if (!confirm("Löschen?")) return;

  await deleteDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id)
  );

  loadMenu();
};

// --------------------
// ✏️ EDIT
// --------------------
window.editItem = async function (category, id, name, price) {

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

// --------------------
// 🔽 DROPDOWN
// --------------------
async function loadCategoriesDropdown() {

  const select = document.getElementById("category");
  select.innerHTML = "";

  const snap = await getDocs(
    collection(db, "restaurants", restaurantId, "kategorien")
  );

  snap.forEach(doc => {
    let option = document.createElement("option");
    option.value = doc.id;
    option.text = doc.data().name;
    select.appendChild(option);
  });
}
