// ==================================================
// 01. 日付・曜日
// ==================================================

// 日付の表示形式変換（YYYY.MM.DD）
function formatDate(date) {
    return date.replaceAll("-", ".");
}

// 日付の表示形式変換（M月D日）
function formatDateJP(date) {
    const d = new Date(`${date}T00:00:00`);

    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 曜日の取得（英語3文字）
function getDayOfWeek(date) {
    const days = [
        "SUN", "MON", "TUE", "WED",
        "THU", "FRI", "SAT"
    ];

    return days[new Date(`${date}T00:00:00`).getDay()];
}

// 日本時間の日付を取得（YYYY-MM-DD）
function getTodayDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(now);

    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;

    return `${year}-${month}-${day}`;
}


// ==================================================
// 02. 時刻・所要時間
// ==================================================

// 時刻を分に変換
function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

// 日本時間の現在時刻を取得（HH:mm）
function getCurrentTime(now = new Date()) {
    return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).format(now);
}

// 所要時間を算出
function calculateDuration(startTime, endTime) {
    return timeToMinutes(endTime) - timeToMinutes(startTime);
}

// 所要時間の表示形式を変換
function formatDuration(duration) {
    if (duration == null) return "";

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    const hourText = hours > 0 ? `${hours}時間` : "";
    const minuteText = minutes > 0 ? `${minutes}分` : "";

    return hourText + minuteText || "0分";
}

// 開始・終了時刻をまとめて表示
function formatTimeRange(startTime, endTime) {
    if (startTime && endTime) {
        return `${startTime}〜${endTime}`;
    }

    if (startTime) {
        return `${startTime} 発`;
    }

    if (endTime) {
        return `${endTime} 着`;
    }

    return "";
}


// ==================================================
// 03. 料金
// ==================================================

// 料金の表示形式を変換
function formatPrice(price) {
    if (price == null) return "料金未定";
    if (price === 0) return "無料";

    return `${price.toLocaleString("ja-JP")}円`;
}


// ==================================================
// 04. HTML・URL
// ==================================================

// HTML特殊文字のエスケープ
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// 外部リンクとして使用可能なURLを取得
function getSafeUrl(value) {
    if (!value) return "";

    try {
        const url = new URL(value);

        if (
            url.protocol === "https:" ||
            url.protocol === "http:"
        ) {
            return url.href;
        }

        return "";

    } catch {
        return "";
    }
}


// ==================================================
// 05. スケジュールの進捗状態
// ==================================================

// スケジュールの進捗状態を取得
function getScheduleStatus(
    schedule,
    tripDate,
    now = new Date()
) {
    const start = new Date(
        `${tripDate}T${schedule.startTime}:00+09:00`
    );

    const end = new Date(
        `${tripDate}T${schedule.endTime}:00+09:00`
    );

    // 終了済み
    if (now >= end) {
        return "completed";
    }

    // 開始前
    if (now < start) {
        return "upcoming";
    }

    // 現在進行中
    return "current";
}


// ==================================================
// 06. 時刻表
// ==================================================

// 出発済みの便かどうかを判定
function isPastDeparture(
    departureTime,
    tripDate,
    now = new Date()
) {
    if (!departureTime) return false;

    const departure = new Date(
        `${tripDate}T${departureTime}:00+09:00`
    );

    return departure < now;
}

// 時刻表を出発時刻順に並べ替え
function sortTimetable(timetable) {
    return [...timetable].sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime)
    );
}

// 現在時刻以降の最初の便を取得
function getNextDeparture(
    timetable,
    tripDate,
    now = new Date()
) {
    // 旅行当日のみ次発便を判定
    if (getTodayDate(now) !== tripDate) {
        return null;
    }

    return sortTimetable(timetable).find(
        item => !isPastDeparture(
            item.departureTime,
            tripDate,
            now
        )
    ) ?? null;
}


// ==================================================
// 07. スポット種別
// ==================================================

// スポット種別に対応するアイコンを取得
function getSpotIcon(type) {
    const icons = {
        temple: "fa-solid fa-torii-gate",
        shrine: "fa-solid fa-torii-gate",
        sightseeing: "bi bi-camera",
        nature: "bi bi-tree",
        museum: "bi bi-bank",
        restaurant: "fa-solid fa-utensils",
        cafe: "bi bi-cup-hot",
        shop: "bi bi-bag",
        event: "bi bi-calendar-event",
        other: "bi bi-geo-alt"
    };

    return icons[type] ?? icons.other;
}

// スポット種別の日本語名称を取得
function getSpotTypeName(type) {
    const names = {
        temple: "寺院",
        shrine: "神社",
        sightseeing: "観光",
        nature: "自然・景勝地",
        museum: "美術館・博物館",
        restaurant: "飲食店",
        cafe: "カフェ",
        shop: "ショップ",
        event: "イベント",
        other: "その他"
    };

    return names[type] ?? names.other;
}


// ==================================================
// 08. スケジュール種別
// ==================================================

// スケジュール種別に対応するアイコンを取得
function getScheduleIcon(type) {
    const icons = {
        sightseeing: "icon-maple",
        meal: "fa-solid fa-utensils",
        cafe: "bi bi-cup-hot",
        shopping: "bi bi-bag",
        transport: "bi bi-arrow-left-right",
        rest: "bi bi-cup",
        other: "bi bi-calendar-event"
    };

    return icons[type] ?? icons.other;
}


// ==================================================
// 09. 移動手段
// ==================================================

// 移動手段に対応するアイコンを取得
function getTransportIcon(transportType) {
    const icons = {
        walk: "fa-solid fa-person-walking",
        train: "bi bi-train-front",
        subway: "bi bi-train-front-tunnel",
        bus: "bi bi-bus-front",
        taxi: "fa-solid fa-taxi",
        car: "bi bi-car-front",
        bicycle: "bi bi-bicycle",
        other: "bi bi-arrow-left-right"
    };

    return icons[transportType] ?? icons.other;
}

// 移動手段の日本語名称を取得
function getTransportName(transportType) {
    const names = {
        walk: "徒歩",
        train: "電車",
        subway: "地下鉄",
        bus: "バス",
        taxi: "タクシー",
        car: "車",
        bicycle: "自転車",
        other: "その他"
    };

    return names[transportType] ?? names.other;
}