// 効果音（ドラムロールと、番号が決まった瞬間の音）
//
// 音声ファイルを指定しなければ、ブラウザ内で音を合成して鳴らす。
// ファイルを指定した場合はそのファイルを再生する（例：'sounds/drumroll.mp3'）。

function createSoundPlayer({ enabled, drumrollFile, resultFile, drumrollVolume, resultVolume }) {
    let ctx = null;
    let master = null;
    let resultBus = null;      // 合成の決定音の音量ノード
    let noiseBuffer = null;
    let drumrollGain = null;   // 合成ドラムロールを途中で止めるための音量ノード
    let drumrollAudio = null;  // ファイル版ドラムロール
    let resultAudio = null;    // ファイル版の決定音

    if (enabled && drumrollFile) {
        drumrollAudio = new Audio(drumrollFile);
        drumrollAudio.loop = true;  // 抽選時間より短いファイルでも途切れないように
        drumrollAudio.volume = drumrollVolume;
    }
    if (enabled && resultFile) {
        resultAudio = new Audio(resultFile);
        resultAudio.volume = resultVolume;
    }

    // ブラウザは「クリックやキー操作のあと」でないと音を鳴らせないため、
    // 最初の抽選時に初めて準備する
    function ensureContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.connect(ctx.destination);

            resultBus = ctx.createGain();
            resultBus.gain.value = resultVolume;
            resultBus.connect(master);

            // ホワイトノイズ（スネアやシンバルの材料）
            noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function playNoise(dest, time, duration) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.connect(dest);
        src.start(time, Math.random() * 1.5, duration);
    }

    // 減衰する音量エンベロープを持つゲインノードを作る
    function envelope(time, peak, decay, dest) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(peak, time + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
        g.connect(dest);
        return g;
    }

    // ===== ドラムロール（合成）=====
    // スネアを細かく連打し、だんだん大きくする
    function synthDrumroll(durationMs) {
        ensureContext();
        const start = ctx.currentTime + 0.02;
        const duration = durationMs / 1000;
        const hitsPerSecond = 24;

        drumrollGain = ctx.createGain();
        drumrollGain.gain.value = drumrollVolume;
        drumrollGain.connect(master);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        filter.connect(drumrollGain);

        for (let t = 0; t < duration; t += 1 / hitsPerSecond) {
            const progress = t / duration;                       // 0 → 1
            const peak = (0.15 + 0.55 * progress) * (0.85 + Math.random() * 0.3);
            const time = start + t;

            // 皮の「シャッ」
            playNoise(envelope(time, peak, 0.07, filter), time, 0.08);

            // 胴の「トッ」
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, time);
            osc.connect(envelope(time, peak * 0.4, 0.05, drumrollGain));
            osc.start(time);
            osc.stop(time + 0.06);
        }
    }

    // ===== 決定音（合成）=====
    // 「ドン！」＋シンバル＋明るい和音の「ジャーン」
    function synthResult() {
        ensureContext();
        const time = ctx.currentTime + 0.01;

        // ドン（低音のキック）
        const kick = ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, time);
        kick.frequency.exponentialRampToValueAtTime(45, time + 0.3);
        kick.connect(envelope(time, 0.9, 0.4, resultBus));
        kick.start(time);
        kick.stop(time + 0.45);

        // シンバル
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 5000;
        hp.connect(envelope(time, 0.5, 2.0, resultBus));
        playNoise(hp, time, 2.0);

        // ジャーン（ド・ミ・ソ・ド）
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3500;
        lp.connect(envelope(time, 0.5, 1.6, resultBus));
        [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.value = 0.18;
            osc.connect(g).connect(lp);
            osc.start(time);
            osc.stop(time + 1.7);
        });
    }

    // ===== 外から呼ぶ関数 =====
    return {
        startDrumroll(durationMs) {
            if (!enabled) return;
            if (drumrollAudio) {
                drumrollAudio.currentTime = 0;
                drumrollAudio.play().catch(() => {});
            } else {
                synthDrumroll(durationMs);
            }
        },

        stopDrumroll() {
            if (drumrollAudio) {
                drumrollAudio.pause();
            }
            if (drumrollGain) {
                drumrollGain.gain.setValueAtTime(0, ctx.currentTime);
                drumrollGain = null;
            }
        },

        playResult() {
            if (!enabled) return;
            if (resultAudio) {
                resultAudio.currentTime = 0;
                resultAudio.play().catch(() => {});
            } else {
                synthResult();
            }
        },
    };
}
