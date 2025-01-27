// 開始番号と終了番号をJavaScriptの変数で設定
let startNumber = 1;  // 開始番号
let endNumber = 10;   // 終了番号

// 除外する番号もJavaScriptの変数で設定
const excludedNumbers = [3, 7];  // 除外する番号を設定




// くじ引きボタンのクリックイベントを設定
document.getElementById('drawButton').addEventListener('click', function() {
    // 開始番号と終了番号が正しいかチェック
    if (startNumber > endNumber) {
        document.getElementById('result').textContent = '開始番号は終了番号より小さい必要があります。';
        return;
    }

    // 指定された範囲の番号を配列に格納
    const allNumbers = Array.from({ length: endNumber - startNumber + 1 }, (_, i) => startNumber + i);

    // 除外する番号を取り除く
    const availableNumbers = allNumbers.filter(num => !excludedNumbers.includes(num));

    const resultElement = document.getElementById('result')
    const resultNumElement = document.getElementById('result_num');
    const selectedListElement = document.getElementById('selectedList');

    resultElement.textContent = '';

    // くじ引きボタンがクリックされた時の動作
    let intervalId = setInterval(() => {
    // ランダムな番号を表示
    resultNumElement.textContent = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
}, 100); // 0.1秒ごとにランダムな番号を表示



// 4秒後に最終的な番号を確定
setTimeout(() => {
    clearInterval(intervalId); // ランダム表示を停止

    // 最終的に選ばれた番号を決める
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const drawnNumber = availableNumbers[randomIndex];

    // 結果を表示
    resultElement.textContent = '選ばれた番号は:';
    resultNumElement.textContent = drawnNumber;

    // 選ばれた番号を除外リストに追加して再選択できないようにする
    excludedNumbers.push(drawnNumber);

    // 選ばれた番号を左側のリストに追加
    const listItem = document.createElement('li');
    listItem.textContent = drawnNumber;
    selectedListElement.appendChild(listItem);

}, 3500); // 4秒後に確定
});