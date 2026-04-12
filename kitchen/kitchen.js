import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBFJ6n7f3U3qpfezvqTgx9vugOpMSp284o",
  authDomain: "oberkellner-app.firebaseapp.com",
  projectId: "oberkellner-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const restaurantId = "AlteSchmiede";
const ordersDiv = document.getElementById("orders");


const tableListeners = {};

function startKitchenLive() {

  const kitchenRef = collection(db, "restaurants", restaurantId, "kitchen");

  onSnapshot(kitchenRef, (tablesSnap) => {

    tablesSnap.forEach(tableDoc => {

      const tableId = tableDoc.id;

      // 👉 verhindert doppelte Listener
      if (tableListeners[tableId]) return;

      let tableDiv = document.createElement("div");
      tableDiv.id = "table_" + tableId;
      tableDiv.innerHTML = `<h2>🪑 Tisch ${tableId}</h2>`;

      let contentDiv = document.createElement("div");
      tableDiv.appendChild(contentDiv);

      ordersDiv.appendChild(tableDiv);

      // 🔥 LIVE ORDERS
      const unsub = onSnapshot(
        collection(db, "restaurants", restaurantId, "kitchen", tableId, "orders"),
        (ordersSnap) => {

          contentDiv.innerHTML = "";

          // ❌ wenn leer → entfernen
let hasOpenOrders = false;

ordersSnap.forEach(doc => {
  let data = doc.data();
  if (data.status !== "fertig") {
    hasOpenOrders = true;
  }
});

if (!hasOpenOrders) {
  tableDiv.remove();
  delete tableListeners[tableId];
  return;
}

 ordersSnap.forEach(orderDoc => {

  let data = orderDoc.data();

  // ❌ fertige direkt überspringen
  if (data.status === "fertig") return;

  let orderDiv = document.createElement("div");
  orderDiv.className = "order offen";

  // 🔥 ITEMS
  data.items.forEach(item => {

    let row = document.createElement("div");
    row.className = "order-row";

    let extras = "";

    if (item.extras && item.extras.length > 0) {
      extras = " + " + item.extras.map(e => e.name).join(", ");
    }

    row.innerHTML = `
      <span>${item.qty}x ${item.name}${extras}</span>
    `;

    orderDiv.appendChild(row);
  });

  // 🔥 BUTTON
  let btn = document.createElement("button");
  btn.className = "done-btn";
  btn.innerText = "✅ Fertig";

  btn.onclick = async () => {
    await updateDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "kitchen",
        tableId,
        "orders",
        orderDoc.id
      ),
      { status: "fertig" }
    );

    await updateDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "kitchen",
        tableId
      ),
      { status: "fertig", updated: Date.now() }
    );

    await updateDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "tables",
        tableId,
        "orders",
        orderDoc.id
      ),
      { status: "fertig" }
    );
  };

  orderDiv.appendChild(btn);

  // 👉 GANZ WICHTIG: innerhalb der forEach!
  contentDiv.appendChild(orderDiv);

});

        }
      );

      tableListeners[tableId] = unsub;
    });

  });
}
// loadKitchen();
startKitchenLive();
