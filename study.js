function setupNavigation() {

  var buttons =
    $$(".nav-button");

  buttons.forEach(
    function(button) {

      button.onclick =
        function() {

          var viewName =
            button.getAttribute(
              "data-view"
            );

          if (!viewName) {
            return;
          }

          showView(viewName);

          buttons.forEach(
            function(other) {

              other.classList.toggle(
                "active",
                other === button
              );
            }
          );
        };
    }
  );
}

function showView(viewName) {

  var views = $$(".view");

  views.forEach(function(view) {
    view.classList.remove("active-view");
  });

  var target = $("#view-" + viewName);

  if (!target) {
    target = $("#" + viewName);
  }

  if (target) {
    target.classList.add("active-view");
  }
}


/* ============================================================
   PROGRESS
============================================================ */

function loadProgress() {

  try {

    var saved =
      localStorage.getItem(
        PROGRESS_STORAGE_KEY
      );

    if (!saved) {
      state.progress = {};
      return;
    }

    var parsed =
      JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      state.progress = parsed;
    } else {
      state.progress = {};
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
      PROGRESS_STORAGE_KEY,
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

function getWordProgressKey(row) {

  var simplified =
    getSimplified(row);

  var lesson =
    getLesson(row);

  if (!simplified) {
    return "";
  }

  return (
    lesson +
    "::" +
    simplified
  );
}

function markWordSeen(row) {

  var key =
    getWordProgressKey(row);

  if (!key) {
    return;
  }

  if (!state.progress[key]) {

    state.progress[key] = {
      seen: 0,
      lastSeen: null
    };
  }

  state.progress[key].seen += 1;

  state.progress[key].lastSeen =
    new Date().toISOString();

  saveProgress();

  updateProgressDisplay();
}

function updateProgressDisplay() {

  var seen =
    Object.keys(
      state.progress
    ).filter(
      function(key) {

        var item =
          state.progress[key];

        return (
          item &&
          Number(item.seen) > 0
        );
      }
    ).length;

  var total =
    state.vocabulary.length;

  var element =
    $("#progress-summary");

  if (element) {

    element.textContent =
      seen +
      " of " +
      total +
      " words practiced";
  }

  var homeProgress =
    $("#home-progress");

  if (homeProgress) {

    homeProgress.textContent =
      seen +
      " / " +
      total;
  }
}

