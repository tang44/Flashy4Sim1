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



function speakCurrentFlashcard() {

  if (!state.studySet.length) {
    return;
  }

  var row = state.studySet[state.cardIndex];

  if (row) {
    speakChinese(getSimplified(row));
  }
}

