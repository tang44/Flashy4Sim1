function renderProgress() {

  updateProgressDisplay();

  var container =
    $("#progress-list");

  if (!container) {
    return;
  }

  var rows =
    state.vocabulary
      .map(function(row) {

        return {
          row: row,
          progress:
            state.progress[
              getWordProgressKey(row)
            ]
        };
      })
      .filter(function(item) {
        return item.progress;
      });

  if (!rows.length) {

    container.innerHTML =
      "<p>No study progress yet.</p>";

    return;
  }

  container.innerHTML =
    rows
      .map(function(item) {

        var row =
          item.row;

        var progress =
          item.progress;

        return (
          '<div class="progress-row">' +

            '<strong>' +
              escapeHTML(
                getSimplified(row)
              ) +
            '</strong>' +

            '<span>' +
              escapeHTML(
                getEnglish(row)
              ) +
            '</span>' +

            '<span>' +
              "Seen " +
              Number(
                progress.seen || 0
              ) +
              " time(s)" +
            '</span>' +

          '</div>'
        );
      })
      .join("");
}


/* ============================================================
   GAMES
============================================================ */

function exitCurrentGame() {
  state.currentGame = null;
  state.gameWords = [];
  state.currentGameIndex = 0;
  state.gameScore = 0;
  state.matchingMatches = 0;
  state.matchingSelected = null;

  if (state.listeningTimeout) {
    clearTimeout(state.listeningTimeout);
    state.listeningTimeout = null;
  }

  var selection = $("#game-selection");
  var gameArea = $("#game-area");
  var content = $("#game-content");

  if (selection) selection.classList.remove("hidden");
  if (gameArea) gameArea.classList.add("hidden");
  if (content) content.innerHTML = "";
}

function initializeGames() {

  var gameSelect =
    $("#game-select");

  if (gameSelect) {
    gameSelect.onchange =
      startSelectedGame;
  }

  var startButton =
    $("#start-game");

  if (startButton) {
    startButton.onclick =
      startSelectedGame;
  }

  var exitButton =
    $("#exit-game");

  if (exitButton) {
    exitButton.onclick =
      exitCurrentGame;
  }

  setupGameButtons();
}
function setupGameButtons() {
  var buttons = $$("[data-game]");

  buttons.forEach(function(button) {
    if (!button) {
      return;
    }

    var gameName =
      button.getAttribute("data-game");

    if (!gameName || button.id === "start-game") {
      return;
    }

    button.onclick = function() {
      startGame(gameName);
    };
  });
}
// function setupGameButtons() {

//   var buttons =
//     $(
//       "[data-game]"
//     );

//   buttons.forEach(
//     function(button) {

//       /*
//          Do not attach to the main select/start
//          controls unless they explicitly identify
//          themselves as a game button.
//       */

//       var game =
//         button.getAttribute(
//           "data-game"
//         );

//       if (!game) {
//         return;
//       }

//       if (
//         button.id === "start-game"
//       ) {
//         return;
//       }

//       button.onclick =
//         function() {
//           startGame(game);
//         };
//     }
//   );

//   /*
//      Also support the six original IDs.
//   */

//   var ids = [
//     "game-multiple-choice",
//     "game-english-chinese",
//     "game-scramble",
//     "game-matching",
//     "game-sentence",
//     "game-listening"
//   ];

//   ids.forEach(
//     function(id) {

//       var button =
//         $("#" + id);

//       if (!button) {
//         return;
//       }

//       button.onclick =
//         function() {

//           var game =
//             button.getAttribute(
//               "data-game"
//             );

//           if (!game) {
//             game =
//               id.replace(
//                 "game-",
//                 ""
//               );
//           }

//           startGame(game);
//         };
//     }
//   );
// }

function startSelectedGame() {

  var gameSelect =
    $("#game-select");

  var game =
    gameSelect
      ? gameSelect.value
      : "multiple-choice";

  if (!game) {
    game = "multiple-choice";
  }

  startGame(game);
}

function prepareGameWords() {

  var source =
    state.filteredVocabulary.length
      ? state.filteredVocabulary
      : state.vocabulary;

  return shuffle(source).slice(
    0,
    Math.min(
      10,
      source.length
    )
  );
}

function startGame(game) {

  state.currentGame =
    game;

  state.currentGameIndex = 0;
  state.gameScore = 0;
  state.matchingMatches = 0;
  state.matchingSelected = null;

  state.gameWords =
    prepareGameWords();

  var selection =
    $("#game-selection");

  var gameArea =
    $("#game-area");

  if (selection) {
    selection.classList.add("hidden");
  }

  if (gameArea) {
    gameArea.classList.remove("hidden");
  }

  var container =
    $("#game-content");

  if (!container) {
    return;
  }

  if (!state.gameWords.length) {

    container.innerHTML =
      '<p>No vocabulary is available for this game.</p>';

    return;
  }

  switch (game) {

    case "multiple-choice":
      renderMultipleChoiceGame();
      break;

    case "english-chinese":
      renderEnglishChineseGame();
      break;

    case "scramble":
      renderScrambleGame();
      break;

    case "matching":
      renderMatchingGame();
      break;

    case "sentence":
      renderSentenceGame();
      break;

    case "listening":
      renderListeningGame();
      break;

    default:
      renderMultipleChoiceGame();
  }
}


/* ============================================================
   GAME QUESTION HELPERS
============================================================ */

function getGameAlternatives(
  row,
  fieldGetter,
  count
) {
  var correct = fieldGetter(row);
  var seen = {};
  var alternatives = [];

  state.vocabulary.forEach(function(item) {
    if (item === row) {
      return;
    }

    var value = fieldGetter(item);

    if (!value || value === correct || seen[value]) {
      return;
    }

    seen[value] = true;
    alternatives.push(item);
  });

  return shuffle(alternatives).slice(0, count);
}

function updateGameScoreDisplay() {

  var elements =
    $$(".game-score");

  elements.forEach(
    function(element) {

      element.textContent =
        "Score: " +
        state.gameScore;
    }
  );
}


/* ============================================================
   MULTIPLE CHOICE GAME
============================================================ */

function renderMultipleChoiceGame() {

  var container =
    $("#game-content");

  var row =
    state.gameWords[
      state.currentGameIndex
    ];

  if (!container || !row) {
    finishGame();
    return;
  }

  var correct =
    getEnglish(row);

  var alternatives =
    getGameAlternatives(
      row,
      getEnglish,
      3
    );

  var options =
    shuffle(
      [row].concat(
        alternatives
      )
    );

  container.innerHTML =
    '<div class="game-question">' +

      '<div class="game-chinese">' +
        escapeHTML(
          getSimplified(row)
        ) +
      '</div>' +

      '<p>Choose the correct English meaning.</p>' +

      '<div class="game-options">' +

        options.map(
          function(option) {

            return (
              '<button ' +
                'class="game-option" ' +
                'data-answer="' +
                escapeAttribute(
                  getEnglish(option)
                ) +
              '">' +
                escapeHTML(
                  getEnglish(option)
                ) +
              '</button>'
            );
          }
        ).join("") +

      '</div>' +

      '<div class="game-score">' +
        "Question " +
        (state.currentGameIndex + 1) +
        " / " +
        state.gameWords.length +
        " • Score: " +
        state.gameScore +
      '</div>' +

    '</div>';

  var optionButtons =
    $$(".game-option");

  optionButtons.forEach(
    function(button) {

      button.onclick =
        function() {

          /*
             Prevent double-click scoring.
          */

          optionButtons.forEach(
            function(item) {
              item.disabled = true;
            }
          );

          var answer =
            button.getAttribute(
              "data-answer"
            );

          if (answer === correct) {

            state.gameScore++;

            button.classList.add(
              "correct"
            );

          } else {

            button.classList.add(
              "incorrect"
            );

            /*
               Show the correct answer.
            */

            optionButtons.forEach(
              function(item) {

                if (
                  item.getAttribute(
                    "data-answer"
                  ) === correct
                ) {
                  item.classList.add(
                    "correct"
                  );
                }
              }
            );
          }

          markWordSeen(row);

          setTimeout(
            function() {

              state.currentGameIndex++;

              renderMultipleChoiceGame();

            },
            600
          );
        };
    }
  );
}


/* ============================================================
   ENGLISH → CHINESE GAME
============================================================ */

function renderEnglishChineseGame() {

  var container =
    $("#game-content");

  var row =
    state.gameWords[
      state.currentGameIndex
    ];

  if (!container || !row) {
    finishGame();
    return;
  }

  var correct =
    getSimplified(row);

  var alternatives =
    getGameAlternatives(
      row,
      getSimplified,
      3
    );

  var options =
    shuffle(
      [row].concat(
        alternatives
      )
    );

  container.innerHTML =
    '<div class="game-question">' +

      '<div class="game-english">' +
        escapeHTML(
          getEnglish(row)
        ) +
      '</div>' +

      '<p>Choose the correct Chinese word.</p>' +

      '<div class="game-options">' +

        options.map(
          function(option) {

            return (
              '<button ' +
                'class="game-option game-chinese-option" ' +
                'data-answer="' +
                escapeAttribute(
                  getSimplified(option)
                ) +
              '">' +
                escapeHTML(
                  getSimplified(option)
                ) +
              '</button>'
            );
          }
        ).join("") +

      '</div>' +

      '<div class="game-score">' +
        "Question " +
        (state.currentGameIndex + 1) +
        " / " +
        state.gameWords.length +
        " • Score: " +
        state.gameScore +
      '</div>' +

    '</div>';

  var optionButtons =
    $$(".game-option");

  optionButtons.forEach(
    function(button) {

      button.onclick =
        function() {

          optionButtons.forEach(
            function(item) {
              item.disabled = true;
            }
          );

          var answer =
            button.getAttribute(
              "data-answer"
            );

          if (answer === correct) {

            state.gameScore++;

            button.classList.add(
              "correct"
            );

          } else {

            button.classList.add(
              "incorrect"
            );

            optionButtons.forEach(
              function(item) {

                if (
                  item.getAttribute(
                    "data-answer"
                  ) === correct
                ) {
                  item.classList.add(
                    "correct"
                  );
                }
              }
            );
          }

          markWordSeen(row);

          setTimeout(
            function() {

              state.currentGameIndex++;

              renderEnglishChineseGame();

            },
            600
          );
        };
    }
  );
}


/* ============================================================
   SCRAMBLE GAME
============================================================ */

function renderScrambleGame() {

  var container =
    $("#game-content");

  var row =
    state.gameWords[
      state.currentGameIndex
    ];

  if (!container || !row) {
    finishGame();
    return;
  }

  var answer =
    getSimplified(row);

  var letters =
    shuffle(
      Array.from(answer)
    );

  container.innerHTML =
    '<div class="game-question">' +

      '<div class="game-english">' +
        escapeHTML(
          getEnglish(row)
        ) +
      '</div>' +

      '<p>Unscramble the Chinese word.</p>' +

      '<div class="scramble-word">' +

        letters.map(
          function(character) {

            return (
              '<button ' +
                'class="scramble-character">' +
                escapeHTML(character) +
              '</button>'
            );
          }
        ).join("") +

      '</div>' +

      '<div id="scramble-answer" ' +
           'class="scramble-answer">' +
      '</div>' +

      '<button id="scramble-clear" ' +
              'class="button secondary">' +
        'Clear' +
      '</button> ' +

      '<button id="scramble-submit" ' +
              'class="button primary">' +
        'Check Answer' +
      '</button>' +

    '</div>';

  var selected = "";

  var characterButtons =
    $$(".scramble-character");

  characterButtons.forEach(
    function(button) {

      button.onclick =
        function() {

          if (button.disabled) {
            return;
          }

          selected +=
            button.textContent;

          button.disabled = true;

          var answerElement =
            $("#scramble-answer");

          if (answerElement) {
            answerElement.textContent =
              selected;
          }
        };
    }
  );

  var clearButton =
    $("#scramble-clear");

  if (clearButton) {

    clearButton.onclick =
      function() {

        selected = "";

        characterButtons.forEach(
          function(button) {
            button.disabled = false;
          }
        );

        var answerElement =
          $("#scramble-answer");

        if (answerElement) {
          answerElement.textContent =
            "";
        }
      };
  }

  var submit =
    $("#scramble-submit");

  if (submit) {

    submit.onclick =
      function() {

        characterButtons.forEach(
          function(button) {
            button.disabled = true;
          }
        );

        submit.disabled = true;

        if (selected === answer) {

          state.gameScore++;

          var answerElement =
            $("#scramble-answer");

          if (answerElement) {
            answerElement.classList.add(
              "correct"
            );
          }

        } else {

          var wrongElement =
            $("#scramble-answer");

          if (wrongElement) {
            wrongElement.classList.add(
              "incorrect"
            );
          }
        }

        markWordSeen(row);

        setTimeout(
          function() {

            state.currentGameIndex++;

            renderScrambleGame();

          },
          600
        );
      };
  }
}


/* ============================================================
   MATCHING GAME
============================================================ */

function renderMatchingGame() {

  var container =
    $("#game-content");

  if (!container) {
    return;
  }

  var words =
    state.gameWords.slice(0, 5);

  if (!words.length) {
    finishGame();
    return;
  }

  var chinese =
    shuffle(words);

  var english =
    shuffle(words);

  state.matchingSelected =
    null;

  state.matchingMatches =
    0;

  container.innerHTML =
    '<div class="game-question">' +

      '<p>Match each Chinese word with its English meaning.</p>' +

      '<div class="matching-grid">' +

        '<div class="matching-column">' +

          chinese.map(
            function(row) {

              return (
                '<button ' +
                  'class="matching-card" ' +
                  'data-id="' +
                  escapeAttribute(
                    getWordProgressKey(row)
                  ) +
                  '" ' +
                  'data-type="chinese">' +
                  escapeHTML(
                    getSimplified(row)
                  ) +
                '</button>'
              );
            }
          ).join("") +

        '</div>' +

        '<div class="matching-column">' +

          english.map(
            function(row) {

              return (
                '<button ' +
                  'class="matching-card" ' +
                  'data-id="' +
                  escapeAttribute(
                    getWordProgressKey(row)
                  ) +
                  '" ' +
                  'data-type="english">' +
                  escapeHTML(
                    getEnglish(row)
                  ) +
                '</button>'
              );
            }
          ).join("") +

        '</div>' +

      '</div>' +

      '<div id="matching-score" ' +
           'class="game-score">' +
        "Matches: 0 / " +
        words.length +
      '</div>' +

    '</div>';

  var cards =
    $$(".matching-card");

  cards.forEach(
    function(button) {

      button.onclick =
        function() {

          if (button.disabled) {
            return;
          }

          if (
            !state.matchingSelected
          ) {

            state.matchingSelected =
              button;

            button.classList.add(
              "selected"
            );

            return;
          }

          var first =
            state.matchingSelected;

          var second =
            button;

          if (first === second) {
            return;
          }

          if (
            first.getAttribute("data-id") ===
            second.getAttribute("data-id")
          ) {

            first.classList.add(
              "matched"
            );

            second.classList.add(
              "matched"
            );

            first.disabled = true;
            second.disabled = true;

            state.matchingMatches++;

            state.gameScore++;

            state.matchingSelected =
              null;

            var score =
              $("#matching-score");

            if (score) {

              score.textContent =
                "Matches: " +
                state.matchingMatches +
                " / " +
                words.length;
            }

            if (
              state.matchingMatches ===
              words.length
            ) {

              words.forEach(
                function(row) {
                  markWordSeen(row);
                }
              );

              setTimeout(
                finishGame,
                600
              );
            }

          } else {

            first.classList.add(
              "incorrect"
            );

            second.classList.add(
              "incorrect"
            );

            setTimeout(
              function() {

                first.classList.remove(
                  "incorrect",
                  "selected"
                );

                second.classList.remove(
                  "incorrect"
                );

              },
              500
            );

            state.matchingSelected =
              null;
          }
        };
    }
  );
}


/* ============================================================
   SENTENCE GAME
============================================================ */

function renderSentenceGame() {

  var container = $("#game-content");

  var row =
    state.gameWords[
      state.currentGameIndex
    ];

  if (!container || !row) {
    finishGame();
    return;
  }

  var correctExamples =
    getAvailableExamples(row);

  if (!correctExamples.length) {
    state.currentGameIndex++;

    if (
      state.currentGameIndex >=
      state.gameWords.length
    ) {
      finishGame();
    } else {
      renderSentenceGame();
    }

    return;
  }

  var correctExample =
    correctExamples[
      Math.floor(
        Math.random() *
        correctExamples.length
      )
    ];

  var alternatives = [];
  var seen = {};
  var candidates = shuffle(state.vocabulary);

  candidates.forEach(function(candidate) {
    if (
      alternatives.length >= 3 ||
      candidate === row
    ) {
      return;
    }

    var examples =
      getAvailableExamples(candidate);

    if (!examples.length) {
      return;
    }

    var example =
      examples[
        Math.floor(
          Math.random() *
          examples.length
        )
      ];

    var text = clean(example.chinese);

    if (!text || seen[text]) {
      return;
    }

    seen[text] = true;

    alternatives.push({
      row: candidate,
      example: example
    });
  });

  var options = shuffle(
    [
      {
        row: row,
        example: correctExample,
        correct: true
      }
    ].concat(
      alternatives.map(function(item) {
        return {
          row: item.row,
          example: item.example,
          correct: false
        };
      })
    )
  );

  container.innerHTML =
    '<div class="game-question">' +

      '<div class="game-prompt-word">' +
        escapeHTML(getSimplified(row)) +
      '</div>' +

      '<p>Which sentence uses this word?</p>' +

      '<div class="game-options">' +
        options.map(function(option) {
          return (
            '<button ' +
              'class="game-option sentence-game-option" ' +
              'data-answer="' +
              escapeAttribute(
                option.correct ? "correct" : "incorrect"
              ) +
            '">' +
              escapeHTML(option.example.chinese) +
            '</button>'
          );
        }).join("") +
      '</div>' +

      '<div class="game-score">' +
        "Question " +
        (state.currentGameIndex + 1) +
        " / " +
        state.gameWords.length +
        " • Score: " +
        state.gameScore +
      '</div>' +

    '</div>';

  var optionButtons =
    $$(".sentence-game-option");

  optionButtons.forEach(function(button) {

    button.onclick = function() {

      optionButtons.forEach(function(item) {
        item.disabled = true;
      });

      var isCorrect =
        button.getAttribute("data-answer") === "correct";

      if (isCorrect) {
        state.gameScore++;
        button.classList.add("correct");
      } else {
        button.classList.add("incorrect");

        optionButtons.forEach(function(item) {
          if (
            item.getAttribute("data-answer") === "correct"
          ) {
            item.classList.add("correct");
          }
        });
      }

      markWordSeen(row);

      setTimeout(function() {
        state.currentGameIndex++;
        renderSentenceGame();
      }, 600);
    };
  });
}

/* ============================================================
   LISTENING GAME
============================================================ */

function renderListeningGame() {

  var container =
    $("#game-content");

  var row =
    state.gameWords[
      state.currentGameIndex
    ];

  if (!container || !row) {
    finishGame();
    return;
  }

  var correct =
    getSimplified(row);

  var alternatives =
    getGameAlternatives(
      row,
      getSimplified,
      3
    );

  var options =
    shuffle(
      [row].concat(
        alternatives
      )
    );

  container.innerHTML =
    '<div class="game-question">' +

      '<button id="play-listening-word" ' +
              'class="button primary">' +
        '🔊 Play Word' +
      '</button>' +

      '<p>Which Chinese word did you hear?</p>' +

      '<div class="game-options">' +

        options.map(
          function(option) {

            return (
              '<button ' +
                'class="game-option game-chinese-option" ' +
                'data-answer="' +
                escapeAttribute(
                  getSimplified(option)
                ) +
              '">' +
                escapeHTML(
                  getSimplified(option)
                ) +
              '</button>'
            );
          }
        ).join("") +

      '</div>' +

      '<div class="game-score">' +
        "Question " +
        (state.currentGameIndex + 1) +
        " / " +
        state.gameWords.length +
        " • Score: " +
        state.gameScore +
      '</div>' +

    '</div>';

  var play =
    $("#play-listening-word");

  if (play) {

    play.onclick =
      function() {

        speakChinese(
          getSimplified(row)
        );
      };
  }

  var optionButtons =
    $$(".game-option");

  optionButtons.forEach(
    function(button) {

      button.onclick =
        function() {

          optionButtons.forEach(
            function(item) {
              item.disabled = true;
            }
          );

          var answer =
            button.getAttribute(
              "data-answer"
            );

          if (
            answer === correct
          ) {

            state.gameScore++;

            button.classList.add(
              "correct"
            );

          } else {

            button.classList.add(
              "incorrect"
            );

            optionButtons.forEach(
              function(item) {

                if (
                  item.getAttribute(
                    "data-answer"
                  ) === correct
                ) {
                  item.classList.add(
                    "correct"
                  );
                }
              }
            );
          }

          markWordSeen(row);

          setTimeout(
            function() {

              state.currentGameIndex++;

              renderListeningGame();

            },
            600
          );
        };
    }
  );

  /*
     Automatically play the word once
     after the question appears.
  */

  state.listeningTimeout =
    setTimeout(
      function() {

        if (
          state.currentGameIndex <
          state.gameWords.length
        ) {
          speakChinese(
            getSimplified(row)
          );
        }

        state.listeningTimeout = null;

      },
      300
    );
}


/* ============================================================
   GAME FINISH
============================================================ */

function finishGame() {

  var container =
    $("#game-content");

  if (!container) {
    return;
  }

  var total =
    state.gameWords.length;

  if (state.currentGame === "matching") {
    total = Math.min(
      5,
      state.gameWords.length
    );
  }

  container.innerHTML =
    '<div class="game-finished">' +

      '<h3>Game Complete!</h3>' +

      '<p class="game-final-score">' +
        'Score: ' +
        state.gameScore +
        ' / ' +
        total +
      '</p>' +

      '<button id="restart-game" ' +
              'class="button primary">' +
        'Play Again' +
      '</button>' +

    '</div>';

  var restart =
    $("#restart-game");

  if (restart) {

    restart.onclick =
      function() {

        startGame(
          state.currentGame
        );
      };
  }
}


/* ============================================================
   RELOAD BUTTON
============================================================ */

