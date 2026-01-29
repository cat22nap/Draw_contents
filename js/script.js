// 開始番号と終了番号をJavaScriptの変数で設定
let startNumber = 1;  // 開始番号
let endNumber = 53;   // 終了番号

// 除外する番号もJavaScriptの変数で設定
const excludedNumbers = [47, 1, 45, 7, 39, 22, 12];  // 除外する番号を設定（空の配列）

max_row = 10; // 縦に並べる数字の個数

push_col_num = 0;
push_row_num = 0;

// くじ引きボタンのクリックイベントを設定
document.getElementById('drawButton').addEventListener('click', function() {
    // 指定された範囲の番号を配列に格納
    const allNumbers = Array.from(
        { length: endNumber - startNumber + 1 }, (_, i) => startNumber + i);

    // 除外する番号を取り除く
    const availableNumbers = allNumbers.filter(num => !excludedNumbers.includes(num));

    const result = document.getElementById('result')
    const resultNum = document.getElementById('result_num');
    const Table = document.getElementById('selectedTable');

    result.textContent = '';

    // くじ引きボタンがクリックされた時の動作
    let intervalId = setInterval(() => {
        // ランダムな番号を表示
        resultNum.textContent = availableNumbers[
            Math.floor(Math.random() * availableNumbers.length)];
    }, 100); // 0.1秒ごとにランダムな番号を表示



    setTimeout(() => {
        clearInterval(intervalId); // ランダム表示を停止

        if(availableNumbers.length == 0){
            result.textContent = '終了';
            resultNum.textContent = '';
        }else{
            
            // 最終的に選ばれる番号を決める
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const drawnNumber = availableNumbers[randomIndex];
            // console.log(drawnNumber)
            // 結果を表示
            result.textContent = '選ばれた番号は:';
            resultNum.textContent = drawnNumber;
    
            // 選ばれた番号を除外リストに追加して再選択できないようにする
            excludedNumbers.push(drawnNumber);
            

            console.log('col_num',push_col_num)
            console.log('row_num',push_row_num)
            if (push_row_num != 0){
                Table.rows[push_row_num-1].cells[push_col_num].classList.replace('last-child', 'first-child')
            }else if ((push_col_num != 0)){
                Table.rows[max_row-1].cells[push_col_num-1].classList.replace('last-child', 'first-child')
            }

            if(push_col_num == 0){
                const row = Table.insertRow(-1);
                const cell = row.insertCell(0);
                cell.textContent = drawnNumber;
                cell.className = 'last-child';
            }else{
                const row = Table.rows[push_row_num];
                const cell = row.insertCell(-1);
                cell.textContent = drawnNumber;
                cell.className = 'last-child';
            }

            if (((push_row_num+1) == max_row) & ((push_row_num+1) % max_row == 0)){
                push_row_num = 0;
                push_col_num += 1;
            }else{
                push_row_num += 1;
            }
        }
    }, 3500); // 4秒後に確定
    // }, 100); // 4秒後に確定
});
