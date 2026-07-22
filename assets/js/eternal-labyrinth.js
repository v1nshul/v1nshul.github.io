(function () {
  "use strict";

  var root = document.querySelector("[data-story-root]");
  var source = document.querySelector("[data-story-source]");
  var scenesContainer = document.querySelector("[data-story-scenes]");
  var visual = document.querySelector("[data-story-visual]");

  if (!root || !source || !scenesContainer || !visual) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var animeApi = window.anime || null;
  var activeScene = -1;
  var visibleScenes = new Map();
  var observer = null;

  function splitIntoScenes(paragraph) {
    var sentences = paragraph.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) || [paragraph];
    var sceneList = [];
    var chunk = "";

    sentences.forEach(function (sentence) {
      if (chunk && (chunk + sentence).length > 620) {
        sceneList.push(chunk.trim());
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    });

    if (chunk.trim()) sceneList.push(chunk.trim());
    return sceneList;
  }

  var storyParagraphs = Array.prototype.slice.call(source.querySelectorAll("p"));
  var paragraphScenes = storyParagraphs.map(function (paragraph, index) {
    var text = paragraph.textContent.trim();
    return index === storyParagraphs.length - 1 ? [text] : splitIntoScenes(text);
  });
  var endingScene = paragraphScenes.slice(0, -1).reduce(function (count, paragraph) {
    return count + paragraph.length;
  }, 0);
  var scenes = paragraphScenes.reduce(function (allScenes, paragraph) {
    return allScenes.concat(paragraph);
  }, []);
  var choiceScene = scenes.findIndex(function (text) {
    return text.indexOf("Left, or right?") !== -1;
  });

  if (!scenes.length) return;

  function padSceneNumber(number) {
    return String(number).padStart(2, "0");
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
      opacity: [0.72, 1],
      scale: [0.985, 1],
      duration: 620,
      ease: "outExpo"
    });
    animeApi.animate(active, {
      opacity: [0, 1],
      scale: [0.84, 1],
      rotate: [-2, 0],
      duration: 760,
      ease: "outExpo"
    });
    animeApi.animate(active.querySelectorAll("b, i"), {
      opacity: [0, 1],
      delay: animeApi.stagger(80),
      duration: 640,
      ease: "outQuad"
    });
  }

  function activateScene(section) {
    var nextScene = Number(section.dataset.sceneIndex);
    if (nextScene === activeScene) return;

    var previous = scenesContainer.querySelector(".story-scroll-scene.is-active");
    if (previous) previous.classList.remove("is-active");

    activeScene = nextScene;
    section.classList.add("is-active");
    renderVisual(nextScene);

    if (!animeApi || reduceMotion.matches) return;
    animeApi.animate(section.querySelector(".story-scene-copy"), {
      opacity: [0.45, 1],
      y: [34, 0],
      duration: 720,
      ease: "outExpo"
    });
  }

  function chooseRoute(direction, button) {
    var sections = scenesContainer.querySelectorAll(".story-scroll-scene");
    var destination = direction === "right" ? endingScene : choiceScene + 1;

    root.dataset.storyRoute = direction;
    sections.forEach(function (section, index) {
      if (index <= choiceScene) return;
      section.hidden = direction === "right" ? index !== endingScene : false;
    });

    var choiceBlock = button.closest(".story-choices");
    if (choiceBlock) {
      var decision = document.createElement("p");
      decision.className = "story-decision";
      decision.textContent = direction;
      choiceBlock.replaceWith(decision);
    }

    window.requestAnimationFrame(function () {
      var target = scenesContainer.querySelector('[data-scene-index="' + destination + '"]');
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "center"
        });
      }
    });
  }

  function makeChoice(label) {
    var button = document.createElement("button");
    button.className = "story-choice";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", function () {
      chooseRoute(label, button);
    });
    return button;
  }

  function createScene(text, index) {
    var section = document.createElement("section");
    var copy = document.createElement("div");
    var progress = document.createElement("p");
    var paragraph = document.createElement("p");

    section.className = "story-scroll-scene";
    section.id = "story-scene-" + (index + 1);
    section.dataset.sceneIndex = String(index);
    section.setAttribute("aria-label", "Story scene " + (index + 1) + " of " + scenes.length);

    copy.className = "story-scene-copy";
    progress.className = "story-progress";
    progress.textContent = padSceneNumber(index + 1) + " / " + padSceneNumber(scenes.length);
    paragraph.className = "story-text";
    paragraph.textContent = text;

    copy.appendChild(progress);
    copy.appendChild(paragraph);

    if (index === choiceScene) {
      var choiceBlock = document.createElement("div");
      choiceBlock.className = "story-choices";
      choiceBlock.setAttribute("aria-label", "Choose a direction");
      choiceBlock.appendChild(makeChoice("left"));
      choiceBlock.appendChild(makeChoice("right"));
      copy.appendChild(choiceBlock);
      section.dataset.choiceScene = "true";
    }

    if (choiceScene !== -1 && index > choiceScene) section.hidden = true;
    section.appendChild(copy);
    scenesContainer.appendChild(section);
    return section;
  }

  function observeScenes(sections) {
    if (!("IntersectionObserver" in window)) {
      sections.forEach(function (section) {
        section.classList.add("is-active");
        section.style.opacity = "1";
      });
      renderVisual(0);
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleScenes.set(entry.target, entry.intersectionRatio);
        } else {
          visibleScenes.delete(entry.target);
        }
      });

      var bestSection = null;
      var bestRatio = -1;
      visibleScenes.forEach(function (ratio, section) {
        if (!section.hidden && ratio > bestRatio) {
          bestSection = section;
          bestRatio = ratio;
        }
      });
      if (bestSection) activateScene(bestSection);
    }, {
      root: null,
      rootMargin: "-24% 0px -42% 0px",
      threshold: [0, 0.15, 0.35, 0.6]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function startAmbientMotion() {
    if (!animeApi || reduceMotion.matches) return;

    animeApi.animate(".story-fog-one", {
      x: ["-3vw", "5vw"],
      y: ["-2vh", "5vh"],
      scale: [0.94, 1.06],
      duration: 14000,
      ease: "inOutSine",
      alternate: true,
      loop: true
    });
    animeApi.animate(".story-fog-two", {
      x: ["4vw", "-6vw"],
      y: ["3vh", "-4vh"],
      scale: [1.06, 0.94],
      duration: 17000,
      ease: "inOutSine",
      alternate: true,
      loop: true
    });
  }

  document.documentElement.classList.add("story-enhanced");
  var sceneElements = scenes.map(createScene);
  observeScenes(sceneElements);
  activateScene(sceneElements[0]);
  startAmbientMotion();
})();
