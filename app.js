/* ============================================================
   CHINESE STUDY APP
   Plain HTML / CSS / JavaScript
   No Vite / npm required
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const EXCEL_FILE = "WM_level1_all_with_HSK.xlsx";

//WM_level1_all_with_HSK.xlsx

const STORAGE_KEY = "chineseStudyProgress_v1";


/* ============================================================
   APPLICATION STATE
============================================================ */

const state = {

  // Original Excel data
  vocabulary: [],

  // Data after filters
  filteredVocabulary: [],

  // Current study set
  studySet: [],

  // Flashcard position
  cardIndex: 0,

  // Flashcard flipped?
  cardFlipped: false,

  // Reading
  readingVocabulary: [],
  readingIndex: 0,

  // Currently displayed example
  readingExampleNumber: 1,

  // Progress
  progress: {},

  // Games
  currentGame: null,
  gameWords: [],
  gameIndex: 0,
  gameScore: 0,
  gameAnswered: false,

  // Matching
  matchingCards: [],
  matchingFirst: null,
  matchingSecond: null,
  matchingMatches: 0

};


/* ============================================================
   DOM HELPERS
============================================================ */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  Array.from(document.querySelectorAll(selector));


/* ============================================================
   NORMALIZATION
============================================================ */

function clean(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


function getWord(row) {
  return clean(row.Simplified);
}


function getEnglish(row) {
  return clean(row.English);
}


/* ============================================================
   SHUFFLE
============================================================ */

function shuffle(array) {

  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [
      copy[i],
      copy[j]
    ] = [
      copy[j],
      copy[i]
    ];

  }

  return copy;
}


/* ============================================================
   LOAD EXCEL
============================================================ */

async function loadVocabulary() {

  try {

    showLoading();


    /* Make sure SheetJS loaded before trying to use it. */

    if (typeof XLSX === "undefined") {

      throw new Error(
        "The Excel reader could not be loaded. " +
        "Please check your internet connection and reload the page."
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
        `Excel file could not be found. HTTP ${response.status}. ` +
        `Expected file at: ${EXCEL_FILE}`
      );

    }


    const arrayBuffer =
      await response.arrayBuffer();


    const workbook =
      XLSX.read(
        arrayBuffer,
        {
          type: "array"
        }
      );


    if (
      !workbook.SheetNames ||
      !workbook.SheetNames.length
    ) {

      throw new Error(
        "The Excel workbook contains no worksheets."
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


    if (!rows.length) {

      throw new Error(
        "The Excel sheet contains no vocabulary rows."
      );

    }


    state.vocabulary =
      rows.filter(
        row => getWord(row)
      );


    if (!state.vocabulary.length) {

      throw new Error(
        "The Excel file was loaded, but no rows containing Simplified Chinese words were found."
      );

    }


    validateColumns();

    console.log(
      `Loaded ${state.vocabulary.length} vocabulary words.`
    );


    initializeApp();

    hideLoading();

  } catch (error) {

    console.error(
      "Vocabulary loading error:",
      error
    );

    showError(
      error.message ||
      "Unknown error loading vocabulary."
    );

  }

}


/* ============================================================
   VALIDATE DATA
============================================================ */

function validateColumns() {

  if (!state.vocabulary.length) {

    throw new Error(
      "No vocabulary rows were found."
    );

  }


  const firstRow =
    state.vocabulary[0];


  const requiredColumns = [
    "Simplified",
    "English"
  ];


  const missing =
    requiredColumns.filter(
      column =>
        !(column in firstRow)
    );


  if (missing.length) {

    throw new Error(
      `Missing required Excel columns: ${missing.join(", ")}`
    );

  }

}


/* ============================================================
   APP INITIALIZATION
============================================================ */

function initializeApp() {

  loadProgress();

  populateFilters();


  state.filteredVocabulary =
    [...state.vocabulary];


  createDefaultStudySet();

  initializeReading();

  updateAllStatistics();

  setupNavigation();

  setupFlashcards();

  setupReading();

  setupGames();

  setupProgress();

  updateWordCount();

}


/* ============================================================
   LOADING UI
============================================================ */

function showLoading() {

  const loading =
    $("#loading-message");

  const error =
    $("#error-message");


  if (loading) {
    loading.classList.remove("hidden");
  }


  if (error) {
    error.classList.add("hidden");
  }

}


function hideLoading() {

  const loading =
    $("#loading-message");

  const error =
    $("#error-message");


  if (loading) {
    loading.classList.add("hidden");
  }


  if (error) {
    error.classList.add("hidden");
  }

}


function showError(message) {

  const loading =
    $("#loading-message");

  const error =
    $("#error-message");

  const errorText =
    $("#error-text");


  if (loading) {
    loading.classList.add("hidden");
  }


  if (error) {
    error.classList.remove("hidden");
  }


  if (errorText) {

    errorText.textContent =
      message ||
      "Unknown error loading vocabulary.";

  }

}


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

  $$(".nav-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            button.dataset.view;

          showView(view);

        }
      );

    });


  $$("[data-go-view]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showView(
            button.dataset.goView
          );

        }
      );

    });


  const homeStart =
    $("#home-start-button");


  if (homeStart) {

    homeStart.addEventListener(
      "click",
      () => showView("flashcards")
    );

  }

}


function showView(viewName) {

  $$(".view")
    .forEach(view => {

      view.classList.remove(
        "active-view"
      );

    });


  const target =
    $(`#view-${viewName}`);


  if (target) {

    target.classList.add(
      "active-view"
    );

  }


  $$(".nav-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view === viewName
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (viewName === "progress") {

    renderProgress();

  }

}


/* ============================================================
   FILTERS
============================================================ */

function populateFilters() {

  populateSelect(
    $("#lesson-filter"),
    uniqueValues(
      state.vocabulary,
      "Lesson#"
    ),
    "All Lessons"
  );


  populateSelect(
    $("#topic-filter"),
    uniqueValues(
      state.vocabulary,
      "Topic"
    ),
    "All Topics"
  );


  populateSelect(
    $("#hsk-filter"),
    uniqueValues(
      state.vocabulary,
      "HSK_Level"
    ),
    "All HSK Levels"
  );

}


function uniqueValues(
  rows,
  column
) {

  return [
    ...new Set(
      rows
        .map(row => clean(row[column]))
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          numeric: true
        }
      )
  );

}


function populateSelect(
  select,
  values,
  defaultLabel
) {

  if (!select) {
    return;
  }


  select.innerHTML = "";


  const defaultOption =
    document.createElement("option");


  defaultOption.value = "";

  defaultOption.textContent =
    defaultLabel;


  select.appendChild(
    defaultOption
  );


  values.forEach(value => {

    const option =
      document.createElement("option");


    option.value =
      value;

    option.textContent =
      value;


    select.appendChild(
      option
    );

  });

}


/* ============================================================
   FILTER VOCABULARY
============================================================ */

function applyFilters() {

  const lesson =
    $("#lesson-filter").value;

  const topic =
    $("#topic-filter").value;

  const hsk =
    $("#hsk-filter").value;


  state.filteredVocabulary =
    state.vocabulary.filter(row => {

      const lessonMatch =
        !lesson ||
        clean(row["Lesson#"]) === lesson;


      const topicMatch =
        !topic ||
        clean(row.Topic) === topic;


      const hskMatch =
        !hsk ||
        clean(row.HSK_Level) === hsk;


      return (
        lessonMatch &&
        topicMatch &&
        hskMatch
      );

    });


  updateWordCount();

}


/* ============================================================
   STUDY SET
============================================================ */

function createDefaultStudySet() {

  const amount =
    Math.min(
      20,
      state.vocabulary.length
    );


  state.studySet =
    shuffle(
      state.vocabulary
    ).slice(
      0,
      amount
    );


  state.cardIndex = 0;

  state.cardFlipped = false;

  renderFlashcard();

}


function createStudySet() {

  applyFilters();


  const requestedSize =
    Number(
      $("#study-size").value
    );


  if (!state.filteredVocabulary.length) {

    alert(
      "No words match your selected filters."
    );

    return;

  }


  const actualSize =
    Math.min(
      requestedSize,
      state.filteredVocabulary.length
    );


  state.studySet =
    shuffle(
      state.filteredVocabulary
    ).slice(
      0,
      actualSize
    );


  state.cardIndex = 0;

  state.cardFlipped = false;

  renderFlashcard();

}


function setupFlashcards() {

  $("#create-study-set")
    .addEventListener(
      "click",
      createStudySet
    );


  $("#flashcard")
    .addEventListener(
      "click",
      flipCard
    );


  $("#previous-card")
    .addEventListener(
      "click",
      previousCard
    );


  $("#next-card")
    .addEventListener(
      "click",
      nextCard
    );


  $("#shuffle-card")
    .addEventListener(
      "click",
      shuffleCurrentSet
    );


  $("#flashcard-speak")
    .addEventListener(
      "click",
      speakCurrentWord
    );


  $("#back-speak")
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        speakCurrentWord();

      }
    );

}


function renderFlashcard() {

  const card =
    state.studySet[
      state.cardIndex
    ];


  if (!card) {

    $("#flashcard-simplified")
      .textContent = "—";


    $("#flashcard-progress")
      .textContent = "0 / 0";


    $("#flashcard-details")
      .innerHTML = "";


    return;

  }


  $("#flashcard-simplified")
    .textContent =
    getWord(card);


  $("#flashcard-progress")
    .textContent =
    `${state.cardIndex + 1} / ${state.studySet.length}`;


  renderCardDetails(card);


  $("#flashcard")
    .classList.toggle(
      "flipped",
      state.cardFlipped
    );

}


function renderCardDetails(row) {

  const container =
    $("#flashcard-details");


  container.innerHTML = "";


  const coreColumns = [
    "Simplified",
    "Traditional",
    "Pinyin",
    "English",
    "Part of Speech",
    "Lesson",
    "Lesson#",
    "Topic"
  ];


  const hskColumns = [
    "HSK_Number",
    "HSK_Hanzi",
    "HSK_Pinyin",
    "HSK_Level",
    "CLI_English"
  ];


  addDetailSection(
    container,
    "Core Information",
    row,
    coreColumns
  );


  addDetailSection(
    container,
    "HSK / CLI Information",
    row,
    hskColumns
  );


  for (let i = 1; i <= 3; i++) {

    addDetailSection(
      container,
      `Example ${i}`,
      row,
      [
        `example${i}_chinese`,
        `example${i}_pinyin`,
        `example${i}_english`
      ]
    );

  }

}


function addDetailSection(
  container,
  title,
  row,
  columns
) {

  const available =
    columns.filter(
      column =>
        clean(row[column])
    );


  if (!available.length) {
    return;
  }


  const section =
    document.createElement("div");


  section.className =
    "detail-section";


  const heading =
    document.createElement("h4");


  heading.textContent =
    title;


  section.appendChild(
    heading
  );


  available.forEach(column => {

    const rowElement =
      document.createElement("div");


    rowElement.className =
      "detail-row";


    const label =
      document.createElement("div");


    label.className =
      "detail-label";


    label.textContent =
      prettyColumnName(column);


    const value =
      document.createElement("div");


    value.className =
      "detail-value";


    value.textContent =
      clean(row[column]);


    rowElement.appendChild(label);

    rowElement.appendChild(value);

    section.appendChild(
      rowElement
    );

  });


  container.appendChild(
    section
  );

}


function prettyColumnName(column) {

  return column
    .replace(/_/g, " ")
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    );

}


/* ============================================================
   FLASHCARD CONTROLS
============================================================ */

function flipCard() {

  state.cardFlipped =
    !state.cardFlipped;


  renderFlashcard();

}


function nextCard() {

  if (!state.studySet.length) {
    return;
  }


  recordStudyResult(
    state.studySet[
      state.cardIndex
    ],
    null
  );


  state.cardIndex++;


  if (
    state.cardIndex >=
    state.studySet.length
  ) {

    state.cardIndex = 0;

  }


  state.cardFlipped = false;

  renderFlashcard();

}


function previousCard() {

  if (!state.studySet.length) {
    return;
  }


  state.cardIndex--;


  if (state.cardIndex < 0) {

    state.cardIndex =
      state.studySet.length - 1;

  }


  state.cardFlipped = false;

  renderFlashcard();

}


function shuffleCurrentSet() {

  state.studySet =
    shuffle(state.studySet);


  state.cardIndex = 0;

  state.cardFlipped = false;

  renderFlashcard();

}


/* ============================================================
   READING
============================================================ */

function initializeReading() {

  state.readingVocabulary =
    state.vocabulary.filter(row => {

      for (let i = 1; i <= 3; i++) {

        if (
          clean(
            row[`example${i}_chinese`]
          )
        ) {

          return true;

        }

      }

      return false;

    });


  state.readingVocabulary =
    shuffle(
      state.readingVocabulary
    );


  state.readingIndex = 0;

  state.readingExampleNumber = 1;

  renderReading();

}


function setupReading() {

  $("#previous-reading")
    .addEventListener(
      "click",
      previousReading
    );


  $("#next-reading")
    .addEventListener(
      "click",
      nextReading
    );


  $("#random-reading")
    .addEventListener(
      "click",
      randomReading
    );


  $("#show-example-details")
    .addEventListener(
      "click",
      toggleExampleDetails
    );


  $("#reading-speak")
    .addEventListener(
      "click",
      speakReadingSentence
    );


  $("#reading-sentence")
    .addEventListener(
      "click",
      handleCharacterClick
    );


  $("#reading-sentence")
    .addEventListener(
      "mouseover",
      handleCharacterHover
    );


  $("#reading-sentence")
    .addEventListener(
      "mouseout",
      hideCharacterTooltip
    );

}


function getCurrentReadingRow() {

  return state.readingVocabulary[
    state.readingIndex
  ];

}


function getAvailableExamples(row) {

  const examples = [];


  for (let i = 1; i <= 3; i++) {

    const chinese =
      clean(
        row[`example${i}_chinese`]
      );


    if (chinese) {

      examples.push({

        number: i,

        chinese,

        pinyin: clean(
          row[`example${i}_pinyin`]
        ),

        english: clean(
          row[`example${i}_english`]
        )

      });

    }

  }


  return examples;

}


function renderReading() {

  const row =
    getCurrentReadingRow();


  if (!row) {

    $("#reading-sentence")
      .textContent =
      "No example sentences available.";

    return;

  }


  const examples =
    getAvailableExamples(row);


  if (!examples.length) {
    return;
  }


  if (
    !examples.some(
      ex =>
        ex.number ===
        state.readingExampleNumber
    )
  ) {

    state.readingExampleNumber =
      examples[0].number;

  }


  const example =
    examples.find(
      ex =>
        ex.number ===
        state.readingExampleNumber
    );


  $("#reading-example-label")
    .textContent =
    `Example ${example.number}`;


  renderReadingSentence(
    example.chinese
  );


  $("#example-pinyin-text")
    .textContent =
    example.pinyin ||
    "No pinyin available.";


  $("#example-english-text")
    .textContent =
    example.english ||
    "No English translation available.";


  $("#example-details")
    .classList.add("hidden");


  $("#show-example-details")
    .textContent =
    "Show Pinyin & English";

}


function renderReadingSentence(sentence) {

  const container =
    $("#reading-sentence");


  container.innerHTML = "";


  for (
    const character of sentence
  ) {

    if (
      /\s/.test(character)
    ) {

      container.appendChild(
        document.createTextNode(character)
      );

      continue;

    }


    const span =
      document.createElement("span");


    span.className =
      "reading-character";


    span.textContent =
      character;


    span.dataset.character =
      character;


    container.appendChild(
      span
    );

  }

}


function nextReading() {

  if (
    !state.readingVocabulary.length
  ) {
    return;
  }


  state.readingIndex++;


  if (
    state.readingIndex >=
    state.readingVocabulary.length
  ) {

    state.readingIndex = 0;

  }


  state.readingExampleNumber = 1;

  renderReading();

}


function previousReading() {

  if (
    !state.readingVocabulary.length
  ) {
    return;
  }


  state.readingIndex--;


  if (state.readingIndex < 0) {

    state.readingIndex =
      state.readingVocabulary.length - 1;

  }


  state.readingExampleNumber = 1;

  renderReading();

}


function randomReading() {

  if (
    !state.readingVocabulary.length
  ) {
    return;
  }


  state.readingIndex =
    Math.floor(
      Math.random() *
      state.readingVocabulary.length
    );


  const row =
    getCurrentReadingRow();


  const examples =
    getAvailableExamples(row);


  if (examples.length) {

    const randomExample =
      examples[
        Math.floor(
          Math.random() *
          examples.length
        )
      ];


    state.readingExampleNumber =
      randomExample.number;

  }


  renderReading();

}


function toggleExampleDetails() {

  const details =
    $("#example-details");


  const hidden =
    details.classList.toggle(
      "hidden"
    );


  $("#show-example-details")
    .textContent =
    hidden
      ? "Show Pinyin & English"
      : "Hide Pinyin & English";

}


/* ============================================================
   CHARACTER LOOKUP
============================================================ */

function findCharacterInformation(
  character
) {

  let result =
    state.vocabulary.find(
      row =>
        getWord(row) === character
    );


  if (result) {
    return result;
  }


  result =
    state.vocabulary.find(
      row =>
        clean(row.Traditional) === character
    );


  if (result) {
    return result;
  }


  result =
    state.vocabulary.find(
      row =>
        getWord(row).includes(character)
    );


  return result || null;

}


function handleCharacterClick(event) {

  const characterElement =
    event.target.closest(
      ".reading-character"
    );


  if (!characterElement) {
    return;
  }


  const character =
    characterElement.dataset.character;


  const row =
    findCharacterInformation(
      character
    );


  renderCharacterDetails(
    character,
    row
  );

}


function handleCharacterHover(event) {

  const characterElement =
    event.target.closest(
      ".reading-character"
    );


  if (!characterElement) {
    return;
  }


  const character =
    characterElement.dataset.character;


  const row =
    findCharacterInformation(
      character
    );


  showCharacterTooltip(
    characterElement,
    character,
    row
  );

}


function showCharacterTooltip(
  element,
  character,
  row
) {

  let tooltip =
    $("#character-tooltip");


  if (!tooltip) {

    tooltip =
      document.createElement("div");


    tooltip.id =
      "character-tooltip";


    tooltip.className =
      "character-tooltip";


    document.body.appendChild(
      tooltip
    );

  }


  if (row) {

    tooltip.innerHTML = `

      <div class="tooltip-character">
        ${escapeHTML(character)}
      </div>

      <div class="tooltip-pinyin">
        ${escapeHTML(
          clean(row.Pinyin) ||
          clean(row.HSK_Pinyin) ||
          "No pinyin"
        )}
      </div>

      <div class="tooltip-english">
        ${escapeHTML(
          clean(row.English) ||
          clean(row.CLI_English) ||
          "No English"
        )}
      </div>

    `;

  } else {

    tooltip.innerHTML = `

      <div class="tooltip-character">
        ${escapeHTML(character)}
      </div>

      <div class="tooltip-english">
        No vocabulary entry found
      </div>

    `;

  }


  const rect =
    element.getBoundingClientRect();


  tooltip.style.display =
    "block";


  let left =
    rect.left +
    rect.width / 2 -
    100;


  let top =
    rect.top -
    120;


  if (top < 10) {

    top =
      rect.bottom + 10;

  }


  if (
    left + 210 >
    window.innerWidth - 10
  ) {

    left =
      window.innerWidth - 220;

  }


  if (left < 10) {
    left = 10;
  }


  tooltip.style.left =
    `${left}px`;


  tooltip.style.top =
    `${top}px`;

}


function hideCharacterTooltip() {

  const tooltip =
    $("#character-tooltip");


  if (tooltip) {

    tooltip.style.display =
      "none";

  }

}


function renderCharacterDetails(
  character,
  row
) {

  const panel =
    $("#character-details");


  if (!panel) {
    return;
  }


  if (!row) {

    panel.innerHTML = `

      <div class="character-selected">

        <div class="selected-character">
          ${escapeHTML(character)}
        </div>

        <p>
          No vocabulary entry was found
          for this character.
        </p>

      </div>

    `;

    return;

  }


  panel.innerHTML = `

    <div class="character-selected">

      <div class="selected-character">
        ${escapeHTML(character)}
      </div>

      ${characterInfoRow(
        "Simplified",
        row.Simplified
      )}

      ${characterInfoRow(
        "Traditional",
        row.Traditional
      )}

      ${characterInfoRow(
        "Pinyin",
        row.Pinyin || row.HSK_Pinyin
      )}

      ${characterInfoRow(
        "English",
        row.English
      )}

      ${characterInfoRow(
        "CLI English",
        row.CLI_English
      )}

      ${characterInfoRow(
        "HSK Level",
        row.HSK_Level
      )}

    </div>

  `;

}


function characterInfoRow(
  label,
  value
) {

  value =
    clean(value);


  if (!value) {
    return "";
  }


  return `

    <div class="character-info-row">

      <strong>
        ${escapeHTML(label)}
      </strong>

      ${escapeHTML(value)}

    </div>

  `;

}


/* ============================================================
   TEXT TO SPEECH
============================================================ */

function speakText(text) {

  if (
    !text ||
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


function speakCurrentWord() {

  const row =
    state.studySet[
      state.cardIndex
    ];


  if (row) {

    speakText(
      getWord(row)
    );

  }

}


function speakReadingSentence() {

  const row =
    getCurrentReadingRow();


  if (!row) {
    return;
  }


  const examples =
    getAvailableExamples(row);


  const example =
    examples.find(
      ex =>
        ex.number ===
        state.readingExampleNumber
    );


  if (example) {

    speakText(
      example.chinese
    );

  }

}


/* ============================================================
   GAMES
============================================================ */

function setupGames() {

  $$(".game-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          startGame(
            card.dataset.game
          );

        }
      );

    });


  $("#exit-game")
    .addEventListener(
      "click",
      exitGame
    );

}


function startGame(gameName) {

  const gameSource =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;


  if (gameSource.length < 4) {

    alert(
      "At least 4 vocabulary words are needed for games."
    );

    return;

  }


  state.currentGame =
    gameName;


  state.gameScore = 0;

  state.gameIndex = 0;

  state.gameAnswered = false;


  $("#game-selection")
    .classList.add("hidden");


  $("#game-area")
    .classList.remove("hidden");


  $("#game-score")
    .textContent =
    "0";


  state.gameWords =
    shuffle(
      gameSource
    ).slice(
      0,
      Math.min(
        10,
        gameSource.length
      )
    );


  renderGame();

}


function exitGame() {

  state.currentGame =
    null;


  $("#game-area")
    .classList.add("hidden");


  $("#game-selection")
    .classList.remove("hidden");

}


function renderGame() {

  switch (
    state.currentGame
  ) {

    case "multiple-choice":

      renderMultipleChoice();

      break;


    case "english-chinese":

      renderEnglishChinese();

      break;


    case "scramble":

      renderScramble();

      break;


    case "matching":

      startMatchingGame();

      break;


    case "sentence":

      renderSentenceScramble();

      break;


    case "listening":

      renderListeningGame();

      break;

  }

}


/* ============================================================
   MULTIPLE CHOICE
============================================================ */

function renderMultipleChoice() {

  const row =
    state.gameWords[
      state.gameIndex
    ];


  if (!row) {

    renderGameComplete();

    return;

  }


  state.gameAnswered = false;


  const correct =
    getEnglish(row);


  const distractors =
    shuffle(
      state.gameWords.filter(
        item =>
          item !== row &&
          getEnglish(item)
      )
    )
    .slice(0, 3)
    .map(
      item =>
        getEnglish(item)
    );


  const answers =
    shuffle([
      correct,
      ...distractors
    ]);


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        What does this word mean?
      </div>

      <div class="game-chinese">
        ${escapeHTML(
          getWord(row)
        )}
      </div>

      <div class="answer-grid">

        ${answers.map(
          answer => `

            <button
              class="answer-button"
              data-answer="${escapeAttribute(answer)}"
            >
              ${escapeHTML(answer)}
            </button>

          `
        ).join("")}

      </div>

      <div
        id="game-feedback"
        class="game-feedback hidden"
      ></div>

    `;


  $$(".answer-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          handleMultipleChoiceAnswer(
            button,
            correct,
            row
          );

        }
      );

    });

}


function handleMultipleChoiceAnswer(
  button,
  correct,
  row
) {

  if (state.gameAnswered) {
    return;
  }


  state.gameAnswered = true;


  const answer =
    button.dataset.answer;


  const isCorrect =
    answer === correct;


  $$(".answer-button")
    .forEach(btn => {

      if (
        btn.dataset.answer ===
        correct
      ) {

        btn.classList.add(
          "correct"
        );

      }

    });


  if (isCorrect) {

    button.classList.add(
      "correct"
    );


    state.gameScore++;


    recordStudyResult(
      row,
      true
    );

  } else {

    button.classList.add(
      "incorrect"
    );


    recordStudyResult(
      row,
      false
    );

  }


  $("#game-score")
    .textContent =
    state.gameScore;


  showGameFeedback(
    isCorrect,
    isCorrect
      ? "Correct!"
      : `The answer is: ${correct}`
  );


  setTimeout(
    nextGameQuestion,
    900
  );

}


/* ============================================================
   ENGLISH → CHINESE
============================================================ */

function renderEnglishChinese() {

  const row =
    state.gameWords[
      state.gameIndex
    ];


  if (!row) {

    renderGameComplete();

    return;

  }


  state.gameAnswered = false;


  const correct =
    getWord(row);


  const distractors =
    shuffle(
      state.gameWords.filter(
        item =>
          item !== row &&
          getWord(item)
      )
    )
    .slice(0, 3)
    .map(
      item =>
        getWord(item)
    );


  const answers =
    shuffle([
      correct,
      ...distractors
    ]);


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        Which Chinese word means:
      </div>

      <div class="game-question">
        "${escapeHTML(
          getEnglish(row)
        )}"
      </div>

      <div class="answer-grid">

        ${answers.map(
          answer => `

            <button
              class="answer-button"
              data-answer="${escapeAttribute(answer)}"
            >
              ${escapeHTML(answer)}
            </button>

          `
        ).join("")}

      </div>

      <div
        id="game-feedback"
        class="game-feedback hidden"
      ></div>

    `;


  $$(".answer-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (state.gameAnswered) {
            return;
          }


          state.gameAnswered = true;


          const answer =
            button.dataset.answer;


          const isCorrect =
            answer === correct;


          $$(".answer-button")
            .forEach(btn => {

              if (
                btn.dataset.answer ===
                correct
              ) {

                btn.classList.add(
                  "correct"
                );

              }

            });


          if (isCorrect) {

            button.classList.add(
              "correct"
            );

            state.gameScore++;

          } else {

            button.classList.add(
              "incorrect"
            );

          }


          recordStudyResult(
            row,
            isCorrect
          );


          $("#game-score")
            .textContent =
            state.gameScore;


          showGameFeedback(
            isCorrect,
            isCorrect
              ? "Correct!"
              : `The answer is: ${correct}`
          );


          setTimeout(
            nextGameQuestion,
            900
          );

        }
      );

    });

}


/* ============================================================
   WORD SCRAMBLE
============================================================ */

function renderScramble() {

  const row =
    state.gameWords[
      state.gameIndex
    ];


  if (!row) {

    renderGameComplete();

    return;

  }


  state.gameAnswered = false;


  const word =
    getWord(row);


  if (
    [...word].length < 2
  ) {

    state.gameIndex++;

    renderGame();

    return;

  }


  const characters =
    shuffle([
      ...word
    ]);


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        Build the Chinese word
      </div>

      <div class="game-question">
        English:
        <strong>
          ${escapeHTML(
            getEnglish(row)
          )}
        </strong>
      </div>

      <div
        id="scramble-answer"
        class="scramble-answer"
      >
        <span>
          Click characters below
        </span>
      </div>

      <div
        id="scramble-letters"
        class="scramble-letters"
      >

        ${characters.map(
          (char, index) => `

            <button
              class="scramble-letter"
              data-index="${index}"
              data-char="${escapeAttribute(char)}"
            >
              ${escapeHTML(char)}
            </button>

          `
        ).join("")}

      </div>

      <button
        id="scramble-submit"
        class="primary-button"
      >
        Check Answer
      </button>

      <div
        id="game-feedback"
        class="game-feedback hidden"
      ></div>

    `;


  const selected = [];


  $$(".scramble-letter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (button.disabled) {
            return;
          }


          button.disabled = true;


          selected.push(
            button.dataset.char
          );


          renderScrambleAnswer(
            selected
          );

        }
      );

    });


  $("#scramble-submit")
    .addEventListener(
      "click",
      () => {

        if (state.gameAnswered) {
          return;
        }


        state.gameAnswered = true;


        const answer =
          selected.join("");


        const isCorrect =
          answer === word;


        if (isCorrect) {
          state.gameScore++;
        }


        recordStudyResult(
          row,
          isCorrect
        );


        $("#game-score")
          .textContent =
          state.gameScore;


        showGameFeedback(
          isCorrect,
          isCorrect
            ? "Correct!"
            : `Correct word: ${word}`
        );


        setTimeout(
          nextGameQuestion,
          1200
        );

      }
    );

}


function renderScrambleAnswer(
  characters
) {

  const container =
    $("#scramble-answer");


  if (!characters.length) {

    container.innerHTML =
      "<span>Click characters below</span>";

    return;

  }


  container.innerHTML =
    characters.map(
      char =>
        `<span class="word-tile">${escapeHTML(char)}</span>`
    ).join("");

}


/* ============================================================
   SENTENCE SCRAMBLE
============================================================ */

function renderSentenceScramble() {

  const candidates =
    state.gameWords.filter(row => {

      return getAvailableExamples(row)
        .some(
          ex =>
            ex.chinese &&
            ex.chinese.length > 3
        );

    });


  if (!candidates.length) {

    $("#game-content")
      .innerHTML = `

        <div class="game-question">
          No suitable example sentences
          were found for this game.
        </div>

        <button
          id="sentence-back-button"
          class="primary-button"
        >
          Back to Games
        </button>

      `;


    $("#sentence-back-button")
      .addEventListener(
        "click",
        exitGame
      );


    return;

  }


  const row =
    candidates[
      state.gameIndex %
      candidates.length
    ];


  const examples =
    getAvailableExamples(row)
      .filter(
        ex =>
          ex.chinese.length > 3
      );


  const example =
    examples[
      Math.floor(
        Math.random() *
        examples.length
      )
    ];


  const cleanedSentence =
    example.chinese;


  const characters =
    shuffle([
      ...cleanedSentence
    ]);


  state.gameAnswered = false;


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        Put the sentence in the correct order.
      </div>

      <div>
        English:
        <strong>
          ${escapeHTML(
            example.english
          )}
        </strong>
      </div>

      <div
        id="sentence-answer"
        class="scramble-answer"
      >
      </div>

      <div class="sentence-tiles">

        ${characters.map(
          (char, index) => `

            <button
              class="sentence-tile"
              data-index="${index}"
              data-char="${escapeAttribute(char)}"
            >
              ${escapeHTML(char)}
            </button>

          `
        ).join("")}

      </div>

      <button
        id="sentence-submit"
        class="primary-button"
      >
        Check Sentence
      </button>

      <div
        id="game-feedback"
        class="game-feedback hidden"
      ></div>

    `;


  const selected = [];


  $$(".sentence-tile")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (button.disabled) {
            return;
          }


          button.disabled = true;


          selected.push(
            button.dataset.char
          );


          $("#sentence-answer")
            .textContent =
            selected.join("");

        }
      );

    });


  $("#sentence-submit")
    .addEventListener(
      "click",
      () => {

        if (state.gameAnswered) {
          return;
        }


        state.gameAnswered = true;


        const answer =
          selected.join("");


        const isCorrect =
          answer === cleanedSentence;


        if (isCorrect) {
          state.gameScore++;
        }


        recordStudyResult(
          row,
          isCorrect
        );


        $("#game-score")
          .textContent =
          state.gameScore;


        showGameFeedback(
          isCorrect,
          isCorrect
            ? "Correct!"
            : `Correct sentence: ${cleanedSentence}`
        );


        setTimeout(
          nextGameQuestion,
          1300
        );

      }
    );

}


/* ============================================================
   LISTENING GAME
============================================================ */

function renderListeningGame() {

  const row =
    state.gameWords[
      state.gameIndex
    ];


  if (!row) {

    renderGameComplete();

    return;

  }


  state.gameAnswered = false;


  const correct =
    getWord(row);


  const distractors =
    shuffle(
      state.gameWords.filter(
        item =>
          item !== row &&
          getWord(item)
      )
    )
    .slice(0, 3)
    .map(
      item =>
        getWord(item)
    );


  const answers =
    shuffle([
      correct,
      ...distractors
    ]);


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        What Chinese word did you hear?
      </div>

      <button
        id="listen-button"
        class="primary-button large-button"
      >
        🔊 Play Word
      </button>

      <div
        class="answer-grid"
        style="margin-top:25px"
      >

        ${answers.map(
          answer => `

            <button
              class="answer-button"
              data-answer="${escapeAttribute(answer)}"
            >
              ${escapeHTML(answer)}
            </button>

          `
        ).join("")}

      </div>

      <div
        id="game-feedback"
        class="game-feedback hidden"
      ></div>

    `;


  $("#listen-button")
    .addEventListener(
      "click",
      () => speakText(correct)
    );


  setTimeout(
    () => speakText(correct),
    300
  );


  $$(".answer-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (state.gameAnswered) {
            return;
          }


          state.gameAnswered = true;


          const isCorrect =
            button.dataset.answer ===
            correct;


          if (isCorrect) {

            button.classList.add(
              "correct"
            );


            state.gameScore++;

          } else {

            button.classList.add(
              "incorrect"
            );

          }


          $$(".answer-button")
            .forEach(btn => {

              if (
                btn.dataset.answer ===
                correct
              ) {

                btn.classList.add(
                  "correct"
                );

              }

            });


          recordStudyResult(
            row,
            isCorrect
          );


          $("#game-score")
            .textContent =
            state.gameScore;


          showGameFeedback(
            isCorrect,
            isCorrect
              ? "Correct!"
              : `The answer is: ${correct}`
          );


          setTimeout(
            nextGameQuestion,
            1000
          );

        }
      );

    });

}


/* ============================================================
   MATCHING GAME
============================================================ */

function startMatchingGame() {

  const gameSource =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;


  const words =
    shuffle(
      gameSource
    ).slice(
      0,
      6
    );


  state.matchingCards = [];


  words.forEach((row, index) => {

    state.matchingCards.push({

      id: `${index}-cn`,

      pair: index,

      text: getWord(row),

      type: "chinese",

      row

    });


    state.matchingCards.push({

      id: `${index}-en`,

      pair: index,

      text: getEnglish(row),

      type: "english",

      row

    });

  });


  state.matchingCards =
    shuffle(
      state.matchingCards
    );


  state.matchingFirst = null;

  state.matchingSecond = null;

  state.matchingMatches = 0;


  renderMatchingGame();

}


function renderMatchingGame() {

  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        Match each Chinese word
        with its English meaning.
      </div>

      <div
        id="matching-grid"
        class="matching-grid"
      >

        ${state.matchingCards.map(
          card => `

            <button
              class="match-card hidden-card"
              data-id="${escapeAttribute(card.id)}"
            >
              ${escapeHTML(card.text)}
            </button>

          `
        ).join("")}

      </div>

    `;


  $$(".match-card")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          handleMatchingClick(
            button
          );

        }
      );

    });

}


function handleMatchingClick(
  button
) {

  if (
    state.matchingFirst &&
    state.matchingSecond
  ) {
    return;
  }


  const id =
    button.dataset.id;


  const card =
    state.matchingCards.find(
      item =>
        item.id === id
    );


  if (!card) {
    return;
  }


  if (
    state.matchingFirst &&
    state.matchingFirst.id === id
  ) {

    return;

  }


  button.classList.remove(
    "hidden-card"
  );


  button.classList.add(
    "revealed"
  );


  if (!state.matchingFirst) {

    state.matchingFirst = {

      ...card,

      element: button

    };


    return;

  }


  state.matchingSecond = {

    ...card,

    element: button

  };


  const first =
    state.matchingFirst;

  const second =
    state.matchingSecond;


  const isMatch =
    first.pair ===
    second.pair;


  if (isMatch) {

    state.matchingMatches++;

    state.gameScore++;


    first.element.style.visibility =
      "hidden";


    second.element.style.visibility =
      "hidden";


    recordStudyResult(
      first.row,
      true
    );


    /*
      Both cards represent the same
      vocabulary word, so both should
      receive credit.
    */

    if (second.row !== first.row) {

      recordStudyResult(
        second.row,
        true
      );

    }


    $("#game-score")
      .textContent =
      state.gameScore;


    state.matchingFirst = null;

    state.matchingSecond = null;


    if (
      state.matchingMatches ===
      6
    ) {

      setTimeout(
        renderGameComplete,
        500
      );

    }

  } else {

    recordStudyResult(
      first.row,
      false
    );


    if (second.row !== first.row) {

      recordStudyResult(
        second.row,
        false
      );

    }


    setTimeout(
      () => {

        first.element
          .classList.add(
            "hidden-card"
          );


        second.element
          .classList.add(
            "hidden-card"
          );


        first.element
          .classList.remove(
            "revealed"
          );


        second.element
          .classList.remove(
            "revealed"
          );


        state.matchingFirst = null;

        state.matchingSecond = null;

      },
      700
    );

  }

}


/* ============================================================
   GAME UTILITIES
============================================================ */

function nextGameQuestion() {

  state.gameIndex++;


  if (
    state.gameIndex >=
    state.gameWords.length
  ) {

    renderGameComplete();

    return;

  }


  renderGame();

}


function showGameFeedback(
  correct,
  message
) {

  const element =
    $("#game-feedback");


  if (!element) {
    return;
  }


  element.classList.remove(
    "hidden"
  );


  element.classList.toggle(
    "correct",
    correct
  );


  element.classList.toggle(
    "incorrect",
    !correct
  );


  element.textContent =
    message;

}


function renderGameComplete() {

  const total =
    state.gameWords.length;


  const percentage =
    total
      ? Math.round(
          (state.gameScore / total) *
          100
        )
      : 0;


  $("#game-content")
    .innerHTML = `

      <div class="game-question">
        🎉 Game Complete!
      </div>

      <div class="game-chinese">
        ${state.gameScore}
        /
        ${total}
      </div>

      <p>
        You scored
        <strong>
          ${percentage}%
        </strong>
      </p>

      <button
        id="play-again"
        class="primary-button"
      >
        Play Again
      </button>

    `;


  $("#play-again")
    .addEventListener(
      "click",
      () => {

        startGame(
          state.currentGame
        );

      }
    );


  updateAllStatistics();

}


/* ============================================================
   PROGRESS SYSTEM
============================================================ */

function loadProgress() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (saved) {

      state.progress =
        JSON.parse(saved);

    } else {

      state.progress = {};

    }

  } catch (error) {

    console.error(
      "Could not load progress",
      error
    );


    state.progress = {};

  }

}


function saveProgress() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        state.progress
      )
    );

  } catch (error) {

    console.error(
      "Could not save progress",
      error
    );

  }

}


function getProgressKey(row) {

  return (
    getWord(row) ||
    clean(row.Traditional) ||
    clean(row.Pinyin)
  );

}


function getWordProgress(row) {

  const key =
    getProgressKey(row);


  if (!state.progress[key]) {

    state.progress[key] = {

      correct: 0,

      incorrect: 0,

      lastStudied: null

    };

  }


  return state.progress[key];

}


function recordStudyResult(
  row,
  result
) {

  if (!row) {
    return;
  }


  /*
    null means the card was viewed
    but not answered.
  */

  if (
    result !== true &&
    result !== false
  ) {

    return;

  }


  const progress =
    getWordProgress(row);


  if (result) {

    progress.correct++;

  } else {

    progress.incorrect++;

  }


  progress.lastStudied =
    new Date().toISOString();


  saveProgress();

  updateAllStatistics();

}


function getMasteryPercentage(row) {

  const progress =
    getWordProgress(row);


  const total =
    progress.correct +
    progress.incorrect;


  if (!total) {
    return 0;
  }


  return Math.round(
    (progress.correct / total) *
    100
  );

}


function getMasteryStatus(row) {

  const progress =
    getWordProgress(row);


  const total =
    progress.correct +
    progress.incorrect;


  if (!total) {
    return "New";
  }


  const accuracy =
    getMasteryPercentage(row);


  if (
    total >= 5 &&
    accuracy >= 80
  ) {

    return "Mastered";

  }


  return "Learning";

}


/* ============================================================
   PROGRESS UI
============================================================ */

function setupProgress() {

  $("#reset-progress")
    .addEventListener(
      "click",
      resetProgress
    );


  $("#review-incorrect")
    .addEventListener(
      "click",
      reviewIncorrectWords
    );

}


function getProgressStats() {

  let practiced = 0;

  let mastered = 0;

  let needsReview = 0;

  let correct = 0;

  let incorrect = 0;


  state.vocabulary.forEach(row => {

    const progress =
      getWordProgress(row);


    const total =
      progress.correct +
      progress.incorrect;


    if (total > 0) {
      practiced++;
    }


    if (
      getMasteryStatus(row) ===
      "Mastered"
    ) {

      mastered++;

    }


    if (
      progress.incorrect >
      progress.correct
    ) {

      needsReview++;

    }


    correct +=
      progress.correct;


    incorrect +=
      progress.incorrect;

  });


  const attempts =
    correct + incorrect;


  const accuracy =
    attempts
      ? Math.round(
          (correct / attempts) *
          100
        )
      : 0;


  return {

    practiced,

    mastered,

    needsReview,

    accuracy,

    correct,

    incorrect

  };

}


function updateAllStatistics() {

  if (!state.vocabulary.length) {
    return;
  }


  const stats =
    getProgressStats();


  const homeTotal =
    $("#home-total-words");

  const homeMastered =
    $("#home-mastered");

  const homeReview =
    $("#home-review");

  const homeAccuracy =
    $("#home-accuracy");


  if (homeTotal) {
    homeTotal.textContent =
      state.vocabulary.length;
  }


  if (homeMastered) {
    homeMastered.textContent =
      stats.mastered;
  }


  if (homeReview) {
    homeReview.textContent =
      stats.needsReview;
  }


  if (homeAccuracy) {
    homeAccuracy.textContent =
      `${stats.accuracy}%`;
  }


  const progressTotal =
    $("#progress-total");

  const progressMastered =
    $("#progress-mastered");

  const progressReview =
    $("#progress-review");

  const progressAccuracy =
    $("#progress-accuracy");


  if (progressTotal) {
    progressTotal.textContent =
      stats.practiced;
  }


  if (progressMastered) {
    progressMastered.textContent =
      stats.mastered;
  }


  if (progressReview) {
    progressReview.textContent =
      stats.needsReview;
  }


  if (progressAccuracy) {
    progressAccuracy.textContent =
      `${stats.accuracy}%`;
  }

}


function renderProgress() {

  updateAllStatistics();


  const container =
    $("#progress-list");


  if (!container) {
    return;
  }


  const rows =
    [...state.vocabulary]
      .sort(
        (a, b) =>
          getMasteryPercentage(a) -
          getMasteryPercentage(b)
      );


  container.innerHTML = "";


  rows.forEach(row => {

    const progress =
      getWordProgress(row);


    const mastery =
      getMasteryPercentage(row);


    const status =
      getMasteryStatus(row);


    const element =
      document.createElement("div");


    element.className =
      "progress-row";


    const statusClass =
      status === "Mastered"
        ? "mastery-mastered"
        : status === "Learning"
          ? "mastery-learning"
          : "mastery-new";


    element.innerHTML = `

      <div class="progress-word">
        ${escapeHTML(
          getWord(row)
        )}
      </div>

      <div class="progress-english">
        ${escapeHTML(
          getEnglish(row)
        )}
      </div>

      <div>

        <div class="progress-bar-container">

          <div
            class="progress-bar"
            style="width:${mastery}%"
          ></div>

        </div>

        <small>
          ${progress.correct}
          correct /
          ${progress.incorrect}
          incorrect
        </small>

      </div>

      <span
        class="mastery-badge ${statusClass}"
      >
        ${status}
      </span>

    `;


    container.appendChild(
      element
    );

  });

}


function reviewIncorrectWords() {

  const incorrectWords =
    state.vocabulary.filter(row => {

      const progress =
        getWordProgress(row);


      return (
        progress.incorrect >
        progress.correct
      );

    });


  if (!incorrectWords.length) {

    alert(
      "You currently have no words that need review."
    );

    return;

  }


  state.studySet =
    shuffle(
      incorrectWords
    );


  state.cardIndex = 0;

  state.cardFlipped = false;

  renderFlashcard();

  showView("flashcards");

}


function resetProgress() {

  const confirmed =
    confirm(
      "Reset all vocabulary progress? This cannot be undone."
    );


  if (!confirmed) {
    return;
  }


  state.progress = {};

  saveProgress();

  updateAllStatistics();

  renderProgress();

}


/* ============================================================
   WORD COUNT
============================================================ */

function updateWordCount() {

  const count =
    state.filteredVocabulary.length;


  const total =
    state.vocabulary.length;


  const element =
    $("#word-count");


  if (element) {

    element.textContent =
      `${count} of ${total} words available`;

  }

}


/* ============================================================
   SECURITY / HTML HELPERS
============================================================ */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* ============================================================
   EVENT LISTENERS
============================================================ */

const reloadButton =
  $("#reload-button");


if (reloadButton) {

  reloadButton.addEventListener(
    "click",
    loadVocabulary
  );

}


/* ============================================================
   START APPLICATION
============================================================ */

loadVocabulary();
