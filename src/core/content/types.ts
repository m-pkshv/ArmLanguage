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
}

export interface ImageRef {
  file: string; // путь относительно корня сайта: img/words/fish.svg
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
  level: number;
  reviewed: boolean;
}

export interface RuWord {
  id: string;
  ru: string;
  image: ImageRef | null;
}

export interface Lesson {
  id: string;
  title: string;
  newItems: string[]; // "letter:ayb"
}

export interface Section {
  id: string;
  title: string;
  status: "available" | "coming-soon";
  lessons: Lesson[];
}

export interface Course {
  sections: Section[];
}

export interface Content {
  letters: Letter[];
  words: Word[];
  ruWords: RuWord[];
  course: Course;
}
