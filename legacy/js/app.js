(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  // ---------- Хранилище (localStorage может быть недоступен) ----------
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    },
  };

  const LEARNED_STREAK = 3;
  let progress = store.get("hy-progress", {});

  const stat = (l) => progress[l.up] || { ok: 0, bad: 0, streak: 0 };
  const isLearned = (l) => stat(l).streak >= LEARNED_STREAK;

  function record(letter, correct) {
    const s = stat(letter);
    if (correct) { s.ok++; s.streak++; } else { s.bad++; s.streak = 0; }
    progress[letter.up] = s;
    store.set("hy-progress", progress);
    renderProgress();
    renderGrid();
  }

  function renderProgress() {
    const n = LETTERS.filter(isLearned).length;
    $("#progress-fill").style.width = (n / LETTERS.length) * 100 + "%";
    $("#progress-text").textContent = `${n} / ${LETTERS.length}`;
  }

  // ---------- Группы букв ----------
  const confusableSet = new Set(CONFUSABLE.flat());
  const GROUPS = [
    { id: "1", label: "1–10",  pick: (_, i) => i < 10 },
    { id: "2", label: "11–20", pick: (_, i) => i >= 10 && i < 20 },
    { id: "3", label: "21–30", pick: (_, i) => i >= 20 && i < 30 },
    { id: "4", label: "31–39", pick: (_, i) => i >= 30 },
    { id: "hard", label: "Похожие", pick: (l) => confusableSet.has(l.up) },
    { id: "weak", label: "Невыученные", pick: (l) => !isLearned(l) },
    { id: "all", label: "Все", pick: () => true },
  ];
  let groupId = store.get("hy-group", "1");

  function pool() {
    const g = GROUPS.find((g) => g.id === groupId) || GROUPS[0];
    const list = LETTERS.filter(g.pick);
    return list.length ? list : LETTERS; // «Невыученные» может опустеть
  }

  function renderGroups() {
    $("#group-select").innerHTML = GROUPS.map((g) =>
      `<button class="chip ${g.id === groupId ? "active" : ""}" data-group="${g.id}">${g.label}</button>`
    ).join("");
  }
  $("#group-select").addEventListener("click", (e) => {
    const b = e.target.closest("[data-group]");
    if (!b) return;
    groupId = b.dataset.group;
    store.set("hy-group", groupId);
    renderGroups();
    renderGrid();
    nextCard();
    nextQuestion();
  });

  // ---------- Утилиты ----------
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const glyph = (l) => (l.up === l.low ? l.low : `${l.up} ${l.low}`);

  // Невыученные и часто ошибочные буквы выпадают чаще; одна и та же буква не повторяется подряд
  function pickWeighted(list, avoid) {
    const cand = list.length > 1 ? list.filter((l) => l !== avoid) : list;
    const weights = cand.map((l) => {
      const s = stat(l);
      return isLearned(l) ? 1 : 4 + Math.max(0, s.bad - s.ok);
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cand.length; i++) { r -= weights[i]; if (r <= 0) return cand[i]; }
    return cand[cand.length - 1];
  }

  // Неправильные варианты: сначала «пара» буквы, затем буквы из текущей группы, затем любые
  function distractors(letter, count) {
    const partners = CONFUSABLE.filter((p) => p.includes(letter.up)).flat()
      .filter((u) => u !== letter.up).map((u) => LETTERS.find((l) => l.up === u));
    const others = shuffle(pool().filter((l) => l !== letter && !partners.includes(l)));
    const rest = shuffle(LETTERS.filter((l) => l !== letter && !partners.includes(l) && !others.includes(l)));
    return [...partners, ...others, ...rest].slice(0, count);
  }

  // ---------- Озвучка (если в системе есть армянский голос) ----------
  let hyVoice = null;
  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    hyVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("hy")) || null;
  }
  if ("speechSynthesis" in window) {
    loadVoices();
    speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  }
  function speak(text) {
    if (!hyVoice) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = hyVoice; u.lang = hyVoice.lang; u.rate = 0.8;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  const speakBtn = (text) => (hyVoice ? `<button class="speak" data-say="${text}">🔊</button>` : "");
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) { e.preventDefault(); e.stopPropagation(); speak(b.dataset.say); }
  });

  // ---------- Вкладки ----------
  let view = "alphabet";
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    view = t.dataset.view;
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
    location.hash = view;
  }));
  const initial = location.hash.slice(1);
  if (["alphabet", "cards", "quiz"].includes(initial)) $(`.tab[data-view="${initial}"]`).click();

  // ---------- Алфавит ----------
  function renderGrid() {
    const inPool = new Set(pool());
    $("#grid").innerHTML = LETTERS.map((l, i) => `
      <button class="cell ${isLearned(l) ? "learned" : ""} ${inPool.has(l) ? "" : "dim"}" data-i="${i}">
        <div class="glyph hy">${l.up}${l.up !== l.low ? `<small>${l.low}</small>` : ""}</div>
        <div class="tr">${l.tr}</div>
        <div class="nm">${l.name}</div>
      </button>`).join("");
  }
  $("#grid").addEventListener("click", (e) => {
    const c = e.target.closest(".cell");
    if (c) showDetail(LETTERS[c.dataset.i]);
  });

  function showDetail(l) {
    const s = stat(l);
    $("#detail-body").innerHTML = `
      <div class="d-glyph hy">${glyph(l)}</div>
      <div class="d-name">«${l.name}» · <span class="hy">${l.arm}</span>${speakBtn(l.arm)}</div>
      <dl>
        <div class="d-row"><dt>Звук</dt><dd>${l.sound}</dd></div>
        <div class="d-row"><dt>Пример</dt><dd><span class="hy">${l.word}</span>${speakBtn(l.word)}<br>[${l.read}] — ${l.ru}</dd></div>
        <div class="d-row"><dt>Статистика</dt><dd>верно ${s.ok}, ошибок ${s.bad}${isLearned(l) ? " · выучена ✓" : ""}</dd></div>
      </dl>
      ${l.note ? `<div class="note">${l.note}</div>` : ""}`;
    $("#detail").showModal();
  }
  $("#detail").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  // ---------- Карточки ----------
  let card = null;
  function nextCard() {
    card = pickWeighted(pool(), card);
    $("#flashcard").classList.remove("flipped");
    $("#fc-letter").textContent = card.up === card.low ? card.low : `${card.up}${card.low}`;
    // заполняем оборот чуть позже, чтобы ответ не мелькнул во время анимации переворота
    setTimeout(() => {
      $("#fc-back").innerHTML = `
        <div class="b-glyph hy">${glyph(card)}</div>
        <div class="b-tr">${card.tr}</div>
        <div>«${card.name}» — ${card.sound}</div>
        <div class="b-word"><span class="hy">${card.word}</span> [${card.read}] — ${card.ru}</div>`;
    }, 250);
    $("#fc-no").disabled = $("#fc-yes").disabled = true;
  }
  function flipCard() {
    $("#flashcard").classList.toggle("flipped");
    $("#fc-no").disabled = $("#fc-yes").disabled = false;
  }
  function answerCard(ok) {
    if ($("#fc-yes").disabled) return;
    record(card, ok);
    nextCard();
  }
  $("#flashcard").addEventListener("click", flipCard);
  $("#fc-flip").addEventListener("click", flipCard);
  $("#fc-yes").addEventListener("click", () => answerCard(true));
  $("#fc-no").addEventListener("click", () => answerCard(false));

  // ---------- Тест ----------
  let mode = "letter";
  let q = null; // { letter, options, answered }
  let score = 0, total = 0;

  $(".quiz-modes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    mode = b.dataset.mode;
    $$(".quiz-modes .chip").forEach((x) => x.classList.toggle("active", x === b));
    nextQuestion();
  });

  function nextQuestion() {
    const letter = pickWeighted(pool(), q?.letter);
    const options = shuffle([letter, ...distractors(letter, 3)]);
    q = { letter, options, answered: false };

    const p = $("#q-prompt");
    if (mode === "letter") {
      p.innerHTML = `<div class="big hy">${glyph(letter)}</div><div class="q-sub">Как читается эта буква?</div>`;
    } else if (mode === "sound") {
      p.innerHTML = `<div class="q-sound">${letter.tr}</div><div class="q-sub">${letter.sound}<br>Какая буква даёт этот звук?</div>`;
    } else {
      p.innerHTML = `<div class="q-word hy">${letter.word}</div><div class="q-sub">Как читается это слово?</div>`;
    }

    $("#q-options").innerHTML = options.map((o, i) => {
      const label = mode === "letter" ? o.tr : mode === "sound" ? glyph(o) : o.read;
      return `<button class="opt ${mode === "sound" ? "hy" : ""}" data-i="${i}">${label}</button>`;
    }).join("");
    $("#q-feedback").innerHTML = "";
    $("#q-next").hidden = true;
  }

  function answer(i) {
    if (!q || q.answered) return;
    q.answered = true;
    const chosen = q.options[i];
    const ok = chosen === q.letter;
    const l = q.letter;
    total++; if (ok) score++;
    $("#q-score").textContent = score;
    $("#q-total").textContent = total;
    record(l, ok);

    $$(".opt").forEach((b, j) => {
      b.disabled = true;
      if (q.options[j] === l) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
    });

    const explain = mode === "word"
      ? `<span class="hy">${l.word}</span> [${l.read}] — ${l.ru}`
      : `<span class="hy">${glyph(l)}</span> — «${l.name}», ${l.sound}`;
    if (ok) {
      $("#q-feedback").innerHTML = `✓ Верно! ${explain}`;
      setTimeout(() => { if (q.letter === l && q.answered) nextQuestion(); }, 1100);
    } else {
      const wrongNote = mode === "word" ? "" :
        `<br><span class="hy">${glyph(chosen)}</span> — это «${chosen.name}», ${chosen.tr}`;
      $("#q-feedback").innerHTML = `✗ Правильно: ${explain}${wrongNote}`;
      $("#q-next").hidden = false;
    }
  }
  $("#q-options").addEventListener("click", (e) => {
    const b = e.target.closest(".opt");
    if (b) answer(+b.dataset.i);
  });
  $("#q-next").addEventListener("click", nextQuestion);

  // ---------- Клавиатура ----------
  document.addEventListener("keydown", (e) => {
    if ($("#detail").open || e.ctrlKey || e.metaKey || e.altKey) return;
    if (view === "cards") {
      if (e.key === " ") { e.preventDefault(); flipCard(); }
      else if (e.key === "1") answerCard(false);
      else if (e.key === "2") answerCard(true);
    } else if (view === "quiz") {
      if (/^[1-4]$/.test(e.key)) answer(+e.key - 1);
      else if (e.key === "Enter" && q?.answered) nextQuestion();
    }
  });

  // ---------- Сброс ----------
  $("#reset").addEventListener("click", () => {
    if (!confirm("Сбросить весь прогресс?")) return;
    progress = {};
    store.set("hy-progress", progress);
    renderProgress();
    renderGrid();
  });

  // ---------- Старт ----------
  renderGroups();
  renderProgress();
  renderGrid();
  nextCard();
  nextQuestion();
})();
