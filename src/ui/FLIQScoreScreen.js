// FLIQ Score reveal screen - end of session
// Award-winning animated score reveal with confetti, dimension bars, personality insights
// Every child gets a positive, encouraging, celebratory experience - no one "fails"

import { FLIQ_DIMENSIONS, FLIQ_LEVELS } from '../data/fliqWeights.js';

/* ------------------------------------------------------------------ */
/*  Dimension emoji map                                                */
/* ------------------------------------------------------------------ */
const DIM_EMOJI = {
  saveRate:         '\u{1F437}',   // pig face
  delayTolerance:   '\u23F3',      // hourglass
  needsVsWants:     '\u2696\uFE0F', // balance scale
  generosity:       '\u{1F91D}',   // handshake
  riskCalibration:  '\u26A1',      // lightning
  budgetAdherence:  '\u{1F4CA}',   // bar chart
};

/* ------------------------------------------------------------------ */
/*  Personality descriptions keyed by top-2 dimension combos           */
/* ------------------------------------------------------------------ */
const PERSONALITY_MAP = {
  'saveRate+delayTolerance':
    'You are a natural saver who thinks ahead! Your patience is a superpower - you know that waiting for the right moment makes everything better.',
  'saveRate+needsVsWants':
    'You really know the difference between what you need and what you want - and you save your energy for the things that matter most!',
  'saveRate+generosity':
    'You save wisely AND share generously! That is a rare and wonderful combination. Velo City is lucky to have you.',
  'saveRate+riskCalibration':
    'You save smart and explore brave! You know when to hold your energy and when to take an exciting leap forward.',
  'saveRate+budgetAdherence':
    'You are a true budget hero! You manage your Flow energy carefully and always have some saved for a rainy day.',
  'delayTolerance+needsVsWants':
    'Your patience and wisdom are incredible! You wait for the right choices and always pick what truly matters.',
  'delayTolerance+generosity':
    'You are patient AND generous - a true friend to everyone in Velo City! Good things come to those who wait and share.',
  'delayTolerance+riskCalibration':
    'You know when to wait and when to leap! That balance of patience and bravery makes you a truly special explorer.',
  'delayTolerance+budgetAdherence':
    'You take your time and manage your energy like a pro! No rushed decisions for you - every choice is thoughtful.',
  'needsVsWants+generosity':
    'You choose wisely and share freely! You understand what matters most and you love helping others discover it too.',
  'needsVsWants+riskCalibration':
    'Smart choices and brave explorations! You know what you need but you are not afraid to discover something new.',
  'needsVsWants+budgetAdherence':
    'You are a wise planner who always knows what is most important! Your choices help make Velo City stronger.',
  'generosity+riskCalibration':
    'A generous heart and a brave spirit! You help others while fearlessly exploring new paths through Velo City.',
  'generosity+budgetAdherence':
    'You share with others AND stay on budget - that takes real skill! You make the whole city better.',
  'riskCalibration+budgetAdherence':
    'Brave and organized! You explore new paths while keeping your energy perfectly managed. What an adventurer!',
};

function getPersonality(dimensions) {
  const sorted = Object.entries(dimensions)
    .sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0][0];
  const top2 = sorted[1][0];

  // Try both orderings
  const key1 = `${top1}+${top2}`;
  const key2 = `${top2}+${top1}`;
  if (PERSONALITY_MAP[key1]) return PERSONALITY_MAP[key1];
  if (PERSONALITY_MAP[key2]) return PERSONALITY_MAP[key2];

  // Fallback based on top dimension
  const dim = FLIQ_DIMENSIONS[top1];
  if (dim) {
    return `You are a real ${dim.positiveTitle} Your strength in ${dim.label.toLowerCase()} shines through every choice you make. Keep exploring Velo City!`;
  }
  return 'Great first run! Every choice helps you learn. Run again to discover new paths and grow your FLIQ score!';
}

/* ------------------------------------------------------------------ */
/*  Inline stylesheet (injected once)                                  */
/* ------------------------------------------------------------------ */
let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    /* ---------- base fade-in ---------- */
    @keyframes fliqFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ---------- glow pulse on the score number ---------- */
    @keyframes glowPulse {
      0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.15); }
      50%      { text-shadow: 0 0 35px rgba(255,215,0,0.7), 0 0 70px rgba(255,215,0,0.3); }
    }

    /* ---------- suspenseful background pulse ---------- */
    @keyframes bgPulse {
      0%, 100% { background-position: 50% 50%; }
      50%      { background-position: 50% 45%; }
    }

    /* ---------- score bounce (overshoot + settle) ---------- */
    @keyframes scoreBounce {
      0%   { transform: scale(0.3); opacity: 0; }
      50%  { transform: scale(1.25); opacity: 1; }
      70%  { transform: scale(0.92); }
      85%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }

    /* ---------- badge pop ---------- */
    @keyframes badgePop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.3); opacity: 1; }
      80%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }

    /* ---------- slide in from left for dimension bars ---------- */
    @keyframes slideInLeft {
      0%   { transform: translateX(-60px); opacity: 0; }
      100% { transform: translateX(0);     opacity: 1; }
    }

    /* ---------- confetti fall ---------- */
    @keyframes confettiFall {
      0% {
        transform: translateY(-20px) rotate(0deg) scale(0);
        opacity: 0;
      }
      10% {
        transform: translateY(0) rotate(20deg) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(calc(100vh + 30px)) rotate(720deg) scale(0.6);
        opacity: 0;
      }
    }

    /* ---------- confetti sway variants ---------- */
    @keyframes confettiSway1 {
      0%, 100% { margin-left: 0; }
      25%  { margin-left: 30px; }
      75%  { margin-left: -30px; }
    }
    @keyframes confettiSway2 {
      0%, 100% { margin-left: 0; }
      25%  { margin-left: -25px; }
      75%  { margin-left: 25px; }
    }
    @keyframes confettiSway3 {
      0%, 100% { margin-left: 0; }
      33%  { margin-left: 18px; }
      66%  { margin-left: -18px; }
    }

    /* ---------- personality text fade-in ---------- */
    @keyframes personalityReveal {
      0%   { opacity: 0; transform: translateY(15px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    /* ---------- button entrance ---------- */
    @keyframes btnEntrance {
      0%   { opacity: 0; transform: translateY(20px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0)   scale(1); }
    }

    /* ---------- star sparkle for high-scoring dims ---------- */
    @keyframes starSparkle {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.6; transform: scale(1.3); }
    }

    /* ---------- container scroll ---------- */
    #fliq-score::-webkit-scrollbar { width: 4px; }
    #fliq-score::-webkit-scrollbar-track { background: transparent; }
    #fliq-score::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Confetti generator (pure CSS, no canvas)                           */
/* ------------------------------------------------------------------ */
function createConfettiPieces(container, count = 36) {
  const colors = ['#FFD700', '#EB5273', '#584998', '#2ecc71', '#3498db', '#f5a623', '#FF69B4'];
  const shapes = ['square', 'circle', 'rect'];
  const swayAnims = ['confettiSway1', 'confettiSway2', 'confettiSway3'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 6 + Math.random() * 8;       // 6-14px
    const left = Math.random() * 100;           // 0-100%
    const fallDur = 2 + Math.random() * 2.5;   // 2-4.5s
    const delay = Math.random() * 1.8;          // 0-1.8s
    const swayAnim = swayAnims[Math.floor(Math.random() * swayAnims.length)];
    const swayDur = 1.5 + Math.random() * 2;

    let w = size;
    let h = size;
    let radius = shape === 'circle' ? '50%' : shape === 'rect' ? '2px' : '2px';
    if (shape === 'rect') { w = size * 0.5; h = size * 1.6; }

    piece.style.cssText = `
      position: absolute;
      top: -20px;
      left: ${left}%;
      width: ${w}px;
      height: ${h}px;
      background: ${color};
      border-radius: ${radius};
      opacity: 0;
      pointer-events: none;
      z-index: 60;
      animation:
        confettiFall ${fallDur}s ease-in ${delay}s forwards,
        ${swayAnim} ${swayDur}s ease-in-out ${delay}s infinite;
    `;
    container.appendChild(piece);
  }
}

/* ------------------------------------------------------------------ */
/*  Animated count-up utility                                          */
/* ------------------------------------------------------------------ */
function animateCountUp(element, target, duration = 1800) {
  const start = performance.now();
  const targetVal = Math.round(target);

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic for a satisfying deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * targetVal);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

/* ================================================================== */
/*  FLIQScoreScreen class                                              */
/* ================================================================== */
export class FLIQScoreScreen {
  constructor(overlay, onPlayAgain) {
    this.overlay = overlay;
    this.onPlayAgain = onPlayAgain;
    this.element = null;
    this._build();
  }

  /* ---------- Build the base container (hidden) ---------- */
  _build() {
    injectStyles();

    this.element = document.createElement('div');
    this.element.id = 'fliq-score';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818 0%, #1a1020 40%, #2d1b3e 100%);
      background-size: 100% 120%;
      display: none;
      flex-direction: column;
      align-items: center;
      z-index: 50;
      padding: 24px 20px 40px;
      overflow-y: auto;
      overflow-x: hidden;
      animation: bgPulse 3s ease-in-out infinite;
    `;
    this.overlay.appendChild(this.element);
  }

  /* ---------- Show the full score reveal sequence ---------- */
  showScore(fliqResult) {
    this.element.innerHTML = '';
    this.element.style.display = 'flex';

    const badge = this._getBadge(fliqResult.total);
    const totalScore = Math.round(fliqResult.total);

    // --- CONFETTI CONTAINER (behind everything, absolute positioned) ---
    const confettiLayer = document.createElement('div');
    confettiLayer.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      overflow: hidden; pointer-events: none; z-index: 0;
    `;
    this.element.appendChild(confettiLayer);

    // --- CONTENT WRAPPER (above confetti) ---
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center;
      width: 100%; max-width: 420px;
    `;
    this.element.appendChild(content);

    // ============================================================
    // PHASE 1: "Your FLIQ Score" header (0-0.5s)
    // ============================================================
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center;
      margin-bottom: 8px;
      animation: fliqFadeIn 0.6s ease-out forwards;
      opacity: 0;
    `;

    const yourScore = document.createElement('div');
    yourScore.style.cssText = `
      font-size: 0.9rem;
      color: rgba(255,255,255,0.5);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 12px;
      font-weight: 600;
    `;
    yourScore.textContent = 'Your FLIQ Score';
    header.appendChild(yourScore);
    content.appendChild(header);

    // ============================================================
    // PHASE 2: Big animated score number (0.4-2.2s count-up)
    // ============================================================
    const scoreContainer = document.createElement('div');
    scoreContainer.style.cssText = `
      text-align: center;
      margin-bottom: 6px;
      opacity: 0;
      animation: scoreBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
    `;

    const scoreNum = document.createElement('div');
    scoreNum.style.cssText = `
      font-size: 5.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${badge.color}, #FFD700, ${badge.color});
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      animation: glowPulse 2s ease-in-out 2.2s infinite;
      filter: drop-shadow(0 4px 20px ${badge.color}50);
      font-variant-numeric: tabular-nums;
    `;
    scoreNum.textContent = '0';
    scoreContainer.appendChild(scoreNum);
    content.appendChild(scoreContainer);

    // Start count-up after a brief suspenseful pause
    setTimeout(() => {
      animateCountUp(scoreNum, totalScore, 1800);
    }, 500);

    // ============================================================
    // PHASE 3: Badge title pop (at ~2.3s when count-up finishes)
    // ============================================================
    const badgeEl = document.createElement('div');
    badgeEl.style.cssText = `
      text-align: center;
      margin-bottom: 28px;
      opacity: 0;
      animation: badgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 2.3s forwards;
    `;

    const badgeTitle = document.createElement('div');
    badgeTitle.style.cssText = `
      display: inline-block;
      font-size: 1.5rem;
      font-weight: 800;
      color: ${badge.color};
      text-shadow: 0 0 20px ${badge.color}50, 0 0 40px ${badge.color}20;
      padding: 6px 24px;
      border: 2px solid ${badge.color}60;
      border-radius: 30px;
      background: ${badge.color}12;
      letter-spacing: 0.04em;
    `;
    badgeTitle.textContent = badge.title;
    badgeEl.appendChild(badgeTitle);
    content.appendChild(badgeEl);

    // Launch confetti when badge pops
    setTimeout(() => {
      createConfettiPieces(confettiLayer, 38);
    }, 2300);

    // Shift background gradient to badge color theme
    setTimeout(() => {
      this.element.style.transition = 'background 1.5s ease';
      this.element.style.background = `linear-gradient(180deg, #0d0818 0%, ${badge.color}10 50%, #2d1b3e 100%)`;
    }, 2500);

    // ============================================================
    // PHASE 4: Dimension breakdown (3.0s+, staggered)
    // ============================================================
    const dimsSection = document.createElement('div');
    dimsSection.style.cssText = `
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 28px;
    `;

    const dimKeys = Object.keys(FLIQ_DIMENSIONS);
    dimKeys.forEach((key, i) => {
      const dim = FLIQ_DIMENSIONS[key];
      const score = fliqResult.dimensions[key] || 0;
      const row = this._createDimensionBar(key, dim, score, i);
      dimsSection.appendChild(row);
    });
    content.appendChild(dimsSection);

    // ============================================================
    // PHASE 5: Personality description (after dimensions)
    // ============================================================
    const personalityDelay = 3.0 + dimKeys.length * 0.15 + 0.8; // after last dim bar
    const personality = document.createElement('div');
    personality.style.cssText = `
      text-align: center;
      color: rgba(255,255,255,0.75);
      font-size: 0.95rem;
      max-width: 340px;
      line-height: 1.65;
      margin-bottom: 32px;
      opacity: 0;
      animation: personalityReveal 0.8s ease-out ${personalityDelay}s forwards;
      padding: 16px 20px;
      background: rgba(255,255,255,0.04);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.06);
    `;
    personality.textContent = getPersonality(fliqResult.dimensions);
    content.appendChild(personality);

    // ============================================================
    // PHASE 6: Action button
    // ============================================================
    const btnDelay = personalityDelay + 0.5;

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      justify-content: center;
      opacity: 0;
      animation: btnEntrance 0.6s ease-out ${btnDelay}s forwards;
    `;

    const playAgainBtn = this._createButton(
      'Run Again!',
      `linear-gradient(135deg, #F5A623, #FFD700)`,
      '#1a1020',
      () => { if (this.onPlayAgain) this.onPlayAgain(); }
    );
    btnContainer.appendChild(playAgainBtn);

    content.appendChild(btnContainer);
  }

  /* ---------- Build a single dimension bar row ---------- */
  _createDimensionBar(key, dim, score, index) {
    const animDelay = 3.0 + index * 0.15; // starts at 3s, staggers 0.15s
    const fillDelay = animDelay + 0.3;      // fill starts after slide-in
    const roundedScore = Math.round(score);
    const isHigh = score >= 70;
    const emoji = DIM_EMOJI[key] || '';

    const row = document.createElement('div');
    row.style.cssText = `
      opacity: 0;
      animation: slideInLeft 0.5s ease-out ${animDelay}s forwards;
    `;

    // --- Label row ---
    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    `;

    const nameEl = document.createElement('span');
    nameEl.style.cssText = `
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
      font-weight: 700;
    `;
    nameEl.textContent = `${emoji}  ${dim.label}`;
    labelRow.appendChild(nameEl);

    const scoreLabel = document.createElement('span');
    scoreLabel.style.cssText = `
      font-size: 0.8rem;
      font-weight: 800;
      color: ${isHigh ? '#2ecc71' : '#F5C542'};
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    if (isHigh) {
      const star = document.createElement('span');
      star.style.cssText = `
        font-size: 0.85rem;
        animation: starSparkle 1.5s ease-in-out ${fillDelay + 0.5}s infinite;
      `;
      star.textContent = '\u2B50'; // star
      scoreLabel.appendChild(star);
    }
    const scoreVal = document.createElement('span');
    scoreVal.textContent = roundedScore;
    scoreLabel.appendChild(scoreVal);
    labelRow.appendChild(scoreLabel);

    row.appendChild(labelRow);

    // --- Progress bar ---
    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
      width: 100%;
      height: 10px;
      background: rgba(255,255,255,0.08);
      border-radius: 5px;
      overflow: hidden;
      position: relative;
    `;

    const barFill = document.createElement('div');
    const barColor = isHigh
      ? 'linear-gradient(90deg, #2ecc71, #27ae60)'
      : 'linear-gradient(90deg, #F5A623, #FFD700)';
    barFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: ${barColor};
      border-radius: 5px;
      transition: width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${fillDelay}s;
      position: relative;
    `;

    // Shimmer effect on the bar
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,255,255,0.25) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      border-radius: 5px;
      animation: none;
    `;
    barFill.appendChild(shimmer);
    barOuter.appendChild(barFill);
    row.appendChild(barOuter);

    // Trigger fill after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barFill.style.width = roundedScore + '%';
      });
    });

    // --- Positive note for high scorers ---
    if (isHigh) {
      const note = document.createElement('div');
      note.style.cssText = `
        font-size: 0.7rem;
        color: #2ecc71;
        margin-top: 3px;
        font-weight: 700;
        letter-spacing: 0.02em;
      `;
      note.textContent = dim.positiveTitle;
      row.appendChild(note);
    }

    return row;
  }

  /* ---------- Styled button factory ---------- */
  _createButton(text, bg, textColor, onClick) {
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 16px 44px;
      background: ${bg};
      border: none;
      border-radius: 30px;
      color: ${textColor};
      font-size: 1.15rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(245,166,35,0.35), 0 0 40px rgba(255,215,0,0.1);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      letter-spacing: 0.03em;
      -webkit-tap-highlight-color: transparent;
    `;
    btn.textContent = text;

    btn.addEventListener('pointerenter', () => {
      btn.style.transform = 'scale(1.08)';
      btn.style.boxShadow = '0 6px 28px rgba(245,166,35,0.5), 0 0 60px rgba(255,215,0,0.15)';
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 20px rgba(245,166,35,0.35), 0 0 40px rgba(255,215,0,0.1)';
    });
    btn.addEventListener('pointerdown', () => {
      btn.style.transform = 'scale(0.96)';
    });
    btn.addEventListener('pointerup', () => {
      btn.style.transform = 'scale(1.08)';
    });
    btn.addEventListener('click', onClick);

    return btn;
  }

  /* ---------- Look up badge from FLIQ_LEVELS ---------- */
  _getBadge(score) {
    let badge = FLIQ_LEVELS[0];
    for (const level of FLIQ_LEVELS) {
      if (score >= level.minScore) badge = level;
    }
    return badge;
  }

  /* ---------- Hide the screen ---------- */
  hide() {
    this.element.style.display = 'none';
    this.element.innerHTML = '';
    // Reset background for next show
    this.element.style.transition = 'none';
    this.element.style.background = 'linear-gradient(180deg, #0d0818 0%, #1a1020 40%, #2d1b3e 100%)';
  }
}
