// Built-in beginner vocabulary, bundled with the app. One entry per concept,
// spelled in every supported language — the study language supplies the word to
// catch and the player's native language supplies the hint, so the same 100
// concepts serve every language pairing.
export const SEED_PAIRS = [
  { en: "cat", ru: "кошка", uz: "mushuk" },
  { en: "dog", ru: "собака", uz: "it" },
  { en: "house", ru: "дом", uz: "uy" },
  { en: "water", ru: "вода", uz: "suv" },
  { en: "book", ru: "книга", uz: "kitob" },
  { en: "sun", ru: "солнце", uz: "quyosh" },
  { en: "moon", ru: "луна", uz: "oy" },
  { en: "star", ru: "звезда", uz: "yulduz" },
  { en: "tree", ru: "дерево", uz: "daraxt" },
  { en: "flower", ru: "цветок", uz: "gul" },
  { en: "bird", ru: "птица", uz: "qush" },
  { en: "fish", ru: "рыба", uz: "baliq" },
  { en: "horse", ru: "лошадь", uz: "ot" },
  { en: "cow", ru: "корова", uz: "sigir" },
  { en: "mouse", ru: "мышь", uz: "sichqon" },
  { en: "bear", ru: "медведь", uz: "ayiq" },
  { en: "wolf", ru: "волк", uz: "bo'ri" },
  { en: "fox", ru: "лиса", uz: "tulki" },
  { en: "rabbit", ru: "заяц", uz: "quyon" },
  { en: "chicken", ru: "курица", uz: "tovuq" },
  { en: "mother", ru: "мама", uz: "ona" },
  { en: "father", ru: "папа", uz: "ota" },
  { en: "sister", ru: "сестра", uz: "opa" },
  { en: "brother", ru: "брат", uz: "aka" },
  { en: "family", ru: "семья", uz: "oila" },
  { en: "friend", ru: "друг", uz: "do'st" },
  { en: "child", ru: "ребёнок", uz: "bola" },
  { en: "baby", ru: "малыш", uz: "chaqaloq" },
  { en: "bread", ru: "хлеб", uz: "non" },
  { en: "milk", ru: "молоко", uz: "sut" },
  { en: "cheese", ru: "сыр", uz: "pishloq" },
  { en: "apple", ru: "яблоко", uz: "olma" },
  { en: "banana", ru: "банан", uz: "banan" },
  { en: "orange", ru: "апельсин", uz: "apelsin" },
  { en: "tomato", ru: "помидор", uz: "pomidor" },
  { en: "potato", ru: "картофель", uz: "kartoshka" },
  { en: "meat", ru: "мясо", uz: "go'sht" },
  { en: "soup", ru: "суп", uz: "sho'rva" },
  { en: "tea", ru: "чай", uz: "choy" },
  { en: "coffee", ru: "кофе", uz: "qahva" },
  { en: "one", ru: "один", uz: "bir" },
  { en: "two", ru: "два", uz: "ikki" },
  { en: "three", ru: "три", uz: "uch" },
  { en: "four", ru: "четыре", uz: "to'rt" },
  { en: "five", ru: "пять", uz: "besh" },
  { en: "six", ru: "шесть", uz: "olti" },
  { en: "seven", ru: "семь", uz: "yetti" },
  { en: "eight", ru: "восемь", uz: "sakkiz" },
  { en: "nine", ru: "девять", uz: "to'qqiz" },
  { en: "ten", ru: "десять", uz: "o'n" },
  { en: "red", ru: "красный", uz: "qizil" },
  { en: "blue", ru: "синий", uz: "ko'k" },
  { en: "green", ru: "зелёный", uz: "yashil" },
  { en: "yellow", ru: "жёлтый", uz: "sariq" },
  { en: "black", ru: "чёрный", uz: "qora" },
  { en: "white", ru: "белый", uz: "oq" },
  { en: "pink", ru: "розовый", uz: "pushti" },
  { en: "brown", ru: "коричневый", uz: "jigarrang" },
  { en: "head", ru: "голова", uz: "bosh" },
  { en: "hand", ru: "рука", uz: "qo'l" },
  { en: "leg", ru: "нога", uz: "oyoq" },
  { en: "eye", ru: "глаз", uz: "ko'z" },
  { en: "ear", ru: "ухо", uz: "quloq" },
  { en: "nose", ru: "нос", uz: "burun" },
  { en: "mouth", ru: "рот", uz: "og'iz" },
  { en: "heart", ru: "сердце", uz: "yurak" },
  { en: "table", ru: "стол", uz: "stol" },
  { en: "chair", ru: "стул", uz: "stul" },
  { en: "window", ru: "окно", uz: "deraza" },
  { en: "door", ru: "дверь", uz: "eshik" },
  { en: "bed", ru: "кровать", uz: "karavot" },
  { en: "lamp", ru: "лампа", uz: "chiroq" },
  { en: "clock", ru: "часы", uz: "soat" },
  { en: "phone", ru: "телефон", uz: "telefon" },
  { en: "car", ru: "машина", uz: "mashina" },
  { en: "bus", ru: "автобус", uz: "avtobus" },
  { en: "train", ru: "поезд", uz: "poyezd" },
  { en: "plane", ru: "самолёт", uz: "samolyot" },
  { en: "road", ru: "дорога", uz: "yo'l" },
  { en: "city", ru: "город", uz: "shahar" },
  { en: "school", ru: "школа", uz: "maktab" },
  { en: "teacher", ru: "учитель", uz: "o'qituvchi" },
  { en: "student", ru: "ученик", uz: "o'quvchi" },
  { en: "work", ru: "работа", uz: "ish" },
  { en: "play", ru: "играть", uz: "o'ynamoq" },
  { en: "read", ru: "читать", uz: "o'qimoq" },
  { en: "write", ru: "писать", uz: "yozmoq" },
  { en: "run", ru: "бегать", uz: "yugurmoq" },
  { en: "walk", ru: "гулять", uz: "sayr qilmoq" },
  { en: "sleep", ru: "спать", uz: "uxlamoq" },
  { en: "eat", ru: "есть", uz: "yemoq" },
  { en: "drink", ru: "пить", uz: "ichmoq" },
  { en: "love", ru: "любовь", uz: "sevgi" },
  { en: "happy", ru: "счастливый", uz: "baxtli" },
  { en: "sad", ru: "грустный", uz: "g'amgin" },
  { en: "big", ru: "большой", uz: "katta" },
  { en: "small", ru: "маленький", uz: "kichik" },
  { en: "fast", ru: "быстрый", uz: "tez" },
  { en: "slow", ru: "медленный", uz: "sekin" },
  { en: "new", ru: "новый", uz: "yangi" }
];

export const SEED_LANGS = ["ru", "en", "uz"];

function seedId(lang, index) {
  return `seed_${lang}_${String(index + 1).padStart(3, "0")}`;
}

// Recovers which concept a stored built-in word came from, so its wording can be
// re-derived after the player changes their native language.
export function seedPairIndexFromId(id) {
  const match = /^seed_[a-z]{2}_(\d{3})$/.exec(id);
  if (!match) return -1;
  return Number(match[1]) - 1;
}

export function buildSeedList(studyLang, hintLang) {
  return SEED_PAIRS.map((pair, i) => ({
    id: seedId(studyLang, i),
    word: pair[studyLang],
    hint: pair[hintLang],
    isBuiltIn: true
  }));
}
