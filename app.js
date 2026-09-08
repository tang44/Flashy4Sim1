/* ============================================================
   CHINESE STUDY APP
   Matched to current index.html
   Plain HTML / CSS / JavaScript
   No Vite / npm required
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const EXCEL_FILE = "WM_level1_all_with_HSK.xlsx";


/* ============================================================
   APP STATE
============================================================ */

const state = {

  vocabulary: [],
  filteredVocabulary: [],

  studySet: [],
  cardIndex: 0,
  cardFlipped: false,

  flashcardExample: null,

  readingExampleNumber: 1,
  readingIndex: 0,
  currentReadingRow: null,
  currentReadingExample: null,

  progress: {},

  gameWords: [],
  currentGame: null,
  currentGameIndex: 0,
  gameScore: 0,

  matchingMatches: 0,
  matchingSelected: null

};


/* ============================================================
   DOM HELPERS
============================================================ */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}


/* ============================================================
   GENERAL HELPERS
============================================================ */

function clean(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();

}


function escapeHTML(value) {

  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {
  return escapeHTML(value);
}


function shuffle(array) {

  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }

  return result;

}


/* ============================================================
   EXCEL HELPERS
============================================================ */

function getRowValue(row, possibleNames) {

  for (const name of possibleNames) {

    if (
      Object.prototype.hasOwnProperty.call(
        row,
        name
      )
    ) {

      const value = clean(row[name]);

      if (value) {
        return value;
      }

    }

  }

  return "";

}


function getLesson(row) {

  return getRowValue(
    row,
    [
      "Lesson#",
      "Lesson",
      "Lesson #",
      "Lesson_Number",
      "Lesson Number"
    ]
  );

}


function getTopic(row) {

  return getRowValue(
    row,
    [
      "Topic",
      "Lesson Topic"
    ]
  );

}


function getHSKNumber(row) {

  return getRowValue(
    row,
    [
      "HSK_Number",
      "HSK Number",
      "HSK#",
      "HSK #"
    ]
  );

}


function getHSKLevel(row) {

  return getRowValue(
    row,
    [
      "HSK_Level",
      "HSK Level"
    ]
  );

}


function getCLIEnglish(row) {

  return getRowValue(
    row,
    [
      "CLI_English",
      "CLI English"
    ]
  );

}


/* ============================================================
   EXAMPLE SENTENCES
============================================================ */

/* ============================================================
   EXAMPLE SENTENCES
============================================================ */

function getAvailableExamples(row) {

  const examples = [];

  /*
    Normalize column names so these all match:

    Example_1_Chinese
    Example 1 Chinese
    Example1_Chinese
    Example1 Chinese
    Example1Chinese
  */

  const normalizeKey = value =>
    clean(value)
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const rowKeys = Object.keys(row);

  function findExampleColumn(number, type) {

    const target =
      normalizeKey(
        `Example${number}${type}`
      );

    return rowKeys.find(
      key =>
        normalizeKey(key) === target
    );

  }

  for (let i = 1; i <= 3; i++) {

    const chineseColumn =
      findExampleColumn(
        i,
        "Chinese"
      );

    const pinyinColumn =
      findExampleColumn(
        i,
        "Pinyin"
      );

    const englishColumn =
      findExampleColumn(
        i,
        "English"
      );


    const chinese =
      chineseColumn
        ? clean(row[chineseColumn])
        : "";

    const pinyin =
      pinyinColumn
        ? clean(row[pinyinColumn])
        : "";

    const english =
      englishColumn
        ? clean(row[englishColumn])
        : "";


    if (
      chinese ||
      pinyin ||
      english
    ) {

      examples.push({

        number: i,

        chinese,

        pinyin,

        english

      });

    }

  }

  return examples;

}


/* ============================================================
   LOADING
============================================================ */

async function loadVocabulary() {

  showLoading();

  try {

    if (
      typeof XLSX === "undefined"
    ) {

      throw new Error(
        "SheetJS could not be loaded. Check the SheetJS script in index.html and make sure you are connected to the internet."
      );

    }

    console.log(
      "Loading vocabulary from:",
      EXCEL_FILE
    );

    const response =
      await fetch(EXCEL_FILE);

    if (!response.ok) {

      throw new Error(
        `Could not load ${EXCEL_FILE}. HTTP ${response.status}`
      );

    }

    const buffer =
      await response.arrayBuffer();

    console.log(
      "Excel file downloaded successfully."
    );

    const workbook =
      XLSX.read(
        buffer,
        {
          type: "array"
        }
      );

    if (
      !workbook.SheetNames.length
    ) {

      throw new Error(
        "The Excel workbook does not contain any worksheets."
      );

    }

    const firstSheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json(
        firstSheet,
        {
          defval: ""
        }
      );

    console.log(
      "Excel rows found:",
      rows.length
    );

    state.vocabulary =
      rows.filter(
        row =>
          clean(row.Simplified)
      );

    console.log(
      "Loaded vocabulary:",
      state.vocabulary.length
    );

    if (
      !state.vocabulary.length
    ) {

      throw new Error(
        "No vocabulary rows containing a Simplified word were found. Check the Excel column name."
      );

    }

    const firstRow =
      state.vocabulary[0];

    const simplifiedColumn =
      Object.prototype.hasOwnProperty.call(
        firstRow,
        "Simplified"
      );

    const englishColumn =
      Object.prototype.hasOwnProperty.call(
        firstRow,
        "English"
      );

    if (
      !simplifiedColumn ||
      !englishColumn
    ) {

      throw new Error(
        "The Excel file must contain at least the columns 'Simplified' and 'English'."
      );

    }

    initializeApp();

  } catch (error) {

    console.error(
      "Vocabulary loading error:",
      error
    );

    showError(
      error.message
    );

  }

}


/* ============================================================
   INITIALIZE APP
============================================================ */

function initializeApp() {

  console.log(
    "Initializing Chinese Study App..."
  );

  loadProgress();

  state.filteredVocabulary =
    [...state.vocabulary];

  populateFilters();

  createDefaultStudySet();

  setupNavigation();

  setupFlashcards();

  setupReading();

  setupGames();

  setupProgress();

  setupHomeButtons();

  updateStats();

  updateWordCount();

  renderFlashcard();

  renderReading();

  updateProgressDisplay();

  hideLoading();

  console.log(
    "Chinese Study App initialized successfully."
  );

}


/* ============================================================
   LOADING / ERROR UI
============================================================ */

function showLoading() {

  const loading =
    $("#loading-message");

  if (loading) {

    loading.classList.remove(
      "hidden"
    );

    loading.style.display =
      "block";

  }

  const error =
    $("#error-message");

  if (error) {

    error.classList.add(
      "hidden"
    );

    error.style.display =
      "none";

  }

}


function hideLoading() {

  const loading =
    $("#loading-message");

  if (loading) {

    loading.classList.add(
      "hidden"
    );

    loading.style.display =
      "none";

  }

}


function showError(message) {

  const loading =
    $("#loading-message");

  if (loading) {

    loading.classList.add(
      "hidden"
    );

    loading.style.display =
      "none";

  }

  const error =
    $("#error-message");

  if (error) {

    error.classList.remove(
      "hidden"
    );

    error.style.display =
      "block";

  }

  const errorText =
    $("#error-text");

  if (errorText) {

    errorText.textContent =
      message;

  }

}


/* ============================================================
   ERROR RELOAD BUTTON
============================================================ */

function setupReloadButton() {

  const button =
    $("#reload-button");

  if (button) {

    button.addEventListener(
      "click",
      () => {
        loadVocabulary();
      }
    );

  }

}


/* ============================================================
   FILTERS
============================================================ */

function populateFilters() {

  const lessonSelect =
    $("#lesson-filter");

  const topicSelect =
    $("#topic-filter");

  const hskSelect =
    $("#hsk-filter");


  /* LESSONS */

  if (lessonSelect) {

    const lessons =
      [
        ...new Set(
          state.vocabulary
            .map(
              row =>
                getLesson(row)
            )
            .filter(Boolean)
        )
      ];

    lessons.sort(
      (a, b) =>
        Number(a) - Number(b)
    );

    lessonSelect.innerHTML =
      `<option value="">All Lessons</option>` +
      lessons
        .map(
          lesson =>
            `
              <option value="${escapeAttribute(lesson)}">
                ${escapeHTML(lesson)}
              </option>
            `
        )
        .join("");

  }


  /* TOPICS */

  if (topicSelect) {

    const topics =
      [
        ...new Set(
          state.vocabulary
            .map(
              row =>
                getTopic(row)
            )
            .filter(Boolean)
        )
      ].sort();

    topicSelect.innerHTML =
      `<option value="">All Topics</option>` +
      topics
        .map(
          topic =>
            `
              <option value="${escapeAttribute(topic)}">
                ${escapeHTML(topic)}
              </option>
            `
        )
        .join("");

  }


  /* HSK LEVELS */

  if (hskSelect) {

    const levels =
      [
        ...new Set(
          state.vocabulary
            .map(
              row =>
                getHSKLevel(row)
            )
            .filter(Boolean)
        )
      ].sort();

    hskSelect.innerHTML =
      `<option value="">All HSK Levels</option>` +
      levels
        .map(
          level =>
            `
              <option value="${escapeAttribute(level)}">
                ${escapeHTML(level)}
              </option>
            `
        )
        .join("");

  }


  /* FILTER EVENTS */

  if (lessonSelect) {

    lessonSelect.addEventListener(
      "change",
      applyFilters
    );

  }

  if (topicSelect) {

    topicSelect.addEventListener(
      "change",
      applyFilters
    );

  }

  if (hskSelect) {

    hskSelect.addEventListener(
      "change",
      applyFilters
    );

  }

}


function applyFilters() {

  const lesson =
    $("#lesson-filter")?.value || "";

  const topic =
    $("#topic-filter")?.value || "";

  const hsk =
    $("#hsk-filter")?.value || "";


  state.filteredVocabulary =
    state.vocabulary.filter(
      row => {

        if (
          lesson &&
          getLesson(row) !== lesson
        ) {
          return false;
        }

        if (
          topic &&
          getTopic(row) !== topic
        ) {
          return false;
        }

        if (
          hsk &&
          getHSKLevel(row) !== hsk
        ) {
          return false;
        }

        return true;

      }
    );


  createDefaultStudySet();

  updateWordCount();

  renderFlashcard();

  renderReading();

}


/* ============================================================
   STUDY SET
============================================================ */

function createDefaultStudySet() {

  const sizeValue =
    $("#study-size")?.value || "all";

  const shuffled =
    shuffle(
      state.filteredVocabulary
    );

  if (sizeValue === "all") {
    state.studySet = shuffled;
  } else {
    const size = Number(sizeValue);

    state.studySet =
      shuffled.slice(
        0,
        Math.min(
          size,
          state.filteredVocabulary.length
        )
      );
  }

  state.cardIndex = 0;
  state.cardFlipped = false;
  state.flashcardExample = null;

}


/* ============================================================
   CREATE STUDY SET BUTTON
============================================================ */

function setupStudySetButton() {

  const button =
    $("#create-study-set");

  if (button) {

    button.addEventListener(
      "click",
      () => {

        createDefaultStudySet();

        renderFlashcard();

      }
    );

  }

}


/* ============================================================
   FLASHCARDS
============================================================ */

function setupFlashcards() {

  const studySize =
    $("#study-size");

  if (studySize) {

    studySize.addEventListener(
      "change",
      () => {

        createDefaultStudySet();

        renderFlashcard();

      }
    );

  }


  const next =
    $("#next-card");

  if (next) {

    next.addEventListener(
      "click",
      nextCard
    );

  }


  const previous =
    $("#previous-card");

  if (previous) {

    previous.addEventListener(
      "click",
      previousCard
    );

  }


  const shuffleButton =
    $("#shuffle-card");

  if (shuffleButton) {

    shuffleButton.addEventListener(
      "click",
      () => {

        state.studySet =
          shuffle(
            state.studySet
          );

        state.cardIndex = 0;

        state.cardFlipped = false;

        state.flashcardExample = null;

        renderFlashcard();

      }
    );

  }


  const flashcard =
    $("#flashcard");

  if (flashcard) {

    flashcard.addEventListener(
      "click",
      event => {

        /*
          Don't flip the card when clicking
          one of the buttons on the back.
        */

        if (
          event.target.closest(
            "button"
          )
        ) {
          return;
        }

        toggleCard();

      }
    );

  }


  const speak =
    $("#flashcard-speak");

  if (speak) {

    speak.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        speakChinese(
          getCurrentFlashcardWord()
        );

      }
    );

  }


  const backSpeak =
    $("#back-speak");

  if (backSpeak) {

    backSpeak.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        speakChinese(
          getCurrentFlashcardWord()
        );

      }
    );

  }

}


function getCurrentFlashcardWord() {

  return state.studySet[
    state.cardIndex
  ];

}


function toggleCard() {

  state.cardFlipped =
    !state.cardFlipped;

  renderFlashcard();

}


function nextCard() {

  if (
    !state.studySet.length
  ) {
    return;
  }

  state.cardIndex =
    (
      state.cardIndex + 1
    ) %
    state.studySet.length;

  state.cardFlipped = false;

  state.flashcardExample = null;

  renderFlashcard();

}


function previousCard() {

  if (
    !state.studySet.length
  ) {
    return;
  }

  state.cardIndex =
    (
      state.cardIndex -
      1 +
      state.studySet.length
    ) %
    state.studySet.length;

  state.cardFlipped = false;

  state.flashcardExample = null;

  renderFlashcard();

}


/* ============================================================
   FLASHCARD RENDERING
============================================================ */

function renderFlashcard() {

  const row =
    getCurrentFlashcardWord();


  if (!row) {

    const front =
      $("#flashcard-simplified");

    if (front) {
      front.textContent = "—";
    }

    const progress =
      $("#flashcard-progress");

    if (progress) {
      progress.textContent = "0 / 0";
    }

    const details =
      $("#flashcard-details");

    if (details) {
      details.innerHTML =
        "<p>No vocabulary available.</p>";
    }

    return;

  }


  /* FRONT WORD */

  const front =
    $("#flashcard-simplified");

  if (front) {

    front.textContent =
      clean(row.Simplified);

  }


  /* CARD POSITION */

  const position =
    $("#flashcard-progress");

  if (position) {

    position.textContent =
      `${state.cardIndex + 1} / ${state.studySet.length}`;

  }


  /* CARD FLIP */

  const card =
    $("#flashcard");

  if (card) {

    card.classList.toggle(
      "flipped",
      state.cardFlipped
    );

  }


  /* BACK DETAILS */

  const details =
    $("#flashcard-details");

  if (details) {

    renderCardDetails(
      row
    );

  }

}


/* ============================================================
   FLASHCARD BACK DETAILS
============================================================ */

/* ============================================================
   FLASHCARD BACK DETAILS
============================================================ */

function renderCardDetails(row) {

  const container = $("#flashcard-details");

  if (!container) {
    return;
  }

  container.innerHTML = "";


  /* ==========================================================
     SIMPLIFIED + TRADITIONAL + LESSON/TOPIC
  ========================================================== */

  
  const simplified = clean(row.Simplified);
const flashcardWord = document.getElementById("flashcard-simplified");

const parenIndex = simplified.indexOf("(");

if (parenIndex !== -1) {
  const mainWord = simplified.slice(0, parenIndex).trim();
  const parenthetical = simplified.slice(parenIndex).trim();

  flashcardWord.innerHTML = "";

  const mainWordElement = document.createElement("span");
  mainWordElement.textContent = mainWord;

  const noteElement = document.createElement("span");
  noteElement.className = "traditional-note";
  noteElement.textContent = parenthetical;

  flashcardWord.appendChild(mainWordElement);
  flashcardWord.appendChild(noteElement);
} else {
  flashcardWord.textContent = simplified;
}
  const traditional = clean(row.Traditional);

  const lesson = getLesson(row);
  const topic = getTopic(row);


  if (
    simplified ||
    traditional ||
    lesson ||
    topic
  ) {

    const section = document.createElement("div");
    section.className = "detail-section";

    const wordLine = document.createElement("div");
    wordLine.className = "detail-word-line";


    /* ---------- SIMPLIFIED ---------- */

    if (simplified) {

      const simplifiedGroup =
        document.createElement("span");

      simplifiedGroup.className =
        "detail-word-group";


      const simplifiedLabel =
        document.createElement("span");

      simplifiedLabel.className =
        "detail-word-label";

      simplifiedLabel.textContent =
        "Simplified: ";


      const simplifiedElement =
        document.createElement("span");

      simplifiedElement.className =
        "detail-word-simplified";

      simplifiedElement.textContent =
        simplified;


      simplifiedGroup.appendChild(
        simplifiedLabel
      );

      simplifiedGroup.appendChild(
        simplifiedElement
      );

      wordLine.appendChild(
        simplifiedGroup
      );

    }


    /* ---------- TRADITIONAL ---------- */

    if (traditional) {

      const traditionalGroup =
        document.createElement("span");

      traditionalGroup.className =
        "detail-word-group";


      const traditionalLabel =
        document.createElement("span");

      traditionalLabel.className =
        "detail-word-label";

      traditionalLabel.textContent =
        "Traditional: ";


      const traditionalElement =
        document.createElement("span");

      traditionalElement.className =
        "detail-word-traditional";

      traditionalElement.textContent =
        traditional;


      traditionalGroup.appendChild(
        traditionalLabel
      );

      traditionalGroup.appendChild(
        traditionalElement
      );

      wordLine.appendChild(
        traditionalGroup
      );

    }


    /* ---------- LESSON + TOPIC ---------- */

    if (lesson || topic) {

      const lessonGroup =
        document.createElement("span");

      lessonGroup.className =
        "detail-lesson-group";


      let lessonText = "";

      if (lesson && topic) {

        lessonText =
          `Lesson ${lesson}: ${topic}`;

      } else if (lesson) {

        lessonText =
          `Lesson ${lesson}`;

      } else {

        lessonText =
          topic;

      }


      lessonGroup.textContent =
        lessonText;


      wordLine.appendChild(
        lessonGroup
      );

    }


    section.appendChild(
      wordLine
    );

    container.appendChild(
      section
    );

  }


  /* ==========================================================
     PINYIN / ENGLISH / PART OF SPEECH
  ========================================================== */

  const coreSection =
    document.createElement("div");

  coreSection.className =
    "detail-section";


  const pinyin =
    clean(row.Pinyin);

  if (pinyin) {

    coreSection.appendChild(
      createSimpleDetailRow(
        "Pinyin",
        pinyin
      )
    );

  }


  const english =
    clean(row.English);

  if (english) {

    coreSection.appendChild(
      createSimpleDetailRow(
        "English",
        english
      )
    );

  }


  const partOfSpeech =
    getRowValue(
      row,
      [
        "Part of Speech",
        "Part_of_Speech",
        "Part of speech",
        "POS"
      ]
    );

  if (partOfSpeech) {

    coreSection.appendChild(
      createSimpleDetailRow(
        "Part of Speech",
        partOfSpeech
      )
    );

  }


  if (coreSection.children.length) {

    container.appendChild(
      coreSection
    );

  }


  /* ==========================================================
     HSK + CLI
     ITALICIZED
  ========================================================== */

  const hskNumber =
    getHSKNumber(row);

  const hskLevel =
    getHSKLevel(row);

  const cliEnglish =
    getCLIEnglish(row);


  if (
    hskNumber ||
    hskLevel ||
    cliEnglish
  ) {

    const hskSection =
      document.createElement("div");

    hskSection.className =
      "detail-section";


    /* ---------- HSK ---------- */

    if (
      hskNumber ||
      hskLevel
    ) {

      const hskLine =
        document.createElement("div");

      hskLine.className =
        "detail-row detail-reference";


      let hskText =
        "HSK Number: ";


      if (hskNumber) {

        hskText +=
          hskNumber;

      }


      if (
        hskNumber &&
        hskLevel
      ) {

        hskText +=
          " — Level: ";

      }


      if (hskLevel) {

        hskText +=
          hskLevel;

      }


      hskLine.textContent =
        hskText;


      hskSection.appendChild(
        hskLine
      );

    }


    /* ---------- CLI ---------- */

    if (cliEnglish) {

      const cliLine =
        document.createElement("div");

      cliLine.className =
        "detail-row detail-reference";


      cliLine.textContent =
        `CLI English: ${cliEnglish}`;


      hskSection.appendChild(
        cliLine
      );

    }


    container.appendChild(
      hskSection
    );

  }


  /* ==========================================================
     ONE RANDOM EXAMPLE PER CARD
  ========================================================== */

  const examples =
    getAvailableExamples(row);


  /*
    Choose the example only once for this card.
    Flipping the card will NOT change the example.
  */

  if (
    !state.flashcardExample ||
    state.flashcardExample.row !== row
  ) {

    const randomExample =
      examples.length
        ? examples[
            Math.floor(
              Math.random() *
              examples.length
            )
          ]
        : null;


    state.flashcardExample = {
      row,
      example: randomExample
    };

  }


  const randomExample =
    state.flashcardExample.example;


  /* ==========================================================
     EXAMPLE SENTENCE
  ========================================================== */

  if (randomExample) {

    const exampleSection =
      document.createElement("div");

    exampleSection.className =
      "detail-section";


    const heading =
      document.createElement("h4");

    heading.textContent =
      `Example ${randomExample.number}`;


    exampleSection.appendChild(
      heading
    );


    /* ---------- CHINESE ---------- */

    if (randomExample.chinese) {

      const chinese =
        document.createElement("div");

      chinese.className =
        "example-chinese";

      chinese.textContent =
        randomExample.chinese;


      exampleSection.appendChild(
        chinese
      );

    }


    /* ---------- PINYIN ---------- */

    if (randomExample.pinyin) {

      const examplePinyin =
        document.createElement("div");

      examplePinyin.className =
        "example-pinyin";

      examplePinyin.textContent =
        randomExample.pinyin;


      exampleSection.appendChild(
        examplePinyin
      );

    }


    /* ---------- ENGLISH ---------- */

    if (randomExample.english) {

      const exampleEnglish =
        document.createElement("div");

      exampleEnglish.className =
        "example-english";

      exampleEnglish.textContent =
        randomExample.english;


      exampleSection.appendChild(
        exampleEnglish
      );

    }


    container.appendChild(
      exampleSection
    );

  }

}


/* ============================================================
   SIMPLE DETAIL ROW
============================================================ */

function createSimpleDetailRow(
  label,
  value
) {

  const rowElement =
    document.createElement(
      "div"
    );

  rowElement.className =
    "detail-row";


  const labelElement =
    document.createElement(
      "div"
    );

  labelElement.className =
    "detail-label";

  labelElement.textContent =
    label;


  const valueElement =
    document.createElement(
      "div"
    );

  valueElement.className =
    "detail-value";

  valueElement.textContent =
    clean(value);


  rowElement.appendChild(
    labelElement
  );

  rowElement.appendChild(
    valueElement
  );


  return rowElement;

}


/* ============================================================
   SPEECH
============================================================ */

function speakChinese(row) {

  if (!row) {
    return;
  }

  const text =
    clean(row.Simplified);

  if (!text) {
    return;
  }

  if (
    !("speechSynthesis" in window)
  ) {

    console.warn(
      "Speech synthesis is not supported by this browser."
    );

    return;

  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    "zh-CN";

  utterance.rate =
    0.85;

  window.speechSynthesis.speak(
    utterance
  );

}


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

  $$(".nav-button").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            button.dataset.view;

          if (view) {

            showView(
              view
            );

          }

        }
      );

    }
  );


  $$(".action-card").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            button.dataset.goView;

          if (view) {

            showView(
              view
            );

          }

        }
      );

    }
  );


  const homeStart =
    $("#home-start-button");

  if (homeStart) {

    homeStart.addEventListener(
      "click",
      () => {
        showView("flashcards");
      }
    );

  }


  const exitGame =
    $("#exit-game");

  if (exitGame) {

    exitGame.addEventListener(
      "click",
      () => {

        const gameArea =
          $("#game-area");

        if (gameArea) {

          gameArea.classList.add(
            "hidden"
          );

        }

        const selection =
          $("#game-selection");

        if (selection) {

          selection.classList.remove(
            "hidden"
          );

        }

      }
    );

  }

}


function showView(viewName) {

  $$(".view").forEach(
    view => {

      view.classList.toggle(
        "active-view",
        view.id ===
          `view-${viewName}`
      );

    }
  );


  $$(".nav-button").forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.view ===
          viewName
      );

    }
  );

}


/* ============================================================
   HOME BUTTONS
============================================================ */

function setupHomeButtons() {

  $$(".action-card").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            button.dataset.goView;

          if (view) {

            showView(
              view
            );

          }

        }
      );

    }
  );

}


/* ============================================================
   STATISTICS
============================================================ */

function updateStats() {

  const total =
    state.vocabulary.length;


  const homeTotal =
    $("#home-total-words");

  if (homeTotal) {

    homeTotal.textContent =
      total;

  }


  const practiced =
    Object.keys(
      state.progress
    ).length;


  const homeMastered =
    $("#home-mastered");

  if (homeMastered) {

    homeMastered.textContent =
      calculateMastered();

  }


  const homeReview =
    $("#home-review");

  if (homeReview) {

    homeReview.textContent =
      calculateNeedsReview();

  }


  const homeAccuracy =
    $("#home-accuracy");

  if (homeAccuracy) {

    homeAccuracy.textContent =
      `${calculateAccuracy()}%`;

  }


  updateProgressDisplay();

}


function updateWordCount() {

  const count =
    $("#word-count");

  if (count) {

    count.textContent =
      `${state.filteredVocabulary.length} words`;

  }

}


/* ============================================================
   PROGRESS
============================================================ */

function loadProgress() {

  try {

    const saved =
      localStorage.getItem(
        "chineseStudyProgress"
      );

    if (saved) {

      state.progress =
        JSON.parse(
          saved
        );

    }

  } catch (error) {

    console.warn(
      "Could not load progress:",
      error
    );

    state.progress = {};

  }

}


function saveProgress() {

  try {

    localStorage.setItem(
      "chineseStudyProgress",
      JSON.stringify(
        state.progress
      )
    );

  } catch (error) {

    console.warn(
      "Could not save progress:",
      error
    );

  }

}


function markWordProgress(
  row,
  correct
) {

  const word =
    clean(row?.Simplified);

  if (!word) {
    return;
  }


  if (
    !state.progress[word]
  ) {

    state.progress[word] = {
      seen: 0,
      correct: 0,
      incorrect: 0
    };

  }


  state.progress[word].seen++;


  if (correct) {

    state.progress[word].correct++;

  } else {

    state.progress[word].incorrect++;

  }


  saveProgress();

  updateStats();

}


/* ============================================================
   PROGRESS CALCULATIONS
============================================================ */

function calculateAccuracy() {

  let correct = 0;
  let incorrect = 0;


  Object.values(
    state.progress
  ).forEach(
    item => {

      correct +=
        Number(
          item.correct || 0
        );

      incorrect +=
        Number(
          item.incorrect || 0
        );

    }
  );


  const total =
    correct + incorrect;


  if (!total) {
    return 0;
  }


  return Math.round(
    (
      correct /
      total
    ) * 100
  );

}


function calculateMastered() {

  return Object.values(
    state.progress
  )
    .filter(
      item =>
        Number(item.correct || 0) >= 3 &&
        Number(item.correct || 0) >
          Number(item.incorrect || 0)
    )
    .length;

}


function calculateNeedsReview() {

  return Object.values(
    state.progress
  )
    .filter(
      item =>
        Number(item.incorrect || 0) >
        Number(item.correct || 0)
    )
    .length;

}


/* ============================================================
   PROGRESS DISPLAY
============================================================ */

function setupProgress() {

  const reset =
    $("#reset-progress");

  if (reset) {

    reset.addEventListener(
      "click",
      resetProgress
    );

  }


  const review =
    $("#review-incorrect");

  if (review) {

    review.addEventListener(
      "click",
      reviewIncorrectWords
    );

  }


  renderProgressList();

}


function renderProgressList() {

  const container =
    $("#progress-list");

  if (!container) {
    return;
  }


  const rows =
    state.vocabulary.filter(
      row =>
        state.progress[
          clean(row.Simplified)
        ]
    );


  if (!rows.length) {

    container.innerHTML =
      "<p>No study progress yet.</p>";

    return;

  }


  container.innerHTML =
    rows
      .map(
        row => {

          const word =
            clean(row.Simplified);

          const progress =
            state.progress[word];


          return `
            <div class="progress-row">

              <div class="progress-word">
                ${escapeHTML(word)}
              </div>

              <div class="progress-english">
                ${escapeHTML(clean(row.English))}
              </div>

              <div class="progress-count">
                Seen: ${progress.seen || 0}
              </div>

              <div class="progress-count">
                Correct: ${progress.correct || 0}
              </div>

              <div class="progress-count">
                Incorrect: ${progress.incorrect || 0}
              </div>

            </div>
          `;

        }
      )
      .join("");

}


function updateProgressDisplay() {

  const total =
    $("#progress-total");

  const mastered =
    $("#progress-mastered");

  const review =
    $("#progress-review");

  const accuracy =
    $("#progress-accuracy");


  const practiced =
    Object.keys(
      state.progress
    ).length;


  if (total) {

    total.textContent =
      practiced;

  }


  if (mastered) {

    mastered.textContent =
      calculateMastered();

  }


  if (review) {

    review.textContent =
      calculateNeedsReview();

  }


  if (accuracy) {

    accuracy.textContent =
      `${calculateAccuracy()}%`;

  }


  renderProgressList();

}


function resetProgress() {

  const confirmed =
    window.confirm(
      "Reset all vocabulary progress?"
    );

  if (!confirmed) {
    return;
  }


  state.progress = {};

  saveProgress();

  updateStats();

  updateProgressDisplay();

}


function reviewIncorrectWords() {

  const incorrectWords =
    state.vocabulary.filter(
      row => {

        const progress =
          state.progress[
            clean(row.Simplified)
          ];

        return (
          progress &&
          Number(progress.incorrect || 0) >
            Number(progress.correct || 0)
        );

      }
    );


  if (!incorrectWords.length) {

    window.alert(
      "There are no words currently marked for review."
    );

    return;

  }


  state.filteredVocabulary =
    incorrectWords;

  state.studySet =
    shuffle(
      incorrectWords
    ).slice(
      0,
      Math.min(
        Number(
          $("#study-size")?.value || 20
        ),
        incorrectWords.length
      )
    );


  state.cardIndex = 0;

  state.cardFlipped = false;

  state.flashcardExample = null;

  updateWordCount();

  renderFlashcard();

  showView(
    "flashcards"
  );

}


/* ============================================================
   READING
============================================================ */

function setupReading() {

  const previous =
    $("#previous-reading");

  if (previous) {

    previous.addEventListener(
      "click",
      previousReading
    );

  }


  const next =
    $("#next-reading");

  if (next) {

    next.addEventListener(
      "click",
      nextReading
    );

  }


  const random =
    $("#random-reading");

  if (random) {

    random.addEventListener(
      "click",
      randomReading
    );

  }


  const speak =
    $("#reading-speak");

  if (speak) {

    speak.addEventListener(
      "click",
      () => {

        if (
          state.currentReadingExample
        ) {

          speakText(
            state.currentReadingExample.chinese
          );

        }

      }
    );

  }


  const details =
    $("#show-example-details");

  if (details) {

    details.addEventListener(
      "click",
      toggleExampleDetails
    );

  }

}


function getReadingCandidates() {

  const words =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;


  return words.filter(
    row =>
      getAvailableExamples(row).length
  );

}


function renderReading() {

  const container =
    $("#reading-sentence");

  if (!container) {
    return;
  }


  const candidates =
    getReadingCandidates();


  if (!candidates.length) {

    container.innerHTML =
      "<p>No example sentences are available.</p>";

    return;

  }


  if (
    state.readingIndex >=
    candidates.length
  ) {

    state.readingIndex = 0;

  }


  const row =
    candidates[
      state.readingIndex
    ];


  const examples =
    getAvailableExamples(
      row
    );


  let example =
    examples.find(
      item =>
        item.number ===
        state.readingExampleNumber
    );


  if (!example) {

    example =
      examples[0];

  }


  state.currentReadingRow =
    row;

  state.currentReadingExample =
    example;


  const label =
    $("#reading-example-label");

  if (label) {

    label.textContent =
      `Example ${example.number}`;

  }


  container.innerHTML =
    renderInteractiveChinese(
      example.chinese
    );


  const pinyin =
    $("#example-pinyin-text");

  if (pinyin) {

    pinyin.textContent =
      example.pinyin || "";

  }


  const english =
    $("#example-english-text");

  if (english) {

    english.textContent =
      example.english || "";

  }


  const details =
    $("#example-details");

  if (details) {

    details.classList.add(
      "hidden"
    );

  }


  const detailsButton =
    $("#show-example-details");

  if (detailsButton) {

    detailsButton.textContent =
      "Show Pinyin & English";

  }


  updateCharacterPanel(
    null
  );


  attachCharacterEvents();

}


function renderInteractiveChinese(text) {

  return Array.from(
    clean(text)
  )
    .map(
      character => {

        if (
          /\s/.test(character)
        ) {

          return " ";

        }


        return `
          <span
            class="reading-character"
            data-character="${escapeAttribute(character)}"
          >
            ${escapeHTML(character)}
          </span>
        `;

      }
    )
    .join("");

}


function attachCharacterEvents() {

  $$(".reading-character")
    .forEach(
      element => {

        element.addEventListener(
          "mouseenter",
          () => {

            showCharacterInfo(
              element.dataset.character
            );

          }
        );


        element.addEventListener(
          "click",
          () => {

            showCharacterInfo(
              element.dataset.character
            );

          }
        );

      }
    );

}


function showCharacterInfo(
  character
) {

  const matchingRows =
    state.vocabulary.filter(
      row => {

        const simplified =
          clean(row.Simplified);

        const traditional =
          clean(row.Traditional);

        return (
          simplified.includes(character) ||
          traditional.includes(character)
        );

      }
    );


  if (!matchingRows.length) {

    updateCharacterPanel({
      character
    });

    return;

  }


  const row =
    matchingRows[0];


  updateCharacterPanel({
    character,
    row
  });

}


function updateCharacterPanel(
  data
) {

  const panel =
    $("#character-details");

  if (!panel) {
    return;
  }


  if (!data) {

    panel.innerHTML = `
      <div class="character-placeholder">

        <div class="large-placeholder-character">
          字
        </div>

        <h3>Character Information</h3>

        <p>
          Hover over or click a Chinese character
          in the sentence.
        </p>

      </div>
    `;

    return;

  }


  const character =
    clean(data.character);


  const row =
    data.row;


  if (!row) {

    panel.innerHTML = `
      <div class="character-info">

        <div class="character-display">
          ${escapeHTML(character)}
        </div>

        <h3>${escapeHTML(character)}</h3>

        <p>
          No vocabulary entry was found for this character.
        </p>

      </div>
    `;

    return;

  }


  const simplified =
    clean(row.Simplified);

  const traditional =
    clean(row.Traditional);

  const pinyin =
    clean(row.Pinyin);

  const english =
    clean(row.English);

  const cli =
    getCLIEnglish(row);


  panel.innerHTML = `
    <div class="character-info">

      <div class="character-display">
        ${escapeHTML(character)}
      </div>

      <div class="character-detail-row">
        <strong>Simplified</strong>
        <span>${escapeHTML(simplified)}</span>
      </div>

      <div class="character-detail-row">
        <strong>Traditional</strong>
        <span>${escapeHTML(traditional || simplified)}</span>
      </div>

      <div class="character-detail-row">
        <strong>Pinyin</strong>
        <span>${escapeHTML(pinyin)}</span>
      </div>

      <div class="character-detail-row">
        <strong>English</strong>
        <span>${escapeHTML(english)}</span>
      </div>

      ${
        cli
          ? `
            <div class="character-detail-row">
              <strong>CLI</strong>
              <span>${escapeHTML(cli)}</span>
            </div>
          `
          : ""
      }

    </div>
  `;

}


function previousReading() {

  const candidates =
    getReadingCandidates();


  if (!candidates.length) {
    return;
  }


  state.readingIndex =
    (
      state.readingIndex -
      1 +
      candidates.length
    ) %
    candidates.length;


  renderReading();

}


function nextReading() {

  const candidates =
    getReadingCandidates();


  if (!candidates.length) {
    return;
  }


  state.readingIndex =
    (
      state.readingIndex + 1
    ) %
    candidates.length;


  renderReading();

}


function randomReading() {

  const candidates =
    getReadingCandidates();


  if (!candidates.length) {
    return;
  }


  state.readingIndex =
    Math.floor(
      Math.random() *
      candidates.length
    );


  const examples =
    getAvailableExamples(
      candidates[
        state.readingIndex
      ]
    );


  if (examples.length) {

    state.readingExampleNumber =
      examples[
        Math.floor(
          Math.random() *
          examples.length
        )
      ].number;

  }


  renderReading();

}


function toggleExampleDetails() {

  const details =
    $("#example-details");

  const button =
    $("#show-example-details");


  if (!details) {
    return;
  }


  const hidden =
    details.classList.toggle(
      "hidden"
    );


  if (button) {

    button.textContent =
      hidden
        ? "Show Pinyin & English"
        : "Hide Pinyin & English";

  }

}


/* ============================================================
   SPEECH FOR READING
============================================================ */

function speakText(text) {

  text =
    clean(text);


  if (!text) {
    return;
  }


  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    "zh-CN";

  utterance.rate =
    0.85;


  window.speechSynthesis.speak(
    utterance
  );

}


/* ============================================================
   GAMES
============================================================ */

function setupGames() {

  $$(".game-card")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const game =
              button.dataset.game;

            startGame(
              game
            );

          }
        );

      }
    );

}


function startGame(game) {

  const source =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;


  if (!source.length) {

    return;

  }


  state.gameWords =
    shuffle(
      source
    ).slice(
      0,
      Math.min(
        10,
        source.length
      )
    );


  state.currentGame =
    game;

  state.currentGameIndex =
    0;

  state.gameScore =
    0;


  const selection =
    $("#game-selection");

  if (selection) {

    selection.classList.add(
      "hidden"
    );

  }


  const gameArea =
    $("#game-area");

  if (gameArea) {

    gameArea.classList.remove(
      "hidden"
    );

  }


  updateGameScore();


  if (
    game === "multiple-choice"
  ) {

    startMultipleChoice();

  } else if (
    game === "english-chinese"
  ) {

    startEnglishToChinese();

  } else if (
    game === "scramble"
  ) {

    startScramble();

  } else if (
    game === "matching"
  ) {

    startMatching();

  } else if (
    game === "sentence"
  ) {

    startSentenceScramble();

  } else if (
    game === "listening"
  ) {

    startListening();

  } else {

    showGameMessage(
      "Game not recognized."
    );

  }

}


/* ============================================================
   GAME HELPERS
============================================================ */

function updateGameScore() {

  const score =
    $("#game-score");

  if (score) {

    score.textContent =
      state.gameScore;

  }

}


function getGameContainer() {

  return $("#game-content");

}


function showGameMessage(
  message
) {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="game-complete">
      ${escapeHTML(message)}
    </div>
  `;

}


/* ============================================================
   MULTIPLE CHOICE
============================================================ */

function startMultipleChoice() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const word =
    state.gameWords[
      state.currentGameIndex
    ];


  if (!word) {

    finishGame();

    return;

  }


  const distractors =
    shuffle(
      state.vocabulary.filter(
        row =>
          row !== word
      )
    )
      .slice(
        0,
        3
      );


  const choices =
    shuffle(
      [
        word,
        ...distractors
      ]
    );


  container.innerHTML = `

    <div class="game-question">
      ${escapeHTML(word.Simplified)}
    </div>

    <p>
      Choose the English meaning.
    </p>

    <div class="game-choices">

      ${choices
        .map(
          choice =>
            `
              <button
                class="game-choice"
                data-answer="${escapeAttribute(choice.Simplified)}"
              >
                ${escapeHTML(choice.English)}
              </button>
            `
        )
        .join("")}

    </div>

    <div id="game-feedback"></div>

  `;


  $$(".game-choice")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const correct =
              button.dataset.answer ===
              word.Simplified;


            if (correct) {

              button.classList.add(
                "correct"
              );

              state.gameScore++;

            } else {

              button.classList.add(
                "incorrect"
              );

            }


            markWordProgress(
              word,
              correct
            );


            const feedback =
              $("#game-feedback");


            if (feedback) {

              feedback.textContent =
                correct
                  ? "Correct!"
                  : `Answer: ${word.English}`;

            }


            $$(".game-choice")
              .forEach(
                item => {
                  item.disabled = true;
                }
              );


            updateGameScore();


            setTimeout(
              () => {

                state.currentGameIndex++;

                startMultipleChoice();

              },
              900
            );

          }
        );

      }
    );

}


/* ============================================================
   ENGLISH → CHINESE
============================================================ */

function startEnglishToChinese() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const word =
    state.gameWords[
      state.currentGameIndex
    ];


  if (!word) {

    finishGame();

    return;

  }


  container.innerHTML = `

    <div class="game-question">
      ${escapeHTML(word.English)}
    </div>

    <p>
      Type the Chinese word.
    </p>

    <input
      id="game-answer"
      class="game-answer"
      type="text"
      autocomplete="off"
      placeholder="Type the Chinese word"
    />

    <button
      id="check-answer"
      class="primary-button"
      type="button"
    >
      Check
    </button>

    <div id="game-feedback"></div>

  `;


  const input =
    $("#game-answer");

  if (input) {

    input.focus();

  }


  $("#check-answer")
    ?.addEventListener(
      "click",
      () => {

        const answer =
          clean(
            input?.value
          );


        const correct =
          answer ===
          clean(word.Simplified);


        if (correct) {

          state.gameScore++;

        }


        markWordProgress(
          word,
          correct
        );


        const feedback =
          $("#game-feedback");


        if (feedback) {

          feedback.textContent =
            correct
              ? "Correct!"
              : `Answer: ${word.Simplified}`;

        }


        updateGameScore();


        const button =
          $("#check-answer");

        if (button) {

          button.disabled =
            true;

        }


        setTimeout(
          () => {

            state.currentGameIndex++;

            startEnglishToChinese();

          },
          1000
        );

      }
    );

}


/* ============================================================
   SCRAMBLE
============================================================ */

function startScramble() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const word =
    state.gameWords[
      state.currentGameIndex
    ];


  if (!word) {

    finishGame();

    return;

  }


  const characters =
    shuffle(
      Array.from(
        clean(
          word.Simplified
        )
      )
    );


  container.innerHTML = `

    <div class="game-question">
      Unscramble the Chinese word.
    </div>

    <div class="scramble-word">
      ${escapeHTML(
        characters.join(" ")
      )}
    </div>

    <input
      id="game-answer"
      class="game-answer"
      type="text"
      autocomplete="off"
      placeholder="Type the word"
    />

    <button
      id="check-answer"
      class="primary-button"
      type="button"
    >
      Check
    </button>

    <div id="game-feedback"></div>

  `;


  const input =
    $("#game-answer");


  if (input) {
    input.focus();
  }


  $("#check-answer")
    ?.addEventListener(
      "click",
      () => {

        const answer =
          clean(
            input?.value
          );


        const correct =
          answer ===
          clean(
            word.Simplified
          );


        if (correct) {

          state.gameScore++;

        }


        markWordProgress(
          word,
          correct
        );


        const feedback =
          $("#game-feedback");


        if (feedback) {

          feedback.textContent =
            correct
              ? "Correct!"
              : `Answer: ${word.Simplified}`;

        }


        updateGameScore();


        setTimeout(
          () => {

            state.currentGameIndex++;

            startScramble();

          },
          1000
        );

      }
    );

}


/* ============================================================
   MATCHING
============================================================ */

function startMatching() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const words =
    state.gameWords.slice(
      0,
      Math.min(
        6,
        state.gameWords.length
      )
    );


  state.matchingMatches =
    0;

  state.matchingSelected =
    null;


  if (!words.length) {

    showGameMessage(
      "Not enough words for matching."
    );

    return;

  }


  const cards = [
    ...words.map(
      word => ({
        type: "chinese",
        value: word.Simplified,
        word
      })
    ),
    ...words.map(
      word => ({
        type: "english",
        value: word.English,
        word
      })
    )
  ];


  const shuffledCards =
    shuffle(cards);


  container.innerHTML = `

    <p>
      Match each Chinese word with its English meaning.
    </p>

    <div class="matching-grid">

      ${shuffledCards
        .map(
          (card, index) =>
            `
              <button
                class="matching-card"
                data-index="${index}"
              >
                ${escapeHTML(card.value)}
              </button>
            `
        )
        .join("")}

    </div>

  `;


  $$(".matching-card")
    .forEach(
      (element, index) => {

        element.addEventListener(
          "click",
          () => {

            const card =
              shuffledCards[index];


            if (
              element.classList.contains(
                "matched"
              )
            ) {

              return;

            }


            if (
              !state.matchingSelected
            ) {

              state.matchingSelected = {
                element,
                card
              };


              element.classList.add(
                "selected"
              );


              return;

            }


            const first =
              state.matchingSelected;


            if (
              first.card.word ===
                card.word &&
              first.card.type !==
                card.type
            ) {

              first.element.classList.add(
                "matched"
              );

              element.classList.add(
                "matched"
              );


              state.matchingMatches++;


              markWordProgress(
                card.word,
                true
              );


              state.gameScore++;


              updateGameScore();


              if (
                state.matchingMatches ===
                words.length
              ) {

                setTimeout(
                  () => {

                    finishGame();

                  },
                  500
                );

              }

            } else {

              first.element.classList.add(
                "incorrect"
              );

              element.classList.add(
                "incorrect"
              );


              markWordProgress(
                card.word,
                false
              );


              setTimeout(
                () => {

                  first.element.classList.remove(
                    "incorrect"
                  );

                  element.classList.remove(
                    "incorrect"
                  );

                },
                500
              );

            }


            first.element.classList.remove(
              "selected"
            );


            state.matchingSelected =
              null;

          }
        );

      }
    );

}


/* ============================================================
   SENTENCE SCRAMBLE
============================================================ */

function startSentenceScramble() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const candidates =
    state.gameWords
      .map(
        row => {

          const examples =
            getAvailableExamples(
              row
            );


          return {
            row,
            example:
              examples[0]
          };

        }
      )
      .filter(
        item =>
          item.example &&
          item.example.chinese
      );


  if (!candidates.length) {

    showGameMessage(
      "No example sentences are available for this game."
    );

    return;

  }


  const selected =
    candidates[
      Math.floor(
        Math.random() *
        candidates.length
      )
    ];


  /*
    Chinese sentences usually do not have spaces
    between words, so this game works character-by-character.
  */

  const characters =
    shuffle(
      Array.from(
        clean(
          selected.example.chinese
        )
      )
    );


  container.innerHTML = `

    <div class="game-question">
      Put the sentence in the correct order.
    </div>

    <div class="scramble-word">
      ${escapeHTML(
        characters.join(" / ")
      )}
    </div>

    <input
      id="game-answer"
      class="game-answer"
      type="text"
      autocomplete="off"
      placeholder="Type the complete sentence"
    />

    <button
      id="check-answer"
      class="primary-button"
      type="button"
    >
      Check
    </button>

    <div id="game-feedback"></div>

  `;


  const input =
    $("#game-answer");


  if (input) {
    input.focus();
  }


  $("#check-answer")
    ?.addEventListener(
      "click",
      () => {

        const answer =
          clean(
            input?.value
          );


        const correct =
          answer ===
          clean(
            selected.example.chinese
          );


        if (correct) {

          state.gameScore++;

        }


        markWordProgress(
          selected.row,
          correct
        );


        const feedback =
          $("#game-feedback");


        if (feedback) {

          feedback.textContent =
            correct
              ? "Correct!"
              : `Answer: ${selected.example.chinese}`;

        }


        updateGameScore();


        setTimeout(
          () => {

            finishGame();

          },
          1000
        );

      }
    );

}


/* ============================================================
   LISTENING
============================================================ */

function startListening() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  const word =
    state.gameWords[
      state.currentGameIndex
    ];


  if (!word) {

    finishGame();

    return;

  }


  container.innerHTML = `

    <div class="game-question">
      Listen and type what you hear.
    </div>

    <button
      id="play-word"
      class="primary-button"
      type="button"
    >
      🔊 Play Chinese
    </button>

    <input
      id="game-answer"
      class="game-answer"
      type="text"
      autocomplete="off"
      placeholder="Type what you hear"
    />

    <button
      id="check-answer"
      class="primary-button"
      type="button"
    >
      Check
    </button>

    <div id="game-feedback"></div>

  `;


  $("#play-word")
    ?.addEventListener(
      "click",
      () => {

        speakChinese(
          word
        );

      }
    );


  $("#check-answer")
    ?.addEventListener(
      "click",
      () => {

        const answer =
          clean(
            $("#game-answer")?.value
          );


        const correct =
          answer ===
          clean(
            word.Simplified
          );


        if (correct) {

          state.gameScore++;

        }


        markWordProgress(
          word,
          correct
        );


        const feedback =
          $("#game-feedback");


        if (feedback) {

          feedback.textContent =
            correct
              ? "Correct!"
              : `Answer: ${word.Simplified}`;

        }


        updateGameScore();


        setTimeout(
          () => {

            state.currentGameIndex++;

            startListening();

          },
          1000
        );

      }
    );

}


/* ============================================================
   GAME FINISH
============================================================ */

function finishGame() {

  const container =
    getGameContainer();

  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="game-complete">

      <h3>Great job!</h3>

      <p>
        Your score:
        <strong>
          ${state.gameScore}
        </strong>
      </p>

      <button
        id="play-again"
        class="primary-button"
        type="button"
      >
        Play Again
      </button>

      <button
        id="return-games"
        class="secondary-button"
        type="button"
      >
        Back to Games
      </button>

    </div>

  `;


  $("#play-again")
    ?.addEventListener(
      "click",
      () => {

        startGame(
          state.currentGame
        );

      }
    );


  $("#return-games")
    ?.addEventListener(
      "click",
      () => {

        const gameArea =
          $("#game-area");

        if (gameArea) {

          gameArea.classList.add(
            "hidden"
          );

        }


        const selection =
          $("#game-selection");

        if (selection) {

          selection.classList.remove(
            "hidden"
          );

        }

      }
    );

}


/* ============================================================
   INITIAL SETUP
============================================================ */

setupReloadButton();

loadVocabulary();