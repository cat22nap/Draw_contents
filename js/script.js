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
// const DRAW_DURATION = 600;    // 抽選開始から確定までの時間（ミリ秒）
const DRAW_DURATION = 3500;    // 抽選開始から確定までの時間（ミリ秒）

// const SHOW_REMAINING = true;   // 残り人数を表示するなら true、隠すなら false
const SHOW_REMAINING = false;   // 残り人数を表示するなら true、隠すなら false

const SAVE_RESULTS = true;     // 抽選結果をブラウザに保存し、再読み込みしても復元するなら true

// 効果音（抽選中のドラムロールと、決まった瞬間の音）
const SOUND_ENABLED = true;    // 効果音を鳴らすなら true
// 音声ファイルのパス。空（''）にすると合成音を鳴らす
const DRUMROLL_FILE = 'src/sound/ドラムロール.mp3';  // 抽選中の音
const RESULT_FILE = 'src/sound/jaja.mp3';             // 決まった瞬間の音
// 音量（0〜1）
const DRUMROLL_VOLUME = 0.8;
const RESULT_VOLUME = 0.8;

// 番号が決まった瞬間に、数字を拡大するアニメーションを出すなら true
// （大きさや速さは styles.css の --reveal-... で調整）
const REVEAL_ANIMATION = true;

// 不在マーク：当選者がその場にいなかった番号に取り消し線を付ける
// ・ABSENT_KEY を押す → 直前に引いた番号に付ける（もう一度押すと外す）
// ・一覧の数字をクリック → その番号に付ける／外す（あとから変更したいとき用）
const ABSENT_MARK_ENABLED = true;
const ABSENT_KEY = 'KeyX';     // X キー

// マウスカーソルを自動で隠す（抽選中と、マウスを動かさずに一定時間たったとき）
const HIDE_CURSOR = true;
const CURSOR_HIDE_DELAY = 2000;  // マウスを止めてから隠すまでの時間（ミリ秒）

// 抽選を実行するキー（スペース・Enter・→・↓・PageDown）
// プレゼン用リモコンの「次へ」ボタンは、たいてい → か PageDown を送る
const DRAW_KEYS = ['Space', 'Enter', 'NumpadEnter', 'ArrowRight', 'ArrowDown', 'PageDown'];

// リセットのキー操作：Shift + Backspace（確認ダイアログが出る）
// 画面にはリセットボタンを置かない。開発者ツールのコンソールで resetDraw() と打ってもリセットできる

// ===== 状態 =====
const STORAGE_KEY = 'draw_contents.drawnNumbers';
const ABSENT_STORAGE_KEY = 'draw_contents.absentNumbers';
const drawnNumbers = loadList(STORAGE_KEY);               // 抽選済みの番号（引いた順）
const absentNumbers = new Set(loadList(ABSENT_STORAGE_KEY)); // 不在マークを付けた番号
let shownNumber = null;   // 大きく表示中の当選番号
let isDrawing = false;

const sound = createSoundPlayer({
    enabled: SOUND_ENABLED,
    drumrollFile: DRUMROLL_FILE,
    resultFile: RESULT_FILE,
    drumrollVolume: DRUMROLL_VOLUME,
    resultVolume: RESULT_VOLUME,
});

// ===== 画面要素 =====
const drawButton = document.getElementById('drawButton');
const result = document.getElementById('result');
const resultNum = document.getElementById('result_num');
const table = document.getElementById('selectedTable');
const remaining = document.getElementById('remaining');

// ===== 保存・復元 =====
function loadList(key) {
    if (!SAVE_RESULTS) return [];
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        return Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
    } catch {
        return [];
    }
}

function saveList(key, list) {
    if (!SAVE_RESULTS) return;
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch {
        // 保存できない環境でも抽選自体は続けられるようにする
    }
}

function saveAll() {
    saveList(STORAGE_KEY, drawnNumbers);
    saveList(ABSENT_STORAGE_KEY, [...absentNumbers]);
}

function resetDraw() {
    if (isDrawing) return;
    drawnNumbers.length = 0;
    absentNumbers.clear();
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ABSENT_STORAGE_KEY);
    } catch {}
    shownNumber = null;
    result.textContent = '開始';
    resultNum.textContent = '';
    resultNum.classList.remove('reveal');
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
    shownNumber = null;
    resultNum.classList.remove('reveal', 'absent');
    if (HIDE_CURSOR) hideCursor();
    sound.startDrumroll(DRAW_DURATION);

    // 抽選中はランダムな番号を表示し続ける
    const intervalId = setInterval(() => {
        resultNum.textContent = pickRandom(availableNumbers);
    }, SHUFFLE_INTERVAL);

    setTimeout(() => {
        clearInterval(intervalId);
        sound.stopDrumroll();
        sound.playResult();

        const drawnNumber = pickRandom(availableNumbers);
        drawnNumbers.push(drawnNumber);
        saveAll();

        result.textContent = '選ばれた番号は:';
        resultNum.textContent = drawnNumber;
        shownNumber = drawnNumber;
        if (REVEAL_ANIMATION) playReveal();
        renderTable();
        renderRemaining();

        isDrawing = false;
        drawButton.disabled = false;
    }, DRAW_DURATION);
}

// ===== 不在マーク =====
function toggleAbsent(number) {
    if (!ABSENT_MARK_ENABLED || isDrawing || !drawnNumbers.includes(number)) return;
    if (absentNumbers.has(number)) {
        absentNumbers.delete(number);
    } else {
        absentNumbers.add(number);
    }
    saveAll();
    renderTable();
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
        cell.dataset.number = number;
        cell.className = (i === drawnNumbers.length - 1) ? 'last-child' : 'first-child';
        if (absentNumbers.has(number)) cell.classList.add('absent');
    });
    // 大きく表示中の番号にも不在マークを反映する
    resultNum.classList.toggle('absent', shownNumber !== null && absentNumbers.has(shownNumber));
}

function renderRemaining() {
    remaining.textContent = `残り ${getAvailableNumbers().length} 人`;
}

function showFinished() {
    result.textContent = '終了';
    resultNum.textContent = '';
    shownNumber = null;
    resultNum.classList.remove('reveal', 'absent');
}

// 数字を拡大するアニメーションを最初から再生する
function playReveal() {
    resultNum.classList.remove('reveal');
    void resultNum.offsetWidth;  // アニメーションをリセットするためのおまじない
    resultNum.classList.add('reveal');
}

// ===== マウスカーソル =====
let cursorTimer = null;

function hideCursor() {
    clearTimeout(cursorTimer);
    document.documentElement.classList.add('hide-cursor');
}

function showCursorForAWhile() {
    document.documentElement.classList.remove('hide-cursor');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(hideCursor, CURSOR_HIDE_DELAY);
}

// ===== 操作 =====
drawButton.addEventListener('click', startDraw);

table.addEventListener('click', (e) => {
    const cell = e.target.closest('td');
    if (cell) toggleAbsent(Number(cell.dataset.number));
});

document.addEventListener('keydown', (e) => {
    // リセット：Shift + Backspace
    if (e.shiftKey && e.code === 'Backspace') {
        e.preventDefault();
        if (!isDrawing && confirm('抽選結果をすべて消去して最初からやり直しますか？')) {
            resetDraw();
        }
        return;
    }

    // 不在マーク：直前に引いた番号
    if (e.code === ABSENT_KEY && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!e.repeat && drawnNumbers.length > 0) {
            toggleAbsent(drawnNumbers[drawnNumbers.length - 1]);
        }
        return;
    }

    if (DRAW_KEYS.includes(e.code)) {
        // ボタンにフォーカスがあるときの二重実行や、ページのスクロールを防ぐ
        e.preventDefault();
        if (!e.repeat) startDraw();
    }
});

if (HIDE_CURSOR) {
    document.addEventListener('mousemove', showCursorForAWhile);
    showCursorForAWhile();
}

// ===== 初期表示 =====
remaining.hidden = !SHOW_REMAINING;
table.classList.toggle('absent-enabled', ABSENT_MARK_ENABLED);
renderTable();
renderRemaining();
