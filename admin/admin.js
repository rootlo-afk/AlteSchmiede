<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFJ6n7f3U3qpfezvqTgx9vugOpMSp284o",
  authDomain: "oberkellner-app.firebaseapp.com",
  projectId: "oberkellner-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 FESTE RESTAURANT ID
const restaurantId = "AlteSchmiede";

const menuDiv = document.getElementById("menuList");


let isLoading = false;
// 🔥 Menü laden
async function loadMenu() {

  // 🔒 SCHUTZ
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

  const order = ["Getränke", "Salate", "Hauptgerichte", "Extras", "Dessert"];

  categories.sort((a, b) => {
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  for (const cat of categories) {

let catTitle = document.createElement("div");

catTitle.style.display = "flex";
catTitle.style.alignItems = "center";
catTitle.style.justifyContent = "center";
catTitle.style.gap = "10px";
catTitle.style.marginTop = "20px";

// 🎨 Farbbox
let colorBox = document.createElement("div");
colorBox.style.width = "15px";
colorBox.style.height = "15px";
colorBox.style.borderRadius = "4px";
colorBox.style.background = cat.color || "#ccc";

// 🏷️ Text
let titleText = document.createElement("span");
titleText.innerText = getCategoryIcon(cat.name) + " " + cat.name;
titleText.style.fontWeight = "bold";

catTitle.appendChild(colorBox);
catTitle.appendChild(titleText);
catTitle.style.background = cat.color || "#eee";
catTitle.style.padding = "5px 10px";
catTitle.style.borderRadius = "8px";
catTitle.style.cursor = "pointer";


catTitle.onclick = () => {

  let picker = document.createElement("input");
  picker.type = "color";
  picker.value = cat.color || "#3498db";

  picker.onchange = async () => {

    await updateDoc(
      doc(db, "restaurants", restaurantId, "kategorien", cat.id),
      {
        color: picker.value
      }
    );

    loadMenu();
  };

  picker.click();
};
menuDiv.appendChild(catTitle);

    const prodSnap = await getDocs(
      collection(db, "restaurants", restaurantId, "kategorien", cat.id, "produkte")
    );

    let items = [];

    prodSnap.forEach(p => {
      items.push({
        id: p.id,
        ...p.data()
      });
    });

    items.sort((a, b) => {

  let orderA = a.order ?? 999;
  let orderB = b.order ?? 999;

  // 🔥 zuerst nach ORDER
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  // 🔥 dann alphabetisch
  return a.name.localeCompare(b.name, "de", { sensitivity: "base" });

});

    items.forEach(item => {

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
    style="opacity:${item.active === false ? 0.4 : 1}"
  ">

    <!-- NAME + PREIS -->
    <div style="
      display:flex;
      justify-content: space-between;
      align-items:center;
      flex:1;
      font-weight:bold;
      gap:15px;
    ">
<div style="display:flex; align-items:center; gap:10px;">


  <!-- ORDER -->
  <input 
    type="number" 
    value="${item.order ?? 0}" 
    style="width:60px;"
    onchange="updateOrder('${cat.id}', '${item.id}', this.value)"
  >

  <!-- NAME -->
  <span>${item.name}</span>

</div>

      <span style="
        min-width:70px;
        text-align:right;
      ">
        ${item.price.toFixed(2)}€
      </span>
    </div>

    <!-- BUTTONS -->
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


  
window.addCategory = async function() {

  const nameInput = document.getElementById("catName");
  const colorInput = document.getElementById("catColor");

  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    alert("Name fehlt!");
    return;
  }

  // 🔥 NUR EINMAL speichern
  await addDoc(
    collection(db, "restaurants", "AlteSchmiede", "kategorien"),
    {
      name: name,
      color: color
    }
  );

  // 🔄 Dropdown direkt erweitern (optional)
  let select = document.getElementById("category");

  if (select) {
    let option = document.createElement("option");
    option.value = name;
    option.text = "📁 " + name;
    select.appendChild(option);
  }

  // 🔄 Felder leeren
  nameInput.value = "";

  // 🔄 Menü neu laden
  loadMenu();
};

// ➕ Gericht hinzufügen
window.addItem = async function() {

  let name = document.getElementById("name").value;
  let price = parseFloat(document.getElementById("price").value);
  let category = document.getElementById("category").value;

  let type = (category === "Getränke") ? "drink" : "food";

  if (!name || !price) {
    alert("Name & Preis nötig!");
    return;
  }

  await addDoc(
    collection(db, "restaurants", restaurantId, "kategorien", category, "produkte"),
{
  name: name,
  price: price,
  type: type,
  order: Date.now(),
  active: true // 🔥 STANDARD = sichtbar
}
  );

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";

  loadMenu();
}

// ❌ löschen
window.deleteItem = async function(category, id) {

  if (!confirm("Löschen?")) return;

  await deleteDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id)
  );

  loadMenu();
}

// ✏️ bearbeiten
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
}

async function loadCategoriesDropdown() {

  const select = document.getElementById("category");
  select.innerHTML = "";

  const snap = await getDocs(
    collection(db, "restaurants", restaurantId, "kategorien")
  );

  let categories = [];

  snap.forEach(doc => {
    categories.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // 🔥 gewünschte Reihenfolge
  const order = ["Getränke", "Salate", "Hauptgerichte", "kleine Snacks", "Extras", "Dessert"];

  // 🔥 sortieren
categories.sort((a, b) => {
  let indexA = order.indexOf(a.name);
  let indexB = order.indexOf(b.name);

  if (indexA === -1) indexA = 999;
  if (indexB === -1) indexB = 999;

  return indexA - indexB;
});

  // 🔥 Dropdown befüllen
  categories.forEach(cat => {

    let option = document.createElement("option");
    option.value = cat.id;
    option.text = getCategoryIcon(cat.name) + " " + cat.name;

    select.appendChild(option);
  });

}

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
window.toggleActive = async function(category, id, current) {

  await updateDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id),
    {
      active: !current
    }
  );

  loadMenu();
}
window.updateOrder = async function(category, id, newOrder) {

  await updateDoc(
    doc(db, "restaurants", restaurantId, "kategorien", category, "produkte", id),
    {
      order: Number(newOrder)
    }
  );

  loadMenu();
}
document.addEventListener("DOMContentLoaded", () => {

  const catColor = document.getElementById("catColor");
  const preview = document.getElementById("colorPreview");

  if (catColor && preview) {

    preview.style.background = catColor.value;

    catColor.oninput = () => {
      preview.style.background = catColor.value;
    };

  }

});
// 🔥 Start
loadMenu();
loadCategoriesDropdown(); // 🔥 DAS FEHLT

</script>
