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
// 指定シートからデータを取得して配列に変換
//------------------------------------------------------
async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonText = text.match(/(?<=\().*(?=\);)/s)[0];
  const data = JSON.parse(jsonText);

  if (!data.table.rows.length) return [];

  // 列名（ヘッダー行）を取得
  const headers = data.table.cols.map(c => (c.label || "").trim());

  // 指定候補から該当列を検出
  const getColumn = (candidates) => {
    return headers.find(h => candidates.some(c => h.toLowerCase().includes(c)));
  };

  const imgKey = getColumn(["画像", "image", "img", "photo", "picture"]);
  const urlKey = getColumn(["url", "リンク", "link"]);

  // データを整形
  return data.table.rows.map(r => {
    const row = {};
    headers.forEach((h, i) => row[h] = r.c[i]?.v || "");
    return {
      image: row[imgKey] || "",
      link: row[urlKey] || ""
    };
  });
}

//------------------------------------------------------
// 全シートを読み込む
//------------------------------------------------------
async function loadAllSheets() {
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
  render();
}

//------------------------------------------------------
// 検索結果を表示
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

  // 画像のみを表示
  gallery.innerHTML = pageData.map(item => `
    <div class="card">
      <a href="${item.link || '#'}" target="_blank" rel="noopener noreferrer">
        <img src="${item.image || 'noimage.png'}" alt="">
      </a>
    </div>
  `).join("");

  renderPagination(total);
}

//------------------------------------------------------
// ページネーション生成
//------------------------------------------------------
function renderPagination(total) {
  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.onclick = () => { currentPage = i; render(); };
    pagination.appendChild(btn);
  }
}

//------------------------------------------------------
// 検索イベント設定
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
// 閲覧数カウント（CountAPI）
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
