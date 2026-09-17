function setupReloadButton() {

  var button =
    $("#reload-app");

  if (!button) {
    return;
  }

  button.onclick =
    function() {
      window.location.reload();
    };
}


/* ============================================================
   LOADING / ERROR UI
============================================================ */

function showLoadingError(
  message
) {

  var loading =
    $("#loading-message");

  var error =
    $("#error-message");

  if (loading) {
    loading.classList.add(
      "hidden"
    );
  }

  if (error) {

    error.classList.remove(
      "hidden"
    );

    error.textContent =
      message;
  }

  var count =
    $("#word-count");

  if (count) {

    count.textContent =
      "Unable to load vocabulary";
  }
}


/* ============================================================
   KEYBOARD CONTROLS
============================================================ */

function setupKeyboardControls() {

  document.addEventListener(
    "keydown",
    function(event) {

      var activeElement =
        document.activeElement;

      var tag =
        activeElement
          ? activeElement.tagName
          : "";

      if (
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
      ) {
        return;
      }

      /*
         Do not use keyboard flashcard controls
         while the user is interacting with a game.
      */

      var flashcardView =
        $("#view-flashcards");

      var readingView =
        $("#view-reading");

      if (
        event.code === "Space" &&
        flashcardView &&
        flashcardView.classList.contains(
          "active-view"
        )
      ) {

        event.preventDefault();

        flipFlashcard();

        return;
      }

      if (
        flashcardView &&
        flashcardView.classList.contains(
          "active-view"
        )
      ) {

        if (
          event.key === "ArrowRight"
        ) {
          nextFlashcard();
        }

        if (
          event.key === "ArrowLeft"
        ) {
          previousFlashcard();
        }

        return;
      }

      if (
        readingView &&
        readingView.classList.contains(
          "active-view"
        )
      ) {

        if (
          event.key === "ArrowRight"
        ) {
          nextReading();
        }

        if (
          event.key === "ArrowLeft"
        ) {
          previousReading();
        }
      }
    }
  );
}


/* ============================================================
   FLASHCARD BUTTONS
============================================================ */

function setupFlashcardButtons() {

  var card =
    $("#flashcard");

  if (card) {

    card.onclick =
      function(event) {

        var target =
          event.target;

        if (
          target &&
          target.closest &&
          target.closest(
            "button, a"
          )
        ) {
          return;
        }

        flipFlashcard();
      };
  }

  var flip =
    $("#flip-card");

  if (flip) {
    flip.onclick =
      flipFlashcard;
  }

  var previous =
    $("#previous-card");

  var next =
    $("#next-card");

  var random =
    $("#random-card");

  var topSpeak =
    $("#flashcard-speak");

  var backSpeak =
    $("#back-speak");

  if (topSpeak) {
    topSpeak.onclick =
      speakCurrentFlashcard;
  }

  if (backSpeak) {
    backSpeak.onclick =
      speakCurrentFlashcard;
  }

  if (previous) {
    previous.onclick =
      previousFlashcard;
  }

  if (next) {
    next.onclick =
      nextFlashcard;
  }

  if (random) {
    random.onclick =
      randomFlashcard;
  }
}


/* ============================================================
   INITIALIZATION
============================================================ */

async function initializeApp() {

  console.log(
    "Initializing Chinese Study..."
  );

  loadProgress();

  setupNavigation();

  /* Initialize browser Chinese speech voices independently of workbook loading. */
  setupSpeechVoiceSelector();

  setupFlashcardButtons();

  setupStudySetControls();

  setupReadingDetailsToggle();

  setupKeyboardControls();

  setupReloadButton();

  setupFilters();

  initializeGames();

  var loading =
    $("#loading-message");

  var error =
    $("#error-message");

  if (loading) {
    loading.classList.remove(
      "hidden"
    );
  }

  if (error) {
    error.classList.add(
      "hidden"
    );
  }

  /*
     Main vocabulary is required.
  */

  var vocabularyLoaded =
    await loadVocabulary();

  if (!vocabularyLoaded) {
    return;
  }

  /*
     Class Reading is optional.

     If this workbook is missing,
     the main application still works.
  */

  await loadClassReading();

  if (loading) {
    loading.classList.add(
      "hidden"
    );
  }

  updateProgressDisplay();

  console.log(
    "Chinese Study initialized successfully."
  );
}


/* ============================================================
   START APP
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();
}
