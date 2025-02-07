// 開始番号と終了番号をJavaScriptの変数で設定
let startNumber = 1;  // 開始番号
let endNumber = 20;   // 終了番号

// 除外する番号もJavaScriptの変数で設定
const excludedNumbers = [];  // 除外する番号を設定（空の配列）

max_row = 5; // 縦に並べる数字の個数


// くじ引きボタンのクリックイベントを設定
document.getElementById('drawButton').addEventListener('click', function() {
    // 指定された範囲の番号を配列に格納
    const allNumbers = Array.from({ length: endNumber - startNumber + 1 }, (_, i) => startNumber + i);

    // 除外する番号を取り除く
    const availableNumbers = allNumbers.filter(num => !excludedNumbers.includes(num));

    const resultElement = document.getElementById('result')
    const resultNumElement = document.getElementById('result_num');
    const selectedTableBody = document.getElementById('selectedTable');

    resultElement.textContent = '';

    // くじ引きボタンがクリックされた時の動作
    let intervalId = setInterval(() => {
        // ランダムな番号を表示
        resultNumElement.textContent = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    }, 100); // 0.1秒ごとにランダムな番号を表示



    setTimeout(() => {
        clearInterval(intervalId); // ランダム表示を停止

        if(availableNumbers.length == 0){
            resultElement.textContent = '終了';
            resultNumElement.textContent = '';
        }else{

            // 最終的に選ばれる番号を決める
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const drawnNumber = availableNumbers[randomIndex];
            // console.log(drawnNumber)
            // 結果を表示
            resultElement.textContent = '選ばれた番号は:';
            resultNumElement.textContent = drawnNumber;
    
            // 選ばれた番号を除外リストに追加して再選択できないようにする
            excludedNumbers.push(drawnNumber);
    
            // 選ばれた番号をテーブルに追加
            const row = selectedTableBody.insertRow(-1);
            const cell = row.insertCell(0);
            cell.textContent = drawnNumber;
    
            const rows = selectedTableBody.rows;

            console.log('row', row)
            console.log('rows_length', rows.length)
            
            // if (rows.length / max_row == 0) {
                
        }
    // }, 3500); // 4秒後に確定
    }, 100); // 4秒後に確定
});
