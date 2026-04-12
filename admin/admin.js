<!DOCTYPE html>
<html>
<head>
  <title>Admin Menü</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <style>
    body { font-family: Arial; text-align: center; background: #f5f5f5; }
    input, button, select { padding: 10px; margin: 5px; font-size: 16px; }
    .item { margin: 10px; padding: 10px; background: white; border-radius: 10px; }
    #colorPreview {
  width: 40px;
  height: 40px;
  display: inline-block;
  margin-left: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  vertical-align: middle;
}

  </style>
</head>
<body>

<h1>🛠️ Admin Menü</h1>

<h3>📁 Neue Kategorie</h3>
<input id="catName" placeholder="z.B. Salate">
<button onclick="addCategory()">➕ Kategorie anlegen</button>

<h2>➕ Neues Gericht</h2>

<input id="name" placeholder="Name" style="width:300px;">
<input id="price" type="number" step="0.01" placeholder="Preis" style="width:100px;">



<select id="category"></select>

<br>
<button onclick="addItem()">➕ Speichern</button>

<hr>

<h2>📋 Speisekarte</h2>
<div id="menuList"></div>



</body>
</html>
