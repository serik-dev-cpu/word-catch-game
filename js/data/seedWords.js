// Built-in beginner-level EN <-> RU word pairs, bundled with the app.
// [english, russian] concept pairs; both directions are generated below.
const PAIRS = [
  ["cat", "кошка"], ["dog", "собака"], ["house", "дом"], ["water", "вода"],
  ["book", "книга"], ["sun", "солнце"], ["moon", "луна"], ["star", "звезда"],
  ["tree", "дерево"], ["flower", "цветок"], ["bird", "птица"], ["fish", "рыба"],
  ["horse", "лошадь"], ["cow", "корова"], ["mouse", "мышь"], ["bear", "медведь"],
  ["wolf", "волк"], ["fox", "лиса"], ["rabbit", "заяц"], ["chicken", "курица"],
  ["mother", "мама"], ["father", "папа"], ["sister", "сестра"], ["brother", "брат"],
  ["family", "семья"], ["friend", "друг"], ["child", "ребёнок"], ["baby", "малыш"],
  ["bread", "хлеб"], ["milk", "молоко"], ["cheese", "сыр"], ["apple", "яблоко"],
  ["banana", "банан"], ["orange", "апельсин"], ["tomato", "помидор"], ["potato", "картофель"],
  ["meat", "мясо"], ["soup", "суп"], ["tea", "чай"], ["coffee", "кофе"],
  ["one", "один"], ["two", "два"], ["three", "три"], ["four", "четыре"],
  ["five", "пять"], ["six", "шесть"], ["seven", "семь"], ["eight", "восемь"],
  ["nine", "девять"], ["ten", "десять"], ["red", "красный"], ["blue", "синий"],
  ["green", "зелёный"], ["yellow", "жёлтый"], ["black", "чёрный"], ["white", "белый"],
  ["pink", "розовый"], ["brown", "коричневый"], ["head", "голова"], ["hand", "рука"],
  ["leg", "нога"], ["eye", "глаз"], ["ear", "ухо"], ["nose", "нос"],
  ["mouth", "рот"], ["heart", "сердце"], ["table", "стол"], ["chair", "стул"],
  ["window", "окно"], ["door", "дверь"], ["bed", "кровать"], ["lamp", "лампа"],
  ["clock", "часы"], ["phone", "телефон"], ["car", "машина"], ["bus", "автобус"],
  ["train", "поезд"], ["plane", "самолёт"], ["road", "дорога"], ["city", "город"],
  ["school", "школа"], ["teacher", "учитель"], ["student", "ученик"], ["work", "работа"],
  ["play", "играть"], ["read", "читать"], ["write", "писать"], ["run", "бегать"],
  ["walk", "гулять"], ["sleep", "спать"], ["eat", "есть"], ["drink", "пить"],
  ["love", "любовь"], ["happy", "счастливый"], ["sad", "грустный"], ["big", "большой"],
  ["small", "маленький"], ["fast", "быстрый"], ["slow", "медленный"], ["new", "новый"]
];

function buildList(lang) {
  return PAIRS.map(([en, ru], i) => {
    const idx = String(i + 1).padStart(3, "0");
    const word = lang === "en" ? en : ru;
    const hint = lang === "en" ? ru : en;
    return { id: `seed_${lang}_${idx}`, word, hint, isBuiltIn: true };
  });
}

export const seedWords = {
  en: buildList("en"),
  ru: buildList("ru")
};
