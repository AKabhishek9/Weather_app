/**
 * src/ui.js
 * All DOM rendering: current weather, forecast, hourly, suggestions,
 * AQI badges, sun arc, wind compass, toast, and loading state.
 *
 * DOM elements are read once at module load and cached as module-level vars.
 * This module imports from state + animations; it never imports from api.js
 * (keeping the dependency graph clean).
 */

import { fmtTemp, fmtTempOnly, setLastWeatherData } from './state.js';
import { setWeatherIllustration, setBackgroundAnimation } from './animations.js';
import { formatDate } from './utils.js';

// ── DOM element cache ──────────────────────────────────────────────────────

const bgAnimations       = document.getElementById('bg-animations');
const weatherSection     = document.getElementById('weather-section');
const hourlyDailySection = document.getElementById('hourly-daily-section');
const hourlyScroll       = document.getElementById('hourly-scroll');

// Current weather card
const weatherCity        = document.getElementById('weather-city');
const weatherDate        = document.getElementById('weather-date');
const weatherTemp        = document.getElementById('weather-temp');
const weatherCondition   = document.getElementById('weather-condition');
const weatherFeels       = document.getElementById('weather-feels');
const weatherIllustration = document.getElementById('weather-illustration');

// Detail grid widgets
const widgetAqiIndex     = document.getElementById('widget-aqi-index');
const widgetPm25         = document.getElementById('widget-pm25');
const widgetPm10         = document.getElementById('widget-pm10');
const widgetSunrise      = document.getElementById('widget-sunrise');
const widgetSunset       = document.getElementById('widget-sunset');
const widgetMoonPhase    = document.getElementById('widget-moon-phase');
const widgetWindVal      = document.getElementById('widget-wind-val');
const widgetWindDir      = document.getElementById('widget-wind-dir');
const widgetWindGust     = document.getElementById('widget-wind-gust');
const widgetHumidity     = document.getElementById('widget-humidity');
const widgetDewpoint     = document.getElementById('widget-dewpoint');
const widgetVisibility   = document.getElementById('widget-visibility');
const widgetPressure     = document.getElementById('widget-pressure');
const widgetUv           = document.getElementById('widget-uv');
const widgetCloud        = document.getElementById('widget-cloud');
const widgetPrecip       = document.getElementById('widget-precip');
const widgetRainChance   = document.getElementById('widget-rain-chance');

// Forecast + toast + loader
const forecastGrid       = document.getElementById('forecast-grid');
const toastEl            = document.getElementById('toast');
const loaderWrap         = document.getElementById('loader-wrap');

// Hourly / daily tab elements
export const hdTabHourly  = document.getElementById('hd-tab-hourly');
export const hdTabDaily   = document.getElementById('hd-tab-daily');
export const hdPanelHourly = document.getElementById('hd-panel-hourly');
export const hdPanelDaily  = document.getElementById('hd-panel-daily');

// Search autocomplete
export const suggestionsDropdown = document.getElementById('suggestions-dropdown');

// ── Current weather card ───────────────────────────────────────────────────

/**
 * Populate the current-weather card and detail grid.
 * Also triggers scene illustration + background update.
 * @param {object} data - full WeatherAPI response
 */
export function renderCurrentWeather(data) {
    const { location, current } = data;

    // Persist for unit-toggle re-renders
    setLastWeatherData(data);

    // City & timestamp
    weatherCity.textContent = `${location.name}, ${location.country}`;
    weatherDate.textContent = formatDate(location.localtime);

    // Primary temps
    weatherTemp.textContent      = fmtTemp(current.temp_c);
    weatherCondition.textContent = current.condition.text;
    weatherFeels.textContent     = `Feels like ${fmtTemp(current.feelslike_c)}`;

    // Quick-stats overlay (always °C unit, no conversion needed for wind/UV)
    const humQ  = document.getElementById('weather-humidity-q');
    const windQ = document.getElementById('weather-wind-q');
    const uvQ   = document.getElementById('weather-uv-q');
    if (humQ)  humQ.textContent  = `${current.humidity}%`;
    if (windQ) windQ.textContent = `${current.wind_kph} km/h`;
    if (uvQ)   uvQ.textContent   = `UV ${current.uv}`;

    // ── Detail grid ──────────────────────────────────────────────────────

    // 1. Air Quality
    const epaMap   = { 1:'Good', 2:'Moderate', 3:'Sensitive', 4:'Unhealthy', 5:'Very Unhealthy', 6:'Hazardous' };
    const aqi      = current.air_quality || {};
    const epaIndex = aqi['us-epa-index'] || 0;

    if (widgetAqiIndex) {
        const label = epaMap[epaIndex] || (epaIndex || '--');
        widgetAqiIndex.innerHTML = renderAqiBadge(label, epaIndex);
        const card = widgetAqiIndex.closest('[data-aqi]') || widgetAqiIndex.parentElement;
        if (card) card.dataset.aqi = epaIndex;
    }
    if (widgetPm25) widgetPm25.textContent = aqi.pm2_5 ? Math.round(aqi.pm2_5) : '--';
    if (widgetPm10) widgetPm10.textContent = aqi.pm10  ? Math.round(aqi.pm10)  : '--';

    // 2. Sun & Moon
    const astro = data.forecast.forecastday[0].astro;
    if (widgetSunrise)  widgetSunrise.innerHTML  = renderSunArc(astro, location.localtime);
    if (widgetSunset)   widgetSunset.textContent  = `Sunset: ${astro.sunset}`;
    if (widgetMoonPhase) widgetMoonPhase.textContent = `Phase: ${astro.moon_phase}`;

    // 3. Wind
    if (widgetWindVal)  widgetWindVal.innerHTML   = renderCompass(current.wind_degree, current.wind_dir, current.wind_kph, current.gust_kph);
    if (widgetWindDir)  widgetWindDir.textContent  = `Direction: ${current.wind_dir}`;
    if (widgetWindGust) widgetWindGust.textContent = current.gust_kph;

    // 4. Moisture
    if (widgetHumidity)   widgetHumidity.textContent   = `${current.humidity}%`;
    if (widgetDewpoint)   widgetDewpoint.textContent   = fmtTemp(current.dewpoint_c);
    if (widgetVisibility) widgetVisibility.textContent = current.vis_km;

    // 5. Atmosphere
    if (widgetPressure) widgetPressure.textContent = current.pressure_mb;
    if (widgetUv)       widgetUv.textContent       = current.uv;
    if (widgetCloud)    widgetCloud.textContent    = `${current.cloud}%`;

    // 6. Precipitation
    if (widgetPrecip)     widgetPrecip.textContent     = current.precip_mm;
    const todayDay = data.forecast.forecastday[0].day;
    if (widgetRainChance) widgetRainChance.textContent =
        `${Math.max(todayDay.daily_chance_of_rain, todayDay.daily_chance_of_snow)}%`;

    // ── Animations ───────────────────────────────────────────────────────
    const stageEl   = weatherIllustration;
    const contentEl = document.getElementById('scene-content');
    setWeatherIllustration(current.condition.code, current.is_day, stageEl, contentEl);
    setBackgroundAnimation(current.condition.code, current.is_day, bgAnimations);

    // ── Reveal + focus ──────────────────────────────────────────────────────
    weatherSection.hidden = false;
    weatherSection.style.animation = 'none';
    void weatherSection.offsetWidth; // force reflow
    weatherSection.style.animation = 'fadeSlideUp .5s ease';
}

/**
 * Move keyboard + screen-reader focus to the weather results section.
 * Called by script.js after a successful API fetch so keyboard users
 * don't have to manually navigate past the search bar.
 */
export function focusWeatherSection() {
    if (!weatherSection.hidden) weatherSection.focus();
}

// ── Forecast cards ─────────────────────────────────────────────────────────

/**
 * Render the 5-day forecast cards (skips today).
 * @param {object[]} days - forecastday array from API
 */
export function renderForecast(days) {
    forecastGrid.innerHTML = '';
    const upcoming = days.slice(1, 6);

    upcoming.forEach(day => {
        const card = document.createElement('div');
        card.className = 'forecast-card glass-card';

        const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        const hi      = fmtTempOnly(day.day.maxtemp_c);
        const lo      = fmtTempOnly(day.day.mintemp_c);
        const cond    = day.day.condition;

        card.innerHTML = `
            <p class="forecast-card__day">${dayName}</p>
            <img class="forecast-card__icon" src="https:${cond.icon}" alt="${cond.text}">
            <p class="forecast-card__temp">${hi} <span>/ ${lo}</span></p>
            <p class="forecast-card__cond">${cond.text}</p>`;

        forecastGrid.appendChild(card);
    });

    hourlyDailySection.hidden = false;
    hourlyDailySection.style.animation = 'none';
    void hourlyDailySection.offsetWidth;
    hourlyDailySection.style.animation = 'fadeSlideUp .55s ease';
}

// ── Hourly scroll ──────────────────────────────────────────────────────────

/**
 * Render the next 24 hours of hourly forecast data.
 * @param {object[]} forecastDays - Array of forecastday objects
 * @param {string}   localtime   - The location's local time, e.g. "2026-03-15 19:30"
 */
export function renderHourly(forecastDays, localtime) {
    hourlyScroll.innerHTML = '';

    const now         = new Date(localtime.replace(' ', 'T'));
    let   allHours    = [];
    forecastDays.forEach(day => {
        if (day.hour) allHours = allHours.concat(day.hour);
    });

    const futureHours = allHours
        .filter(h => new Date(h.time.replace(' ', 'T')) >= now)
        .slice(0, 24);

    if (futureHours.length === 0) return;

    futureHours.forEach((h, idx) => {
        const hTime     = new Date(h.time.replace(' ', 'T'));
        const timeLabel = idx === 0
            ? 'Now'
            : hTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        const rainPct  = h.chance_of_rain || 0;
        const snowPct  = h.chance_of_snow || 0;
        const precipMm = h.precip_mm      || 0;
        const willRain = h.will_it_rain   === 1;
        const willSnow = h.will_it_snow   === 1;

        let rainLabel, rainDim;
        if      (rainPct > 0)              { rainLabel = `${rainPct}%`;    rainDim = false; }
        else if (snowPct > 0)              { rainLabel = `${snowPct}%`;    rainDim = false; }
        else if (willRain && precipMm > 0) { rainLabel = `${precipMm}mm`; rainDim = false; }
        else if (willSnow && precipMm > 0) { rainLabel = `${precipMm}mm`; rainDim = false; }
        else if (precipMm > 0)             { rainLabel = `${precipMm}mm`; rainDim = false; }
        else                               { rainLabel = '0%';            rainDim = true;  }

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.setAttribute('role', 'group');
        item.setAttribute('aria-label', `${timeLabel}: ${fmtTempOnly(h.temp_c)}, ${h.condition.text}, precipitation ${rainLabel}`);
        item.innerHTML = `
            <span class="hourly-item__time" aria-hidden="true">${timeLabel}</span>
            <img class="hourly-item__icon" src="https:${h.condition.icon}" alt="${h.condition.text}">
            <span class="hourly-item__temp" aria-hidden="true">${fmtTempOnly(h.temp_c)}</span>
            <div class="hourly-item__rain" style="${rainDim ? 'opacity:0.35' : ''}" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                </svg>
                ${rainLabel}
            </div>`;

        hourlyScroll.appendChild(item);
    });
}

// ── Autocomplete suggestions ───────────────────────────────────────────────

/** Tracks the currently highlighted suggestion index */
export let activeSuggestionIdx = -1;

/**
 * Set the active suggestion index (called by script.js keyboard handler).
 * @param {number} idx
 */
export function setActiveSuggestionIdx(idx) {
    activeSuggestionIdx = idx;
}

/**
 * Highlight the suggestion at activeSuggestionIdx.
 * @param {NodeList|Array} items
 */
export function highlightSuggestion(items) {
    const input = document.getElementById('city-input');
    items.forEach((el, i) => {
        const isActive = i === activeSuggestionIdx;
        el.classList.toggle('active', isActive);
        el.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (items[activeSuggestionIdx]) {
        items[activeSuggestionIdx].scrollIntoView({ block: 'nearest' });
        if (input) input.setAttribute('aria-activedescendant', items[activeSuggestionIdx].id);
    } else {
        if (input) input.removeAttribute('aria-activedescendant');
    }
}

/**
 * Render the autocomplete dropdown items.
 * @param {object[]} cities   - merged city list from api.js
 * @param {Function} onSelect - callback(cityName) when a suggestion is clicked
 * @param {Function} [onClear] - callback when "Clear History" is clicked
 */
export function renderSuggestions(cities, onSelect, onClear) {

    suggestionsDropdown.innerHTML = '';
    activeSuggestionIdx = -1;

    const input = document.getElementById('city-input');
    if (!cities || cities.length === 0) {
        suggestionsDropdown.innerHTML = '<div class="suggestion-empty" role="option" aria-disabled="true">No cities found</div>';
        suggestionsDropdown.hidden = false;
        if (input) input.setAttribute('aria-expanded', 'true');
        return;
    }

    cities.forEach((city, idx) => {
        const item      = document.createElement('div');
        item.className  = 'suggestion-item';
        item.dataset.index = idx;
        item.id = `opt-${idx}`;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');

        const region    = city.region ? `, ${city.region}` : '';
        const isIndia   = city.country === 'India';
        const isHistory = city._fromHistory;

        const icon = isHistory
            ? `<svg class="suggestion-item__icon suggestion-item__icon--history" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
               </svg>`
            : `<svg class="suggestion-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true" focusable="false">
                    <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
               </svg>`;

        const badgeLabel = isHistory ? ` (searched ${city.count} time${city.count === 1 ? '' : 's'})` : '';
        const badge = isHistory
            ? `<span class="suggestion-item__badge" aria-hidden="true">×${city.count}</span>`
            : '';

        // Build accessible label for screen readers: "London, England, United Kingdom"
        const fullLabel = `${city.name}${region}, ${city.country}${badgeLabel}`;
        item.setAttribute('aria-label', fullLabel);

        item.innerHTML = `
            ${icon}
            <div class="suggestion-item__text" aria-hidden="true">
                <strong>${city.name}</strong>${region}
                <span class="suggestion-item__country ${isIndia ? 'suggestion-item__country--india' : ''}">${city.country}</span>
            </div>
            ${badge}`;

        item.addEventListener('click', () => {
            const input = document.getElementById('city-input');
            if (input) {
                input.value = `${city.name}${region}`;
                input.setAttribute('aria-expanded', 'false');
                input.removeAttribute('aria-activedescendant');
            }
            suggestionsDropdown.hidden = true;
            activeSuggestionIdx = -1;
            onSelect?.(city.name);
        });

        item.addEventListener('mouseenter', () => {
            activeSuggestionIdx = idx;
            highlightSuggestion(suggestionsDropdown.querySelectorAll('.suggestion-item'));
        });

        suggestionsDropdown.appendChild(item);
    });

    // Add "Clear History" option if any item is from history and onClear is provided
    const hasHistory = cities.some(c => c._fromHistory);
    if (hasHistory && onClear) {
        const clearBtn = document.createElement('div');
        clearBtn.className = 'suggestion-clear';
        clearBtn.setAttribute('role', 'button');
        clearBtn.setAttribute('tabindex', '0');
        clearBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Clear Search History`;
        
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClear();
        });
        
        // Handle keyboard for the clear button
        clearBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClear();
            }
        });

        suggestionsDropdown.appendChild(clearBtn);
    }

    suggestionsDropdown.hidden = false;

    const inputEl = document.getElementById('city-input');
    if (inputEl) {
        inputEl.setAttribute('aria-expanded', 'true');
        // Announce count to screen reader via the listbox label
        suggestionsDropdown.setAttribute('aria-label',
            `City suggestions: ${cities.length} result${cities.length === 1 ? '' : 's'}`);
    }
}

// ── Widget renderers ───────────────────────────────────────────────────────

/**
 * AQI badge with a colored dot.
 * @param {string} label - e.g. 'Good'
 * @param {number} index - EPA index 1-6
 * @returns {string} HTML string
 */
export function renderAqiBadge(label, index) {
    return `<span class="aqi-badge" data-aqi="${index}" aria-label="Air Quality: ${label}">
        <span class="aqi-badge__dot" aria-hidden="true"></span>
        <span>${label}</span>
    </span>`;
}

/**
 * Minimal SVG sun-arc showing sunrise→sunset progress.
 * @param {object} astro    - { sunrise, sunset } strings
 * @param {string} localtime
 * @returns {string} HTML string
 */
export function renderSunArc(astro, localtime) {
    const parseTime = t => {
        if (!t) return 0;
        const [timePart, period] = t.trim().split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };

    const nowParts = localtime.split(' ')[1]?.split(':').map(Number) || [12, 0];
    const nowMin   = nowParts[0] * 60 + (nowParts[1] || 0);
    const riseMin  = parseTime(astro.sunrise);
    const setMin   = parseTime(astro.sunset);
    const daySpan  = Math.max(setMin - riseMin, 1);
    const progress = Math.min(Math.max((nowMin - riseMin) / daySpan, 0), 1);

    const totalDash  = 160;
    const dashOffset = totalDash - progress * totalDash;
    const angle = Math.PI * progress;
    const cx    = 10 + 80 * progress;
    const cy    = 55 - 40 * Math.sin(angle);

    return `
    <div class="sun-arc-wrap" aria-label="Sunrise ${astro.sunrise}, Sunset ${astro.sunset}">
        <svg class="sun-arc-svg" viewBox="0 0 100 65" fill="none" role="img" aria-hidden="true">
            <path class="sun-arc-track"    d="M10 55 A 40 40 0 0 1 90 55" stroke-width="3" fill="none"/>
            <path class="sun-arc-progress" d="M10 55 A 40 40 0 0 1 90 55" stroke-width="3" fill="none"
                style="stroke-dashoffset:${dashOffset.toFixed(1)}"/>
            <circle class="sun-arc-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5"/>
            <text class="sun-arc-label" x="5"  y="64" font-size="7">${astro.sunrise}</text>
            <text class="sun-arc-label" x="72" y="64" font-size="7">${astro.sunset}</text>
        </svg>
    </div>
    <div>${astro.sunrise}</div>`;
}

/**
 * Miniature SVG compass with rotating needle.
 * @param {number} degrees - wind direction in degrees
 * @param {string} dir     - cardinal label e.g. "NNE"
 * @param {number} kph     - wind speed
 * @param {number} gust    - gust speed
 * @returns {string} HTML string
 */
export function renderCompass(degrees, dir, kph, gust) {
    const safeDegs = isNaN(degrees) ? 0 : degrees;
    return `
    <div class="wind-compass-wrap" aria-label="Wind ${kph} km/h from ${dir}">
        <svg class="wind-compass-svg" viewBox="0 0 72 72" role="img" aria-hidden="true">
            <circle class="compass-ring" cx="36" cy="36" r="33" stroke-width="1.5" fill="none"/>
            <text class="compass-label" x="34" y="9"  font-size="7" text-anchor="middle">N</text>
            <text class="compass-label" x="34" y="68" font-size="7" text-anchor="middle">S</text>
            <text class="compass-label" x="5"  y="39" font-size="7" text-anchor="middle">W</text>
            <text class="compass-label" x="63" y="39" font-size="7" text-anchor="middle">E</text>
            <g id="compass-needle-group" style="transform:rotate(${safeDegs}deg)">
                <polygon class="compass-needle-n" points="36,14 33,36 36,40 39,36"/>
                <polygon class="compass-needle-s" points="36,58 33,36 36,32 39,36"/>
            </g>
            <circle cx="36" cy="36" r="3" fill="rgba(255,255,255,.5)"/>
        </svg>
    </div>
    <div>${kph} km/h ${dir}</div>`;
}

// ── Toast & loader ─────────────────────────────────────────────────────────

/**
 * Show / hide the loading skeleton.
 * @param {boolean} visible
 */
export function showLoading(visible) {
    loaderWrap.hidden = !visible;
}

/**
 * Show a toast notification.
 * @param {string}           msg
 * @param {'error'|'info'}   type
 */
export function showToast(msg, type = 'info') {
    toastEl.innerHTML = `<p class="toast__msg toast__msg--${type}">${msg}</p>`;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(hideToast, 5000);
}

/** Dismiss the toast immediately. */
export function hideToast() {
    toastEl.innerHTML = '';
    toastEl.classList.remove('show');
}
