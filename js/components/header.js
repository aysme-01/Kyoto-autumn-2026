// ==========================================
// 共通ヘッダーの描画
// ==========================================

function renderHeader() {
    renderHeaderDate();
    renderReservationList();
}

// ヘッダーの日付表示
function renderHeaderDate() {
    const trip = getTrip();

    $("#header-date").text(formatDate(trip.date));
    $("#header-day").text(getDayOfWeek(trip.date));
}

// 予約リストの描画
function renderReservationList() {
    const reservations = sortReservations(getReservations());
    const $list = $("#reservation-list");

    $list.empty();

    // 予約がない場合
    if (reservations.length === 0) {
        $list.append(`
            <div class="reservation-empty">
                予約はありません
            </div>
        `);
        return;
    }

    $list.append(`<div class="reservation-list-heading"><span>予約一覧</span><span class="reservation-count">${reservations.length}件</span></div>`);

    reservations.forEach(reservation => {
        const spot = getSpotById(reservation.spotId);
        const url = reservation.links?.[0]?.url;
        const $item = $(`
            <button type="button" class="reservation-link">
                <span class="reservation-time-block">
                    <span class="reservation-day"></span>
                    <span class="reservation-time"></span>
                </span>
                <span class="reservation-info">
                    <span class="reservation-name"></span>
                    <span class="reservation-facility"></span>
                    <span class="reservation-status"></span>
                </span>
                <i class="bi bi-chevron-right reservation-arrow" aria-hidden="true"></i>
            </button>
        `);
        const date = reservation.date ?? getTrip().date;
        const time = reservation.reservationTime ?? "";
        $item.find(".reservation-name").text(spot?.name ?? reservation.title);
        $item.find(".reservation-facility").text(reservation.scheduleId === "lunch" ? "昼食" : reservation.scheduleId === "dinner" ? "夕食" : reservation.title).toggle(!!reservation.title);
        $item.find(".reservation-day").text(formatDateJP(date));
        $item.find(".reservation-time").text(time || "時刻未定");
        $item.find(".reservation-status").text(reservation.note ?? "").toggle(!!reservation.note);

        if (spot) {
            $item.on("click", function () {
                const toggle = document.querySelector("#header-reservations .reservation-btn");
                bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
                // Restore focus to the visible header button when the detail closes.
                toggle.focus();
                openSpotDetail(spot.id);
            });
        } else if (url) {
            $item.on("click", () => window.open(url, "_blank", "noopener,noreferrer"));
        } else {
            $item.prop("disabled", true).find(".reservation-arrow").hide();
        }
        $list.append($item);
    });
}

// 予約種別に応じたアイコンの取得
function getReservationIcon(type) {
    const icons = {
        restaurant: "fa-solid fa-utensils",
        ticket: "bi bi-ticket-perforated",
        transport: "bi bi-train-front",
        activity: "bi bi-camera",
        accommodation: "bi bi-building",
        other: "bi bi-calendar-check"
    };

    return icons[type] ?? icons.other;
}

// 予約情報を日時順に並び替える
function sortReservations(reservations) {
    const tripDate = getTrip().date;

    return [...reservations].sort((a, b) => {
        const dateA = a.date ?? tripDate;
        const dateB = b.date ?? tripDate;

        const timeA = a.reservationTime ?? "99:99";
        const timeB = b.reservationTime ?? "99:99";

        return `${dateA} ${timeA}`
            .localeCompare(`${dateB} ${timeB}`);
    });
}
