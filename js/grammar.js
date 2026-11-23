/* Hər iki səhifə (grammar.html və grammar-lesson.html) bu faylı istifadə edir. */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function loadGrammar() {
  const response = await fetch("js/grammar.json");
  if (!response.ok) throw new Error("grammar.json tapılmadı");
  return response.json();
}

/* ---------------- KART SİYAHISI (grammar.html) ---------------- */
function renderList(container, lessons) {
  lessons.forEach(lesson => {
    const card = el("a", "grammar-card");
    card.href = "grammar-lesson.html?id=" + encodeURIComponent(lesson.id);

    card.appendChild(el("span", "level-badge", lesson.level));
    card.appendChild(el("h3", "", lesson.title));
    card.appendChild(el("span", "card-az", lesson.title_az));
    card.appendChild(el("p", "card-summary", lesson.summary));

    container.appendChild(card);
  });
}

/* ---------------- DƏRS SƏHİFƏSİ (grammar-lesson.html) ---------------- */
function renderSection(section) {
  const box = el("section", "lesson-section");
  box.appendChild(el("h2", "", section.heading));

  if (section.text) {
    box.appendChild(el("p", "", section.text));
  }

  if (section.table) {
    const wrap = el("div", "table-wrap");
    const table = el("table", "lesson-table");

    const headRow = el("tr");
    section.table.headers.forEach(h => headRow.appendChild(el("th", "", h)));
    const thead = el("thead");
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el("tbody");
    section.table.rows.forEach(row => {
      const tr = el("tr");
      row.forEach(cell => tr.appendChild(el("td", "", cell)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrap.appendChild(table);
    box.appendChild(wrap);
  }

  if (section.examples && section.examples.length > 0) {
    const list = el("ul", "example-list");
    section.examples.forEach(ex => {
      const li = el("li");
      li.appendChild(el("span", "ex-en", ex.en));
      li.appendChild(el("span", "ex-az", ex.az));
      list.appendChild(li);
    });
    box.appendChild(list);
  }

  if (section.note) {
    box.appendChild(el("div", "lesson-note", "💡 " + section.note));
  }

  return box;
}

function renderLesson(container, lessons) {
  const id = new URLSearchParams(window.location.search).get("id");
  const index = lessons.findIndex(l => l.id === id);

  if (index === -1) {
    container.appendChild(el("h1", "", "Dərs tapılmadı"));
    container.appendChild(el("p", "lesson-intro", "Grammar səhifəsinə qayıdıb mövzunu yenidən seçin."));
    return;
  }

  const lesson = lessons[index];
  document.title = lesson.title;

  container.appendChild(el("span", "level-badge", lesson.level));
  container.appendChild(el("h1", "", lesson.title));
  container.appendChild(el("p", "lesson-az", lesson.title_az));
  container.appendChild(el("p", "lesson-intro", lesson.intro));

  lesson.sections.forEach(section => container.appendChild(renderSection(section)));

  // Əvvəlki / sonrakı dərs
  const nav = document.getElementById("lesson-nav");
  if (nav) {
    if (index > 0) {
      const prev = el("a", "", "⬅ " + lessons[index - 1].title);
      prev.href = "grammar-lesson.html?id=" + encodeURIComponent(lessons[index - 1].id);
      nav.appendChild(prev);
    }
    if (index < lessons.length - 1) {
      const next = el("a", "", lessons[index + 1].title + " ➡");
      next.href = "grammar-lesson.html?id=" + encodeURIComponent(lessons[index + 1].id);
      nav.appendChild(next);
    }
  }
}

/* ---------------- BAŞLANĞIC ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("grammar-list");
  const lessonBox = document.getElementById("lesson-content");
  const target = list || lessonBox;
  if (!target) return;

  try {
    const lessons = await loadGrammar();
    if (list) renderList(list, lessons);
    if (lessonBox) renderLesson(lessonBox, lessons);
  } catch (error) {
    console.error("Grammar yüklənmədi:", error);
    target.appendChild(el("p", "", "Məzmun yüklənmədi. Saytı yerli server (məsələn, Live Server) ilə açın."));
  }
});