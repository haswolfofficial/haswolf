const fs = require("fs");
const path = require("path");

const root = process.cwd();
const adminPath = path.join(root, "app", "admin", "page.tsx");
const homePath = path.join(root, "app", "page.tsx");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Dosya bulunamadı: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) {
    throw new Error(`Güncelleme noktası bulunamadı: ${label}`);
  }
  return content.replace(search, replacement);
}

function backup(file) {
  const backupPath = `${file}.kategori-backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(file, backupPath);
  }
}

let admin = read(adminPath);
let home = read(homePath);

backup(adminPath);
backup(homePath);

// ---------------- ADMIN PANELİ ----------------

if (!admin.includes("const ITEM_CATEGORIES")) {
  admin = replaceOnce(
    admin,
    'const MAX_IMAGE_SIZE = 5 * 1024 * 1024;',
    `const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ITEM_CATEGORIES = [
  "Silahlar",
  "Kalkanlar",
  "Kolyeler",
  "Ayakkabılar",
  "Bilezikler",
  "Küpeler",
  "Zırhlar",
  "Kasklar",
  "Diğer",
] as const;`,
    "admin kategori sabitleri"
  );
}

if (!admin.includes("item_category: string | null;")) {
  admin = replaceOnce(
    admin,
    '  category: "item" | "yang" | "account";',
    '  category: "item" | "yang" | "account";\n  item_category: string | null;',
    "admin Product tipi"
  );
}

if (!admin.includes('const [itemCategory, setItemCategory]')) {
  admin = replaceOnce(
    admin,
    '  const [category, setCategory] = useState<Product["category"]>("item");',
    `  const [category, setCategory] = useState<Product["category"]>("item");
  const [itemCategory, setItemCategory] = useState("Diğer");`,
    "admin kategori state"
  );
}

admin = admin.replace(
  '.select("id,name,category,server,price,description,image_url,stock,is_active")',
  '.select("id,name,category,item_category,server,price,description,image_url,stock,is_active")'
);

if (!admin.includes('setItemCategory("Diğer");')) {
  admin = replaceOnce(
    admin,
    '    setCategory("item");',
    '    setCategory("item");\n    setItemCategory("Diğer");',
    "admin form sıfırlama"
  );
}

if (!admin.includes('setItemCategory(product.item_category ?? "Diğer");')) {
  admin = replaceOnce(
    admin,
    '    setCategory(product.category);',
    '    setCategory(product.category);\n    setItemCategory(product.item_category ?? "Diğer");',
    "admin düzenleme formu"
  );
}

if (!admin.includes('item_category: category === "item" ? itemCategory : null,')) {
  admin = replaceOnce(
    admin,
    '        category,\n        server,',
    '        category,\n        item_category: category === "item" ? itemCategory : null,\n        server,',
    "admin kayıt payload"
  );
}

if (!admin.includes('value={itemCategory}')) {
  const serverSelectMarker = `              <select
                value={server}`;
  const categorySelect = `              {category === "item" && (
                <select
                  value={itemCategory}
                  onChange={(event) => setItemCategory(event.target.value)}
                  className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none"
                >
                  {ITEM_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              )}

`;
  admin = replaceOnce(
    admin,
    serverSelectMarker,
    categorySelect + serverSelectMarker,
    "admin alt kategori seçim kutusu"
  );
}

// ---------------- ANA SAYFA ----------------

if (!home.includes("item_category: string | null;")) {
  home = replaceOnce(
    home,
    '  category: MarketType;',
    '  category: MarketType;\n  item_category: string | null;',
    "ana sayfa Product tipi"
  );
}

home = home.replace(
  '.select("id,name,category,server,price,description,image_url,stock,is_active,created_at")',
  '.select("id,name,category,item_category,server,price,description,image_url,stock,is_active,created_at")'
);

home = home.replace(
  '(selectedCategory === "Tüm Ürünler" || selectedCategory === "Diğer"),',
  `(selectedCategory === "Tüm Ürünler" ||
          (product.item_category ?? "Diğer") === selectedCategory),`
);

fs.writeFileSync(adminPath, admin, "utf8");
fs.writeFileSync(homePath, home, "utf8");

console.log("");
console.log("✅ Alt kategori sistemi kodlara eklendi.");
console.log("✅ Admin paneline Silahlar, Zırhlar, Kolyeler vb. seçim kutusu eklendi.");
console.log("✅ Ana sayfa kategori filtreleri gerçek ilanlarla bağlandı.");
console.log("");
console.log("Şimdi Supabase SQL dosyasını çalıştır, ardından npm run build yaz.");
