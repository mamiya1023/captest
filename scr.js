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
// シート読み込み
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

  const titleKey = getColumn(["タイトル", "商品名", "title", "name"]);
  const imgKey = getColumn(["画像", "image", "img"]);
  const urlKey = getColumn(["url", "リンク", "link"]);

  return data.table.rows.map(r => {
    const row = {};
    headers.forEach((h, i) => row[h] = r.c[i]?.v || "");
    return {
      maker: sheetName,
      title: row[titleKey] || "",
      image: row[imgKey] || "",
      link: row[urlKey] || ""
    };
  });
}

//------------------------------------------------------
// 全シート読み込み
//------------------------------------------------------
async function loadAllSheets() {
  const all = [];
  for (const name of SHEET_NAMES) {
    try {
      const rows = await fetchSheet(name);
      all.push(...rows);
    } catch (e) {
      console.warn(`${name} 読み込み失敗`, e);
    }
  }
  allData = all;
  filteredData = all;
  populateMakerFilter();
  render();
}

//------------------------------------------------------
// メーカー選択肢を自動生成
//------------------------------------------------------
function populateMakerFilter() {
  const makerFilter = document.getElementById("makerFilter");
  SHEET_NAMES.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    makerFilter.appendChild(opt);
  });
}

//------------------------------------------------------
// 表示処理
//------------------------------------------------------
function render() {
  const gallery = document.getElementById("gallery");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const selectedMaker = document.getElementById("makerFilter").value;

  filteredData = allData.filter(item => {
    const matchText = !query || item.title.toLowerCase().includes(query);
    const matchMaker = !selectedMaker || item.maker === selectedMaker;
    return matchText && matchMaker;
  });

  const total = filteredData.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredData.slice(start, end);

  gallery.innerHTML = pageData.map(item => `
    <div class="card">
      <a href="${item.link || '#'}" target="_blank" rel="noopener noreferrer">
        <img src="${item.image || 'noimage.png'}" alt="${item.title}">
      </a>
      <div class="card-title">${item.title}</div>
    </div>
  `).join("");

  renderPagination(total);
}

//------------------------------------------------------
// ページネーション（5ページ範囲 + ナビ付き）
//------------------------------------------------------
function renderPagination(total) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);

  const createBtn = (label, page) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "page-btn";
    btn.disabled = (page < 1 || page > pageCount || page === currentPage);
    btn.onclick = () => {
      currentPage = page;
      render();
    };
    pagination.appendChild(btn);
  };

  createBtn("⏮", 1);
  createBtn("◀", currentPage - 1);

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(pageCount, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.onclick = () => { currentPage = i; render(); };
    pagination.appendChild(btn);
  }

  createBtn("▶", currentPage + 1);
  createBtn("⏭", pageCount);
}

//------------------------------------------------------
// イベント設定
//------------------------------------------------------
document.getElementById("searchBtn").addEventListener("click", () => {
  currentPage = 1;
  render();
});

document.getElementById("makerFilter").addEventListener("change", () => {
  currentPage = 1;
  render();
});

document.getElementById("searchInput").addEventListener("keypress", e => {
  if (e.key === "Enter") {
    currentPage = 1;
    render();
  }
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
