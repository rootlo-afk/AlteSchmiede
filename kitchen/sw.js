self.addEventListener("install", (e) => {
  console.log("Service Worker installiert");
});

self.addEventListener("fetch", (event) => {
  // aktuell leer – später Cache möglich
});
