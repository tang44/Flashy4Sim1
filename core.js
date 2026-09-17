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
  // "chinese_link_level1_example_sentences_web_all_lessons_expanded.xlsx";

  "chinese_link_example_sentences_webscrape_main.xlsx";

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
            Level: clean(
              getRowValue(row, [
                "Level",
                "Level#",
                "Level"
              ])
            ),
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
   SPEECH / VOICE SELECTION
============================================================ */

/*
   Browser speech synthesis is asynchronous on Chromium-based browsers.
   getVoices() may return [] during the first page-load pass, so the app
   listens for voiceschanged and also refreshes after short delays.
*/

const SPEECH_VOICE_STORAGE_KEY = "chineseStudySpeechVoice";

var speechVoices = [];
var selectedSpeechVoiceName = "";
var speechVoicesChangeHandlerAttached = false;

function isChineseVoice(voice) {
  if (!voice) {
    return false;
  }

  var lang = clean(voice.lang).toLowerCase();

  /*
     Normal browser values are zh-CN / zh-TW / zh-HK, but some engines
     expose Mandarin as cmn. Accept both so we do not hide valid voices.
  */
  return /^zh(?:-|_|$)/i.test(lang) || /^cmn(?:-|_|$)/i.test(lang);
}

function isMainlandChineseVoice(voice) {
  if (!voice) {
    return false;
  }

  var lang = clean(voice.lang).toLowerCase();
  return lang === "zh-cn" || lang === "zh_cn" || lang === "cmn-cn";
}

function isGoogleZhCNVoice(voice) {
  if (!voice) {
    return false;
  }

  var name = clean(voice.name).toLowerCase();
  return isMainlandChineseVoice(voice) && name.indexOf("google") !== -1;
}

function getSpeechVoices() {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.speechSynthesis.getVoices !== "function"
  ) {
    return [];
  }

  return window.speechSynthesis.getVoices() || [];
}

function refreshSpeechVoices() {
  speechVoices = sortSpeechVoices(getSpeechVoices());
  return speechVoices;
}

function chooseDefaultSpeechVoice(voices) {
  var chineseVoices = (voices || []).filter(isChineseVoice);

  if (!chineseVoices.length) {
    return null;
  }

  /* Prefer Google Mandarin when present. */
  var googleZhCN = chineseVoices.find(isGoogleZhCNVoice);
  if (googleZhCN) {
    return googleZhCN;
  }

  /* Then prefer any mainland Chinese voice. */
  var zhCN = chineseVoices.find(isMainlandChineseVoice);
  if (zhCN) {
    return zhCN;
  }

  /* Finally use another Chinese/Mandarin voice. */
  return chineseVoices[0];
}

function sortSpeechVoices(voices) {
  return (voices || [])
    .filter(isChineseVoice)
    .slice()
    .sort(function(a, b) {
      var aGoogle = isGoogleZhCNVoice(a) ? 0 : 1;
      var bGoogle = isGoogleZhCNVoice(b) ? 0 : 1;

      if (aGoogle !== bGoogle) {
        return aGoogle - bGoogle;
      }

      var aMainland = isMainlandChineseVoice(a) ? 0 : 1;
      var bMainland = isMainlandChineseVoice(b) ? 0 : 1;

      if (aMainland !== bMainland) {
        return aMainland - bMainland;
      }

      var langCompare = clean(a.lang).localeCompare(clean(b.lang));
      if (langCompare !== 0) {
        return langCompare;
      }

      return clean(a.name).localeCompare(clean(b.name));
    });
}

function populateSpeechVoiceSelector() {
  var selector = document.querySelector("#speech-voice");
  if (!selector) {
    return;
  }

  refreshSpeechVoices();

  var savedVoiceName = "";
  try {
    savedVoiceName = localStorage.getItem(SPEECH_VOICE_STORAGE_KEY) || "";
  } catch (error) {
    console.warn("Could not read saved speech voice:", error);
  }

  var defaultVoice = speechVoices.find(function(voice) {
    return voice.name === savedVoiceName;
  });

  if (!defaultVoice) {
    defaultVoice = chooseDefaultSpeechVoice(speechVoices);
  }

  selectedSpeechVoiceName = defaultVoice ? defaultVoice.name : "";
  selector.innerHTML = "";

  if (!speechVoices.length) {
    var unavailableOption = document.createElement("option");
    unavailableOption.value = "";
    unavailableOption.textContent = "Waiting for Chinese voices…";
    selector.appendChild(unavailableOption);
    selector.disabled = true;
    return;
  }

  selector.disabled = false;

  speechVoices.forEach(function(voice) {
    var option = document.createElement("option");
    option.value = voice.name;

    var label = clean(voice.name) + " (" + clean(voice.lang) + ")";
    if (isGoogleZhCNVoice(voice)) {
      label += " — DEFAULT";
    }

    option.textContent = label;
    selector.appendChild(option);
  });

  if (selectedSpeechVoiceName) {
    selector.value = selectedSpeechVoiceName;
  }
}

function getSelectedSpeechVoice() {
  var currentVoices = refreshSpeechVoices();
  var selector = document.querySelector("#speech-voice");
  var requestedName = selector && selector.value
    ? selector.value
    : selectedSpeechVoiceName;

  if (requestedName) {
    var selected = currentVoices.find(function(voice) {
      return voice.name === requestedName;
    });

    if (selected) {
      return selected;
    }
  }

  return chooseDefaultSpeechVoice(currentVoices);
}

function setSpeechVoice(voiceName) {
  refreshSpeechVoices();

  var voice = speechVoices.find(function(item) {
    return item.name === voiceName;
  });

  if (!voice) {
    return false;
  }

  selectedSpeechVoiceName = voice.name;

  try {
    localStorage.setItem(SPEECH_VOICE_STORAGE_KEY, voice.name);
  } catch (error) {
    console.warn("Could not save speech voice:", error);
  }

  return true;
}

function setupSpeechVoiceSelector() {
  var selector = document.querySelector("#speech-voice");
  if (!selector) {
    return;
  }

  selector.onchange = function() {
    if (setSpeechVoice(selector.value)) {
      speakChinese("你好");
    }
  };

  populateSpeechVoiceSelector();

  if (
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    !speechVoicesChangeHandlerAttached
  ) {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      function() {
        populateSpeechVoiceSelector();
      }
    );

    speechVoicesChangeHandlerAttached = true;
  }

  /* Chromium may populate the list shortly after DOMContentLoaded. */
  [100, 300, 750, 1500].forEach(function(delay) {
    setTimeout(populateSpeechVoiceSelector, delay);
  });
}

function speakChinese(text) {
  text = clean(text);

  if (!text) {
    return false;
  }

  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    console.warn("Speech synthesis is not supported by this browser.");
    return false;
  }

  var synthesis = window.speechSynthesis;
  var selectedVoice = getSelectedSpeechVoice();

  /*
     If Chromium has not exposed its voices yet, wait briefly for them.
     This fixes the common first-click/first-load failure where getVoices()
     is temporarily empty.
  */
  if (!selectedVoice && !getSpeechVoices().length) {
    var startedAt = Date.now();

    var retrySpeech = function() {
      var retryVoice = getSelectedSpeechVoice();

      if (retryVoice || Date.now() - startedAt >= 1500) {
        if (retryVoice) {
          speakChineseNow(text, retryVoice);
        } else {
          console.warn("No Chinese speech voice is available in this browser.");
        }
        return;
      }

      setTimeout(retrySpeech, 100);
    };

    retrySpeech();
    return true;
  }

  return speakChineseNow(text, selectedVoice);
}

function speakChineseNow(text, selectedVoice) {
  var synthesis = window.speechSynthesis;

  synthesis.cancel();

  var utterance = new window.SpeechSynthesisUtterance(text);

  utterance.lang = selectedVoice
    ? selectedVoice.lang
    : "zh-CN";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onerror = function(event) {
    console.warn("Chinese speech error:", event.error || event);
  };

  synthesis.speak(utterance);

  /* Work around Chromium's occasional paused speech queue. */
  if (typeof synthesis.resume === "function") {
    synthesis.resume();
  }

  return true;
}


/* ============================================================
   END OF SPEECH SECTION
============================================================ */
