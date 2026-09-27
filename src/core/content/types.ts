// Типы учебного контента (формат описан в docs/04-content.md).

export interface ReadingRule {
  canonical: string; // эталонное чтение русскими буквами
  partial: string[]; // «почти» — засчитывается в мягком режиме
}

export interface LetterSound extends ReadingRule {
  ipa: string;
  ru: string; // описание звука для человека
  accept: string[]; // тоже полностью верно (для задания на отдельную букву)
  initial?: ReadingRule; // чтение в начале слова (Ե → «йе», Ո → «во», և → «йев»)
  /** Подпись в вариантах ответа, если чтение совпадает с другой буквой (Հ «h — лёгкое х» против Խ «х»). */
  choiceLabel?: string;
}

export interface ImageRef {
  file: string; // путь относительно корня сайта: img/words/arasaac-2520.webp
  source: string;
  license: string;
  author?: string;
}

export interface Letter {
  id: string;
  upper: string;
  lower: string;
  order: number; // место в алфавите
  name: { hy: string; ru: string };
  sound: LetterSound;
  notes: string[];
  confusable: { sound: string[]; shape: string[] };
  words: string[]; // слова-примеры, первое — главное
  handwriting: { upper: string | null; lower: string } | null; // у և нет заглавной формы
  audio: string | null;
  reviewed: boolean;
}

export interface Word {
  id: string;
  hy: string;
  pronunciation: string; // как звучит в речи, с непроизносимым «ы»
  exception: boolean; // читается не по общим правилам
  ru: string;
  image: ImageRef | null;
  tags: string[];
  /** Темы раздела «Первые слова» (docs/10-first-words.md). */
  themes?: string[];
  level: number;
  reviewed: boolean;
}

/** Армянская фраза раздела «Первые слова» (docs/10-first-words.md, 10.7). */
export interface Phrase {
  id: string;
  hy: string; // с армянскими знаками препинания: «Ինչպե՞ս ես։»
  pronunciation: string;
  ru: string;
  themes: string[];
  reviewed: boolean;
}

export interface RuWord {
  id: string;
  ru: string;
  image: ImageRef | null;
}

/** Русская фраза или мини-текст для смешанного чтения (E09). */
export interface RuPhrase {
  id: string;
  ru: string;
  kind: "phrase" | "text";
}

export interface Lesson {
  id: string;
  title: string;
  newItems: string[]; // "letter:ayb"
}

/** Тема раздела «Первые слова»: уроки идут по порядку, темы — в любом. */
export interface Theme {
  id: string;
  title: string;
  emoji: string;
  status: "available" | "coming-soon";
  lessons: Lesson[];
}

export interface Section {
  id: string;
  title: string;
  status: "available" | "coming-soon";
  lessons: Lesson[];
  themes?: Theme[];
}

export interface Course {
  sections: Section[];
}

/** Русский звук → армянские буквы с этим звуком; первая — основная (docs/04-content.md). */
export type RuHyRules = Record<string, string[]>;

export interface Content {
  letters: Letter[];
  words: Word[];
  ruWords: RuWord[];
  ruPhrases: RuPhrase[];
  phrases: Phrase[];
  course: Course;
  ruHy: RuHyRules;
}
