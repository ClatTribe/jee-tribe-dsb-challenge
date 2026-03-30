// Canvas-based shareable score card generator
// Generates branded 1080x1350 images for sharing on WhatsApp, Instagram, etc.

const W = 1080;
const H = 1350;
const APP_URL = 'jeetribechallenge.getedunext.com';

// Colors
const DARK_BG = '#060818';
const NAVY = '#1e1b4b';
const AMBER = '#F59E0B';
const AMBER_LIGHT = '#FCD34D';
const GREEN = '#10B981';
const RED = '#EF4444';
const WHITE = '#FFFFFF';
const WHITE_60 = 'rgba(255,255,255,0.6)';
const WHITE_80 = 'rgba(255,255,255,0.8)';
const WHITE_10 = 'rgba(255,255,255,0.1)';
const WHITE_20 = 'rgba(255,255,255,0.2)';

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, DARK_BG);
  grad.addColorStop(0.5, NAVY);
  grad.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Amber glow at top
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600);
  glow.addColorStop(0, 'rgba(245,158,11,0.25)');
  glow.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 600);

  // Subtle grid pattern
  ctx.strokeStyle = WHITE_10;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBranding(ctx: CanvasRenderingContext2D) {
  // Top bar
  ctx.fillStyle = WHITE_10;
  ctx.fillRect(0, 0, W, 120);

  // Lightning bolt emoji + brand name
  ctx.font = 'bold 42px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ PREPTRIBE ⚡', W / 2, 78);
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  // Footer bar
  ctx.fillStyle = WHITE_10;
  ctx.fillRect(0, H - 100, W, 100);

  // URL
  ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'center';
  ctx.fillText(`🌐 ${APP_URL}`, W / 2, H - 45);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius: number, fill: string
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, value: string, color: string = AMBER
) {
  drawRoundedRect(ctx, x, y, w, h, 20, WHITE_10);

  // Border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.strokeStyle = WHITE_20;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Value
  ctx.font = `bold 52px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(value, x + w / 2, y + h / 2 + 5);

  // Label
  ctx.font = '24px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.fillText(label, x + w / 2, y + h - 25);
}

function drawGameModeTitle(ctx: CanvasRenderingContext2D, emoji: string, title: string, y: number) {
  ctx.font = '36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji}  ${title}`, W / 2, y);
}

function drawPlayerName(ctx: CanvasRenderingContext2D, name: string, y: number) {
  ctx.font = 'bold 56px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  const displayName = name || 'Anonymous';
  ctx.fillText(displayName, W / 2, y);
}

function drawBigScore(ctx: CanvasRenderingContext2D, score: string, label: string, y: number, color: string = AMBER) {
  ctx.font = `bold 140px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(score, W / 2, y);

  ctx.font = '32px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.fillText(label, W / 2, y + 50);
}

function drawDate(ctx: CanvasRenderingContext2D, y: number) {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  ctx.font = '28px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.textAlign = 'center';
  ctx.fillText(date, W / 2, y);
}

// ─── Mini Mock Score Card ─────────────────────────────────────

export interface MiniMockShareData {
  userName: string;
  totalScore: number;
  maxScore: number;
  accuracy: number;
  subjectBreakdown?: Record<string, { score: number; correct: number; wrong: number; skipped: number }>;
}

export async function drawMiniMockCard(data: MiniMockShareData): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBackground(ctx);
  drawBranding(ctx);

  // Game mode
  drawGameModeTitle(ctx, '🎯', 'MINI MOCK RESULTS', 200);
  drawDate(ctx, 240);

  // Player name
  drawPlayerName(ctx, data.userName, 330);

  // Big score
  drawBigScore(ctx, `${data.totalScore}/${data.maxScore}`, 'TOTAL SCORE', 500);

  // Stats row
  const boxW = 300;
  const boxH = 130;
  const startX = (W - boxW * 3 - 40) / 2;
  const statsY = 590;

  drawStatBox(ctx, startX, statsY, boxW, boxH, 'Accuracy', `${Math.round(data.accuracy * 100)}%`, GREEN);
  drawStatBox(ctx, startX + boxW + 20, statsY, boxW, boxH, 'Correct', `${Object.values(data.subjectBreakdown || {}).reduce((s, v) => s + v.correct, 0)}`, GREEN);
  drawStatBox(ctx, startX + (boxW + 20) * 2, statsY, boxW, boxH, 'Wrong', `${Object.values(data.subjectBreakdown || {}).reduce((s, v) => s + v.wrong, 0)}`, RED);

  // Subject breakdown
  if (data.subjectBreakdown) {
    const subjects = Object.entries(data.subjectBreakdown);
    const barY = 780;
    const barW = 860;
    const barH = 50;
    const barStartX = (W - barW) / 2;

    ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
    ctx.fillStyle = WHITE_80;
    ctx.textAlign = 'center';
    ctx.fillText('SUBJECT BREAKDOWN', W / 2, barY);

    const subjectColors: Record<string, string> = {
      Physics: '#3B82F6',
      Chemistry: '#10B981',
      Mathematics: '#F59E0B',
    };

    subjects.forEach(([name, stats], i) => {
      const y = barY + 40 + i * 100;
      const color = subjectColors[name] || AMBER;

      // Subject name
      ctx.font = '28px Arial, Helvetica, sans-serif';
      ctx.fillStyle = WHITE_80;
      ctx.textAlign = 'left';
      ctx.fillText(name, barStartX, y + 10);

      // Score text
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(`${stats.correct}/${stats.correct + stats.wrong + stats.skipped}`, barStartX + barW, y + 10);

      // Bar background
      drawRoundedRect(ctx, barStartX, y + 25, barW, barH, 12, WHITE_10);

      // Bar fill
      const total = stats.correct + stats.wrong + stats.skipped;
      const pct = total > 0 ? stats.correct / total : 0;
      if (pct > 0) {
        drawRoundedRect(ctx, barStartX, y + 25, barW * pct, barH, 12, color);
      }
    });
  }

  // CTA
  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER_LIGHT;
  ctx.textAlign = 'center';
  ctx.fillText('Can you beat my score? 🔥', W / 2, H - 160);

  drawFooter(ctx);
  return canvasToBlob(canvas);
}

// ─── Sudden Death Score Card ──────────────────────────────────

export interface SuddenDeathShareData {
  userName: string;
  score: number;
  isWin: boolean;
}

export async function drawSuddenDeathCard(data: SuddenDeathShareData): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBackground(ctx);
  drawBranding(ctx);

  drawGameModeTitle(ctx, '💀', 'SUDDEN DEATH', 200);
  drawDate(ctx, 240);
  drawPlayerName(ctx, data.userName, 340);

  // Result
  const resultEmoji = data.isWin ? '⚡' : '💀';
  const resultText = data.isWin ? 'SURVIVED!' : 'ELIMINATED!';
  const resultColor = data.isWin ? GREEN : RED;

  ctx.font = '120px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(resultEmoji, W / 2, 500);

  ctx.font = `bold 72px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = resultColor;
  ctx.fillText(resultText, W / 2, 610);

  // Score
  drawBigScore(ctx, `${data.score}`, 'POINTS EARNED', 790, AMBER);

  // Stat boxes
  const boxW = 440;
  const boxH = 130;
  drawStatBox(ctx, (W - boxW * 2 - 30) / 2, 880, boxW, boxH, 'Result', data.isWin ? 'Victory' : 'Defeat', resultColor);
  drawStatBox(ctx, (W - boxW * 2 - 30) / 2 + boxW + 30, 880, boxW, boxH, 'XP Earned', `+${data.score}`, AMBER);

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER_LIGHT;
  ctx.textAlign = 'center';
  ctx.fillText('Think you can survive? 💀', W / 2, H - 160);

  drawFooter(ctx);
  return canvasToBlob(canvas);
}

// ─── Skip Strategy Score Card ─────────────────────────────────

export interface SkipStrategyShareData {
  userName: string;
  score: number;
}

export async function drawSkipStrategyCard(data: SkipStrategyShareData): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBackground(ctx);
  drawBranding(ctx);

  drawGameModeTitle(ctx, '🧠', 'SKIP OR SOLVE', 200);
  drawDate(ctx, 240);
  drawPlayerName(ctx, data.userName, 340);

  // Big brain emoji
  ctx.font = '140px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧠', W / 2, 520);

  ctx.font = `bold 64px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = GREEN;
  ctx.fillText('INSTINCTS SHARPENED!', W / 2, 630);

  drawBigScore(ctx, `${data.score}`, 'STRATEGY POINTS', 810, AMBER);

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER_LIGHT;
  ctx.textAlign = 'center';
  ctx.fillText('Test your instincts! 🎯', W / 2, H - 160);

  drawFooter(ctx);
  return canvasToBlob(canvas);
}

// ─── Duel Score Card ──────────────────────────────────────────

export interface DuelShareData {
  userName: string;
  userScore: number;
  opponentName: string;
  opponentScore: number;
  result: 'victory' | 'defeat' | 'draw';
}

export async function drawDuelCard(data: DuelShareData): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBackground(ctx);
  drawBranding(ctx);

  drawGameModeTitle(ctx, '⚔️', 'DUEL ARENA', 200);
  drawDate(ctx, 240);

  // Result
  const resultMap = {
    victory: { emoji: '🏆', text: 'VICTORY!', color: GREEN },
    defeat: { emoji: '😤', text: 'DEFEATED', color: RED },
    draw: { emoji: '🤝', text: "IT'S A DRAW!", color: AMBER },
  };
  const r = resultMap[data.result];

  ctx.font = '100px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(r.emoji, W / 2, 380);

  ctx.font = `bold 68px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = r.color;
  ctx.fillText(r.text, W / 2, 470);

  // VS layout
  const cardW = 420;
  const cardH = 350;
  const cardY = 530;
  const gap = 60;
  const leftX = (W - cardW * 2 - gap) / 2;
  const rightX = leftX + cardW + gap;

  // Player card
  drawRoundedRect(ctx, leftX, cardY, cardW, cardH, 24, WHITE_10);
  ctx.beginPath();
  ctx.roundRect(leftX, cardY, cardW, cardH, 24);
  ctx.strokeStyle = GREEN + '80';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '28px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.textAlign = 'center';
  ctx.fillText('YOU', leftX + cardW / 2, cardY + 50);

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE;
  ctx.fillText(data.userName || 'You', leftX + cardW / 2, cardY + 100);

  ctx.font = `bold 100px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = GREEN;
  ctx.fillText(`${data.userScore}`, leftX + cardW / 2, cardY + 240);

  // Opponent card
  drawRoundedRect(ctx, rightX, cardY, cardW, cardH, 24, WHITE_10);
  ctx.beginPath();
  ctx.roundRect(rightX, cardY, cardW, cardH, 24);
  ctx.strokeStyle = RED + '80';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '28px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.textAlign = 'center';
  ctx.fillText('OPPONENT', rightX + cardW / 2, cardY + 50);

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE;
  ctx.fillText(data.opponentName || 'Opponent', rightX + cardW / 2, cardY + 100);

  ctx.font = `bold 100px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = RED;
  ctx.fillText(`${data.opponentScore}`, rightX + cardW / 2, cardY + 240);

  // VS badge
  ctx.font = 'bold 48px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, cardY + cardH / 2 + 15);

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER_LIGHT;
  ctx.textAlign = 'center';
  ctx.fillText('Challenge me to a duel! ⚔️', W / 2, H - 160);

  drawFooter(ctx);
  return canvasToBlob(canvas);
}

// ─── Dashboard Stats Card ─────────────────────────────────────

export interface DashboardShareData {
  userName: string;
  currentStreak: number;
  totalXP: number;
  coins: number;
  predictedAIR: number | null;
  airCategory: string | null;
}

export async function drawDashboardCard(data: DashboardShareData): Promise<Blob> {
  const [canvas, ctx] = createCanvas();
  drawBackground(ctx);
  drawBranding(ctx);

  drawGameModeTitle(ctx, '📊', 'MY DAILY STATS', 200);
  drawDate(ctx, 240);
  drawPlayerName(ctx, data.userName, 340);

  // Streak - big display
  ctx.font = '120px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔥', W / 2, 490);

  ctx.font = `bold 100px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = AMBER;
  ctx.fillText(`${data.currentStreak}`, W / 2, 610);

  ctx.font = '32px Arial, Helvetica, sans-serif';
  ctx.fillStyle = WHITE_60;
  ctx.fillText('DAY STREAK', W / 2, 660);

  // Stat grid (2x2)
  const boxW = 440;
  const boxH = 140;
  const gap = 30;
  const startX = (W - boxW * 2 - gap) / 2;
  const row1Y = 720;
  const row2Y = row1Y + boxH + gap;

  const airDisplay = data.predictedAIR
    ? data.predictedAIR.toLocaleString('en-IN')
    : '—';

  drawStatBox(ctx, startX, row1Y, boxW, boxH, 'Total XP', `${data.totalXP}`, AMBER);
  drawStatBox(ctx, startX + boxW + gap, row1Y, boxW, boxH, 'Predicted AIR', airDisplay, '#8B5CF6');
  drawStatBox(ctx, startX, row2Y, boxW, boxH, 'Coins', `${data.coins}`, AMBER_LIGHT);
  drawStatBox(ctx, startX + boxW + gap, row2Y, boxW, boxH, 'Streak', `${data.currentStreak} days`, '#F97316');

  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillStyle = AMBER_LIGHT;
  ctx.textAlign = 'center';
  ctx.fillText('Join the Tribe! 🔥', W / 2, H - 160);

  drawFooter(ctx);
  return canvasToBlob(canvas);
}

// ─── Utility ──────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      },
      'image/png',
      1.0
    );
  });
}
