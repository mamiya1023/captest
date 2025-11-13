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
// 指定シートを取得してデータ整形
//------------------------------------------------------
async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonText = text.match(/(?<=\().*(?=\);)/s)[0];
  const data = JSON.parse(jsonText);

  if (!data.table.rows.length) return [];

  const headers = data.table.cols.map(c => (c.label || "").trim().toLowerCase());
  const getColumn = (candidates) => headers.find(h => candidates.some(c => h.includes(c)));

  const titleKey = getColumn(["タイトル", "title", "name"]);
  const imgKey = getColumn(["画像", "image", "img", "photo"]);
  const urlKey = getColumn(["url", "リンク", "link"]);

  return data.table.rows.map(r => {
    const row = {};
    headers.forEach((h, i) => row[h] = r.c[i]?.v || "");
    return {
      title: row[titleKey] || "",
      image: row[imgKey] || "",
      link: row[urlKey] || ""
    };
  });
}

//------------------------------------------------------
// 全シートを順に読み込み
//------------------------------------------------------
async function loadAllSheets() {
  const loader = document.getElementById("loading");
  loader.style.display = "flex";

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

  allData = all.filter(item => item.title || item.image || item.link);
  filteredData = allData;

  loader.style.display = "none";
  render();
}

//------------------------------------------------------
// データ表示
//------------------------------------------------------
function render() {
  const gallery = document.getElementById("gallery");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  filteredData = allData.filter(item =>
    Object.values(item).some(v => v && v.toString().toLowerCase().includes(query))
  );

  const total = filteredData.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredData.slice(start, end);

  gallery.innerHTML = pageData.map(item => {
    const titleHTML = item.title
      ? `<h4><a href="${item.link || '#'}" target="_blank">${item.title}</a></h4>` : "";

    const imgHTML = item.image
      ? `<a href="${item.link || '#'}" target="_blank">
          <img src="${item.image}" alt="${item.title || ''}">
        </a>` : "";

    return (item.title || item.image || item.link)
      ? `<div class="card">${titleHTML}${imgHTML}</div>` : "";
  }).join("");

  document.getElementById("resultCount").textContent = `件数: ${total} 件`;
  renderPagination(total);
}

//------------------------------------------------------
// ページネーション（5ページ＋ナビ）
 //------------------------------------------------------
function renderPagination(total) {
  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (pageCount <= 1) return;

  const createBtn = (label, disabled, onClick) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.disabled = disabled;
    btn.onclick = onClick;
    pagination.appendChild(btn);
  };

  createBtn("≪ 最初", currentPage === 1, () => { currentPage = 1; render(); });
  createBtn("＜ 前", currentPage === 1, () => { currentPage--; render(); });

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(pageCount, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active" : "";
    btn.onclick = () => { currentPage = i; render(); };
    pagination.appendChild(btn);
  }

  createBtn("次 ＞", currentPage === pageCount, () => { currentPage++; render(); });
  createBtn("最後 ≫", currentPage === pageCount, () => { currentPage = pageCount; render(); });
}

//------------------------------------------------------
// 検索ボタン
//------------------------------------------------------
document.getElementById("searchBtn").addEventListener("click", () => {
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
// 初期化
//------------------------------------------------------
loadAllSheets();
