/**
 * src/animations.js
 * Weather scene builders and full-screen background animations.
 * These functions write to DOM elements but do NOT own them —
 * they receive the elements or IDs as arguments.
 */

// ── Condition code groups ──────────────────────────────────────────────────

const CODES = {
    rain:    [1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246,
              1069,1072,1168,1171,1198,1201,1204,1207,1237,1249,1252,1261,1264],
    snow:    [1066,1114,1117,1210,1213,1216,1219,1222,1225,1255,1258],
    thunder: [1087,1273,1276,1279,1282],
    mist:    [1030,1135,1147],
    cloudy:  [1003,1006,1009],
};

// ── Public: scene-card illustration ───────────────────────────────────────

/**
 * Build a cinematic animated scene inside the scene-stage div.
 * @param {number}  code  - WeatherAPI condition code
 * @param {number}  isDay - 1 (day) or 0 (night)
 * @param {Element} stageEl   - .scene-stage element
 * @param {Element} contentEl - inner target (#scene-content)
 */
export function setWeatherIllustration(code, isDay, stageEl, contentEl) {
    stageEl.className = 'scene-stage'; // reset sky class

    if (code === 1000) {
        if (isDay) {
            stageEl.classList.add('scene-sunny-day');
            contentEl.innerHTML = buildSceneSunny();
        } else {
            stageEl.classList.add('scene-clear-night');
            contentEl.innerHTML = buildSceneNight();
        }
    } else if (CODES.cloudy.includes(code)) {
        stageEl.classList.add(isDay ? 'scene-cloudy-day' : 'scene-cloudy-night');
        contentEl.innerHTML = buildSceneCloudy(isDay);
    } else if (CODES.rain.includes(code)) {
        stageEl.classList.add(isDay ? 'scene-rain-day' : 'scene-rain-night');
        contentEl.innerHTML = buildSceneRain(isDay);
    } else if (CODES.snow.includes(code)) {
        stageEl.classList.add(isDay ? 'scene-snow-day' : 'scene-snow-night');
        contentEl.innerHTML = buildSceneSnow(isDay);
    } else if (CODES.thunder.includes(code)) {
        stageEl.classList.add(isDay ? 'scene-thunder-day' : 'scene-thunder-night');
        contentEl.innerHTML = buildSceneThunder(isDay);
    } else if (CODES.mist.includes(code)) {
        stageEl.classList.add(isDay ? 'scene-mist-day' : 'scene-mist-night');
        contentEl.innerHTML = buildSceneMist(isDay);
    } else {
        stageEl.classList.add(isDay ? 'scene-cloudy-day' : 'scene-cloudy-night');
        contentEl.innerHTML = buildSceneCloudy(isDay);
    }
}

// ── Public: full-screen background layer ──────────────────────────────────

/**
 * Update the full-screen background animations based on weather code.
 * @param {number}  code
 * @param {number}  isDay
 * @param {Element} bgEl - #bg-animations element
 */
export function setBackgroundAnimation(code, isDay, bgEl) {
    bgEl.innerHTML       = '';
    document.body.className = '';

    if (code === 1000) {
        document.body.classList.add(isDay ? 'weather-clear-day' : 'weather-clear-night');
        if (isDay) {
            bgEl.innerHTML = `<div class="bg-bird"></div>`;
        } else {
            let html = `<div class="bg-moon"></div>`;
            for (let i = 0; i < 40; i++) {
                const left       = Math.random() * 120 - 10;
                const top        = Math.random() * 80;
                const size       = 1 + Math.random() * 2;
                const delay      = Math.random() * 5;
                const durDrift   = 80 + Math.random() * 60;
                const durTwinkle = 2 + Math.random() * 3;
                html += `<div class="bg-star-wrap" style="left:${left}vw;top:${top}vh;animation-duration:${durDrift}s;">` +
                        `<div class="bg-star" style="width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${durTwinkle}s;"></div></div>`;
            }
            bgEl.innerHTML = html;
        }

    } else if (CODES.cloudy.includes(code)) {
        document.body.classList.add(isDay ? 'weather-cloudy-day' : 'weather-cloudy-night');
        bgEl.innerHTML = `
            <div class="bg-cloud bg-cloud--1"></div>
            <div class="bg-cloud bg-cloud--2"></div>
            <div class="bg-cloud bg-cloud--3"></div>`;

    } else if (CODES.rain.includes(code)) {
        document.body.classList.add(isDay ? 'weather-rain-day' : 'weather-rain-night');
        let html = '';
        for (let i = 0; i < 40; i++) {
            const left     = Math.random() * 100;
            const delay    = Math.random() * 1.5;
            const duration = 0.5 + Math.random() * 0.5;
            html += `<div class="bg-drop" style="left:${left}vw;animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
        }
        bgEl.innerHTML = html;

    } else if (CODES.snow.includes(code)) {
        document.body.classList.add(isDay ? 'weather-snow-day' : 'weather-snow-night');
        let html = '';
        for (let i = 0; i < 40; i++) {
            const left     = Math.random() * 100;
            const delay    = Math.random() * 5;
            const duration = 3 + Math.random() * 5;
            const size     = 3 + Math.random() * 6;
            html += `<div class="bg-flake" style="left:${left}vw;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
        }
        bgEl.innerHTML = html;

    } else if (CODES.thunder.includes(code)) {
        document.body.classList.add(isDay ? 'weather-thunder-day' : 'weather-thunder-night');
        let html = `<div class="bg-flash"></div>`;
        for (let i = 0; i < 50; i++) {
            const left     = Math.random() * 100;
            const delay    = Math.random() * 1.5;
            const duration = 0.4 + Math.random() * 0.3;
            html += `<div class="bg-drop" style="left:${left}vw;animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
        }
        bgEl.innerHTML = html;

    } else if (CODES.mist.includes(code)) {
        document.body.classList.add(isDay ? 'weather-cloudy-day' : 'weather-cloudy-night');
        bgEl.innerHTML = `
            <div class="bg-cloud bg-cloud--1" style="top:auto;bottom:0;opacity:0.3;background:linear-gradient(transparent,#fff);"></div>
            <div class="bg-cloud bg-cloud--3" style="top:auto;bottom:10%;opacity:0.2;"></div>`;

    } else {
        document.body.classList.add(isDay ? 'weather-cloudy-day' : 'weather-cloudy-night');
    }
}

// ── Scene builders ─────────────────────────────────────────────────────────

function buildSceneSunny() {
    return `
        <div class="scene-sun-wrap">
            <div class="scene-sun-rays"></div>
            <div class="scene-sun"></div>
        </div>
        <div class="scene-cloud scene-cloud--1" style="opacity:.35;"></div>
        <div class="scene-cloud scene-cloud--3" style="opacity:.2;"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:90px;
            background:linear-gradient(to top,rgba(255,165,0,.35),transparent);"></div>
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(15,90,30,.85),rgba(15,90,30,.4),transparent);"></div>`;
}

function buildSceneNight() {
    let stars = '';
    for (let i = 0; i < 60; i++) {
        const s   = 1.5 + Math.random() * 2.5;
        const l   = Math.random() * 98;
        const t   = Math.random() * 80;
        const del = Math.random() * 4;
        const dur = 1.5 + Math.random() * 3;
        stars += `<div class="scene-star" style="width:${s}px;height:${s}px;left:${l}%;top:${t}%;animation-delay:${del}s;animation-duration:${dur}s;"></div>`;
    }
    return `
        ${stars}
        <div class="scene-moon"></div>
        <div style="position:absolute;bottom:60px;left:0;right:0;height:60px;
            background:linear-gradient(to top,rgba(0,100,80,.15),transparent);
            animation:sceneMistDrift 6s ease-in-out infinite alternate;"></div>
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(5,15,30,.95),rgba(5,15,30,.6),transparent);"></div>`;
}

function buildSceneCloudy(isDay) {
    const sunOrMoon = isDay
        ? `<div class="scene-sun" style="width:60px;height:60px;top:20px;left:40px;opacity:.7;"></div>`
        : `<div class="scene-moon" style="width:55px;height:55px;top:20px;right:60px;opacity:.7;"></div>`;
    return `
        ${sunOrMoon}
        <div class="scene-cloud scene-cloud--1"></div>
        <div class="scene-cloud scene-cloud--2"></div>
        <div class="scene-cloud scene-cloud--3"></div>
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(20,35,55,.8),rgba(20,35,55,.4),transparent);"></div>`;
}

function buildSceneRain(isDay) {
    let drops = '';
    for (let i = 0; i < 60; i++) {
        const l       = Math.random() * 100;
        const h       = 15 + Math.random() * 30;
        const delay   = Math.random() * 1.5;
        const dur     = 0.5 + Math.random() * 0.5;
        const opacity = 0.4 + Math.random() * 0.5;
        drops += `<div class="scene-drop" style="left:${l}%;height:${h}px;top:-${h}px;animation-delay:${delay}s;animation-duration:${dur}s;opacity:${opacity};"></div>`;
    }
    return `
        <div class="scene-cloud scene-cloud--1 scene-cloud--dark" style="width:200px;height:65px;top:10px;"></div>
        <div class="scene-cloud scene-cloud--2 scene-cloud--dark" style="top:20px;"></div>
        <div class="scene-cloud scene-cloud--3 scene-cloud--dark" style="width:140px;"></div>
        ${drops}
        <div style="position:absolute;bottom:0;left:0;right:0;height:8px;
            background:rgba(100,160,220,.3);animation:sceneMistDrift 1s ease-in-out infinite alternate;"></div>
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(20,35,55,.95),rgba(20,35,55,.5),transparent);"></div>`;
}

function buildSceneSnow(isDay) {
    let flakes = '';
    for (let i = 0; i < 50; i++) {
        const l       = Math.random() * 100;
        const s       = 3 + Math.random() * 6;
        const delay   = Math.random() * 4;
        const dur     = 3 + Math.random() * 4;
        const opacity = 0.6 + Math.random() * 0.4;
        flakes += `<div class="scene-flake" style="left:${l}%;width:${s}px;height:${s}px;animation-delay:${delay}s;animation-duration:${dur}s;opacity:${opacity};"></div>`;
    }
    const cloudColor = isDay ? '' : 'scene-cloud--dark';
    return `
        <div class="scene-cloud scene-cloud--1 ${cloudColor}"></div>
        <div class="scene-cloud scene-cloud--2 ${cloudColor}"></div>
        ${flakes}
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(240,245,255,.85),rgba(180,210,230,.4),transparent);"></div>`;
}

function buildSceneThunder(isDay) {
    let drops = '';
    for (let i = 0; i < 70; i++) {
        const l     = Math.random() * 100;
        const h     = 15 + Math.random() * 30;
        const delay = Math.random() * 1.5;
        const dur   = 0.3 + Math.random() * 0.3;
        drops += `<div class="scene-drop" style="left:${l}%;height:${h}px;top:-${h}px;animation-delay:${delay}s;animation-duration:${dur}s;"></div>`;
    }
    return `
        <div class="scene-cloud scene-cloud--1 scene-cloud--dark" style="width:220px;height:70px;top:5px;"></div>
        <div class="scene-cloud scene-cloud--2 scene-cloud--dark" style="top:15px;right:-10px;"></div>
        <div class="scene-cloud scene-cloud--3 scene-cloud--dark" style="width:150px;top:50px;"></div>
        <div class="scene-lightning">
            <svg viewBox="0 0 18 60" width="18" height="60" fill="rgba(255,240,100,.95)">
                <polygon points="12,0 0,28 9,28 5,60 18,22 9,22"/>
            </svg>
        </div>
        <div style="position:absolute;inset:0;background:rgba(255,240,80,.06);
            animation:sceneLightning 3s ease-in-out infinite;"></div>
        ${drops}
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(5,5,15,.98),rgba(5,5,15,.6),transparent);"></div>`;
}

function buildSceneMist(isDay) {
    return `
        <div class="scene-mist" style="height:80px;bottom:20px;animation-duration:5s;"></div>
        <div class="scene-mist" style="height:60px;bottom:50px;animation-duration:7s;animation-delay:.5s;"></div>
        <div class="scene-mist" style="height:70px;bottom:90px;animation-duration:9s;animation-delay:1s;opacity:.6;"></div>
        <div class="scene-mist" style="height:50px;bottom:130px;animation-duration:11s;opacity:.4;"></div>
        <div class="scene-ground" style=
            "background:linear-gradient(to top,rgba(150,175,190,.3),transparent);"></div>`;
}
