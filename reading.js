/* ============================================================
   CLASS READING SPEECH
============================================================ */

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

