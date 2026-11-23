let allWords = [];
let currentLesson = null;
let currentIndex = 0;
let reversed = localStorage.getItem("reversed") === "true";
let unknownWords = JSON.parse(localStorage.getItem("unknownWords")) || [];

// Yalnız BİR ad istifadə edirik
const UNKNOWN_LESSON = "Bilmediklərim";

/* ---------------- LOAD JSON ---------------- */
async function loadWords() {
  try {
    const response = await fetch("js/words.json");
    allWords = await response.json();

    // Köhnə səhv adla yaradılmış dərsi təmizlə (bir dəfəlik düzəliş)
    allWords = allWords.filter(w => w.lesson !== "Bilmədiklərim");

    if (unknownWords.length > 0) {
      addUnknownLesson();
    }

    generateLessonSelector();
  } catch (error) {
    console.error("JSON yüklənmədi:", error);
  }
}

/* ---------------- UNKNOWN LESSON YARAT ---------------- */
function addUnknownLesson() {
  const exists = allWords.some(w => w.lesson === UNKNOWN_LESSON);
  if (!exists) {
    allWords.push({ lesson: UNKNOWN_LESSON, words: unknownWords });
  }
}

/* ---------------- LESSON SELECTOR ---------------- */
function generateLessonSelector() {
  const selector = document.getElementById("lesson-select");
  if (!selector) return;

  selector.innerHTML = '<option value="" disabled selected>Dərs seçin</option>';

  allWords.forEach(lesson => {
    const option = document.createElement("option");
    option.value = lesson.lesson;
    option.textContent = lesson.lesson === UNKNOWN_LESSON ? "📚 Bilmediklərim" : lesson.lesson;
    selector.appendChild(option);
  });

  // Event-i yalnız BİR dəfə əlavə edirik (hər dəfə yox)
  if (!selector.dataset.bound) {
    selector.addEventListener("change", (e) => {
      if (e.target.value) showLessonWords(e.target.value);
    });
    selector.dataset.bound = "true";
  }
}

/* ---------------- SHOW LESSON WORDS ---------------- */
function showLessonWords(lessonName) {
  currentLesson = lessonName;
  currentIndex = 0;

  const lessonObj = allWords.find(w => w.lesson === lessonName);
  const lessonWords = lessonObj ? lessonObj.words : [];

  if (lessonWords.length > 0) {
    updateCard(lessonWords[currentIndex]);
  } else {
    document.getElementById("card-word").textContent = "Söz yoxdur";
  }

  document.getElementById("prev-btn").onclick = () => navigate(-1, lessonWords);
  document.getElementById("next-btn").onclick = () => navigate(1, lessonWords);
  document.getElementById("shuffle-btn").onclick = () => shuffleWords(lessonWords);
  document.getElementById("unknown-btn").onclick = () => addToUnknownWords(lessonWords);
}

/* ---------------- UPDATE CARD ---------------- */
function updateCard(word) {
  const card = document.getElementById("word-card");
  card.classList.remove("flipped");

  if (reversed) {
    // Azərbaycanca ön üz, ingiliscə arxa üz
    document.getElementById("card-word").textContent = word.meaning;
    document.getElementById("card-example").textContent = word.example_az || "";
    document.getElementById("card-pronunciation-az").textContent = "";
    document.getElementById("card-meaning").textContent = word.word;
    document.getElementById("card-example-az").textContent = word.example || "";
  } else {
    // İngiliscə ön üz, Azərbaycanca arxa üz (normal rejim)
    document.getElementById("card-word").textContent = word.word;
    document.getElementById("card-example").textContent = word.example || "";
    document.getElementById("card-pronunciation-az").textContent =
      word.pronunciation_az ? `Oxunur: ${word.pronunciation_az}` : "";
    document.getElementById("card-meaning").textContent = word.meaning;
    document.getElementById("card-example-az").textContent = word.example_az || word.example || "";
  }

  // "Bildim" düyməsi yalnız "Bilmediklərim" dərsində görünür
  const learnedBtn = document.getElementById("learned-btn");
  if (currentLesson === UNKNOWN_LESSON) {
    learnedBtn.style.display = "block";
    learnedBtn.onclick = () => removeFromUnknownWords(word);
  } else {
    learnedBtn.style.display = "none";
  }
}

/* ---------------- NAVIGATE ---------------- */
function navigate(direction, words) {
  if (words.length === 0) return;
  currentIndex += direction;
  if (currentIndex < 0) currentIndex = words.length - 1;
  if (currentIndex >= words.length) currentIndex = 0;
  updateCard(words[currentIndex]);
}

/* ---------------- SHUFFLE ---------------- */
function shuffleWords(words) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const lessonIndex = allWords.findIndex(w => w.lesson === currentLesson);
  if (lessonIndex !== -1) allWords[lessonIndex].words = shuffled;
  currentIndex = 0;
  updateCard(shuffled[currentIndex]);
}

/* ---------------- ADD TO UNKNOWN ---------------- */
function addToUnknownWords(lessonWords) {
  if (lessonWords.length === 0) return;

  const currentWord = lessonWords[currentIndex];
  const isAlreadyAdded = unknownWords.some(
    uw => uw.word === currentWord.word && uw.lesson === currentLesson
  );

  if (!isAlreadyAdded) {
    unknownWords.push({
      word: currentWord.word,
      meaning: currentWord.meaning,
      lesson: currentLesson,
      example: currentWord.example,
      example_az: currentWord.example_az,
      pronunciation_az: currentWord.pronunciation_az
    });
    localStorage.setItem("unknownWords", JSON.stringify(unknownWords));
    alert("Bilmədiyiniz sözlər siyahısına əlavə edildi!");
  } else {
    alert("Bu söz artıq siyahıda var!");
  }
}

/* ---------------- REMOVE FROM UNKNOWN ("Bildim") ---------------- */
function removeFromUnknownWords(word) {
  unknownWords = unknownWords.filter(
    uw => !(uw.word === word.word && uw.lesson === word.lesson)
  );
  localStorage.setItem("unknownWords", JSON.stringify(unknownWords));

  const lessonIndex = allWords.findIndex(w => w.lesson === UNKNOWN_LESSON);
  if (lessonIndex === -1) return;

  allWords[lessonIndex].words = allWords[lessonIndex].words.filter(
    w => !(w.word === word.word && w.lesson === word.lesson)
  );

  if (allWords[lessonIndex].words.length === 0) {
    allWords.splice(lessonIndex, 1);
    generateLessonSelector();
    document.getElementById("lesson-select").value = "";
    currentLesson = null;
    alert("Bilmediklərim siyahısı boşaldı! 🎉");
  } else {
    if (currentIndex >= allWords[lessonIndex].words.length) {
      currentIndex = 0;
    }
    updateCard(allWords[lessonIndex].words[currentIndex]);
  }
}

/* ---------------- SHOW UNKNOWN LESSON ---------------- */
document.getElementById("unknown-lesson-btn").onclick = () => {
  if (unknownWords.length === 0) {
    alert("Bilmədiyiniz söz yoxdur!");
    return;
  }
  addUnknownLesson();      // varsa yenisi yaratmır
  generateLessonSelector();
  document.getElementById("lesson-select").value = UNKNOWN_LESSON;
  showLessonWords(UNKNOWN_LESSON);
};

/* ---------------- CARD FLIP ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadWords();

  const card = document.getElementById("word-card");
  card.addEventListener("click", () => card.classList.toggle("flipped"));

  // 🔄 Çevir düyməsi: istiqaməti dəyiş
  const reverseBtn = document.getElementById("reverse-btn");
  updateReverseBtnText(reverseBtn);
  reverseBtn.addEventListener("click", () => {
    reversed = !reversed;
    localStorage.setItem("reversed", reversed); // seçim yadda qalır
    updateReverseBtnText(reverseBtn);

    // Cari sözü yeni rejimdə yenidən göstər
    const lessonObj = allWords.find(w => w.lesson === currentLesson);
    if (lessonObj && lessonObj.words.length > 0) {
      updateCard(lessonObj.words[currentIndex]);
    }
  });
});

function updateReverseBtnText(btn) {
  btn.textContent = reversed ? "🔄 İngiliscə göstər" : "🔄 Azərbaycanca göstər";
}