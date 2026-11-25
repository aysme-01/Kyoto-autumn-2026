// ==================================================
// 01. スケジュール画面の描画
// ==================================================

// スケジュール画面全体を描画
function renderSchedule() {

    renderScheduleDate();

    const schedules = getSortedSchedules();

    const html = schedules
        .map(schedule => renderScheduleItem(schedule))
        .join("");

    $("#schedule-list").html(html);

    // イベント登録
    bindScheduleEvents();

    // 写真の読み込みエラーへの対応
    handleScheduleImageErrors();

    // 30秒ごとに進捗状態を更新
    const timerId = setInterval(() => {
        updateScheduleStatus();
    }, 30000);

    // 画面を離れる際の後処理
    return () => {
        clearInterval(timerId);

        $("#schedule-list").off(".schedule");
    };
}

// 日付スタンプの描画
function renderScheduleDate() {

    const trip = getTrip();
    const date = new Date(`${trip.date}T00:00:00`);

    $("#schedule-date").text(
        `${date.getMonth() + 1}/${date.getDate()}`
    );

    $("#schedule-day").text(
        getDayOfWeek(trip.date)
    );
}


// ==================================================
// 02. スケジュールカード
// ==================================================

// スケジュール項目のHTMLを生成
function renderScheduleItem(schedule) {

    const status = getScheduleStatus(
        schedule,
        getTrip().date
    );

    const isTransport = schedule.type === "transport";

    const icon = getScheduleIcon(schedule.type);

    const duration = calculateDuration(
        schedule.startTime,
        schedule.endTime
    );

    // 代表スポット・代表写真
    const spots = getSpotsBySchedule(schedule.id);
    const spot = spots.find(item => item.image) ?? spots[0];
    const image = schedule.image ?? spot?.image;
    const photoHtml = !isTransport ? `
        <div class="schedule-photo ${image ? "" : "is-placeholder"}">
            ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(spot?.name ?? schedule.title)}">` : ""}
            <div class="schedule-photo-placeholder" aria-hidden="true">
                <i class="${icon}"></i><span>KYOTO</span>
            </div>
        </div>` : "";

    // サブタイトル
    const descriptionHtml = schedule.description
        ? `
            <div class="schedule-description">
                ${escapeHtml(schedule.description)}
            </div>
        `
        : "";

    // 予約タグ
    const reservationsHtml = renderScheduleReservations(
        schedule.id
    );

    // スケジュール種別に応じた詳細
    const detailHtml = isTransport
        ? renderTransportBody(schedule)
        : renderScheduleBody(schedule);

    // 補足メモ
    const noteHtml = renderScheduleNote(schedule);

    const bodyHtml = detailHtml + noteHtml;

    // 詳細情報の有無
    const hasDetails = Boolean(bodyHtml.trim());

    return `
        <div class="schedule-item
                    is-${status}
                    ${isTransport ? "is-transport" : ""}"
             data-schedule-id="${escapeHtml(schedule.id)}">

            <div class="schedule-time">

                <span class="schedule-start">
                    ${escapeHtml(schedule.startTime)}
                </span>

                <span class="schedule-end">
                    〜${escapeHtml(schedule.endTime)}
                </span>

            </div>

            <div class="schedule-marker">
                <span class="schedule-dot"></span>
            </div>

            <div class="schedule-card">

                <div class="schedule-card-header
                            ${hasDetails ? "" : "has-no-detail"}"
                     ${hasDetails
                         ? 'role="button" tabindex="0" aria-expanded="false"'
                         : ""
                     }>

                    <div class="schedule-category">
                        <i class="${icon}"></i>
                    </div>

                    <div class="schedule-heading">

                        <div class="schedule-title-row">

                            <div class="schedule-title">
                                ${escapeHtml(schedule.title)}
                            </div>

                            <div class="schedule-duration">
                                <i class="bi bi-clock"></i>
                                約${duration}分
                            </div>

                        </div>

                        ${descriptionHtml}

                        ${reservationsHtml
                            ? `
                                <div class="schedule-spot-tags">
                                    ${reservationsHtml}
                                </div>
                            `
                            : ""
                        }

                    </div>

                    ${photoHtml}

                    ${hasDetails
                        ? `
                            <i class="bi bi-chevron-down
                                      schedule-toggle"></i>
                        `
                        : ""
                    }

                </div>

                ${hasDetails
                    ? `
                        <div class="schedule-card-body">
                            ${bodyHtml}
                        </div>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}


// ==================================================
// 03. 通常スケジュールの詳細
// ==================================================

// 通常スケジュールの詳細HTMLを生成
function renderScheduleBody(schedule) {

    const spots = getSpotsBySchedule(schedule.id);

    const spotsHtml = spots
        .map(spot => renderScheduleSpot(
            spot,
            schedule.id
        ))
        .join("");

    const reservationsHtml =
        renderScheduleReservationDetails(schedule);

    return `
        ${spotsHtml
            ? `
                <div class="schedule-spot-list">
                    ${spotsHtml}
                </div>
            `
            : ""
        }

        ${reservationsHtml}
    `;
}


// ==================================================
// 04. スポット一覧
// ==================================================

// スケジュール内のスポット1件分を描画
function renderScheduleSpot(spot, scheduleId) {

    const mapUrl = getSafeUrl(spot.mapUrl);

    // 地図ボタン
    const mapHtml = mapUrl
        ? `
            <a class="schedule-spot-map"
               href="${escapeHtml(mapUrl)}"
               target="_blank"
               rel="noopener noreferrer">

                <i class="bi bi-geo-alt"></i>
                地図

            </a>
        `
        : "";

    // メニューボタン
    const menuHtml = (spot.menus ?? []).length > 0
        ? `
            <button type="button"
                    class="schedule-spot-menu"
                    data-spot-id="${escapeHtml(spot.id)}">

                <i class="fa-solid fa-utensils"></i>
                メニュー

            </button>
        `
        : "";

    // スポット情報タグ
    const tagsHtml = [
        renderScheduleSpotHours(spot),
        renderScheduleSpotFees(spot),
        renderScheduleSpotReservations(
            scheduleId,
            spot.id
        )
    ].join("");

    return `
        <div class="schedule-spot-item"
             data-spot-id="${escapeHtml(spot.id)}">

            <i class="${getSpotIcon(spot.type)}
                      schedule-spot-icon"></i>

            <div class="schedule-spot-info">

                <div class="schedule-spot-name-row">
                    <div class="schedule-spot-name">${escapeHtml(spot.name)}</div>
                    ${mapHtml}
                </div>

                ${tagsHtml
                    ? `
                        <div class="schedule-spot-tags">
                            ${tagsHtml}
                        </div>
                    `
                    : ""
                }

                ${menuHtml
                    ? `
                        <div class="schedule-spot-actions">
                            ${menuHtml}
                        </div>
                    `
                    : ""
                }

            </div>

            <button type="button"
                    class="schedule-spot-detail-btn"
                    aria-label="${escapeHtml(spot.name)}の詳細">

                <i class="bi bi-chevron-right
                          schedule-spot-arrow"></i>

            </button>

        </div>
    `;
}

// スポットの営業時間を描画
function renderScheduleSpotHours(spot) {

    return (spot.businessHours ?? [])
        .map(hours => {

            const label = hours.label
                ? `${escapeHtml(hours.label)} `
                : "";

            const timeRange = [
                hours.openTime,
                hours.closeTime
            ].filter(Boolean).join("〜");

            const hoursHtml = timeRange
                ? `
                    <span class="schedule-spot-tag tag-hours">

                        <i class="bi bi-clock"></i>

                        ${label}${escapeHtml(timeRange)}

                    </span>
                `
                : "";

            const lastAdmissionHtml =
                hours.lastAdmissionTime
                    ? `
                        <span class="schedule-spot-tag
                                     tag-admission">

                            <i class="bi bi-hourglass-split"></i>
                            最終受付 ${escapeHtml(hours.lastAdmissionTime)}

                        </span>
                    `
                    : "";

            return hoursHtml + lastAdmissionHtml;

        })
        .join("");
}

// スポットの料金を描画
function renderScheduleSpotFees(spot) {

    return (spot.fees ?? [])
        .map(fee => `
            <span class="schedule-spot-tag tag-fee">

                <i class="bi bi-currency-yen"></i>

                ${escapeHtml(fee.label)}
                ${escapeHtml(formatPrice(fee.price))}

            </span>
        `)
        .join("");
}


// ==================================================
// 05. 予約情報
// ==================================================

// スポットの予約タグを描画
function renderScheduleSpotReservations(
    scheduleId,
    spotId
) {

    const reservations = getReservationsBySpot(
        scheduleId,
        spotId
    );

    return reservations.map(reservation => `
        <span class="schedule-spot-tag tag-reservation">

            <i class="bi bi-calendar-check"></i>

            予約
            ${escapeHtml(
                reservation.reservationTime ?? ""
            )}

        </span>
    `).join("");
}

// スケジュール上部の予約タグを描画
function renderScheduleReservations(scheduleId) {

    const reservations = getReservationsBySchedule(
        scheduleId
    );

    return reservations.map(reservation => `
        <span class="schedule-spot-tag
                     tag-reservation
                     tag-reservation-main">

            <i class="bi bi-calendar-check"></i>

            予約
            ${escapeHtml(
                reservation.reservationTime ?? ""
            )}

        </span>
    `).join("");
}

// スケジュールに直接紐づく予約の詳細を描画
function renderScheduleReservationDetails(schedule) {

    // スポットに紐づく予約はスポット詳細で表示する
    const reservations = getReservationsBySchedule(
        schedule.id
    ).filter(reservation =>
        !schedule.spotIds.includes(reservation.spotId)
    );

    if (reservations.length === 0) return "";

    const html = reservations.map(reservation => {

        const linksHtml = (reservation.links ?? [])
            .map(link => {

                const url = getSafeUrl(link.url);

                if (!url) return "";

                return `
                    <a class="schedule-route-link"
                       href="${escapeHtml(url)}"
                       target="_blank"
                       rel="noopener noreferrer">

                        ${escapeHtml(
                            link.label || "予約確認"
                        )}

                        <i class="bi bi-box-arrow-up-right"></i>

                    </a>
                `;
            })
            .join("");

        return `
            <div class="schedule-reservation-detail">

                <div class="schedule-reservation-title">

                    <i class="bi bi-calendar-check"></i>

                    ${escapeHtml(reservation.title)}

                </div>

                <div class="schedule-reservation-time">

                    ${escapeHtml(
                        formatDateJP(
                            reservation.date ?? getTrip().date
                        )
                    )}

                    ${escapeHtml(
                        reservation.reservationTime
                        ?? "時間指定なし"
                    )}

                </div>

                ${reservation.note
                    ? `
                        <div class="schedule-reservation-note">
                            ${escapeHtml(reservation.note)}
                        </div>
                    `
                    : ""
                }

                ${linksHtml
                    ? `
                        <div class="schedule-route-actions">
                            ${linksHtml}
                        </div>
                    `
                    : ""
                }

            </div>
        `;
    }).join("");

    return `
        <div class="schedule-reservation-list">
            ${html}
        </div>
    `;
}


// ==================================================
// 06. 移動スケジュールの詳細
// ==================================================

// 移動経路一覧を描画
function renderTransportBody(schedule) {

    const routes = getRoutesBySchedule(schedule.id);

    const routesHtml = routes
        .some(route => ["train", "subway"].includes(route.transportType))
        ? renderRailJourney(routes)
        : routes.map(route => renderTransportRoute(route)).join("");

    const reservationsHtml =
        renderScheduleReservationDetails(schedule);

    return `
        ${routesHtml
            ? `
                <div class="schedule-route-list">
                    ${routesHtml}
                </div>
            `
            : ""
        }

        ${reservationsHtml}
    `;
}


// 電車を含む経路を、駅と乗車区間が交互に並ぶ形式で描画する。
// 隣接区間の駅名が一致する場合だけ、乗換駅を1行にまとめる。
function renderRailJourney(routes) {
    const parts = [];
    routes.forEach((route, index) => {
        const previous = routes[index - 1];
        const joined = previous && previous.arrival === route.departure;
        if (!joined) {
            if (previous) {
                parts.push(renderRailStation(previous.arrival, previous.arrivalTime, null));
            }
            parts.push(renderRailStation(route.departure, null, route.departureTime));
        } else {
            const transfer = previous.arrivalTime && route.departureTime &&
                ["train", "subway"].includes(previous.transportType) &&
                ["train", "subway"].includes(route.transportType)
                ? calculateDuration(previous.arrivalTime, route.departureTime)
                : null;
            parts.push(renderRailStation(route.departure, previous.arrivalTime,
                route.departureTime, transfer));
        }
        parts.push(renderRailLeg(route));
    });
    const last = routes[routes.length - 1];
    if (last) parts.push(renderRailStation(last.arrival, last.arrivalTime, null));
    return `<div class="rail-journey">${parts.join("")}</div>`;
}

function renderRailStation(name, arrival, departure, transfer = null) {
    const time = (value, label) => value
        ? `<div><strong>${escapeHtml(value)}</strong><small>${label}</small></div>` : "";
    return `
        <div class="rail-station">
            <div class="rail-station-times">${time(arrival, "着")}${time(departure, "発")}</div>
            <div class="rail-station-name">
                ${escapeHtml(name ?? "")}
                ${Number.isFinite(transfer) && transfer >= 0
                    ? `<div class="rail-transfer">乗り換え ${transfer}分</div>` : ""}
            </div>
        </div>`;
}

function renderRailLeg(route) {
    const line = [route.operator, route.lineName, route.serviceType]
        .filter(Boolean).join(" ");
    const transport = getTransportName(route.transportType);
    const lineColor = ["train", "subway"].includes(route.transportType) ? "rail-train" : "rail-other";
    const details = [
        route.platform ? `発：${route.platform}番ホーム` : "",
        route.arrivalPlatform ? `着：${route.arrivalPlatform}番ホーム` : "",
        route.boardingPosition ? `乗車位置：${route.boardingPosition}` : "",
        [route.carCount != null ? `${route.carCount}両編成` : "",
         route.isOrigin ? "当駅始発" : ""].filter(Boolean).join("・")
    ].filter(Boolean);
    const stats = [
        route.duration != null ? `所要 ${formatDuration(route.duration)}` : "",
        route.stopCount != null ? `${route.stopCount}駅` : "",
        route.fare != null && !(route.transportType === "walk" && route.fare === 0)
            ? `${formatPrice(route.fare)}${route.fareNote ? `（${route.fareNote}）` : ""}` : ""
    ].filter(Boolean);
    return `
        <div class="rail-leg ${lineColor}">
            <div class="rail-line-name"><i class="${getTransportIcon(route.transportType)}"></i>
                <span>${escapeHtml(line || transport)}</span></div>
            ${route.direction ? `<div class="rail-direction">${escapeHtml(route.direction)}</div>` : ""}
            ${details.length ? `<div class="rail-meta">${details.map(t => `<div>${escapeHtml(t)}</div>`).join("")}</div>` : ""}
            ${stats.length ? `<div class="rail-stats">${stats.map(t => `<span>${escapeHtml(t)}</span>`).join("")}</div>` : ""}
            ${renderRouteActions(route)}
            ${route.note ? `<div class="rail-note">${escapeHtml(route.note)}</div>` : ""}
        </div>`;
}

// 移動経路1件分のHTMLを生成
function renderTransportRoute(route) {

    const icon = getTransportIcon(
        route.transportType
    );

    const transportName = getTransportName(
        route.transportType
    );

    // 交通機関・路線名
    const lineText = [
        route.operator,
        route.lineName
    ].filter(Boolean).join(" ");

    // 方面・乗り場
    const directionText = [
        route.direction,
        route.platform
            ? `${route.platform}番乗り場`
            : ""
    ].filter(Boolean).join(" ／ ");

    // 出発・到着時刻
    const timeHtml = renderRouteTime(route);

    // 所要時間
    const durationHtml = route.duration != null
        ? `
            <span class="schedule-route-tag">

                <i class="bi bi-clock"></i>

                約${escapeHtml(
                    formatDuration(route.duration)
                )}

            </span>
        `
        : "";

    // 運賃
    // 未登録の運賃・徒歩の0円は表示しない
    const fareHtml =
        route.fare != null &&
        !(route.transportType === "walk" &&
          route.fare === 0)
            ? `
                <span class="schedule-route-tag">

                    <i class="bi bi-ticket-perforated"></i>

                    ${escapeHtml(
                        formatPrice(route.fare)
                    )}

                </span>
            `
            : "";

    // 時刻表・外部リンク
    const actionsHtml = renderRouteActions(route, false);
    const routeUrl = getSafeUrl(route.routeUrl);
    const inlineMapHtml = routeUrl ? `<a class="schedule-route-link route-inline-map" href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt"></i> 経路</a>` : "";

    return `
        <div class="schedule-route-item">

            <div class="schedule-route-marker">

                <span class="schedule-route-icon">
                    <i class="${icon}"></i>
                </span>

            </div>

            <div class="schedule-route-info">

                <div class="schedule-route-type-row">
                    <span class="schedule-route-type">${escapeHtml(transportName)}</span>
                    ${durationHtml}
                    ${inlineMapHtml}
                </div>

                ${timeHtml}

                <div class="schedule-route-title">

                    ${escapeHtml(route.departure)}

                    <i class="bi bi-arrow-right"></i>

                    ${escapeHtml(route.arrival)}

                </div>

                ${lineText
                    ? `
                        <div class="schedule-route-line">
                            ${escapeHtml(lineText)}
                        </div>
                    `
                    : ""
                }

                ${directionText
                    ? `
                        <div class="schedule-route-direction">
                            ${escapeHtml(directionText)}
                        </div>
                    `
                    : ""
                }

                ${fareHtml
                    ? `
                        <div class="schedule-route-tags">
                            ${fareHtml}
                        </div>
                    `
                    : ""
                }

                ${actionsHtml}

                ${route.note
                    ? `
                        <div class="schedule-route-note">
                            ${escapeHtml(route.note)}
                        </div>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}

// 移動経路の出発・到着時刻を描画
function renderRouteTime(route) {

    const departureHtml = route.departureTime
        ? `
            <span class="schedule-route-departure">
                ${escapeHtml(route.departureTime)}
                <small>発</small>
            </span>
        `
        : "";

    const arrivalHtml = route.arrivalTime
        ? `
            <span class="schedule-route-arrival">
                ${escapeHtml(route.arrivalTime)}
                <small>着</small>
            </span>
        `
        : "";

    if (!departureHtml && !arrivalHtml) return "";

    return `
        <div class="schedule-route-time">

            ${departureHtml}

            ${departureHtml && arrivalHtml
                ? '<i class="bi bi-arrow-right"></i>'
                : ""
            }

            ${arrivalHtml}

        </div>
    `;
}


// ==================================================
// 07. 移動経路の操作ボタン
// ==================================================

// 時刻表・地図・外部リンクを描画
function renderRouteActions(route, includeMap = true) {

    // 時刻表ボタン
    const timetableHtml =
        (route.timetable ?? []).length > 0
            ? `
                <button type="button"
                        class="schedule-route-timetable"
                        data-route-id="${escapeHtml(route.id)}">

                    <i class="bi bi-clock"></i>
                    時刻表

                </button>
            `
            : "";

    // 経路地図ボタン
    const routeUrl = getSafeUrl(route.routeUrl);

    const mapHtml = includeMap && routeUrl
        ? `
            <a class="schedule-route-link"
               href="${escapeHtml(routeUrl)}"
               target="_blank"
               rel="noopener noreferrer">

                <i class="bi bi-geo-alt"></i>
                経路

            </a>
        `
        : "";

    // 外部リンク
    const linksHtml = (route.links ?? [])
        .map(link => {

            const url = getSafeUrl(link.url);

            if (!url) return "";

            return `
                <a class="schedule-route-link"
                   href="${escapeHtml(url)}"
                   target="_blank"
                   rel="noopener noreferrer">

                    ${escapeHtml(
                        link.label || "関連サイト"
                    )}

                    <i class="bi bi-box-arrow-up-right"></i>

                </a>
            `;
        })
        .join("");

    if (!timetableHtml && !mapHtml && !linksHtml) {
        return "";
    }

    return `
        <div class="schedule-route-actions">

            ${timetableHtml}

            ${mapHtml}

            ${linksHtml}

        </div>
    `;
}


// ==================================================
// 08. スケジュールの補足メモ
// ==================================================

// スケジュールのメモを描画
function renderScheduleNote(schedule) {

    if (!schedule.note) return "";

    return `
        <div class="schedule-note editorial-note">

            <i class="bi bi-info-circle" aria-hidden="true"></i>
            <div class="schedule-note-text">${escapeHtml(schedule.note)}</div>

        </div>
    `;
}


// ==================================================
// 09. スケジュールの進捗状態
// ==================================================

// 現在時刻に応じて進捗状態を更新
function updateScheduleStatus(now = new Date()) {

    const schedules = getSchedules();

    const tripDate = getTrip().date;

    schedules.forEach(schedule => {

        const status = getScheduleStatus(
            schedule,
            tripDate,
            now
        );

        const $item = $(".schedule-item").filter(
            function () {
                return $(this).attr("data-schedule-id")
                    === schedule.id;
            }
        );

        $item
            .removeClass(
                "is-completed is-current is-upcoming"
            )
            .addClass(`is-${status}`);
    });
}


// ==================================================
// 10. イベント登録
// ==================================================

// スケジュール画面のイベントを登録
function bindScheduleEvents() {

    const $list = $("#schedule-list");

    // イベントの重複登録を防止
    $list.off(".schedule");

    // スケジュールカードの開閉
    $list.on(
        "click.schedule",
        ".schedule-card-header",
        function () {

            toggleScheduleCard($(this));

        }
    );

    // キーボードによるカードの開閉
    $list.on(
        "keydown.schedule",
        ".schedule-card-header",
        function (event) {

            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();

            toggleScheduleCard($(this));

        }
    );

    // スポット詳細を開く
    $list.on(
        "click.schedule",
        ".schedule-spot-item",
        function (event) {

            // 地図・メニューボタンの操作時は除外
            if (
                $(event.target)
                    .closest("a, .schedule-spot-menu")
                    .length
            ) {
                return;
            }

            const spotId = $(this).attr(
                "data-spot-id"
            );

            openSpotDetail(spotId);

        }
    );

    // メニューを開く
    $list.on(
        "click.schedule",
        ".schedule-spot-menu",
        function (event) {

            event.stopPropagation();

            const spotId = $(this).attr(
                "data-spot-id"
            );

            openSpotDetail(spotId, true);

        }
    );

    // 時刻表を開く
    $list.on(
        "click.schedule",
        ".schedule-route-timetable",
        function (event) {

            event.stopPropagation();

            const routeId = $(this).attr(
                "data-route-id"
            );

            openTimetable(routeId);

        }
    );
}

// スケジュールカードの開閉状態を切り替え
function toggleScheduleCard($header) {

    if ($header.hasClass("has-no-detail")) {
        return;
    }

    const $card = $header.closest(".schedule-card");

    $card.toggleClass("is-open");

    $header.attr(
        "aria-expanded",
        $card.hasClass("is-open") ? "true" : "false"
    );
}


// ==================================================
// 11. 画像読み込みエラー
// ==================================================

// 写真が読み込めなかった場合は非表示にする
function handleScheduleImageErrors() {

    $("#schedule-list .schedule-photo img")
        .each(function () {

            const hideImage = () => {
                $(this).closest(".schedule-photo").addClass("is-placeholder");
            };

            $(this).one("error", hideImage);

            if (
                this.complete &&
                this.naturalWidth === 0
            ) {
                hideImage();
            }
        });
}