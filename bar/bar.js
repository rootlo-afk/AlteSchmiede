import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 DIESE CONFIG FEHLT BEI DIR
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

function startBarLive() {

  const barRef = collection(db, "restaurants", restaurantId, "bar");

  onSnapshot(barRef, (tablesSnap) => {

tablesSnap.forEach(async tableDoc => {

  const tableId = tableDoc.id;

  // 🔥 NEU: prüfen ob überhaupt noch Bestellungen existieren
  const ordersSnap = await getDocs(
    collection(db, "restaurants", restaurantId, "bar", tableId, "orders")
  );

  // ❌ KEINE Bestellungen → NICHT anzeigen
  if (ordersSnap.empty) {

    let existing = document.getElementById("table_" + tableId);
    if (existing) existing.remove();

    delete tableListeners[tableId];
    return;
  }

  if (tableListeners[tableId]) return;

      let tableDiv = document.createElement("div");
      tableDiv.id = "table_" + tableId;
      tableDiv.innerHTML = `
  <h2 style="margin-left:15px;">
    🪑 Tisch ${tableId}
  </h2>
`;

      let contentDiv = document.createElement("div");
      tableDiv.appendChild(contentDiv);

      ordersDiv.appendChild(tableDiv);

      const unsub = onSnapshot(
        collection(db, "restaurants", restaurantId, "bar", tableId, "orders"),
        (ordersSnap) => {

          contentDiv.innerHTML = "";

// 🔥 NEU: prüfen ob noch offene Bestellungen existieren
let hasOpenOrders = false;

ordersSnap.forEach(doc => {
  let data = doc.data();
  if (data.status !== "fertig") {
    hasOpenOrders = true;
  }
});

// ❌ ALLES FERTIG → Tisch entfernen
if (!hasOpenOrders) {
  tableDiv.remove();
  delete tableListeners[tableId];
  return;
}

          ordersSnap.forEach(orderDoc => {

            let data = orderDoc.data();

            // 🔥 FERTIGE BESTELLUNGEN AUSBLENDEN
            if (data.status === "fertig") return;

            let orderDiv = document.createElement("div");
            orderDiv.className = "order";
            

if (data.status === "fertig") {
  orderDiv.classList.add("fertig");
} else {
  orderDiv.classList.add("offen"); // 🔥 NEU
}
orderDiv.innerHTML = "";

// 🔥 jede Position einzeln sauber darstellen
data.items.forEach(item => {

  let row = document.createElement("div");
  row.className = "order-row";

  row.innerHTML = `
    <span class="order-text">
      ${item.qty}x ${item.name}
    </span>
  `;

  orderDiv.appendChild(row);
});

            if (data.status !== "fertig") {

let btn = document.createElement("button");
btn.className = "done-btn";
btn.innerText = "✅ Fertig";

btn.onclick = async () => {

  // Theke fertig
  await updateDoc(
    doc(
      db,
      "restaurants",
      restaurantId,
      "bar",
      tableId,
      "orders",
      orderDoc.id
    ),
    { status: "fertig" }
  );

  // Tisch aktualisieren
  await updateDoc(
    doc(
      db,
      "restaurants",
      restaurantId,
      "bar",
      tableId
    ),
    { status: "fertig", updated: Date.now() }
  );

  // Service synchronisieren
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

// 👉 ERST JETZT anhängen
orderDiv.appendChild(btn);

let footer = document.createElement("div");
footer.className = "order-footer";

footer.appendChild(btn);
orderDiv.appendChild(footer);
            }

            contentDiv.appendChild(orderDiv);
          });

        }
      );

      tableListeners[tableId] = unsub;
    });

  });
}

// 🚀 START
startBarLive();
// setInterval(loadBar, 2000);
