(function () {
  "use strict";

  var root = document.querySelector("[data-story-root]");
  var source = document.querySelector("[data-story-source]");
  var stage = document.querySelector("[data-story-stage]");
  var storyText = document.querySelector("[data-story-text]");
  var choices = document.querySelector("[data-story-choices]");
  var currentLabel = document.querySelector("[data-story-current]");
  var totalLabel = document.querySelector("[data-story-total]");
  var resetButton = document.querySelector("[data-story-reset]");
  var visual = document.querySelector("[data-story-visual]");
  var scrollProgress = document.querySelector("[data-story-scroll-progress]");

  if (!root || !source || !stage || !storyText || !choices || !resetButton || !visual) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var animeApi = window.anime || null;
  var transitioning = false;

  function splitIntoScenes(paragraph) {
    var sentences = paragraph.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) || [paragraph];
    var scenes = [];
    var chunk = "";

    sentences.forEach(function (sentence) {
      if (chunk && (chunk + sentence).length > 620) {
        scenes.push(chunk.trim());
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    });

    if (chunk.trim()) scenes.push(chunk.trim());
    return scenes;
  }

  var storyParagraphs = Array.prototype.slice.call(source.querySelectorAll("p"));
  var paragraphScenes = storyParagraphs.map(function (paragraph, index) {
    if (index === storyParagraphs.length - 1) return [paragraph.textContent.trim()];
    return splitIntoScenes(paragraph.textContent);
  });
  var endingScene = paragraphScenes.slice(0, -1).reduce(function (count, paragraph) {
    return count + paragraph.length;
  }, 0);
  var scenes = paragraphScenes.reduce(function (allScenes, paragraph) {
    return allScenes.concat(paragraph);
  }, []);

  if (!scenes.length) return;

  function padSceneNumber(number) {
    return String(number).padStart(2, "0");
  }

  function choiceLabelsFor(scene) {
    if (scene === scenes.length - 1) return ["restart", "read the original"];
    if (scenes[scene].indexOf("Left, or right?") !== -1) return ["left", "right"];
    return ["continue"];
  }

  function createChoice(label, action) {
    var button = document.createElement("button");
    button.className = "story-choice";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    choices.appendChild(button);
  }

  function goToOriginal() {
    var originalLink = root.querySelector(".story-footer a");
    if (originalLink) originalLink.click();
  }

  function visualModeForScene(scene) {
    var text = scenes[scene].toLowerCase();

    if (text.indexOf("crossroad") !== -1 || text.indexOf("left, or right") !== -1 || text.indexOf("maze") !== -1) return "crossroads";
    if (text.indexOf("podium") !== -1 || text.indexOf("binary search") !== -1 || text.indexOf("windows xp") !== -1) return "podium";
    if (text.indexOf("old man") !== -1 || text.indexOf("instruments") !== -1 || text.indexOf("in the control") !== -1) return "signal";
    if (text.indexOf("creature") !== -1 || text.indexOf("trench") !== -1 || text.indexOf("shadow of myself") !== -1 || text.indexOf("falling") !== -1) return "shadow";
    if (scene >= endingScene || text.indexOf("eyes snap open") !== -1 || text.indexOf("simulation") !== -1 || text.indexOf("mandela") !== -1) return "wake";
    return "mist";
  }

  function renderVisual(scene) {
    var mode = visualModeForScene(scene);
    var groups = visual.querySelectorAll("[data-visual-group]");
    var active = visual.querySelector('[data-visual-group="' + mode + '"]');
    root.setAttribute("data-story-visual-mode", mode);

    if (!active || !animeApi || reduceMotion.matches) return;

    animeApi.utils.set(groups, { opacity: 0 });
    animeApi.animate(visual, {
      opacity: [0.55, 1],
      scale: [0.985, 1],
      duration: 620,
      ease: "outExpo"
    });
    animeApi.animate(active, {
      opacity: [0, 1],
      scale: [0.82, 1],
      rotate: [-3, 0],
      duration: 760,
      ease: "outExpo"
    });
    animeApi.animate(active.querySelectorAll("b, i"), {
      opacity: [0, 1],
      delay: animeApi.stagger(85),
      duration: 680,
      ease: "outQuad"
    });
  }

  function renderScene(scene, shouldFocus) {
    storyText.textContent = scenes[scene];
    currentLabel.textContent = padSceneNumber(scene + 1);
    totalLabel.textContent = padSceneNumber(scenes.length);
    choices.replaceChildren();

    choiceLabelsFor(scene).forEach(function (label) {
      if (label === "restart") {
        createChoice(label, function () { transitionTo(0); });
      } else if (label === "read the original") {
        createChoice(label, goToOriginal);
      } else if (label === "right") {
        createChoice(label, function () { transitionTo(endingScene); });
      } else {
        createChoice(label, function () { transitionTo(scene + 1); });
      }
    });

    renderVisual(scene);
    if (shouldFocus) storyText.focus({ preventScroll: true });
  }

  function setChoicesDisabled(disabled) {
    choices.querySelectorAll("button").forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function revealScene() {
    if (!animeApi || reduceMotion.matches) {
      transitioning = false;
      return;
    }

    animeApi.animate(storyText, {
      opacity: [0, 1],
      y: [16, 0],
      duration: 520,
      ease: "outExpo"
    });

    animeApi.animate(choices.querySelectorAll(".story-choice"), {
      opacity: [0, 1],
      y: [10, 0],
      delay: animeApi.stagger(90),
      duration: 420,
      ease: "outQuad",
      onComplete: function () {
        transitioning = false;
      }
    });
  }

  function transitionTo(scene) {
    if (transitioning || scene < 0 || scene >= scenes.length) return;
    transitioning = true;
    setChoicesDisabled(true);

    if (!animeApi || reduceMotion.matches) {
      renderScene(scene, true);
      transitioning = false;
      return;
    }

    animeApi.animate([storyText, choices], {
      opacity: 0,
      y: -10,
      duration: 240,
      ease: "inQuad",
      onComplete: function () {
        renderScene(scene, true);
        animeApi.utils.set([storyText, choices], { opacity: 1, y: 0 });
        revealScene();
      }
    });
  }

  function startAmbientMotion() {
    if (!animeApi || reduceMotion.matches) return;

    animeApi.animate(".story-fog-one", {
      x: ["-4vw", "7vw"],
      y: ["-2vh", "8vh"],
      scale: [0.92, 1.08],
      duration: 14000,
      ease: "inOutSine",
      alternate: true,
      loop: true
    });

    animeApi.animate(".story-fog-two", {
      x: ["5vw", "-8vw"],
      y: ["4vh", "-5vh"],
      scale: [1.08, 0.9],
      duration: 17000,
      ease: "inOutSine",
      alternate: true,
      loop: true
    });

    animeApi.animate(".story-marker span", {
      opacity: [0.22, 0.9],
      scaleX: [0.65, 1],
      delay: animeApi.stagger(180),
      duration: 1800,
      ease: "inOutSine",
      alternate: true,
      loop: true
    });
  }

  function startScrollMotion() {
    if (reduceMotion.matches) return;

    var framePending = false;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function updateScrollState() {
      var bounds = root.getBoundingClientRect();
      var distance = Math.max(root.offsetHeight - window.innerHeight, 1);
      var progress = clamp(-bounds.top / distance, 0, 1);
      var cueProgress = clamp(progress * 4.5, 0, 1);
      var panelProgress = clamp(progress * 1.9, 0, 1);

      framePending = false;
      root.style.setProperty("--story-scroll-progress", progress.toFixed(4));
      root.style.setProperty("--story-title-y", (-82 * progress).toFixed(2) + "px");
      root.style.setProperty("--story-title-opacity", (1 - progress * 0.78).toFixed(3));
      root.style.setProperty("--story-title-scale", (1 - progress * 0.055).toFixed(4));
      root.style.setProperty("--story-grid-y", (22 + progress * 31).toFixed(2) + "%");
      root.style.setProperty("--story-grid-rotate", (-13 + progress * 7).toFixed(2) + "deg");
      root.style.setProperty("--story-grid-scale", (1 + progress * 0.14).toFixed(4));
      root.style.setProperty("--story-cue-opacity", (1 - cueProgress).toFixed(3));
      root.style.setProperty("--story-cue-y", (-38 * cueProgress).toFixed(2) + "px");
      root.style.setProperty("--story-visual-y", (-24 * progress).toFixed(2) + "px");
      root.style.setProperty("--story-panel-y", (42 * (1 - panelProgress)).toFixed(2) + "px");
      root.style.setProperty("--story-panel-opacity", (0.3 + panelProgress * 0.7).toFixed(3));

      if (scrollProgress) scrollProgress.style.transform = "scaleY(" + progress.toFixed(4) + ")";
    }

    function requestScrollUpdate() {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateScrollState);
    }

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    updateScrollState();
  }
  document.documentElement.classList.add("story-enhanced");
  renderScene(0, false);
  resetButton.addEventListener("click", function () { transitionTo(0); });
  startScrollMotion();

  if (animeApi && !reduceMotion.matches) {
    transitioning = true;
    animeApi.animate(stage, {
      opacity: [0, 1],
      y: [24, 0],
      duration: 900,
      ease: "outExpo"
    });
    revealScene();
    startAmbientMotion();
  }
})();
