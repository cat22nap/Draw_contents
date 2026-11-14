// ===== 設定 =====
const START_NUMBER = 1;   // 開始番号
const END_NUMBER = 88;    // 終了番号

// 除外する番号（重複して書いても問題なし）
const EXCLUDED_NUMBERS = [
    6, 7, 12, 13, 16, 18,
    20, 21, 23, 27, 29, 30, 33, 36,
    56, 63, 67, 72, 73, 74, 75, 76, 77, 78,
    81, 82, 83, 87, 88,
];

const MAX_ROW = 5;             // 一覧で縦に並べる数字の個数
const SHUFFLE_INTERVAL = 100;  // 抽選中に数字を切り替える間隔（ミリ秒）
const DRAW_DURATION = 600;    // 抽選開始から確定までの時間（ミリ秒）
// const DRAW_DURATION = 3500;    // 抽選開始から確定までの時間（ミリ秒）

// const SHOW_REMAINING = true;   // 残り人数を表示するなら true、隠すなら false
const SHOW_REMAINING = false;   // 残り人数を表示するなら true、隠すなら false

const SAVE_RESULTS = true;     // 抽選結果をブラウザに保存し、再読み込みしても復元するなら true

// 抽選を実行するキー（スペース・Enter・→・↓・PageDown）
// プレゼン用リモコンの「次へ」ボタンは、たいてい → か PageDown を送る
const DRAW_KEYS = ['Space', 'Enter', 'NumpadEnter', 'ArrowRight', 'ArrowDown', 'PageDown'];

// リセットのキー操作：Shift + Backspace（確認ダイアログが出る）
// 画面にはリセットボタンを置かない。開発者ツールのコンソールで resetDraw() と打ってもリセットできる

// ===== 状態 =====
const STORAGE_KEY = 'draw_contents.drawnNumbers';
const drawnNumbers = loadDrawnNumbers();  // 抽選済みの番号（引いた順）
let isDrawing = false;

// ===== 画面要素 =====
const drawButton = document.getElementById('drawButton');
const result = document.getElementById('result');
const resultNum = document.getElementById('result_num');
const table = document.getElementById('selectedTable');
const remaining = document.getElementById('remaining');

// ===== 保存・復元 =====
function loadDrawnNumbers() {
    if (!SAVE_RESULTS) return [];
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
    } catch {
        return [];
    }
}

function saveDrawnNumbers() {
    if (!SAVE_RESULTS) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drawnNumbers));
    } catch {
        // 保存できない環境でも抽選自体は続けられるようにする
    }
}

function resetDraw() {
    if (isDrawing) return;
    drawnNumbers.length = 0;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {}
    result.textContent = '開始';
    resultNum.textContent = '';
    renderTable();
    renderRemaining();
}

// ===== 抽選 =====
// まだ引かれていない番号の一覧を返す
function getAvailableNumbers() {
    const excluded = new Set([...EXCLUDED_NUMBERS, ...drawnNumbers]);
    const numbers = [];
    for (let n = START_NUMBER; n <= END_NUMBER; n++) {
        if (!excluded.has(n)) numbers.push(n);
    }
    return numbers;
}

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function startDraw() {
    // 抽選中は受け付けない（同じ番号が2回出るのを防ぐ）
    if (isDrawing) return;

    const availableNumbers = getAvailableNumbers();

    // 残りがなければ演出なしで終了表示
    if (availableNumbers.length === 0) {
        showFinished();
        return;
    }

    isDrawing = true;
    drawButton.disabled = true;
    result.textContent = '';

    // 抽選中はランダムな番号を表示し続ける
    const intervalId = setInterval(() => {
        resultNum.textContent = pickRandom(availableNumbers);
    }, SHUFFLE_INTERVAL);

    setTimeout(() => {
        clearInterval(intervalId);

        const drawnNumber = pickRandom(availableNumbers);
        drawnNumbers.push(drawnNumber);
        saveDrawnNumbers();

        result.textContent = '選ばれた番号は:';
        resultNum.textContent = drawnNumber;
        renderTable();
        renderRemaining();

        isDrawing = false;
        drawButton.disabled = false;
    }, DRAW_DURATION);
}

// ===== 表示 =====
// 抽選済み一覧を描き直す
// 上から下へ MAX_ROW 個ずつ並べ、埋まったら右の列へ進む。最新の番号だけ強調する。
function renderTable() {
    table.innerHTML = '';
    drawnNumbers.forEach((number, i) => {
        const rowIndex = i % MAX_ROW;
        const row = table.rows[rowIndex] || table.insertRow(-1);
        const cell = row.insertCell(-1);
        cell.textContent = number;
        cell.className = (i === drawnNumbers.length - 1) ? 'last-child' : 'first-child';
    });
}

function renderRemaining() {
    remaining.textContent = `残り ${getAvailableNumbers().length} 人`;
}

function showFinished() {
    result.textContent = '終了';
    resultNum.textContent = '';
}

// ===== 操作 =====
drawButton.addEventListener('click', startDraw);

document.addEventListener('keydown', (e) => {
    // リセット：Shift + Backspace
    if (e.shiftKey && e.code === 'Backspace') {
        e.preventDefault();
        if (!isDrawing && confirm('抽選結果をすべて消去して最初からやり直しますか？')) {
            resetDraw();
        }
        return;
    }

    if (DRAW_KEYS.includes(e.code)) {
        // ボタンにフォーカスがあるときの二重実行や、ページのスクロールを防ぐ
        e.preventDefault();
        if (!e.repeat) startDraw();
    }
});

// ===== 初期表示 =====
remaining.hidden = !SHOW_REMAINING;
renderTable();
renderRemaining();
