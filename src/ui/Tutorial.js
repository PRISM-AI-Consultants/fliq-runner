// Tutorial screen - visual-only instruction panels for ages 6-10
// ZERO text (except "GO!" button) - all icon/animation communication
// 4 panels: Movement, Actions, Collecting, Choices
// Auto-advances every 3s or tap/click to advance
// Skips if player has seen tutorial before (localStorage)

export class Tutorial {
  constructor(overlay, onComplete) {
    this.overlay = overlay;
    this.onComplete = onComplete;
    this.element = null;
    this.currentPanel = 0;
    this.totalPanels = 4;
    this.autoTimer = null;
    this.animationFrames = [];
    this._injectStyles();
    this._build();
  }

  // ---------------------------------------------------------------------------
  //  CSS Keyframes & Styles (injected once)
  // ---------------------------------------------------------------------------

  _injectStyles() {
    if (document.getElementById('tutorial-styles')) return;
    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      /* ---------- panel transitions ---------- */
      @keyframes tutFadeSlideIn {
        0%   { opacity: 0; transform: translateX(60px) scale(0.96); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes tutFadeSlideOut {
        0%   { opacity: 1; transform: translateX(0) scale(1); }
        100% { opacity: 0; transform: translateX(-60px) scale(0.96); }
      }

      /* ---------- character bounce in lanes ---------- */
      @keyframes tutLaneBounce {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }
      @keyframes tutCharLeft {
        0%   { left: 50%; }
        33%  { left: 15%; }
        66%  { left: 50%; }
        100% { left: 85%; }
      }
      @keyframes tutCharLanes {
        0%, 18%   { left: 50%; }
        25%, 43%  { left: 16%; }
        50%, 68%  { left: 84%; }
        75%, 93%  { left: 50%; }
        100%      { left: 50%; }
      }

      /* ---------- swipe hand ---------- */
      @keyframes tutSwipeHand {
        0%   { transform: translateX(-24px); opacity: 0.4; }
        50%  { transform: translateX(24px); opacity: 1; }
        100% { transform: translateX(-24px); opacity: 0.4; }
      }

      /* ---------- jump / slide ---------- */
      @keyframes tutJump {
        0%, 100% { transform: translateY(0); }
        40%      { transform: translateY(-48px); }
        60%      { transform: translateY(-44px); }
      }
      @keyframes tutSlide {
        0%, 100% { transform: scaleY(1) translateY(0); }
        30%, 70% { transform: scaleY(0.4) translateY(14px); }
      }

      /* ---------- arrow pulse ---------- */
      @keyframes tutArrowPulse {
        0%, 100% { opacity: 0.5; transform: translateY(0); }
        50%      { opacity: 1; transform: translateY(-6px); }
      }
      @keyframes tutArrowDown {
        0%, 100% { opacity: 0.5; transform: translateY(0); }
        50%      { opacity: 1; transform: translateY(6px); }
      }

      /* ---------- coin spin ---------- */
      @keyframes tutCoinSpin {
        0%   { transform: rotateY(0deg) scale(1); }
        50%  { transform: rotateY(180deg) scale(1.15); }
        100% { transform: rotateY(360deg) scale(1); }
      }

      /* ---------- plus-one float ---------- */
      @keyframes tutPlusOne {
        0%   { opacity: 1; transform: translateY(0) scale(1); }
        80%  { opacity: 1; transform: translateY(-28px) scale(1.2); }
        100% { opacity: 0; transform: translateY(-36px) scale(0.8); }
      }

      /* ---------- piggy glow ---------- */
      @keyframes tutPiggyGlow {
        0%, 100% { filter: drop-shadow(0 0 4px rgba(245,197,66,0.3)); transform: scale(1); }
        50%      { filter: drop-shadow(0 0 16px rgba(245,197,66,0.7)); transform: scale(1.1); }
      }

      /* ---------- red candy shake ---------- */
      @keyframes tutCandyShake {
        0%, 100% { transform: rotate(0deg); }
        20%      { transform: rotate(-12deg); }
        40%      { transform: rotate(12deg); }
        60%      { transform: rotate(-8deg); }
        80%      { transform: rotate(8deg); }
      }

      /* ---------- flow meter fill ---------- */
      @keyframes tutMeterFill {
        0%   { width: 15%; }
        100% { width: 85%; }
      }

      /* ---------- path glow ---------- */
      @keyframes tutPathGlow {
        0%, 100% { box-shadow: 0 0 6px rgba(245,197,66,0.2); }
        50%      { box-shadow: 0 0 20px rgba(245,197,66,0.6); }
      }

      /* ---------- city light up ---------- */
      @keyframes tutCityLight {
        0%   { opacity: 0.15; filter: brightness(0.5); }
        60%  { opacity: 0.15; filter: brightness(0.5); }
        100% { opacity: 1; filter: brightness(1.4); }
      }

      /* ---------- choice hand tap ---------- */
      @keyframes tutChoiceTap {
        0%, 30%  { transform: translateX(30px) translateY(10px) scale(1); opacity: 0.7; }
        40%, 55% { transform: translateX(-28px) translateY(-2px) scale(0.92); opacity: 1; }
        65%      { transform: translateX(-28px) translateY(-2px) scale(1); opacity: 0.9; }
        100%     { transform: translateX(30px) translateY(10px) scale(1); opacity: 0.7; }
      }

      /* ---------- dot indicator ---------- */
      @keyframes tutDotActive {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.3); }
      }

      /* ---------- GO button ---------- */
      @keyframes tutGoPulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(245,166,35,0.4), 0 0 40px rgba(245,166,35,0.15); }
        50%      { box-shadow: 0 4px 30px rgba(245,166,35,0.7), 0 0 60px rgba(245,166,35,0.35); }
      }

      /* ---------- obstacle ---------- */
      @keyframes tutObstacleSlide {
        0%   { transform: translateY(-20px); opacity: 0; }
        20%  { transform: translateY(0); opacity: 1; }
        80%  { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(20px); opacity: 0; }
      }

      /* ---------- sparkle ---------- */
      @keyframes tutSparkle {
        0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
        50%      { opacity: 1; transform: scale(1) rotate(180deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  //  Build root container
  // ---------------------------------------------------------------------------

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'tutorial-screen';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818 0%, #2d1b3e 40%, #3d2040 70%, #1a0e28 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 48;
      overflow: hidden;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    `;

    // Panel container (holds the 4 panels)
    this.panelContainer = document.createElement('div');
    this.panelContainer.style.cssText = `
      position: relative;
      width: 100%; max-width: 380px;
      height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    this.element.appendChild(this.panelContainer);

    // Build all panels
    this.panels = [
      this._buildMovementPanel(),
      this._buildActionsPanel(),
      this._buildCollectingPanel(),
      this._buildChoicesPanel(),
    ];
    this.panels.forEach((p, i) => {
      p.style.position = 'absolute';
      p.style.top = '0';
      p.style.left = '0';
      p.style.right = '0';
      p.style.bottom = '0';
      p.style.display = 'none';
      p.style.flexDirection = 'column';
      p.style.alignItems = 'center';
      p.style.justifyContent = 'center';
      this.panelContainer.appendChild(p);
    });

    // Dot indicators
    this.dotsContainer = document.createElement('div');
    this.dotsContainer.style.cssText = `
      display: flex; gap: 12px;
      margin-top: 24px;
    `;
    this.dots = [];
    for (let i = 0; i < this.totalPanels; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 10px; height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        transition: background 0.3s ease, transform 0.3s ease;
      `;
      this.dots.push(dot);
      this.dotsContainer.appendChild(dot);
    }
    this.element.appendChild(this.dotsContainer);

    // Tap-to-advance zone (full screen, behind GO button)
    this.element.addEventListener('click', (e) => {
      // Don't advance if they clicked the GO button
      if (e.target.closest('#tutorial-go-btn')) return;
      this._advance();
    });

    this.overlay.appendChild(this.element);
  }

  // ---------------------------------------------------------------------------
  //  Panel 1: Movement (lane switching)
  // ---------------------------------------------------------------------------

  _buildMovementPanel() {
    const panel = document.createElement('div');

    // --- Lane visual ---
    const laneArea = document.createElement('div');
    laneArea.style.cssText = `
      position: relative;
      width: 240px; height: 160px;
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      border: 2px solid rgba(245,197,66,0.15);
      overflow: hidden;
      margin-bottom: 20px;
    `;

    // Lane dividers
    for (let i = 1; i <= 2; i++) {
      const divider = document.createElement('div');
      divider.style.cssText = `
        position: absolute;
        left: ${i * 33.33}%;
        top: 10%; bottom: 10%;
        width: 2px;
        background: repeating-linear-gradient(
          to bottom,
          rgba(245,197,66,0.2) 0px,
          rgba(245,197,66,0.2) 8px,
          transparent 8px,
          transparent 16px
        );
      `;
      laneArea.appendChild(divider);
    }

    // Animated character dot
    const charDot = document.createElement('div');
    charDot.style.cssText = `
      position: absolute;
      bottom: 24px;
      width: 28px; height: 36px;
      margin-left: -14px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 8px 8px 4px 4px;
      animation: tutCharLanes 3s ease-in-out infinite, tutLaneBounce 0.5s ease-in-out infinite;
      box-shadow: 0 2px 12px rgba(245,166,35,0.4);
    `;
    // Head
    const charHead = document.createElement('div');
    charHead.style.cssText = `
      position: absolute;
      top: -10px; left: 50%; margin-left: -8px;
      width: 16px; height: 16px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 50%;
    `;
    charDot.appendChild(charHead);
    laneArea.appendChild(charDot);

    // Left arrow icon
    const arrowLeft = document.createElement('div');
    arrowLeft.style.cssText = `
      position: absolute; left: 8px; top: 50%; margin-top: -16px;
      font-size: 2rem; color: rgba(245,197,66,0.7);
      animation: tutArrowPulse 1.5s ease infinite;
    `;
    arrowLeft.textContent = '\u25C0';
    laneArea.appendChild(arrowLeft);

    // Right arrow icon
    const arrowRight = document.createElement('div');
    arrowRight.style.cssText = `
      position: absolute; right: 8px; top: 50%; margin-top: -16px;
      font-size: 2rem; color: rgba(245,197,66,0.7);
      animation: tutArrowPulse 1.5s ease infinite 0.75s;
    `;
    arrowRight.textContent = '\u25B6';
    laneArea.appendChild(arrowRight);

    panel.appendChild(laneArea);

    // --- Swipe hand icon ---
    const swipeArea = document.createElement('div');
    swipeArea.style.cssText = `
      position: relative;
      width: 120px; height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Trail line
    const swipeLine = document.createElement('div');
    swipeLine.style.cssText = `
      position: absolute;
      width: 60px; height: 3px;
      background: linear-gradient(90deg, transparent, rgba(245,197,66,0.4), transparent);
      border-radius: 2px;
    `;
    swipeArea.appendChild(swipeLine);

    // Hand emoji
    const hand = document.createElement('div');
    hand.style.cssText = `
      font-size: 2rem;
      animation: tutSwipeHand 2s ease-in-out infinite;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
    `;
    hand.textContent = '\uD83D\uDC46'; // pointing up hand (swipe gesture)
    swipeArea.appendChild(hand);

    panel.appendChild(swipeArea);

    return panel;
  }

  // ---------------------------------------------------------------------------
  //  Panel 2: Actions (jump + slide)
  // ---------------------------------------------------------------------------

  _buildActionsPanel() {
    const panel = document.createElement('div');

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; gap: 32px;
      align-items: flex-end;
      justify-content: center;
    `;

    // --- Jump scene ---
    const jumpScene = document.createElement('div');
    jumpScene.style.cssText = `
      display: flex; flex-direction: column;
      align-items: center; gap: 8px;
    `;

    // Up arrow
    const upArrow = document.createElement('div');
    upArrow.style.cssText = `
      font-size: 2.2rem;
      color: #7ED67E;
      animation: tutArrowPulse 1.2s ease infinite;
      filter: drop-shadow(0 0 8px rgba(126,214,126,0.4));
    `;
    upArrow.textContent = '\u2B06\uFE0F';
    jumpScene.appendChild(upArrow);

    // Jump area
    const jumpArea = document.createElement('div');
    jumpArea.style.cssText = `
      position: relative;
      width: 100px; height: 120px;
      background: rgba(0,0,0,0.25);
      border-radius: 12px;
      border: 2px solid rgba(126,214,126,0.2);
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    `;

    // Ground
    const jumpGround = document.createElement('div');
    jumpGround.style.cssText = `
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 16px;
      background: rgba(245,197,66,0.15);
      border-radius: 0 0 10px 10px;
    `;
    jumpArea.appendChild(jumpGround);

    // Obstacle (barrier)
    const jumpObstacle = document.createElement('div');
    jumpObstacle.style.cssText = `
      position: absolute; bottom: 16px; left: 50%; margin-left: -14px;
      width: 28px; height: 20px;
      background: linear-gradient(180deg, #e74c3c, #c0392b);
      border-radius: 4px;
      box-shadow: 0 0 8px rgba(231,76,60,0.3);
      animation: tutObstacleSlide 3s ease infinite;
    `;
    jumpArea.appendChild(jumpObstacle);

    // Jumping character
    const jumpChar = document.createElement('div');
    jumpChar.style.cssText = `
      position: absolute; bottom: 16px; left: 50%; margin-left: -12px;
      width: 24px; height: 32px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 6px 6px 3px 3px;
      animation: tutJump 1.8s ease-in-out infinite;
      z-index: 2;
      box-shadow: 0 2px 8px rgba(245,166,35,0.3);
    `;
    const jumpHead = document.createElement('div');
    jumpHead.style.cssText = `
      position: absolute; top: -8px; left: 50%; margin-left: -6px;
      width: 12px; height: 12px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 50%;
    `;
    jumpChar.appendChild(jumpHead);
    jumpArea.appendChild(jumpChar);

    jumpScene.appendChild(jumpArea);
    row.appendChild(jumpScene);

    // --- Slide scene ---
    const slideScene = document.createElement('div');
    slideScene.style.cssText = `
      display: flex; flex-direction: column;
      align-items: center; gap: 8px;
    `;

    // Down arrow
    const downArrow = document.createElement('div');
    downArrow.style.cssText = `
      font-size: 2.2rem;
      color: #5DA9E9;
      animation: tutArrowDown 1.2s ease infinite;
      filter: drop-shadow(0 0 8px rgba(93,169,233,0.4));
    `;
    downArrow.textContent = '\u2B07\uFE0F';
    slideScene.appendChild(downArrow);

    // Slide area
    const slideArea = document.createElement('div');
    slideArea.style.cssText = `
      position: relative;
      width: 100px; height: 120px;
      background: rgba(0,0,0,0.25);
      border-radius: 12px;
      border: 2px solid rgba(93,169,233,0.2);
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    `;

    // Ground
    const slideGround = document.createElement('div');
    slideGround.style.cssText = `
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 16px;
      background: rgba(245,197,66,0.15);
      border-radius: 0 0 10px 10px;
    `;
    slideArea.appendChild(slideGround);

    // Overhead obstacle (bar to slide under)
    const slideObstacle = document.createElement('div');
    slideObstacle.style.cssText = `
      position: absolute; top: 24px; left: 10%; right: 10%;
      height: 8px;
      background: linear-gradient(90deg, #e74c3c, #c0392b);
      border-radius: 4px;
      box-shadow: 0 0 8px rgba(231,76,60,0.3);
    `;
    // Vertical supports
    const supportL = document.createElement('div');
    supportL.style.cssText = `
      position: absolute; left: 0; top: 0;
      width: 4px; height: 80px;
      background: rgba(231,76,60,0.5);
      border-radius: 2px;
    `;
    const supportR = document.createElement('div');
    supportR.style.cssText = `
      position: absolute; right: 0; top: 0;
      width: 4px; height: 80px;
      background: rgba(231,76,60,0.5);
      border-radius: 2px;
    `;
    slideObstacle.appendChild(supportL);
    slideObstacle.appendChild(supportR);
    slideArea.appendChild(slideObstacle);

    // Sliding character
    const slideChar = document.createElement('div');
    slideChar.style.cssText = `
      position: absolute; bottom: 16px; left: 50%; margin-left: -12px;
      width: 24px; height: 32px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 6px 6px 3px 3px;
      animation: tutSlide 2s ease-in-out infinite;
      transform-origin: bottom center;
      z-index: 2;
      box-shadow: 0 2px 8px rgba(245,166,35,0.3);
    `;
    const slideHead = document.createElement('div');
    slideHead.style.cssText = `
      position: absolute; top: -8px; left: 50%; margin-left: -6px;
      width: 12px; height: 12px;
      background: linear-gradient(180deg, #F5C542, #F5A623);
      border-radius: 50%;
    `;
    slideChar.appendChild(slideHead);
    slideArea.appendChild(slideChar);

    slideScene.appendChild(slideArea);
    row.appendChild(slideScene);

    panel.appendChild(row);

    return panel;
  }

  // ---------------------------------------------------------------------------
  //  Panel 3: Collecting (coin, piggy bank, red candy, flow meter)
  // ---------------------------------------------------------------------------

  _buildCollectingPanel() {
    const panel = document.createElement('div');

    // Top row: coin + piggy + candy
    const collectRow = document.createElement('div');
    collectRow.style.cssText = `
      display: flex; gap: 24px;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    `;

    // --- Coin with +1 ---
    const coinBox = document.createElement('div');
    coinBox.style.cssText = `
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
      position: relative;
    `;
    const coin = document.createElement('div');
    coin.style.cssText = `
      font-size: 2.8rem;
      animation: tutCoinSpin 2s ease-in-out infinite;
      filter: drop-shadow(0 0 8px rgba(245,197,66,0.5));
    `;
    coin.textContent = '\uD83E\uDE99';
    coinBox.appendChild(coin);

    // +1 floating
    const plusOne = document.createElement('div');
    plusOne.style.cssText = `
      position: absolute; top: -6px; right: -12px;
      font-size: 1.1rem; font-weight: 900;
      color: #7ED67E;
      animation: tutPlusOne 2s ease infinite;
      text-shadow: 0 0 6px rgba(126,214,126,0.5);
    `;
    plusOne.textContent = '+1';
    coinBox.appendChild(plusOne);

    // Green check border glow
    const coinGlow = document.createElement('div');
    coinGlow.style.cssText = `
      width: 56px; height: 56px;
      border: 2px solid rgba(126,214,126,0.3);
      border-radius: 50%;
      position: absolute; top: 2px;
      animation: tutPathGlow 2s ease infinite;
      pointer-events: none;
    `;
    coinBox.appendChild(coinGlow);

    collectRow.appendChild(coinBox);

    // --- Piggy bank with big plus ---
    const piggyBox = document.createElement('div');
    piggyBox.style.cssText = `
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
      position: relative;
    `;
    const piggy = document.createElement('div');
    piggy.style.cssText = `
      font-size: 2.8rem;
      animation: tutPiggyGlow 2.5s ease-in-out infinite;
    `;
    piggy.textContent = '\uD83D\uDC37';
    piggyBox.appendChild(piggy);

    // Big plus
    const bigPlus = document.createElement('div');
    bigPlus.style.cssText = `
      position: absolute; top: -8px; right: -16px;
      font-size: 1.3rem; font-weight: 900;
      color: #F5C542;
      text-shadow: 0 0 8px rgba(245,197,66,0.6);
      animation: tutPlusOne 2.5s ease infinite 0.5s;
    `;
    bigPlus.textContent = '+++';
    piggyBox.appendChild(bigPlus);

    collectRow.appendChild(piggyBox);

    // --- Red candy with X ---
    const candyBox = document.createElement('div');
    candyBox.style.cssText = `
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
      position: relative;
    `;
    const candy = document.createElement('div');
    candy.style.cssText = `
      font-size: 2.8rem;
      animation: tutCandyShake 1.5s ease-in-out infinite;
      filter: drop-shadow(0 0 8px rgba(231,76,60,0.4));
    `;
    candy.textContent = '\uD83C\uDF6C';
    candyBox.appendChild(candy);

    // Minus / X overlay
    const minus = document.createElement('div');
    minus.style.cssText = `
      position: absolute; top: -4px; right: -14px;
      font-size: 1.4rem; font-weight: 900;
      color: #e74c3c;
      text-shadow: 0 0 6px rgba(231,76,60,0.6);
    `;
    minus.textContent = '\u2716'; // heavy X
    candyBox.appendChild(minus);

    // Red warning ring
    const candyRing = document.createElement('div');
    candyRing.style.cssText = `
      width: 56px; height: 56px;
      border: 2px solid rgba(231,76,60,0.4);
      border-radius: 50%;
      position: absolute; top: 2px;
      pointer-events: none;
    `;
    candyBox.appendChild(candyRing);

    collectRow.appendChild(candyBox);
    panel.appendChild(collectRow);

    // --- Flow meter ---
    const meterContainer = document.createElement('div');
    meterContainer.style.cssText = `
      width: 220px; height: 28px;
      background: rgba(0,0,0,0.35);
      border-radius: 14px;
      border: 2px solid rgba(245,197,66,0.2);
      overflow: hidden;
      position: relative;
    `;

    const meterFill = document.createElement('div');
    meterFill.style.cssText = `
      position: absolute; top: 2px; bottom: 2px; left: 2px;
      width: 15%;
      background: linear-gradient(90deg, #F5A623, #FFD700, #F5C542);
      border-radius: 12px;
      animation: tutMeterFill 3s ease-in-out infinite;
      box-shadow: 0 0 12px rgba(245,166,35,0.4);
    `;
    meterContainer.appendChild(meterFill);

    // Sparkle particles on meter
    for (let i = 0; i < 3; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        top: ${4 + Math.random() * 16}px;
        left: ${20 + i * 30}%;
        width: 6px; height: 6px;
        background: #fff;
        border-radius: 50%;
        animation: tutSparkle 1.5s ease infinite ${i * 0.5}s;
        pointer-events: none;
      `;
      meterContainer.appendChild(sparkle);
    }

    // Lightning bolt icon at the end
    const bolt = document.createElement('div');
    bolt.style.cssText = `
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      font-size: 1rem;
    `;
    bolt.textContent = '\u26A1';
    meterContainer.appendChild(bolt);

    panel.appendChild(meterContainer);

    return panel;
  }

  // ---------------------------------------------------------------------------
  //  Panel 4: Choices (decision paths + city lighting up + GO button)
  // ---------------------------------------------------------------------------

  _buildChoicesPanel() {
    const panel = document.createElement('div');

    // --- Two path cards ---
    const pathRow = document.createElement('div');
    pathRow.style.cssText = `
      display: flex; gap: 28px;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      position: relative;
    `;

    // Path A (piggy = save)
    const pathA = document.createElement('div');
    pathA.style.cssText = `
      width: 90px; height: 105px;
      background: rgba(20,10,30,0.85);
      border: 2px solid rgba(126,214,126,0.3);
      border-radius: 14px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      animation: tutPathGlow 2s ease infinite;
    `;
    const pathAIcon = document.createElement('div');
    pathAIcon.style.cssText = `
      font-size: 2.2rem;
      filter: drop-shadow(0 0 6px rgba(126,214,126,0.3));
    `;
    pathAIcon.textContent = '\uD83D\uDC37';
    pathA.appendChild(pathAIcon);
    const pathAArrow = document.createElement('div');
    pathAArrow.style.cssText = `font-size: 1.3rem; opacity: 0.6;`;
    pathAArrow.textContent = '\u2190';
    pathA.appendChild(pathAArrow);
    pathRow.appendChild(pathA);

    // "OR" divider
    const orDiv = document.createElement('div');
    orDiv.style.cssText = `
      color: rgba(255,255,255,0.3);
      font-size: 1.6rem; font-weight: 700;
    `;
    orDiv.textContent = '\u2194'; // left-right arrow as visual "or"
    pathRow.appendChild(orDiv);

    // Path B (candy = spend)
    const pathB = document.createElement('div');
    pathB.style.cssText = `
      width: 90px; height: 105px;
      background: rgba(20,10,30,0.85);
      border: 2px solid rgba(245,197,66,0.3);
      border-radius: 14px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    `;
    const pathBIcon = document.createElement('div');
    pathBIcon.style.cssText = `
      font-size: 2.2rem;
      filter: drop-shadow(0 0 6px rgba(245,197,66,0.3));
    `;
    pathBIcon.textContent = '\uD83C\uDFAE';
    pathB.appendChild(pathBIcon);
    const pathBArrow = document.createElement('div');
    pathBArrow.style.cssText = `font-size: 1.3rem; opacity: 0.6;`;
    pathBArrow.textContent = '\u2192';
    pathB.appendChild(pathBArrow);
    pathRow.appendChild(pathB);

    // Animated hand choosing path A
    const choiceHand = document.createElement('div');
    choiceHand.style.cssText = `
      position: absolute;
      bottom: -8px;
      font-size: 1.6rem;
      animation: tutChoiceTap 3s ease-in-out infinite;
      pointer-events: none;
      z-index: 3;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    `;
    choiceHand.textContent = '\uD83D\uDC46';
    pathRow.appendChild(choiceHand);

    panel.appendChild(pathRow);

    // --- City lighting up ---
    const cityRow = document.createElement('div');
    cityRow.style.cssText = `
      display: flex; align-items: flex-end; gap: 3px;
      margin-bottom: 20px;
    `;
    const heights = [20, 36, 24, 48, 30, 42, 28, 44, 22, 34, 26, 40];
    heights.forEach((h, i) => {
      const bldg = document.createElement('div');
      bldg.style.cssText = `
        width: 10px; height: ${h}px;
        background: linear-gradient(180deg, rgba(245,197,66,0.8), rgba(245,166,35,0.3));
        border-radius: 2px 2px 0 0;
        animation: tutCityLight 3s ease infinite ${i * 0.15}s;
      `;
      // Window dots
      const windowCount = Math.floor(h / 12);
      for (let w = 0; w < windowCount; w++) {
        const win = document.createElement('div');
        win.style.cssText = `
          width: 3px; height: 3px;
          background: rgba(255,255,200,0.8);
          border-radius: 1px;
          margin: 4px auto 0;
          animation: tutCityLight 3s ease infinite ${(i * 0.15) + 0.3}s;
        `;
        bldg.appendChild(win);
      }
      cityRow.appendChild(bldg);
    });
    panel.appendChild(cityRow);

    // --- GO! Button ---
    const goBtn = document.createElement('button');
    goBtn.id = 'tutorial-go-btn';
    goBtn.style.cssText = `
      padding: 16px 56px;
      background: linear-gradient(135deg, #F5A623, #FFD700);
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 40px;
      color: #1a1020;
      font-size: 1.8rem;
      font-weight: 900;
      cursor: pointer;
      letter-spacing: 0.12em;
      animation: tutGoPulse 1.5s ease infinite;
      transition: transform 0.15s ease;
      touch-action: manipulation;
    `;
    goBtn.textContent = 'GO!';
    goBtn.addEventListener('pointerenter', () => {
      goBtn.style.transform = 'scale(1.08)';
    });
    goBtn.addEventListener('pointerleave', () => {
      goBtn.style.transform = 'scale(1)';
    });
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._complete();
    });
    panel.appendChild(goBtn);

    return panel;
  }

  // ---------------------------------------------------------------------------
  //  Navigation
  // ---------------------------------------------------------------------------

  _showPanel(index) {
    // Hide current
    this.panels.forEach((p, i) => {
      if (i === index) {
        p.style.display = 'flex';
        p.style.animation = 'tutFadeSlideIn 0.4s ease-out forwards';
      } else if (p.style.display === 'flex') {
        p.style.animation = 'tutFadeSlideOut 0.3s ease-in forwards';
        setTimeout(() => { p.style.display = 'none'; }, 300);
      }
    });

    // Update dots
    this.dots.forEach((dot, i) => {
      if (i === index) {
        dot.style.background = 'linear-gradient(135deg, #F5A623, #FFD700)';
        dot.style.transform = 'scale(1.3)';
        dot.style.boxShadow = '0 0 8px rgba(245,166,35,0.5)';
      } else if (i < index) {
        dot.style.background = 'rgba(245,197,66,0.5)';
        dot.style.transform = 'scale(1)';
        dot.style.boxShadow = 'none';
      } else {
        dot.style.background = 'rgba(255,255,255,0.2)';
        dot.style.transform = 'scale(1)';
        dot.style.boxShadow = 'none';
      }
    });

    this.currentPanel = index;
    this._resetAutoAdvance();
  }

  _advance() {
    if (this.currentPanel < this.totalPanels - 1) {
      this._showPanel(this.currentPanel + 1);
    }
    // On the last panel, tapping anywhere (except GO) does nothing -
    // they have to hit the GO button.
  }

  _resetAutoAdvance() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    // Auto-advance all panels except the last one (which has the GO button)
    if (this.currentPanel < this.totalPanels - 1) {
      this.autoTimer = setTimeout(() => this._advance(), 3000);
    }
  }

  _complete() {
    // Mark tutorial as seen
    try {
      localStorage.setItem('fliq-tutorial-seen', '1');
    } catch (e) {
      // localStorage may be unavailable - that is fine
    }
    this.hide();
    if (this.onComplete) this.onComplete();
  }

  // ---------------------------------------------------------------------------
  //  Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the player has already seen the tutorial.
   */
  static hasBeenSeen() {
    try {
      return localStorage.getItem('fliq-tutorial-seen') === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * Reset the "seen" flag (useful for settings / debug).
   */
  static reset() {
    try {
      localStorage.removeItem('fliq-tutorial-seen');
    } catch (e) {
      // ignore
    }
  }

  /**
   * Show the tutorial. If the player has already seen it, calls
   * onComplete immediately and returns false. Otherwise shows the
   * panels and returns true.
   */
  show(forceShow = false) {
    if (!forceShow && Tutorial.hasBeenSeen()) {
      if (this.onComplete) this.onComplete();
      return false;
    }
    this.currentPanel = 0;
    this.element.style.display = 'flex';
    this._showPanel(0);
    return true;
  }

  /**
   * Hide the tutorial immediately (no animation).
   */
  hide() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.element.style.display = 'none';
    this.panels.forEach(p => {
      p.style.display = 'none';
      p.style.animation = 'none';
    });
  }

  /**
   * Tear down all DOM elements (for cleanup).
   */
  destroy() {
    this.hide();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.panels = [];
    this.dots = [];
  }
}
