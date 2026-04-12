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

const restaurantId = "AlteSchmiede";

const menuDiv = document.getElementById("menuList");

let isLoading = false;

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

    let colorBox = document.createElement("div");
    colorBox.style.width = "15px";
    colorBox.style.height = "15px";
    colorBox.style.borderRadius = "4px";
    colorBox.style.background = cat.color || "#ccc";

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
          { color: picker.value }
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

      if (orderA !== orderB) return orderA - orderB;

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
    ${item.active === false ? "opacity:0.4;" : ""}
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
async function loadCategoriesDropdown() {

  const select = document.getElementById("category");
  if (!select) return; // 🔥 wichtig!

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

  const order = ["Getränke", "Salate", "Hauptgerichte", "kleine Snacks", "Extras", "Dessert"];

  categories.sort((a, b) => {
    let indexA = order.indexOf(a.name);
    let indexB = order.indexOf(b.name);

    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;

    return indexA - indexB;
  });

  categories.forEach(cat => {
    let option = document.createElement("option");
    option.value = cat.id;
    option.text = getCategoryIcon(cat.name) + " " + cat.name;
    select.appendChild(option);
  });
}
// 👉 REST bleibt IDENTISCH wie bei dir
// (addItem, deleteItem, toggleActive usw.)

// 🔥 WICHTIG (einziger technischer Fix!)
document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  loadCategoriesDropdown();
});
