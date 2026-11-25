
function renderHome() {

    const trip = getTrip();
    const schedules = getSortedSchedules();
    const milestones = (trip.progressGroups ?? []).length
        ? trip.progressGroups.map(group => ({
            label: group.label,
            items: schedules.slice(schedules.findIndex(s => s.id === group.from),
                schedules.findIndex(s => s.id === group.to) + 1)
        })).filter(group => group.items.length)
        : schedules.filter(s => s.showInProgress).map(s => ({label: s.shortTitle ?? s.title, items: [s]}));

    const $page = $("#app-content");
    const $controls = $page.find(".home-controls");
    const $photo = $page.find("#home-current-photo");
    const $image = $page.find("#home-current-image");
    const $placeholder = $photo.find(".home-photo-placeholder");
    const $route = $page.find(".today-route");

    let manualIndex = null;
    let displayedIndex = -1;

    let previousRenderKey = null;
    let previousProgressKey = null;
    let previousPhotoKey = null;

    let photoRequestId = 0;
    let disposed = false;

    /* ========================================
       表示対象の取得
    ======================================== */

    function getDisplayIndex(statuses) {

        if (manualIndex !== null) {
            return manualIndex;
        }

        const currentIndex = statuses.indexOf("current");

        if (currentIndex >= 0) {
            return currentIndex;
        }

        const upcomingIndex = statuses.indexOf("upcoming");

        if (upcomingIndex >= 0) {
            return upcomingIndex;
        }

        return schedules.length - 1;
    }


    /* ========================================
       ホームの更新
    ======================================== */

    function update(now = new Date()) {

        const statuses = schedules.map(schedule =>
            getScheduleStatus(schedule, trip.date, now)
        );

        displayedIndex = getDisplayIndex(statuses);

        const current = schedules[displayedIndex];
        const next = schedules[displayedIndex + 1];
        const status = statuses[displayedIndex];

        const renderKey = [
            displayedIndex,
            status,
            manualIndex === null
        ].join("|");

        if (renderKey !== previousRenderKey) {

            renderCurrent(current, status);
            renderNext(next);
            renderControls();

            previousRenderKey = renderKey;
        }

        renderCountdown(current, next, status, now);

        const progressKey = statuses.join("|");

        if (progressKey !== previousProgressKey) {

            renderProgress(statuses);

            previousProgressKey = progressKey;
        }
    }


    /* ========================================
       NOWカード
    ======================================== */

    function renderCurrent(schedule, status) {

        let label = "いまの予定";

        if (manualIndex !== null) {
            label = "予定プレビュー";
        } else if (status === "upcoming") {
            label = "これからの予定";
        } else if (status === "completed") {
            label = "旅の思い出";
        }

        $page.find("#home-current-label").text(label);

        $page.find("#home-current")
            .text(schedule?.title ?? "予定はありません");

        $page.find("#home-current-description")
            .text(schedule?.description ?? "");

        $page.find("#home-current-icon")
            .attr("class", getHomePhotoIcon(schedule?.type));

        $page.find("#home-current-category")
            .text(schedule ? getHomeCategoryName(schedule.type) : "")
            .prop("hidden", !schedule);

        $page.find("#home-current-time")
            .text(schedule
                ? formatTimeRange(schedule.startTime, schedule.endTime)
                : "—");

        $page.find("#home-current-duration")
            .text(getHomeDuration(schedule))
            .prop("hidden", !schedule);

        const note = schedule?.note ?? "";

        $page.find("#home-current-note").text(note);

        $page.find("#home-note-row")
            .prop("hidden", !note);

        $page.find("[data-home-current-detail]")
            .prop("disabled", !schedule);

        renderCurrentPhoto(schedule);
    }


    /* ========================================
       NOWカード｜写真
    ======================================== */

    function renderCurrentPhoto(schedule) {

        const candidates = getHomePhotoCandidates(schedule);
        const photoKey = JSON.stringify([schedule?.id, candidates]);
        if (photoKey === previousPhotoKey) return;
        previousPhotoKey = photoKey;
        const requestId = ++photoRequestId;

        $placeholder.find("i").attr("class", getHomePhotoIcon(schedule?.type));
        $image.prop("hidden", true).removeAttr("src");
        $placeholder.prop("hidden", false);

        function setPhotoTarget(spot) {
            $photo.prop("disabled", !spot)
                .attr("aria-label", spot ? `${spot.name}の詳細` : "予定のイメージ");
            if (spot) $photo.attr("data-spot-id", spot.id);
            else $photo.removeAttr("data-spot-id");
        }
        setPhotoTarget(candidates[0]?.spot);

        function tryPhoto(index) {
            if (disposed || requestId !== photoRequestId || index >= candidates.length) return;
            const { path, spot, label } = candidates[index];
            const loader = new Image();
            loader.onload = function () {
                if (disposed || requestId !== photoRequestId) return;
                setPhotoTarget(spot);
                $image.attr("src", path).attr("alt", label).prop("hidden", false);
                $placeholder.prop("hidden", true);
            };
            loader.onerror = () => tryPhoto(index + 1);
            loader.src = path;
        }
        tryPhoto(0);
    }


    /* ========================================
       NEXTカード
    ======================================== */

    function renderNext(schedule) {

        $page.find("#home-next")
            .text(schedule?.title ?? "次の予定なし");

        $page.find("#home-next-icon")
            .attr("class", getHomePhotoIcon(schedule?.type))
            .prop("hidden", !schedule);

        $page.find("#home-next-time")
            .text(schedule
                ? formatTimeRange(schedule.startTime, schedule.endTime)
                : "");

        $page.find("#home-next-duration")
            .text(schedule ? `（${getHomeDuration(schedule)}）` : "");

        $page.find("[data-home-next-detail]")
            .prop("disabled", !schedule);
    }


    /* ========================================
       カウントダウン
    ======================================== */

    function renderCountdown(current, next, status, now) {

        let label;
        let timing;

        if (!current) {

            label = "予定";
            timing = "—";

        } else if (manualIndex !== null) {

            label = "予定の状況";

            timing = {
                completed: "終了済み",
                current: "進行中",
                upcoming: "これから"
            }[status] ?? "—";

        } else if (status === "upcoming") {

            label = "開始まで";

            timing = formatHomeCountdown(
                trip.date,
                current.startTime,
                now
            );

        } else if (status === "current") {

            label = next ? "つぎの予定まで" : "終了まで";

            timing = formatHomeCountdown(
                trip.date,
                next?.startTime ?? current.endTime,
                now
            );

        } else {

            label = "今日の道のり";
            timing = "行程終了";
        }

        const $label = $page.find("#home-timing-label");
        const $timing = $page.find("#home-timing");

        if ($label.text() !== label) {
            $label.text(label);
        }

        if ($timing.text() !== timing) {
            $timing.text(timing);
        }
    }


    /* ========================================
       操作ボタン
    ======================================== */

    function renderControls() {

        $controls.find("[data-home-step='-1']")
            .prop("disabled", displayedIndex <= 0);

        $controls.find("[data-home-step='1']")
            .prop("disabled",
                displayedIndex < 0 ||
                displayedIndex >= schedules.length - 1);

        $controls.find("[data-home-auto]")
            .attr("aria-pressed", String(manualIndex === null))
            .prop("disabled", manualIndex === null);
    }


    /* ========================================
       今日の道のり
    ======================================== */

    function renderProgress(statuses) {
        const count = milestones.length;
        const width = 360;
        const names = {completed: "完了", current: "進行中", upcoming: "これから"};
        const points = milestones.map((group, i) => ({
            x: count === 1 ? width / 2 : 32 + i * (width - 64) / (count - 1),
            y: 17 + 2 * Math.sin(i * 1.4)
        }));
        let path = points.length ? `M${points[0].x} ${points[0].y}` : "";
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1], b = points[i];
            path += ` Q${(a.x+b.x)/2} ${(a.y+b.y)/2+(i%2===0?4:-4)} ${b.x} ${b.y}`;
        }
        const descriptions = [];
        const groups = milestones.map((group, i) => {
            const states = group.items.map(s => statuses[schedules.indexOf(s)]);
            const status = states.every(s => s === "completed") ? "completed"
                : states.some(s => s === "current" || s === "completed") ? "current" : "upcoming";
            descriptions.push(`${group.label} ${names[status]}`);
            const lines = group.label === "永観堂・南禅寺" ? ["永観堂・", "南禅寺"] : [group.label];
            const labels = lines.map((label, j) => `<tspan x="0" dy="${j ? 12 : 0}">${escapeHtml(label)}</tspan>`).join("");
            return `<g class="route-stop is-${status}" transform="translate(${points[i].x} ${points[i].y})">
                <path class="route-maple" d="M0 -12 L2.4 -5.6 L7.2 -8.8 L5.6 -3.2 L12 -4 L8 1.6 L10.4 4 L3.2 5.6 L.8 3.2 L.8 11.2 L-.8 11.2 L-.8 3.2 L-3.2 5.6 L-10.4 4 L-8 1.6 L-12 -4 L-5.6 -3.2 L-7.2 -8.8 L-2.4 -5.6 Z"></path>
                <text y="25">${labels}</text></g>`;
        }).join("");
        $route.attr("viewBox", `0 0 ${width} 58`).attr("aria-label", descriptions.join("、"));
        $route.html(`<path class="route-path" d="${path}"></path>${groups}`);
    }

    /* ========================================
       イベント｜予定切り替え
    ======================================== */

    $controls.on("click.home", "[data-home-step]", function () {

        if (!schedules.length) return;

        const step = Number(this.dataset.homeStep);

        manualIndex = Math.max(
            0,
            Math.min(schedules.length - 1, displayedIndex + step)
        );

        update();
    });

    $controls.on("click.home", "[data-home-auto]", function () {

        manualIndex = null;

        update();
    });


    /* ========================================
       イベント｜予定詳細
    ======================================== */

    $page.on("click.home", "[data-home-current-detail]", function () {

        const schedule = schedules[displayedIndex];

        if (schedule) {
            openScheduleDetail(schedule.id);
        }
    });

    $page.on("click.home", "[data-home-next-detail]", function () {

        const schedule = schedules[displayedIndex + 1];

        if (schedule) {
            openScheduleDetail(schedule.id);
        }
    });


    /* ========================================
       イベント｜スポット詳細
    ======================================== */

    $photo.on("click.home", function () {

        const spotId = $(this).attr("data-spot-id");

        if (spotId) {
            openSpotDetail(spotId);
        }
    });


    /* ========================================
       旅のメモ
    ======================================== */

    const notesHtml = getSortedNotes().map(note => `

        <article>
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
            ${note.items?.length ? `<div class="home-memo-shops">${note.items.map(item => `
                <button type="button" class="home-memo-shop" data-home-memo-spot="${escapeHtml(item.spotId)}">
                    <span class="home-memo-shop-text"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></span>
                    <i class="bi bi-chevron-right" aria-hidden="true"></i>
                </button>`).join("")}</div>` : ""}
        </article>

    `).join("");

    $page.find("#home-notes")
        .html(notesHtml || "<p>メモはまだありません。</p>");

    $page.on("click.home", "[data-home-memo-spot]", function () {
        openSpotDetail($(this).attr("data-home-memo-spot"));
    });

    $page.on("click.home", "[data-home-notes]", function () {

        document.getElementById("home-notes-section")
            ?.scrollIntoView({
                behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches ? "auto" : "smooth",
                block: "start"
            });
    });


    /* ========================================
       初期表示・定期更新
    ======================================== */

    update();

    const timer = setInterval(update, 15000);

    const weather = new AbortController();

    renderHomeWeather(
        trip,
        $page.find(".weather-circle"),
        weather.signal
    );


    /* ========================================
       画面遷移時の後処理
    ======================================== */

    return () => {

        disposed = true;

        clearInterval(timer);
        weather.abort();

        $controls.off(".home");
        $photo.off(".home");
        $page.off(".home");
    };
}


// Use the actual destination (or its nearby sightseeing spot) for transport cards.
function getHomePhotoCandidates(schedule) {
    if (!schedule) return [];
    const result = [];
    const add = (path, spot, label) => {
        if (path && !result.some(item => item.path === path)) {
            result.push({path, spot, label: label || spot?.name || schedule.title});
        }
    };
    const ownSpots = getSpotsBySchedule(schedule.id);
    add(schedule.image, ownSpots[0], schedule.title);
    ownSpots.forEach(spot => add(spot.image, spot));
    if (schedule.type === "transport") {
        const destinations = {
            "to-arashiyama": "togetsukyo", "to-bridge": "togetsukyo",
            "to-tenryu": "tenryuji", "to-jojakko": "jojakkoji",
            "to-lunch": "matsugae", "to-randen": "square",
            "to-keage": "nejiri", "to-eikando": "eikando",
            "to-nanzen": "nanzenji", "to-higashiyama": "ninenzaka",
            "to-kiyomizu": "kiyomizu", "to-dinner": "iroha"
        };
        const destinationId = destinations[schedule.id];
        const destination = destinationId ? getSpotById(destinationId) : null;
        if (destination) add(destination.image, destination);
        if (schedule.id === "to-osaka") {
            add("assets/spots/hankyu-umeda.jpg", null, "阪急大阪梅田駅");
        }
        if (schedule.id === "to-station") {
            add("assets/spots/hankyu-kawaramachi.jpg", null, "京都河原町駅");
        }
    }
    return result;
}


/* ========================================
   カテゴリ名
======================================== */

function getHomeCategoryName(type) {

    const names = {
        sightseeing: "散策",
        meal: "食事",
        cafe: "カフェ",
        shopping: "買い物",
        transport: "移動",
        rest: "休憩",
        other: "その他"
    };

    return names[type] ?? "その他";
}


/* ========================================
   カテゴリアイコン
======================================== */

function getHomePhotoIcon(type) {

    const icons = {
        sightseeing: "fa-solid fa-torii-gate",
        meal: "fa-solid fa-utensils",
        cafe: "bi bi-cup-hot",
        shopping: "bi bi-bag",
        transport: "bi bi-train-front",
        rest: "bi bi-cup",
        other: "bi bi-image"
    };

    return icons[type] ?? icons.other;
}


/* ========================================
   所要時間
======================================== */

function getHomeDuration(schedule) {

    if (!schedule) return "";

    const duration = calculateDuration(
        schedule.startTime,
        schedule.endTime
    );

    return `約${formatDuration(duration)}`;
}


/* ========================================
   カウントダウン
======================================== */

function formatHomeCountdown(date, time, now = new Date()) {

    const deadline = new Date(`${date}T${time}:00+09:00`);

    const minutes = Math.max(
        0,
        Math.ceil((deadline - now) / 60000)
    );

    if (minutes >= 1440) {

        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);

        return `あと${days}日${hours ? `${hours}時間` : ""}`;
    }

    return `あと${formatDuration(minutes)}`;
}


/* ========================================
   天気予報
======================================== */

async function renderHomeWeather(trip, $weather, signal) {

    const $label = $weather.find("#home-weather-label");
    const $degrees = $weather.find("#home-weather-temperature");
    const $sunset = $weather.find("#home-sunset");

    const daysAway =
        (Date.parse(trip.date) - Date.parse(getTodayDate()))
        / 86400000;

    if (!trip.weatherLocation ||
        !(daysAway >= 0 && daysAway < 16)) {

        $label.text("予報期間外");
        return;
    }

    const { latitude, longitude } = trip.weatherLocation;

    const query = new URLSearchParams({
        latitude,
        longitude,
        timezone: trip.timezone,
        daily:
            "weather_code,temperature_2m_max,temperature_2m_min,sunset",
        start_date: trip.date,
        end_date: trip.date
    });

    try {

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${query}`,
            {
                signal: AbortSignal.any([
                    signal,
                    AbortSignal.timeout(10000)
                ])
            }
        );

        if (!response.ok) {
            throw new Error("Forecast unavailable");
        }

        const { daily } = await response.json();

        const index = daily?.time?.indexOf(trip.date) ?? -1;

        if (index < 0) {
            throw new Error("Date unavailable");
        }

        const code = daily.weather_code[index];
        const high = daily.temperature_2m_max[index];
        const low = daily.temperature_2m_min[index];

        $label.text(homeWeatherName(code));

        $degrees.text(
            Number.isFinite(high) && Number.isFinite(low)
                ? `${Math.round(high)}℃ / ${Math.round(low)}℃`
                : "—"
        );

        $sunset.text(
            daily.sunset[index]?.slice(11, 16) || "—"
        );

        $weather.find(".weather-circle__item")
            .first()
            .find(".weather-circle__value i")
            .attr("class", getHomeWeatherIcon(code));

    } catch {

        if (!signal.aborted) {
            $label.text("予報取得不可");
        }
    }
}


/* ========================================
   天気コード
======================================== */

function homeWeatherName(code) {

    if (!Number.isInteger(code)) return "天気情報なし";
    if (code === 0) return "晴れ";
    if (code === 1) return "おおむね晴れ";
    if (code === 2) return "晴れ時々くもり";
    if (code === 3) return "くもり";
    if (code === 45 || code === 48) return "霧";

    if ((code >= 71 && code <= 77) ||
        code === 85 || code === 86) {
        return "雪";
    }

    if (code >= 95) return "雷雨";

    return "雨";
}

function getHomeWeatherIcon(code) {

    if (!Number.isInteger(code)) return "bi bi-cloud-sun";

    if (code === 0) return "bi bi-sun";
    if (code <= 2) return "bi bi-cloud-sun";
    if (code === 3) return "bi bi-cloud";
    if (code === 45 || code === 48) return "bi bi-cloud-fog";

    if ((code >= 71 && code <= 77) ||
        code === 85 || code === 86) {
        return "bi bi-cloud-snow";
    }

    if (code >= 95) return "bi bi-cloud-lightning-rain";

    return "bi bi-cloud-rain";
}
