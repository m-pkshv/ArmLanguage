// Временный список букв для каркаса приложения (этап 1).
// На этапе 2 заменяется данными из content/alphabet/letters.json (см. docs/04-content.md).
// id — стабильные латинские идентификаторы, они используются в адресах и в прогрессе и не меняются.

export interface LetterStub {
  id: string;
  upper: string;
  lower: string;
}

const RAW: [id: string, upper: string, lower: string][] = [
  ["ayb", "Ա", "ա"], ["ben", "Բ", "բ"], ["gim", "Գ", "գ"], ["da", "Դ", "դ"], ["yech", "Ե", "ե"],
  ["za", "Զ", "զ"], ["e", "Է", "է"], ["yt", "Ը", "ը"], ["tho", "Թ", "թ"], ["zhe", "Ժ", "ժ"],
  ["ini", "Ի", "ի"], ["lyun", "Լ", "լ"], ["xe", "Խ", "խ"], ["tsa", "Ծ", "ծ"], ["ken", "Կ", "կ"],
  ["ho", "Հ", "հ"], ["dza", "Ձ", "ձ"], ["ghat", "Ղ", "ղ"], ["che", "Ճ", "ճ"], ["men", "Մ", "մ"],
  ["yi", "Յ", "յ"], ["nu", "Ն", "ն"], ["sha", "Շ", "շ"], ["vo", "Ո", "ո"], ["chha", "Չ", "չ"],
  ["pe", "Պ", "պ"], ["je", "Ջ", "ջ"], ["rra", "Ռ", "ռ"], ["se", "Ս", "ս"], ["vev", "Վ", "վ"],
  ["tyun", "Տ", "տ"], ["re", "Ր", "ր"], ["tsho", "Ց", "ց"], ["u", "Ու", "ու"], ["pyur", "Փ", "փ"],
  ["ke", "Ք", "ք"], ["yev", "Եվ", "և"], ["o", "Օ", "օ"], ["fe", "Ֆ", "ֆ"],
];

export const LETTERS: LetterStub[] = RAW.map(([id, upper, lower]) => ({ id, upper, lower }));

export const letterById = (id: string): LetterStub | undefined => LETTERS.find((l) => l.id === id);
