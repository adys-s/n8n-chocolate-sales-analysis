// ===============================
// ANALYSE MÉTIER CENTRALISÉE
// ===============================

const caProduit = {};
const caPays = {};
const caVendeur = {};
const caMensuel = {};
const anomalies = [];

// -------------------------------
// 1️⃣ Boucle principale
// -------------------------------

items.forEach(item => {

  const product = item.json.Product;
  const country = item.json.Country;
  const seller = item.json["Sales Person"];
  const amount = item.json.Amount_clean;
  const date = new Date(item.json.Date);

  if (isNaN(date)) return;

  // Mois formaté correctement (YYYY-MM)
  const monthKey =
    date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

  // -------- Détection anomalie --------
  if (amount < 0) {
    anomalies.push({
      type: "Vente négative",
      produit: product,
      montant: amount
    });
  }

  // -------- CA par produit --------
  if (product) {
    caProduit[product] = (caProduit[product] || 0) + amount;
  }

  // -------- CA par pays --------
  if (country) {
    caPays[country] = (caPays[country] || 0) + amount;
  }

  // -------- CA par vendeur --------
  if (seller) {
    caVendeur[seller] = (caVendeur[seller] || 0) + amount;
  }

  // -------- CA mensuel --------
  caMensuel[monthKey] = (caMensuel[monthKey] || 0) + amount;

});

// -------------------------------
// 2️⃣ Produit Top Vente
// -------------------------------

let topProduit = null;
let maxCA = 0;

for (const p in caProduit) {
  if (caProduit[p] > maxCA) {
    maxCA = caProduit[p];
    topProduit = p;
  }
}

// -------------------------------
// 3️⃣ Détection baisse >20%
// -------------------------------

// 🔥 Tri chronologique réel
const mois = Object.keys(caMensuel).sort(
  (a, b) => new Date(a) - new Date(b)
);

const baisse = [];

for (let i = 1; i < mois.length; i++) {

  const prev = caMensuel[mois[i - 1]];
  const current = caMensuel[mois[i]];

  if (prev > 0) {
    const variation = (current - prev) / prev;

    if (variation < -0.2) {
      baisse.push({
        mois: mois[i],
        variation: variation,
        pourcentage: Math.round(variation * 100)
      });
    }
  }
}

// -------------------------------
// 4️⃣ Moyenne mensuelle
// -------------------------------

const totalCA = Object.values(caMensuel).reduce((a, b) => a + b, 0);

const moyenneMensuelle =
  Object.keys(caMensuel).length > 0
    ? totalCA / Object.keys(caMensuel).length
    : 0;


// -------------------------------
// 5️⃣ Indicateur global d’alerte
// -------------------------------

const alerteBaisse = baisse.length > 0;


// ===============================
// 6️⃣ Retour global unique
// ===============================

return [
  {
    json: {
      caProduit,
      caPays,
      caVendeur,
      caMensuel,
      moyenneMensuelle,
      topProduit,
      baisseDetectee: baisse,
      anomalies,
      alerteBaisse   // 
    }
  }
];
