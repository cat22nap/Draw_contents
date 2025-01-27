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

    // くじ引き
    if (availableNumbers.length === 0) {
        document.getElementById('result').textContent = '終了';
        document.getElementById('result_num').textContent = '';
    } else {
        // ランダムに1つ選ぶ
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];

        // 結果を表示
        document.getElementById('result').textContent = `選ばれた番号は:`;
        document.getElementById('result_num').textContent = ` ${drawnNumber}`;

        // 選ばれた番号を除外リストに追加して再選択できないようにする
        excludedNumbers.push(drawnNumber);
    }
});
