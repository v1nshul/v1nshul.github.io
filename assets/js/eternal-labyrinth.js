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

  if (!root || !source || !stage || !storyText || !choices || !resetButton) return;

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

  var scenes = Array.prototype.slice.call(source.querySelectorAll("p"))
    .reduce(function (allScenes, paragraph) {
      return allScenes.concat(splitIntoScenes(paragraph.textContent));
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
      } else {
        createChoice(label, function () { transitionTo(scene + 1); });
      }
    });

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

  document.documentElement.classList.add("story-enhanced");
  renderScene(0, false);
  resetButton.addEventListener("click", function () { transitionTo(0); });

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
