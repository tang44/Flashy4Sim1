/* ============================================================
   CHINESE STUDY APP
   Plain HTML / CSS / JavaScript
   Designed for VS Code + Live Server
   No npm / Vite required

   Files:
   - WM_level1_all_with_HSK.xlsx
   - chinese_link_level1_example_sentences_web_all_lessons_expanded.xlsx
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const EXCEL_FILE = "WM_level1_all_with_HSK.xlsx";

const CLASS_READING_FILE =
  "chinese_link_level1_example_sentences_web_all_lessons_expanded.xlsx";

const PROGRESS_STORAGE_KEY = "chineseStudyProgress";


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

  classReading: [],
  filteredClassReading: [],
  classReadingIndex: 0,
  currentClassReading: null,
  classReadingDetailsVisible: false,

  vocabularyTerms: [],

  progress: {},

  gameWords: [],
  currentGame: null,
  currentGameIndex: 0,
  gameScore: 0,

  matchingMatches: 0,
  matchingSelected: null,

  listeningTimeout: null
};


/* ============================================================
   BASIC DOM HELPERS
============================================================ */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.prototype.slice.call(
    document.querySelectorAll(selector)
  );
}


/* ============================================================
   BASIC TEXT HELPERS
============================================================ */

function clean(value) {
  if (value === null || value === undefined) {
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
  var result = array.slice();

  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));

    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}

function normalizeChinese(value) {
  return clean(value)
    .replace(/\s+/g, "");
}

function normalizeLessonValue(value) {
  return clean(value)
    .replace(/^lesson\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function lessonNumber(value) {
  var match = clean(value).match(/\d+/);

  if (!match) {
    return 9999;
  }

  return Number(match[0]);
}


/* ============================================================
   SAFE ROW VALUE LOOKUP
============================================================ */

/*
   This is deliberately more tolerant than a normal object lookup.

   It handles:
   - Simplified
   - simplified
   - " Simplified "
   - Example1_chinese
   - example1_chinese
   - Example 1 Chinese
   - blank duplicate fields
*/

function normalizeColumnName(value) {
  return clean(value)
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toLowerCase();
}

function getRowValue(row, names) {
  if (!row || typeof row !== "object") {
    return "";
  }

  var requestedNames;

  if (Array.isArray(names)) {
    requestedNames = names;
  } else {
    requestedNames = [names];
  }

  var keys = Object.keys(row);

  /* First: exact/case-insensitive matches */
  for (var i = 0; i < requestedNames.length; i++) {
    var requested = clean(requestedNames[i]).toLowerCase();

    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];

      if (clean(key).toLowerCase() === requested) {
        var exactValue = row[key];

        if (
          exactValue !== null &&
          exactValue !== undefined &&
          clean(exactValue) !== ""
        ) {
          return exactValue;
        }
      }
    }
  }

  /* Second: normalized matches */
  for (var a = 0; a < requestedNames.length; a++) {
    var normalizedRequested =
      normalizeColumnName(requestedNames[a]);

    for (var b = 0; b < keys.length; b++) {
      var normalizedKey =
        normalizeColumnName(keys[b]);

      if (normalizedKey === normalizedRequested) {
        var normalizedValue = row[keys[b]];

        if (
          normalizedValue !== null &&
          normalizedValue !== undefined &&
          clean(normalizedValue) !== ""
        ) {
          return normalizedValue;
        }
      }
    }
  }

  return "";
}


/* ============================================================
   VOCABULARY FIELD HELPERS
============================================================ */

function getSimplified(row) {
  return clean(
    getRowValue(row, [
      "Simplified",
      "simplified",
      "HSK_Hanzi",
      "HSK Hanzi"
    ])
  );
}

function getTraditional(row) {
  return clean(
    getRowValue(row, [
      "Traditional",
      "traditional"
    ])
  );
}

function getPinyin(row) {
  return clean(
    getRowValue(row, [
      "Pinyin",
      "pinyin",
      "HSK_Pinyin",
      "HSK Pinyin"
    ])
  );
}

function getEnglish(row) {
  return clean(
    getRowValue(row, [
      "English",
      "english"
    ])
  );
}

function getCLIEnglish(row) {
  return clean(
    getRowValue(row, [
      "CLI_English",
      "CLI English",
      "CLIEnglish"
    ])
  );
}

function getLesson(row) {
  return clean(
    getRowValue(row, [
      "Lesson#",
      "Lesson",
      "lesson"
    ])
  );
}

function getTopic(row) {
  return clean(
    getRowValue(row, [
      "Topic",
      "topic"
    ])
  );
}

function getHSKNumber(row) {
  return clean(
    getRowValue(row, [
      "HSK_Number",
      "HSK Number",
      "HSKNumber"
    ])
  );
}

function getHSKLevel(row) {
  return clean(
    getRowValue(row, [
      "HSK_Level",
      "HSK Level",
      "HSKLevel"
    ])
  );
}

function getPartOfSpeech(row) {
  return clean(
    getRowValue(row, [
      "Part of Speech",
      "PartOfSpeech",
      "POS"
    ])
  );
}


/* ============================================================
   EXAMPLE SENTENCE HELPERS
============================================================ */

function getExampleValue(row, number, field) {
  var possibleNames = [
    "example" + number + "_" + field,
    "Example" + number + "_" + field,

    "example" + number + " " + field,
    "Example" + number + " " + field,

    "example " + number + "_" + field,
    "Example " + number + "_" + field,

    "example " + number + " " + field,
    "Example " + number + " " + field
  ];

  return clean(
    getRowValue(row, possibleNames)
  );
}

function getAvailableExamples(row) {
  var examples = [];

  if (!row) {
    return examples;
  }

  for (var number = 1; number <= 3; number++) {
    var chinese =
      getExampleValue(row, number, "chinese");

    var pinyin =
      getExampleValue(row, number, "pinyin");

    var english =
      getExampleValue(row, number, "english");

    if (chinese || pinyin || english) {
      examples.push({
        number: number,
        chinese: chinese,
        pinyin: pinyin,
        english: english
      });
    }
  }

  return examples;
}


/* ============================================================
   VOCABULARY TERM CLEANING
============================================================ */

/*
   Converts entries such as:

   不客气
   不客气 (You're welcome)
   不客气（不客氣）

   into the actual Chinese vocabulary term:

   不客气
*/

function cleanVocabularyTerm(value) {
  var text = clean(value);

  if (!text) {
    return "";
  }

  /* Remove whitespace */
  text = text.replace(/\s+/g, "");

  /* Remove normal parenthetical notes */
  var normalParenthesis =
    text.indexOf("(");

  if (normalParenthesis > 0) {
    text =
      text.substring(0, normalParenthesis);
  }

  /* Remove full-width parenthetical notes */
  var fullWidthParenthesis =
    text.indexOf("（");

  if (fullWidthParenthesis > 0) {
    text =
      text.substring(0, fullWidthParenthesis);
  }

  return text.trim();
}


/* ============================================================
   LONGEST-MATCH VOCABULARY LIST
============================================================ */

function buildVocabularyTerms() {
  var map = new Map();

  state.vocabulary.forEach(function(row) {
    var simplified =
      cleanVocabularyTerm(
        getSimplified(row)
      );

    var traditional =
      cleanVocabularyTerm(
        getTraditional(row)
      );

    if (simplified) {
      if (!map.has(simplified)) {
        map.set(simplified, row);
      }
    }

    if (traditional) {
      if (!map.has(traditional)) {
        map.set(traditional, row);
      }
    }
  });

  state.vocabularyTerms =
    Array.from(map.entries())
      .map(function(entry) {
        return {
          term: entry[0],
          row: entry[1]
        };
      })
      .sort(function(a, b) {

        /*
           LONGEST FIRST.

           This is critical.

           不客气
           will be checked before
           不
           客
           气
        */

        if (b.term.length !== a.term.length) {
          return b.term.length - a.term.length;
        }

        return a.term.localeCompare(b.term);
      });
}


/* ============================================================
   LONGEST-MATCH CHINESE TOKENIZER
============================================================ */

function tokenizeChineseSentence(sentence) {
  var text = clean(sentence);

  if (!text) {
    return [];
  }

  var characters =
    Array.from(text);

  var tokens = [];

  var position = 0;

  while (position < characters.length) {

    var bestMatch = null;

    /*
       Check every vocabulary term, longest first.
    */

    for (
      var i = 0;
      i < state.vocabularyTerms.length;
      i++
    ) {
      var vocabularyTerm =
        state.vocabularyTerms[i];

      var termCharacters =
        Array.from(vocabularyTerm.term);

      if (
        termCharacters.length >
        characters.length - position
      ) {
        continue;
      }

      var matches = true;

      for (
        var j = 0;
        j < termCharacters.length;
        j++
      ) {
        if (
          characters[position + j] !==
          termCharacters[j]
        ) {
          matches = false;
          break;
        }
      }

      if (matches) {
        bestMatch =
          vocabularyTerm;

        break;
      }
    }

    if (bestMatch) {
      var matchedCharacters =
        Array.from(bestMatch.term);

      tokens.push({
        type: "vocabulary",
        text: matchedCharacters.join(""),
        row: bestMatch.row
      });

      position +=
        matchedCharacters.length;

      continue;
    }

    /*
       No vocabulary word matched.

       Consume one Unicode character.
    */

    tokens.push({
      type: "character",
      text: characters[position],
      row: null
    });

    position++;
  }

  return tokens;
}


/* ============================================================
   FIND A SINGLE CHARACTER IN VOCABULARY
============================================================ */

function findVocabularyForCharacter(character) {
  var target =
    cleanVocabularyTerm(character);

  if (!target) {
    return null;
  }

  for (
    var i = 0;
    i < state.vocabularyTerms.length;
    i++
  ) {
    if (
      state.vocabularyTerms[i].term === target
    ) {
      return state.vocabularyTerms[i].row;
    }
  }

  return null;
}


/* ============================================================
   LOAD MAIN VOCABULARY
============================================================ */

async function loadVocabulary() {
  try {

    if (typeof XLSX === "undefined") {
      throw new Error(
        "SheetJS is not loaded. Check the SheetJS script in index.html."
      );
    }

    var response =
      await fetch(EXCEL_FILE);

    if (!response.ok) {
      throw new Error(
        "Could not load " +
        EXCEL_FILE +
        ". HTTP " +
        response.status
      );
    }

    var arrayBuffer =
      await response.arrayBuffer();

    var workbook =
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
        "The vocabulary workbook contains no worksheets."
      );
    }

    var worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    state.vocabulary =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: ""
        }
      );

    state.filteredVocabulary =
      state.vocabulary.slice();

    if (!state.vocabulary.length) {
      throw new Error(
        "The vocabulary workbook loaded, but it contains no data rows."
      );
    }

    buildVocabularyTerms();

    updateWordCount();

    populateFilters();

    applyFilters();

    setupReading();

    renderReading();

    renderProgress();

    console.log(
      "Loaded " +
      state.vocabulary.length +
      " vocabulary rows."
    );

    console.log(
      "Built " +
      state.vocabularyTerms.length +
      " longest-match vocabulary terms."
    );

    return true;

  } catch (error) {

    console.error(
      "Vocabulary loading error:",
      error
    );

    showLoadingError(
      "Unable to load vocabulary: " +
      error.message
    );

    return false;
  }
}


/* ============================================================
   LOAD CLASS READING WORKBOOK
============================================================ */

async function loadClassReading() {
  try {

    if (typeof XLSX === "undefined") {
      throw new Error(
        "SheetJS is not loaded."
      );
    }

    var response =
      await fetch(CLASS_READING_FILE);

    if (!response.ok) {
      throw new Error(
        "Could not load " +
        CLASS_READING_FILE +
        ". HTTP " +
        response.status
      );
    }

    var arrayBuffer =
      await response.arrayBuffer();

    var workbook =
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
        "The Class Reading workbook contains no worksheets."
      );
    }

    var worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    var rows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: ""
        }
      );

    state.classReading =
      rows
        .map(function(row) {

          return {
            Lesson: clean(
              getRowValue(row, [
                "Lesson",
                "Lesson#",
                "lesson"
              ])
            ),

            Chinese: clean(
              getRowValue(row, [
                "Chinese",
                "Sentence",
                "Chinese Sentence"
              ])
            ),

            Pinyin: clean(
              getRowValue(row, [
                "Pinyin",
                "pinyin"
              ])
            ),

            English: clean(
              getRowValue(row, [
                "English Translation",
                "English",
                "Translation"
              ])
            ),

            Source: clean(
              getRowValue(row, [
                "Source",
                "source"
              ])
            ),

            SourceURL: clean(
              getRowValue(row, [
                "Source URL",
                "SourceURL",
                "URL",
                "Url"
              ])
            )
          };
        })
        .filter(function(row) {
          return row.Chinese;
        });

    state.filteredClassReading =
      state.classReading.slice();

    populateClassReadingLessons();

    setupClassReading();

    renderClassReading();

    console.log(
      "Loaded " +
      state.classReading.length +
      " Class Reading sentences."
    );

    return true;

  } catch (error) {

    console.warn(
      "Class Reading could not be loaded:",
      error
    );

    state.classReading = [];
    state.filteredClassReading = [];

    var counter =
      $("#class-reading-counter");

    if (counter) {
      counter.textContent =
        "Class Reading file could not be loaded.";
    }

    return false;
  }
}


/* ============================================================
   WORD COUNT
============================================================ */

function updateWordCount() {
  var element =
    $("#word-count");

  if (!element) {
    return;
  }

  element.textContent =
    state.vocabulary.length +
    " vocabulary words";
}


/* ============================================================
   MAIN FILTERS
============================================================ */

function populateFilters() {
  var lessonSelect =
    $("#lesson-filter");

  var topicSelect =
    $("#topic-filter");

  var hskSelect =
    $("#hsk-filter");

  if (lessonSelect) {

    var lessons =
      Array.from(
        new Set(
          state.vocabulary
            .map(function(row) {
              return getLesson(row);
            })
            .filter(Boolean)
        )
      )
      .sort(function(a, b) {
        return lessonNumber(a) -
          lessonNumber(b);
      });

    lessonSelect.innerHTML =
      '<option value="">All Lessons</option>';

    lessons.forEach(function(lesson) {

      var option =
        document.createElement("option");

      option.value = lesson;

      option.textContent =
        clean(lesson)
          .toLowerCase()
          .indexOf("lesson") === 0
          ? lesson
          : "Lesson " + lesson;

      lessonSelect.appendChild(option);
    });
  }

  if (topicSelect) {

    var topics =
      Array.from(
        new Set(
          state.vocabulary
            .map(function(row) {
              return getTopic(row);
            })
            .filter(Boolean)
        )
      )
      .sort(function(a, b) {
        return a.localeCompare(b);
      });

    topicSelect.innerHTML =
      '<option value="">All Topics</option>';

    topics.forEach(function(topic) {

      var option =
        document.createElement("option");

      option.value = topic;
      option.textContent = topic;

      topicSelect.appendChild(option);
    });
  }

  if (hskSelect) {

    var levels =
      Array.from(
        new Set(
          state.vocabulary
            .map(function(row) {
              return getHSKLevel(row);
            })
            .filter(Boolean)
        )
      )
      .sort(function(a, b) {
        return a.localeCompare(
          b,
          undefined,
          {
            numeric: true
          }
        );
      });

    hskSelect.innerHTML =
      '<option value="">All HSK Levels</option>';

    levels.forEach(function(level) {

      var option =
        document.createElement("option");

      option.value = level;

      option.textContent =
        "HSK " + level;

      hskSelect.appendChild(option);
    });
  }
}

function setupFilters() {

  var lessonSelect =
    $("#lesson-filter");

  var topicSelect =
    $("#topic-filter");

  var hskSelect =
    $("#hsk-filter");

  if (lessonSelect) {
    lessonSelect.onchange =
      applyFilters;
  }

  if (topicSelect) {
    topicSelect.onchange =
      applyFilters;
  }

  if (hskSelect) {
    hskSelect.onchange =
      applyFilters;
  }

  var clearButton =
    $("#clear-filters");

  if (clearButton) {
    clearButton.onclick =
      clearFilters;
  }
}

function applyFilters() {

  var lessonSelect =
    $("#lesson-filter");

  var topicSelect =
    $("#topic-filter");

  var hskSelect =
    $("#hsk-filter");

  var lesson =
    lessonSelect
      ? lessonSelect.value
      : "";

  var topic =
    topicSelect
      ? topicSelect.value
      : "";

  var hsk =
    hskSelect
      ? hskSelect.value
      : "";

  state.filteredVocabulary =
    state.vocabulary.filter(function(row) {

      var rowLesson =
        getLesson(row);

      var rowTopic =
        getTopic(row);

      var rowHSK =
        getHSKLevel(row);

      var lessonMatch =
        !lesson ||
        normalizeLessonValue(rowLesson) ===
        normalizeLessonValue(lesson);

      var topicMatch =
        !topic ||
        rowTopic === topic;

      var hskMatch =
        !hsk ||
        rowHSK === hsk;

      return (
        lessonMatch &&
        topicMatch &&
        hskMatch
      );
    });

  updateFilteredCount();

  initializeStudySet();

  renderFlashcard();

  /*
     Reset games when the vocabulary
     filter changes.
  */

  state.gameWords = [];
  state.currentGameIndex = 0;
  state.gameScore = 0;
}

function clearFilters() {

  var lesson =
    $("#lesson-filter");

  var topic =
    $("#topic-filter");

  var hsk =
    $("#hsk-filter");

  if (lesson) {
    lesson.value = "";
  }

  if (topic) {
    topic.value = "";
  }

  if (hsk) {
    hsk.value = "";
  }

  state.filteredVocabulary =
    state.vocabulary.slice();

  updateFilteredCount();

  initializeStudySet();

  renderFlashcard();
}

function updateFilteredCount() {

  var element =
    $("#filtered-count");

  if (element) {
    element.textContent =
      state.filteredVocabulary.length +
      " words";
  }
}


/* ============================================================
   STUDY SET
============================================================ */

function initializeStudySet() {

  var sizeSelect =
    $("#study-size");

  var size = 10;

  if (sizeSelect) {

    var parsed =
      Number(sizeSelect.value);

    if (
      parsed === 10 ||
      parsed === 20 ||
      parsed === 50 ||
      parsed === 100
    ) {
      size = parsed;
    } else if (sizeSelect.value === "all") {
      size = state.filteredVocabulary.length || state.vocabulary.length;
    }
  }

  var source =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;

  state.studySet =
    shuffle(source).slice(0, size);

  state.cardIndex = 0;
  state.cardFlipped = false;
  state.flashcardExample = null;

  updateStudySetCount();
}

function setupStudySetControls() {

  var sizeSelect =
    $("#study-size");

  if (sizeSelect) {
    sizeSelect.onchange =
      function() {
        initializeStudySet();
        renderFlashcard();
      };
  }

  var newSetButton =
    $("#create-study-set");

  if (newSetButton) {
    newSetButton.onclick =
      function() {
        initializeStudySet();
        renderFlashcard();
      };
  }
}

function updateStudySetCount() {

  /* The current HTML uses #flashcard-progress.
     Keep #study-set-count as a fallback for older HTML. */
  var element =
    $("#flashcard-progress") ||
    $("#study-set-count");

  if (!element) {
    return;
  }

  if (!state.studySet.length) {
    element.textContent =
      "0 / 0";
    return;
  }

  element.textContent =
    (state.cardIndex + 1) +
    " / " +
    state.studySet.length;
}


/* ============================================================
   FLASHCARDS
============================================================ */

function renderFlashcard() {

  var front =
    $("#flashcard-simplified");

  var back =
    $("#flashcard-details");

  if (!front || !back) {
    return;
  }

  if (!state.studySet.length) {

    front.innerHTML =
      '<div class="empty-state">' +
      'No vocabulary matches your filters.' +
      '</div>';

    back.innerHTML = "";

    updateStudySetCount();

    return;
  }

  var row =
    state.studySet[
      state.cardIndex
    ];

  if (!row) {
    return;
  }

  state.cardFlipped = false;
  state.flashcardExample = null;

  renderFlashcardFront(
    front,
    row
  );

  renderFlashcardBack(
    back,
    row
  );

  var card =
    $("#flashcard");

  if (card) {
    card.classList.remove(
      "flipped"
    );
  }

  updateStudySetCount();

  updateProgressDisplay();
}

function renderFlashcardFront(
  container,
  row
) {

  var simplified =
    getSimplified(row);

  if (!simplified) {

    container.innerHTML =
      '<div class="main-chinese">—</div>';

    return;
  }

  var main =
    simplified;

  var note = "";

  /*
     Only use the part before a parenthetical
     annotation as the large main word.
  */

  var match =
    simplified.match(
      /^(.+?)\s*(\(.+\))$/
    );

  if (match) {
    main = match[1];
    note = match[2];
  } else {

    var fullMatch =
      simplified.match(
        /^(.+?)\s*(（.+）)$/
      );

    if (fullMatch) {
      main = fullMatch[1];
      note = fullMatch[2];
    }
  }

  container.innerHTML =
    '<div class="main-chinese">' +
      escapeHTML(main) +
      (
        note
          ? '<span class="traditional-note">' +
              escapeHTML(note) +
            '</span>'
          : ""
      ) +
    '</div>';
}

function renderFlashcardBack(
  container,
  row
) {

  var simplified =
    getSimplified(row);

  var traditional =
    getTraditional(row);

  var pinyin =
    getPinyin(row);

  var english =
    getEnglish(row);

  var pos =
    getPartOfSpeech(row);

  var lesson =
    getLesson(row);

  var topic =
    getTopic(row);

  var hskNumber =
    getHSKNumber(row);

  var hskLevel =
    getHSKLevel(row);

  var cliEnglish =
    getCLIEnglish(row);

  container.innerHTML =
    '<div class="flashcard-details">' +

      '<div class="detail-main">' +
        escapeHTML(simplified) +
      '</div>' +

      (
        traditional
          ? '<div class="detail-row">' +
              '<strong>Traditional:</strong> ' +
              escapeHTML(traditional) +
            '</div>'
          : ""
      ) +

      (
        pinyin
          ? '<div class="detail-row">' +
              '<strong>Pinyin:</strong> ' +
              escapeHTML(pinyin) +
            '</div>'
          : ""
      ) +

      (
        english
          ? '<div class="detail-row">' +
              '<strong>English:</strong> ' +
              escapeHTML(english) +
            '</div>'
          : ""
      ) +

      (
        pos
          ? '<div class="detail-row">' +
              '<strong>Part of Speech:</strong> ' +
              escapeHTML(pos) +
            '</div>'
          : ""
      ) +

      (
        lesson || topic
          ? '<div class="detail-row">' +
              '<strong>Lesson:</strong> ' +
              escapeHTML(lesson) +
              (
                topic
                  ? ' — ' + escapeHTML(topic)
                  : ""
              ) +
            '</div>'
          : ""
      ) +

      (
        hskNumber || hskLevel
          ? '<div class="detail-row">' +
              '<strong>HSK:</strong> ' +
              escapeHTML(hskNumber) +
              (
                hskLevel
                  ? ' (' +
                    escapeHTML(hskLevel) +
                    ')'
                  : ""
              ) +
            '</div>'
          : ""
      ) +

      (
        cliEnglish
          ? '<div class="detail-row">' +
              '<strong>CLI English:</strong> ' +
              escapeHTML(cliEnglish) +
            '</div>'
          : ""
      ) +

      '<div id="flashcard-example" ' +
           'class="flashcard-example">' +
      '</div>' +

    '</div>';

  renderFlashcardExample(row);
}

function renderFlashcardExample(row) {

  var container =
    $("#flashcard-example");

  if (!container) {
    return;
  }

  var examples =
    getAvailableExamples(row);

  if (!examples.length) {
    container.innerHTML = "";
    return;
  }

  if (!state.flashcardExample) {

    state.flashcardExample =
      examples[
        Math.floor(
          Math.random() *
          examples.length
        )
      ];
  }

  var example =
    state.flashcardExample;

  container.innerHTML =
    '<div class="example-title">' +
      'Example ' +
      example.number +
    '</div>' +

    (
      example.chinese
        ? '<div class="example-chinese">' +
            escapeHTML(example.chinese) +
          '</div>'
        : ""
    ) +

    (
      example.pinyin
        ? '<div class="example-pinyin">' +
            escapeHTML(example.pinyin) +
          '</div>'
        : ""
    ) +

    (
      example.english
        ? '<div class="example-english">' +
            escapeHTML(example.english) +
          '</div>'
        : ""
    );
}

function flipFlashcard() {

  var card =
    $("#flashcard");

  if (!card) {
    return;
  }

  state.cardFlipped =
    !state.cardFlipped;

  card.classList.toggle(
    "flipped",
    state.cardFlipped
  );

  if (state.cardFlipped) {

    var row =
      state.studySet[
        state.cardIndex
      ];

    if (row) {
      markWordSeen(row);
    }
  }
}

function nextFlashcard() {

  if (!state.studySet.length) {
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

function previousFlashcard() {

  if (!state.studySet.length) {
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

function randomFlashcard() {

  if (!state.studySet.length) {
    return;
  }

  state.cardIndex =
    Math.floor(
      Math.random() *
      state.studySet.length
    );

  state.cardFlipped = false;
  state.flashcardExample = null;

  renderFlashcard();
}


/* ============================================================
   SPEECH
============================================================ */

function speakChinese(text) {

  text = clean(text);

  if (!text) {
    return false;
  }

  if (
    typeof window === "undefined" ||
    typeof window.speechSynthesis === "undefined" ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    console.warn("Speech synthesis is not supported by this browser.");
    return false;
  }

  var synthesis = window.speechSynthesis;

  synthesis.cancel();

  var utterance =
    new window.SpeechSynthesisUtterance(text);

  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;

  var voices = synthesis.getVoices();
  var chineseVoice = voices.find(function(voice) {
    return /^zh(?:-|$)/i.test(voice.lang);
  });

  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  synthesis.speak(utterance);

  if (typeof synthesis.resume === "function") {
    synthesis.resume();
  }

  return true;
}

function speakCurrentFlashcard() {

  if (!state.studySet.length) {
    return;
  }

  var row = state.studySet[state.cardIndex];

  if (row) {
    speakChinese(getSimplified(row));
  }
}

function speakCurrentClassReading() {

  if (state.currentClassReading) {
    speakChinese(state.currentClassReading.Chinese);
  }
}


/* ============================================================
   READING PRACTICE
============================================================ */

function getReadingRows() {

  var rows = [];

  state.vocabulary.forEach(function(row) {

    var examples =
      getAvailableExamples(row);

    examples.forEach(function(example) {

      rows.push({
        vocabularyRow: row,
        example: example
      });
    });
  });

  return rows;
}

function setupReading() {

  var previous =
    $("#previous-reading");

  var next =
    $("#next-reading");

  var random =
    $("#random-reading");

  var speak =
    $("#reading-speak");

  if (previous) {
    previous.onclick =
      previousReading;
  }

  if (next) {
    next.onclick =
      nextReading;
  }

  if (random) {
    random.onclick =
      randomReading;
  }

  if (speak) {
    speak.onclick =
      speakCurrentReading;
  }
}

function renderReading() {

  var rows =
    getReadingRows();

  if (!rows.length) {
    clearReadingDisplay();
    return;
  }

  if (
    state.readingIndex >=
    rows.length
  ) {
    state.readingIndex = 0;
  }

  if (state.readingIndex < 0) {
    state.readingIndex =
      rows.length - 1;
  }

  state.currentReadingRow =
    rows[state.readingIndex]
      .vocabularyRow;

  state.currentReadingExample =
    rows[state.readingIndex]
      .example;

  var sentence =
    $("#reading-sentence");

  var label =
    $("#reading-example-label");

  var pinyin =
    $("#example-pinyin-text");

  var english =
    $("#example-english-text");

  var details =
    $("#example-details");

  var characterDetails =
    $("#character-details");

  if (sentence) {
    renderReadingSentence(
      sentence,
      state.currentReadingExample.chinese
    );
  }

  if (label) {
    label.textContent =
      "Example " +
      state.currentReadingExample.number;
  }

  if (pinyin) {
    pinyin.textContent = "";
  }

  if (english) {
    english.textContent = "";
  }

  if (details) {
    details.classList.add("hidden");
  }

  if (characterDetails) {
    characterDetails.innerHTML = "";
    characterDetails.classList.add(
      "hidden"
    );
  }

  var showDetails =
    $("#show-example-details");

  if (showDetails) {
    showDetails.textContent =
      "Show Pinyin & English";
  }

  updateReadingCounter(
    rows.length
  );
}

function renderReadingSentence(
  container,
  sentence
) {

  container.innerHTML = "";

  var tokens =
    tokenizeChineseSentence(sentence);

  tokens.forEach(function(token) {

    if (token.type === "vocabulary") {

      var button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "reading-character reading-word";

      button.textContent =
        token.text;

      button.setAttribute(
        "aria-label",
        "Vocabulary word " +
        token.text
      );

      button.addEventListener(
        "mouseenter",
        function() {
          showReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      button.addEventListener(
        "click",
        function() {
          showReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      button.addEventListener(
        "focus",
        function() {
          showReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      container.appendChild(button);

    } else {

      var span =
        document.createElement("span");

      span.className =
        "reading-character";

      span.textContent =
        token.text;

      container.appendChild(span);
    }
  });
}

function showReadingWordDetails(
  row,
  matchedText
) {

  var details =
    $("#character-details");

  if (!details) {
    return;
  }

  /*
     If the tokenizer did not find a multi-character
     vocabulary term, try a single-character lookup.
  */

  if (!row) {
    row =
      findVocabularyForCharacter(
        matchedText
      );
  }

  if (!row) {
    details.innerHTML = "";
    details.classList.add("hidden");
    return;
  }

  var simplified =
    getSimplified(row);

  var traditional =
    getTraditional(row);

  var pinyin =
    getPinyin(row);

  var english =
    getEnglish(row);

  var cliEnglish =
    getCLIEnglish(row);

  details.innerHTML =
    '<div class="character-detail-title">' +
      escapeHTML(matchedText) +
    '</div>' +

    (
      simplified
        ? '<div><strong>Simplified:</strong> ' +
          escapeHTML(simplified) +
          '</div>'
        : ""
    ) +

    (
      traditional
        ? '<div><strong>Traditional:</strong> ' +
          escapeHTML(traditional) +
          '</div>'
        : ""
    ) +

    (
      pinyin
        ? '<div><strong>Pinyin:</strong> ' +
          escapeHTML(pinyin) +
          '</div>'
        : ""
    ) +

    (
      english
        ? '<div><strong>English:</strong> ' +
          escapeHTML(english) +
          '</div>'
        : ""
    ) +

    (
      cliEnglish
        ? '<div><strong>CLI English:</strong> ' +
          escapeHTML(cliEnglish) +
          '</div>'
        : ""
    );

  details.classList.remove("hidden");
}

function updateReadingCounter(total) {

  var counter =
    $("#reading-counter");

  if (!counter) {
    return;
  }

  if (!total) {
    counter.textContent = "0 / 0";
    return;
  }

  counter.textContent =
    (state.readingIndex + 1) +
    " / " +
    total;
}

function previousReading() {

  var rows =
    getReadingRows();

  if (!rows.length) {
    return;
  }

  state.readingIndex =
    (
      state.readingIndex -
      1 +
      rows.length
    ) %
    rows.length;

  renderReading();
}

function nextReading() {

  var rows =
    getReadingRows();

  if (!rows.length) {
    return;
  }

  state.readingIndex =
    (
      state.readingIndex + 1
    ) %
    rows.length;

  renderReading();
}

function randomReading() {

  var rows =
    getReadingRows();

  if (!rows.length) {
    return;
  }

  state.readingIndex =
    Math.floor(
      Math.random() *
      rows.length
    );

  renderReading();
}

function speakCurrentReading() {

  if (
    state.currentReadingExample
  ) {
    speakChinese(
      state.currentReadingExample.chinese
    );
  }
}

function clearReadingDisplay() {

  var sentence =
    $("#reading-sentence");

  if (sentence) {
    sentence.textContent =
      "No available examples.";
  }

  var label =
    $("#reading-example-label");

  if (label) {
    label.textContent = "";
  }

  var counter =
    $("#reading-counter");

  if (counter) {
    counter.textContent = "0 / 0";
  }
}

function setupReadingDetailsToggle() {

  var button =
    $("#show-example-details");

  if (!button) {
    return;
  }

  button.onclick =
    function() {

      var details =
        $("#example-details");

      if (!details) {
        return;
      }

      var visible =
        !details.classList.contains(
          "hidden"
        );

      if (visible) {

        details.classList.add(
          "hidden"
        );

        button.textContent =
          "Show Pinyin & English";

      } else {

        details.classList.remove(
          "hidden"
        );

        if (
          state.currentReadingExample
        ) {

          var pinyin =
            $("#example-pinyin-text");

          var english =
            $("#example-english-text");

          if (pinyin) {
            pinyin.textContent =
              state.currentReadingExample.pinyin ||
              "";
          }

          if (english) {
            english.textContent =
              state.currentReadingExample.english ||
              "";
          }
        }

        button.textContent =
          "Hide Pinyin & English";
      }
    };
}


/* ============================================================
   CLASS READING
============================================================ */

function populateClassReadingLessons() {

  var select =
    $("#class-reading-lesson-filter");

  if (!select) {
    return;
  }

  var lessonMap =
    new Map();

  state.classReading.forEach(
    function(row) {

      var key =
        normalizeLessonValue(
          row.Lesson
        );

      if (
        key &&
        !lessonMap.has(key)
      ) {
        lessonMap.set(
          key,
          row.Lesson
        );
      }
    }
  );

  var lessons =
    Array.from(
      lessonMap.values()
    )
    .sort(function(a, b) {
      return lessonNumber(a) -
        lessonNumber(b);
    });

  select.innerHTML =
    '<option value="">All Lessons</option>';

  lessons.forEach(function(lesson) {

    var option =
      document.createElement("option");

    option.value = lesson;

    option.textContent =
      clean(lesson)
        .toLowerCase()
        .indexOf("lesson") === 0
        ? lesson
        : "Lesson " + lesson;

    select.appendChild(option);
  });
}

function setupClassReading() {

  var select =
    $("#class-reading-lesson-filter");

  if (select) {
    select.onchange =
      filterClassReading;
  }

  var previous =
    $("#previous-class-reading");

  var next =
    $("#next-class-reading");

  var random =
    $("#random-class-reading");

  var speak =
    $("#class-reading-speak");

  if (speak) {
    speak.onclick =
      speakCurrentClassReading;
  }

  if (previous) {
    previous.onclick =
      previousClassReading;
  }

  if (next) {
    next.onclick =
      nextClassReading;
  }

  if (random) {
    random.onclick =
      randomClassReading;
  }

  var detailsButton =
    $("#show-class-reading-details");

  if (detailsButton) {
    detailsButton.onclick =
      toggleClassReadingDetails;
  }
}

function filterClassReading() {

  var select =
    $("#class-reading-lesson-filter");

  var selected =
    select
      ? select.value
      : "";

  state.filteredClassReading =
    state.classReading.filter(
      function(row) {

        if (!selected) {
          return true;
        }

        return (
          normalizeLessonValue(
            row.Lesson
          ) ===
          normalizeLessonValue(
            selected
          )
        );
      }
    );

  state.classReadingIndex = 0;

  renderClassReading();
}

function getTopicForClassLesson(
  lesson
) {

  var normalized =
    normalizeLessonValue(
      lesson
    );

  var matchingRows =
    state.vocabulary.filter(
      function(row) {

        return (
          normalizeLessonValue(
            getLesson(row)
          ) === normalized
        );
      }
    );

  var topics =
    Array.from(
      new Set(
        matchingRows
          .map(function(row) {
            return getTopic(row);
          })
          .filter(Boolean)
      )
    );

  return topics.join(" / ");
}

function renderClassReading() {

  var sentence =
    $("#class-reading-sentence");

  if (!sentence) {
    return;
  }

  if (
    !state.filteredClassReading.length
  ) {

    sentence.textContent =
      "No Class Reading sentences available.";

    updateClassReadingCounter(0);

    resetClassReadingDetails();

    return;
  }

  if (
    state.classReadingIndex >=
    state.filteredClassReading.length
  ) {
    state.classReadingIndex = 0;
  }

  if (state.classReadingIndex < 0) {
    state.classReadingIndex =
      state.filteredClassReading.length - 1;
  }

  state.currentClassReading =
    state.filteredClassReading[
      state.classReadingIndex
    ];

  var row =
    state.currentClassReading;

  renderClassReadingSentence(
    sentence,
    row.Chinese
  );

  renderClassReadingLessonTopic(
    row
  );

  resetClassReadingDetails();

  renderClassReadingSource(
    row
  );

  updateClassReadingCounter(
    state.filteredClassReading.length
  );
}

function renderClassReadingSentence(
  container,
  chinese
) {

  container.innerHTML = "";

  var tokens =
    tokenizeChineseSentence(chinese);

  tokens.forEach(function(token) {

    if (
      token.type ===
      "vocabulary"
    ) {

      var button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "class-reading-word";

      button.textContent =
        token.text;

      button.setAttribute(
        "aria-label",
        "Vocabulary word " +
        token.text
      );

      button.addEventListener(
        "mouseenter",
        function() {
          showClassReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      button.addEventListener(
        "click",
        function() {
          showClassReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      button.addEventListener(
        "mouseleave",
        function() {
          clearClassReadingWordDetails();
        }
      );

      button.addEventListener(
        "focus",
        function() {
          showClassReadingWordDetails(
            token.row,
            token.text
          );
        }
      );

      container.appendChild(button);

    } else {

      var span =
        document.createElement("span");

      span.className =
        "class-reading-punctuation";

      span.textContent =
        token.text;

      container.appendChild(span);
    }
  });
}

function renderClassReadingLessonTopic(
  row
) {

  var element =
    $("#class-reading-lesson-topic");

  if (!element) {
    return;
  }

  var lesson =
    clean(row.Lesson);

  var topic =
    getTopicForClassLesson(
      lesson
    );

  var displayLesson =
    lesson.toLowerCase()
      .indexOf("lesson") === 0
      ? lesson
      : "Lesson " + lesson;

  if (topic) {

    element.textContent =
      displayLesson +
      ": " +
      topic;

  } else {

    element.textContent =
      displayLesson;
  }
}

function clearClassReadingWordDetails() {

  var details =
    $("#class-reading-word-details");

  if (!details) {
    return;
  }

  details.innerHTML = "";
}


function showClassReadingWordDetails(
  row,
  matchedText
) {

  var details =
    $("#class-reading-word-details");

  if (!details) {
    return;
  }

  if (!row) {
    row =
      findVocabularyForCharacter(
        matchedText
      );
  }

  if (!row) {
    details.innerHTML = "";
    return;
  }

  var simplified =
    getSimplified(row);

  var traditional =
    getTraditional(row);

  var pinyin =
    getPinyin(row);

  var english =
    getEnglish(row);

  var cliEnglish =
    getCLIEnglish(row);

  details.innerHTML =
    '<div class="character-detail-title">' +
      escapeHTML(matchedText) +
    '</div>' +

    (
      simplified
        ? '<div>' +
          '<strong>Simplified:</strong> ' +
          escapeHTML(simplified) +
          '</div>'
        : ""
    ) +

    (
      traditional
        ? '<div>' +
          '<strong>Traditional:</strong> ' +
          escapeHTML(traditional) +
          '</div>'
        : ""
    ) +

    (
      pinyin
        ? '<div>' +
          '<strong>Pinyin:</strong> ' +
          escapeHTML(pinyin) +
          '</div>'
        : ""
    ) +

    (
      english
        ? '<div>' +
          '<strong>English:</strong> ' +
          escapeHTML(english) +
          '</div>'
        : ""
    ) +

    (
      cliEnglish
        ? '<div>' +
          '<strong>CLI English:</strong> ' +
          escapeHTML(cliEnglish) +
          '</div>'
        : ""
    );
}

function resetClassReadingDetails() {

  state.classReadingDetailsVisible =
    false;

  var pinyin =
    $("#class-reading-pinyin");

  var english =
    $("#class-reading-english");

  var details =
    $("#class-reading-details");

  var button =
    $("#show-class-reading-details");

  var wordDetails =
    $("#class-reading-word-details");

  if (pinyin) {
    pinyin.textContent = "";
  }

  if (english) {
    english.textContent = "";
  }

  if (details) {
    details.classList.add("hidden");
    details.hidden = true;
  }

  if (wordDetails) {
    wordDetails.innerHTML = "";
  }

  if (button) {
    button.textContent =
      "Show Pinyin & English";
  }
}

function toggleClassReadingDetails() {

  if (!state.currentClassReading) {
    return;
  }

  var details =
    $("#class-reading-details");

  var pinyin =
    $("#class-reading-pinyin");

  var english =
    $("#class-reading-english");

  var button =
    $("#show-class-reading-details");

  if (!details) {
    return;
  }

  state.classReadingDetailsVisible =
    !state.classReadingDetailsVisible;

  if (
    state.classReadingDetailsVisible
  ) {

    if (pinyin) {
      pinyin.textContent =
        state.currentClassReading.Pinyin ||
        "";
    }

    if (english) {
      english.textContent =
        state.currentClassReading.English ||
        "";
    }

    details.classList.remove("hidden");
    details.hidden = false;

    if (button) {
      button.textContent =
        "Hide Pinyin & English";
    }

  } else {

    details.classList.add("hidden");
    details.hidden = true;

    if (button) {
      button.textContent =
        "Show Pinyin & English";
    }
  }
}

function isSafeExternalURL(
  value
) {

  if (!value) {
    return false;
  }

  try {

    var url =
      new URL(
        String(value),
        window.location.href
      );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch (error) {
    return false;
  }
}

function renderClassReadingSource(
  row
) {

  var sourceContainer =
    $("#class-reading-source");

  if (!sourceContainer) {
    return;
  }

  sourceContainer.innerHTML = "";

  if (row.Source) {

    var sourceText =
      document.createElement("span");

    sourceText.textContent =
      "Source: " +
      row.Source;

    sourceContainer.appendChild(
      sourceText
    );
  }

  if (
    row.SourceURL &&
    isSafeExternalURL(
      row.SourceURL
    )
  ) {

    var link =
      document.createElement("a");

    link.textContent =
      "View source";

    link.href =
      row.SourceURL;

    link.target =
      "_blank";

    link.rel =
      "noopener noreferrer";

    if (
      sourceContainer.textContent
    ) {
      sourceContainer.appendChild(
        document.createTextNode(
          " · "
        )
      );
    }

    sourceContainer.appendChild(
      link
    );
  }
}

function updateClassReadingCounter(
  total
) {

  var counter =
    $("#class-reading-counter");

  if (!counter) {
    return;
  }

  if (!total) {
    counter.textContent =
      "0 / 0";
    return;
  }

  counter.textContent =
    (state.classReadingIndex + 1) +
    " / " +
    total;
}

function previousClassReading() {

  var total =
    state.filteredClassReading.length;

  if (!total) {
    return;
  }

  state.classReadingIndex =
    (
      state.classReadingIndex -
      1 +
      total
    ) %
    total;

  renderClassReading();
}

function nextClassReading() {

  var total =
    state.filteredClassReading.length;

  if (!total) {
    return;
  }

  state.classReadingIndex =
    (
      state.classReadingIndex +
      1
    ) %
    total;

  renderClassReading();
}

function randomClassReading() {

  var total =
    state.filteredClassReading.length;

  if (!total) {
    return;
  }

  state.classReadingIndex =
    Math.floor(
      Math.random() * total
    );

  renderClassReading();
}


/* ============================================================
   NAVIGATION
============================================================ */

