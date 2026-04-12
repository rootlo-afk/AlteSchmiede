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

      div.innerHTML = `...`; // 🔥 genau wie bei dir (gekürzt hier)

      menuDiv.appendChild(div);
    });
  }

  isLoading = false;
}

// 👉 REST bleibt IDENTISCH wie bei dir
// (addItem, deleteItem, toggleActive usw.)

// 🔥 WICHTIG (einziger technischer Fix!)
document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  loadCategoriesDropdown();
});
