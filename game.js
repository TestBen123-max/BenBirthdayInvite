(() => {
  "use strict";

  if (
    window.BenBirthdayGame &&
    typeof window.BenBirthdayGame.destroy === "function"
  ) {
    window.BenBirthdayGame.destroy();
  }

  const root = document.querySelector("#ben-birthday-game");
  if (!root) return;

  const game = root.querySelector(".game");
  const background = root.querySelector(".scrolling-background");
  const runner = root.querySelector(".runner");
  const startScreen = root.querySelector(".screen.start");
  const gameOverScreen = root.querySelector(".screen.game-over");
  const winScreen = root.querySelector(".screen.win");
  const deathText = gameOverScreen
    ? gameOverScreen.querySelector(".death")
    : null;

  /* =========================================================
     ASSETS
     ========================================================= */

  const OBSTACLE_ATLAS_URL =
    "https://freight.cargo.site/t/original/i/Y3144400352624815716754831541258/obstacle_atlas_v4_512x512-copy.png";

  /* =========================================================
     GAME SETTINGS
     ========================================================= */

  const GAME_DURATION = 26000;
  const GRAVITY = 1900;
  const JUMP_VELOCITY = 700;

  const OBSTACLE_START = 1800;
  const END_BUFFER = 3500;
  const OBSTACLE_MIN_GAP = 260;
  const OBSTACLE_MAX_GAP = 520;

  /* =========================================================
     BEN SPRITE ANIMATIONS
     ========================================================= */

  const BEN_ANIMATIONS = {
    idle: { row: 2, frames: 4, fps: 4, loop: true },
    run: { row: 0, frames: 8, fps: 18, loop: true },
    jump: { row: 1, frames: 6, fps: 0, loop: false },
    hit: { row: 3, frames: 4, fps: 0, loop: false },
    win: { row: 4, frames: 4, fps: 0, loop: true }
  };

  /* =========================================================
     OBSTACLE DEFINITIONS
     4 x 4 atlas, 128 x 128 cells
     ========================================================= */

  const OBSTACLE_TYPES = {
    canHop: {
      key: "canHop",
      label: "CAN YOU HOP ON?",
      cell: 0,
      scale: 0.52,
      stage: "early",
      size: "small",
      hitbox: { left: 0.18, right: 0.18, top: 0.22, bottom: 0.06 }
    },

    meeting: {
      key: "meeting",
      label: "LAST-MINUTE MEETING",
      cell: 1,
      scale: 0.70,
      stage: "early",
      size: "medium",
      hitbox: { left: 0.10, right: 0.10, top: 0.24, bottom: 0.08 }
    },

    justPinged: {
      key: "justPinged",
      label: "JUST PINGED YOU",
      cell: 2,
      scale: 0.62,
      stage: "early",
      size: "medium",
      hitbox: { left: 0.14, right: 0.14, top: 0.22, bottom: 0.08 }
    },

    bandwidth: {
      key: "bandwidth",
      label: "HOW'S YOUR BANDWIDTH?",
      cell: 3,
      scale: 0.60,
      stage: "early",
      size: "medium",
      hitbox: { left: 0.14, right: 0.14, top: 0.22, bottom: 0.08 }
    },

    urgentDeck: {
      key: "urgentDeck",
      label: "URGENT DECK",
      cell: 4,
      scale: 0.60,
      stage: "mid",
      size: "medium",
      hitbox: { left: 0.16, right: 0.16, top: 0.18, bottom: 0.08 }
    },

    oneMoreRound: {
      key: "oneMoreRound",
      label: "ONE MORE ROUND?",
      cell: 5,
      scale: 0.58,
      stage: "mid",
      size: "medium",
      hitbox: { left: 0.16, right: 0.16, top: 0.20, bottom: 0.08 }
    },

    quickSync: {
      key: "quickSync",
      label: "QUICK SYNC?",
      cell: 0,
      scale: 0.52,
      stage: "mid",
      size: "small",
      hitbox: { left: 0.18, right: 0.18, top: 0.22, bottom: 0.06 }
    },

    chair: {
      key: "chair",
      label: "ROGUE CHAIR",
      cell: 6,
      scale: 0.58,
      stage: "mid",
      size: "small",
      hitbox: { left: 0.20, right: 0.20, top: 0.16, bottom: 0.08 }
    },

    feedback: {
      key: "feedback",
      label: "MORE FEEDBACK",
      cell: 7,
      scale: 0.62,
      stage: "mid",
      size: "medium",
      hitbox: { left: 0.16, right: 0.16, top: 0.16, bottom: 0.08 }
    },

    coldBrew: {
      key: "coldBrew",
      label: "COFFEE CATCH-UP?",
      cell: 8,
      scale: 0.50,
      stage: "mid",
      size: "small",
      hitbox: { left: 0.24, right: 0.24, top: 0.10, bottom: 0.08 }
    },

    circleBack: {
      key: "circleBack",
      label: "CIRCLE BACK",
      cell: 9,
      scale: 0.84,
      stage: "late",
      size: "large",
      hitbox: { left: 0.10, right: 0.10, top: 0.28, bottom: 0.08 }
    },

    smallChange: {
      key: "smallChange",
      label: "JUST ONE SMALL CHANGE",
      cell: 10,
      scale: 0.82,
      stage: "late",
      size: "large",
      hitbox: { left: 0.10, right: 0.10, top: 0.24, bottom: 0.08 }
    },

    ptoPlans: {
      key: "ptoPlans",
      label: "PTO PLANS",
      cell: 11,
      scale: 0.60,
      stage: "late",
      size: "medium",
      hitbox: { left: 0.20, right: 0.20, top: 0.12, bottom: 0.08 }
    },

    america251: {
      key: "america251",
      label: "ANOTHER MONUMENT?",
      cell: 12,
      scale: 0.66,
      stage: "late",
      size: "medium",
      hitbox: { left: 0.18, right: 0.18, top: 0.14, bottom: 0.08 }
    },

    oneMoreIdea: {
      key: "oneMoreIdea",
      label: "ONE MORE IDEA?",
      cell: 13,
      scale: 0.72,
      stage: "late",
      size: "large",
      hitbox: { left: 0.14, right: 0.14, top: 0.22, bottom: 0.08 }
    }
  };

  const EARLY_POOL = ["canHop", "meeting", "justPinged", "bandwidth"];
  const MID_POOL = [
    "urgentDeck",
    "oneMoreRound",
    "quickSync",
    "chair",
    "feedback",
    "coldBrew"
  ];
  const LATE_POOL = [
    "circleBack",
    "smallChange",
    "ptoPlans",
    "america251",
    "oneMoreIdea"
  ];

  /* =========================================================
     GAME STATE
     ========================================================= */

  let running = false;
  let destroyed = false;

  let y = 0;
  let velocityY = 0;
  let elapsed = 0;
  let previousTime = 0;
  let animationFrame = null;

  let obstacles = [];
  let nextObstacleTime = OBSTACLE_START;
  let nextObstacleGap = 360;

  let endScreenTimer = null;
  let deathAnimation = null;
  let winAnimation = null;

  let benState = "";
  let benFrame = 0;
  let benFrameTimer = 0;

  /* =========================================================
     PANORAMA
     ========================================================= */

  const panoramaImage = new Image();
  const backgroundStyle = window.getComputedStyle(background);
  const backgroundUrl = backgroundStyle.backgroundImage
    .replace(/^url\(["']?/, "")
    .replace(/["']?\)$/, "");

  panoramaImage.src = backgroundUrl;

  function setBackgroundProgress(progress) {
    progress = Math.max(0, Math.min(1, progress));

    if (!panoramaImage.naturalWidth || !panoramaImage.naturalHeight) {
      return;
    }

    const gameWidth = background.clientWidth;
    const gameHeight = background.clientHeight;
    const imageAspect = panoramaImage.naturalWidth / panoramaImage.naturalHeight;
    const renderedImageWidth = gameHeight * imageAspect;
    const maxScroll = Math.max(0, renderedImageWidth - gameWidth);
    const x = maxScroll * progress;

    background.style.backgroundPosition = `${-x}px bottom`;
  }

  /* =========================================================
     SCREEN HELPERS
     ========================================================= */

  function hideScreen(screen) {
    if (screen) screen.style.display = "none";
  }

  function showScreen(screen) {
    if (screen) screen.style.display = "flex";
  }

  /* =========================================================
     BEN HELPERS
     ========================================================= */

  function drawBenFrame() {
    const animation = BEN_ANIMATIONS[benState];
    if (!animation) return;

    const xPosition = -(benFrame * 64);
    const yPosition = -(animation.row * 64);

    runner.style.backgroundPosition = `${xPosition}px ${yPosition}px`;
  }

  function setBenState(state) {
    if (benState === state) return;

    benState = state;
    benFrame = 0;
    benFrameTimer = 0;
    drawBenFrame();
  }

  function updateBenAnimation(delta) {
    const animation = BEN_ANIMATIONS[benState];
    if (!animation) return;

    if (benState === "jump") {
      const jumpProgress = Math.max(
        0,
        Math.min(
          1,
          (JUMP_VELOCITY - velocityY) / (JUMP_VELOCITY * 2)
        )
      );

      const newFrame = Math.min(5, Math.floor(jumpProgress * 6));

      if (newFrame !== benFrame) {
        benFrame = newFrame;
        drawBenFrame();
      }
      return;
    }

    if (benState === "hit" || benState === "win") return;
    if (!animation.fps) return;

    benFrameTimer += delta;
    const frameDuration = 1 / animation.fps;

    if (benFrameTimer >= frameDuration) {
      benFrameTimer -= frameDuration;
      benFrame++;

      if (benFrame >= animation.frames) {
        benFrame = animation.loop ? 0 : animation.frames - 1;
      }

      drawBenFrame();
    }
  }

  /* =========================================================
     OBSTACLES
     ========================================================= */

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getObstaclePool(progress) {
    if (progress < 0.33) return EARLY_POOL.slice();
    if (progress < 0.72) return EARLY_POOL.concat(MID_POOL);
    return EARLY_POOL.concat(MID_POOL, LATE_POOL);
  }

  function getCellOffset(cell) {
    const col = cell % 4;
    const row = Math.floor(cell / 4);

    return {
      x: -(col * 128),
      y: -(row * 128)
    };
  }

  function clearObstacles() {
    obstacles.forEach((obstacle) => {
      if (obstacle.element) obstacle.element.remove();
    });
    obstacles = [];
  }

  function makeObstacleElement(def) {
    const element = document.createElement("div");
    element.className = `obstacle obstacle--${def.size || "medium"}`;

    const displaySize = Math.round(128 * def.scale);
    element.style.width = `${displaySize}px`;
    element.style.height = `${displaySize}px`;

    const label = document.createElement("div");
    label.className = "obstacle-label";
    label.textContent = def.label;

    const sprite = document.createElement("div");
    sprite.className = "obstacle-sprite";

    const offset = getCellOffset(def.cell);
    sprite.style.backgroundImage = `url("${OBSTACLE_ATLAS_URL}")`;
    sprite.style.backgroundPosition = `${offset.x}px ${offset.y}px`;
    sprite.style.transform = `translateX(-50%) scale(${def.scale})`;

    element.appendChild(label);
    element.appendChild(sprite);

    return { element, sprite, displaySize };
  }

  function spawnObstacle() {
    const progress = elapsed / GAME_DURATION;
    const pool = getObstaclePool(progress);
    const key = pickRandom(pool);
    const def = OBSTACLE_TYPES[key];
    const built = makeObstacleElement(def);
    const element = built.element;
    const startX = game.clientWidth + 40;

    element.style.left = `${startX}px`;
    game.appendChild(element);

    obstacles.push({
      key,
      def,
      element,
      sprite: built.sprite,
      x: startX,
      wobblePhase: Math.random() * Math.PI * 2
    });
  }

  function updateObstacles(delta) {
    const progress = elapsed / GAME_DURATION;
    const speed = 320 + progress * 95;

    if (
      elapsed >= nextObstacleTime &&
      elapsed < GAME_DURATION - END_BUFFER
    ) {
      let canSpawn = true;

      if (obstacles.length) {
        const newest = obstacles[obstacles.length - 1];

        if (newest.x > game.clientWidth - nextObstacleGap) {
          canSpawn = false;
        }
      }

      if (canSpawn) {
        spawnObstacle();

        nextObstacleGap = randomRange(
          OBSTACLE_MIN_GAP,
          OBSTACLE_MAX_GAP
        );

        nextObstacleTime = elapsed + 200;
      }
    }

    obstacles.forEach((obstacle) => {
      obstacle.x -= speed * delta;
      obstacle.element.style.left = `${obstacle.x}px`;

      obstacle.wobblePhase += delta * 5;
      const bob = Math.sin(obstacle.wobblePhase) * 2;

      obstacle.sprite.style.transform =
        `translateX(-50%) translateY(${bob}px) scale(${obstacle.def.scale})`;
    });

    obstacles = obstacles.filter((obstacle) => {
      const keep = obstacle.x > -220;
      if (!keep) obstacle.element.remove();
      return keep;
    });
  }

  /* =========================================================
     IMPACT EFFECT
     ========================================================= */

  function clearImpactEffects() {
    game.querySelectorAll(".impact-effect").forEach((effect) => {
      effect.remove();
    });
  }

  function showImpactEffect(x, yPosition) {
    const effect = document.createElement("div");
    effect.className = "impact-effect";
    effect.style.backgroundImage = `url("${OBSTACLE_ATLAS_URL}")`;
    effect.style.left = `${x}px`;
    effect.style.top = `${yPosition}px`;

    game.appendChild(effect);

    window.setTimeout(() => {
      effect.remove();
    }, 350);
  }

  /* =========================================================
     COLLISION
     ========================================================= */

  function checkCollisions() {
    const runnerRect = runner.getBoundingClientRect();
    const gameRect = game.getBoundingClientRect();

    const runnerHitbox = {
      left: runnerRect.left + 14,
      right: runnerRect.right - 14,
      top: runnerRect.top + 8,
      bottom: runnerRect.bottom - 4
    };

    for (const obstacle of obstacles) {
      const rect = obstacle.element.getBoundingClientRect();
      const hb = obstacle.def.hitbox || {
        left: 0.14,
        right: 0.14,
        top: 0.18,
        bottom: 0.08
      };

      const obstacleHitbox = {
        left: rect.left + rect.width * hb.left,
        right: rect.right - rect.width * hb.right,
        top: rect.top + rect.height * hb.top,
        bottom: rect.bottom - rect.height * hb.bottom
      };

      const hit =
        runnerHitbox.right > obstacleHitbox.left &&
        runnerHitbox.left < obstacleHitbox.right &&
        runnerHitbox.bottom > obstacleHitbox.top &&
        runnerHitbox.top < obstacleHitbox.bottom;

      if (hit) {
        const overlapLeft = Math.max(runnerHitbox.left, obstacleHitbox.left);
        const overlapRight = Math.min(runnerHitbox.right, obstacleHitbox.right);
        const overlapTop = Math.max(runnerHitbox.top, obstacleHitbox.top);
        const overlapBottom = Math.min(runnerHitbox.bottom, obstacleHitbox.bottom);

        const impactX =
          (overlapLeft + overlapRight) / 2 - gameRect.left;
        const impactY =
          (overlapTop + overlapBottom) / 2 - gameRect.top;

        showImpactEffect(impactX, impactY);
        gameOver();
        return true;
      }
    }

    return false;
  }

  /* =========================================================
     RESET / START
     ========================================================= */

  function resetGame() {
    cancelAnimationFrame(animationFrame);
    clearTimeout(endScreenTimer);
    clearInterval(deathAnimation);
    clearInterval(winAnimation);

    clearObstacles();
    clearImpactEffects();

    running = true;
    y = 0;
    velocityY = 0;
    elapsed = 0;
    previousTime = 0;
    nextObstacleTime = OBSTACLE_START;
    nextObstacleGap = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);

    runner.style.transform = "translateY(0)";
    setBackgroundProgress(0);

    hideScreen(startScreen);
    hideScreen(gameOverScreen);
    hideScreen(winScreen);

    benState = "";
    benFrame = 0;
    benFrameTimer = 0;
    setBenState("run");

    game.focus();
    animationFrame = requestAnimationFrame(gameLoop);
  }

  /* =========================================================
     INPUT / JUMP
     ========================================================= */

  function jump() {
    if (!running) {
      resetGame();
      return;
    }

    if (y <= 2) {
      velocityY = JUMP_VELOCITY;
      setBenState("jump");
    }
  }

  /* =========================================================
     GAME OVER / WIN
     ========================================================= */

  function gameOver() {
    if (!running) return;

    running = false;
    cancelAnimationFrame(animationFrame);
    clearTimeout(endScreenTimer);
    clearInterval(deathAnimation);
    clearInterval(winAnimation);

    y = 0;
    velocityY = 0;
    runner.style.transform = "translateY(0)";

    setBenState("hit");
    benFrame = 0;
    drawBenFrame();

    deathAnimation = setInterval(() => {
      if (benFrame < 3) {
        benFrame++;
        drawBenFrame();
      } else {
        clearInterval(deathAnimation);
      }
    }, 120);

    if (deathText) {
      deathText.textContent = "THE WORKDAY GOT YOU.";
    }

    endScreenTimer = setTimeout(() => {
      showScreen(gameOverScreen);
    }, 650);
  }

  function finishGame() {
    if (!running) return;

    running = false;
    cancelAnimationFrame(animationFrame);
    clearTimeout(endScreenTimer);
    clearInterval(deathAnimation);
    clearInterval(winAnimation);

    y = 0;
    velocityY = 0;
    runner.style.transform = "translateY(0)";

    setBackgroundProgress(1);
    setBenState("win");
    benFrame = 0;
    drawBenFrame();

    winAnimation = setInterval(() => {
      benFrame = (benFrame + 1) % 4;
      drawBenFrame();
    }, 150);

    endScreenTimer = setTimeout(() => {
      showScreen(winScreen);
    }, 900);
  }

  /* =========================================================
     MAIN LOOP
     ========================================================= */

  function gameLoop(timestamp) {
    if (!running || destroyed) return;

    if (!previousTime) previousTime = timestamp;

    let delta = (timestamp - previousTime) / 1000;
    previousTime = timestamp;
    delta = Math.min(delta, 0.035);

    elapsed += delta * 1000;

    const progress = Math.min(1, elapsed / GAME_DURATION);
    setBackgroundProgress(progress);
    updateBenAnimation(delta);

    if (y > 0 || velocityY > 0) {
      velocityY -= GRAVITY * delta;
      y += velocityY * delta;

      if (y <= 0) {
        y = 0;
        velocityY = 0;

        if (benState === "jump") {
          setBenState("run");
        }
      }
    }

    runner.style.transform = `translateY(${-y}px)`;

    updateObstacles(delta);

    if (checkCollisions()) return;

    if (elapsed >= GAME_DURATION) {
      finishGame();
      return;
    }

    animationFrame = requestAnimationFrame(gameLoop);
  }

  /* =========================================================
     INPUT EVENTS
     ========================================================= */

  function handleKeyDown(event) {
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      jump();
    }
  }

  function handlePointerDown(event) {
    event.preventDefault();
    jump();
  }

  document.addEventListener("keydown", handleKeyDown);
  game.addEventListener("pointerdown", handlePointerDown);

  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize() {
    running = false;
    y = 0;
    velocityY = 0;
    runner.style.transform = "translateY(0)";

    benState = "";
    setBenState("idle");
    setBackgroundProgress(0);

    hideScreen(gameOverScreen);
    hideScreen(winScreen);
    showScreen(startScreen);

    game.focus();
  }

  /* =========================================================
     CLEANUP
     ========================================================= */

  window.BenBirthdayGame = {
    destroy() {
      destroyed = true;
      running = false;

      cancelAnimationFrame(animationFrame);
      clearTimeout(endScreenTimer);
      clearInterval(deathAnimation);
      clearInterval(winAnimation);

      clearObstacles();
      clearImpactEffects();

      document.removeEventListener("keydown", handleKeyDown);
      game.removeEventListener("pointerdown", handlePointerDown);
    }
  };

  window.setTimeout(initialize, 300);
})();
