//------------------------------------------------------
// Googleスプレッドシート設定
//------------------------------------------------------
const SHEET_ID = "1JG_vDvFlmQgbgQFSmhrktBrnBm-5b6nLQ8s0oTJBNqg";
const SHEET_NAMES = [
  "gashapon","benefice","Qualia","kitan","fukuya","SKjapan","ulcap",
  "bushicap","rainbow","yell","studioSota","toys","spirits",
  "naturetechnicolour","tarlin","peanutclub","yumeya","jdream",
  "amufun","hma","kcom","k2ste","kenelestore"
];
const ITEMS_PER_PAGE = 50;
let allData = [];
let filteredData = [];
let currentPage = 1;

//------------------------------------------------------
// シートを順に読み取る
//------------------------------------------------------
async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonText = text.match(/(?<=\().*(?=\);)/s)[0];
  const data = JSON.parse(jsonText);

  if (!data.table.rows.length) return [];

  const headers = data.table.cols.map(c => (c.label || "").trim());

  const getColumn = (candidates) =>
    headers.find(h => candidates.some(c => h.toLowerCase().includes(c)));

  const titleKey = getColumn(["タイトル", "title", "name"]);
  const imgKey = getColumn(["画像", "image", "img", "photo", "picture"]);
  const urlKey = getColumn(["url", "リンク", "link"]);

  return data.table.rows.map(r => {
    const row = {};
    headers.forEach((h, i) => row[h] = r.c[i]?.v || "");
    return {
      title: row[titleKey] || "",
      image: row[imgKey] || "",
      link: row[urlKey] || ""
    };
  }).filter(item => item.title || item.image || item.link);
}

async function loadAllSheets() {
  document.getElementById("loading").style.display = "block";
  const all = [];
  for (const name of SHEET_NAMES) {
    try {
      console.log(`📘 読み込み中: ${name}`);
      const rows = await fetchSheet(name);
      all.push(...rows);
    } catch (e) {
      console.warn(`⚠️ ${name} の読み込み失敗`, e);
    }
  }
  allData = all;
  filteredData = all;
  document.getElementById("loading").style.display = "none";
  render();
}

//------------------------------------------------------
// 検索と表示
//------------------------------------------------------
function render() {
  const gallery = document.getElementById("gallery");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  filteredData = allData.filter(item =>
    Object.values(item).some(v => v && v.toString().toLowerCase().includes(query))
  );

  const total = filteredData.length;
  document.getElementById("resultCount").textContent = `件数: ${total} 件`;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredData.slice(start, end);

  gallery.innerHTML = pageData.map(item => `
    <div class="card">
      <a href="${item.link || '#'}" target="_blank" rel="noopener noreferrer">
        ${item.image ? `<img src="${item.image}" alt="${item.title || ''}" onerror="this.src='noimage.png';">` : `<div>No Image</div>`}
        ${item.title ? `<p>${item.title}</p>` : ""}
      </a>
    </div>
  `).join("");

  renderPagination(total);
}

//------------------------------------------------------
// ページネーション（5ページずつ表示）
//------------------------------------------------------
function renderPagination(total) {
  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (pageCount <= 1) return;

  const groupSize = 5;
  const currentGroup = Math.ceil(currentPage / groupSize);
  const startPage = (currentGroup - 1) * groupSize + 1;
  const endPage = Math.min(startPage + groupSize - 1, pageCount);

  const createBtn = (text, page, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "page-btn";
    if (disabled) btn.disabled = true;
    else btn.onclick = () => { currentPage = page; render(); };
    pagination.appendChild(btn);
  };

  createBtn("最初", 1, currentPage === 1);
  createBtn("前", currentPage - 1, currentPage === 1);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.onclick = () => { currentPage = i; render(); };
    pagination.appendChild(btn);
  }

  createBtn("次", currentPage + 1, currentPage === pageCount);
  createBtn("最後", pageCount, currentPage === pageCount);
}

//------------------------------------------------------
// イベント設定
//------------------------------------------------------
document.getElementById("searchBtn").addEventListener("click", () => {
  currentPage = 1;
  render();
});
document.getElementById("searchInput").addEventListener("input", () => {
  currentPage = 1;
  render();
});

//------------------------------------------------------
// 閲覧数カウント
//------------------------------------------------------
fetch("https://api.countapi.xyz/hit/gacha-town/views")
  .then(res => res.json())
  .then(data => {
    document.getElementById("viewCount").textContent = `閲覧数: ${data.value} 回`;
  });

//------------------------------------------------------
// 実行開始
//------------------------------------------------------
loadAllSheets();
