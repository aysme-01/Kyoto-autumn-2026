// ==================================================
// 01. 時刻表モーダルの表示
// ==================================================

// 時刻表モーダルを開く
function openTimetable(routeId) {

    const route = getRouteById(routeId);

    if (!route) return;

    const modalElement =
        document.getElementById("timetable-modal");

    if (!modalElement) return;

    const $modal = $(modalElement);

    // 時刻表の内容を描画
    $("#timetable-content").html(
        renderTimetable(route)
    );

    // モーダル表示後の処理
    $modal
        .off("shown.bs.modal.timetable")
        .one("shown.bs.modal.timetable", function () {

            scrollToTimetableDeparture(modalElement);
        });

    // Bootstrapモーダルを表示
    const modal = bootstrap.Modal.getOrCreateInstance(
        modalElement
    );

    modal.show();
}


// ==================================================
// 02. 時刻表全体の描画
// ==================================================

// 時刻表のHTMLを生成
function renderTimetable(route, now = new Date()) {

    const timetable = sortTimetable(
        route.timetable ?? []
    );

    const tripDate = getTrip().date;

    // 次発便を取得
    const nextDeparture = getNextDeparture(
        timetable,
        tripDate,
        now
    );

    // 路線情報
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

    // 時刻表の各行を生成
    const rowsHtml = timetable.map(item =>
        renderTimetableRow(
            item,
            route,
            nextDeparture,
            tripDate,
            now
        )
    ).join("");

    return `
        <div class="timetable-detail">

            <div class="timetable-heading">

                <div class="timetable-line">
                    <i class="${getTransportIcon(
                        route.transportType
                    )}"></i>

                    ${escapeHtml(
                        lineText ||
                        getTransportName(
                            route.transportType
                        )
                    )}
                </div>

                <div class="timetable-route">
                    ${escapeHtml(route.departure)}
                    →
                    ${escapeHtml(route.arrival)}
                </div>

                ${directionText
                    ? `
                        <div class="timetable-direction">
                            ${escapeHtml(directionText)}
                        </div>
                    `
                    : ""
                }

                <div class="timetable-date">
                    ${escapeHtml(formatDateJP(tripDate))}
                    ${escapeHtml(getDayOfWeek(tripDate))}
                </div>

            </div>

            ${timetable.length > 0
                ? `
                    <div class="timetable-table-wrap">

                        <table class="timetable-table">

                            <thead>
                                <tr>
                                    <th>出発</th>
                                    <th>到着</th>
                                    <th>種別・方面</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                ${rowsHtml}
                            </tbody>

                        </table>

                    </div>
                `
                : `
                    <div class="timetable-empty">
                        時刻表は登録されていません
                    </div>
                `
            }

            ${renderTimetableLinks(route)}

            ${route.note
                ? `
                    <div class="timetable-note">
                        <i class="bi bi-info-circle"></i>
                        ${escapeHtml(route.note)}
                    </div>
                `
                : ""
            }

        </div>
    `;
}


// ==================================================
// 03. 時刻表の各行の描画
// ==================================================

// 時刻表1件分のHTMLを生成
function renderTimetableRow(
    item,
    route,
    nextDeparture,
    tripDate,
    now
) {

    // 予定便かどうか
    const isPlanned =
        item.departureTime === route.departureTime &&
        item.arrivalTime === route.arrivalTime;

    // 次発便かどうか
    const isNext = item === nextDeparture;

    // 出発済みかどうか
    const isPast = isPastDeparture(
        item.departureTime,
        tripDate,
        now
    );

    // 状態に応じたCSSクラス
    const classes = [
        "timetable-row",
        isPlanned ? "is-planned" : "",
        isNext ? "is-next" : "",
        isPast ? "is-past" : ""
    ].filter(Boolean).join(" ");

    // 種別・方面・乗り場
    const serviceText = [
        item.serviceType,
        item.direction,
        item.platform
            ? `${item.platform}番乗り場`
            : ""
    ].filter(Boolean).join(" ／ ");

    return `
        <tr class="${classes}">

            <td class="timetable-departure">
                ${escapeHtml(item.departureTime ?? "―")}
            </td>

            <td class="timetable-arrival">
                ${escapeHtml(item.arrivalTime ?? "―")}
            </td>

            <td class="timetable-service">

                ${escapeHtml(serviceText || "―")}

                ${item.note
                    ? `
                        <div class="timetable-row-note">
                            ${escapeHtml(item.note)}
                        </div>
                    `
                    : ""
                }

            </td>

            <td class="timetable-status">

                ${isPlanned
                    ? `
                        <span class="timetable-tag tag-planned">
                            予定便
                        </span>
                    `
                    : ""
                }

                ${isNext
                    ? `
                        <span class="timetable-tag tag-next">
                            次発便
                        </span>
                    `
                    : ""
                }

            </td>

        </tr>
    `;
}


// ==================================================
// 04. 外部リンク
// ==================================================

// 時刻表に関連する外部リンクを描画
function renderTimetableLinks(route) {

    const linksHtml = (route.links ?? [])
        .map(link => {

            const url = getSafeUrl(link.url);

            if (!url) return "";

            return `
                <a class="timetable-link"
                   href="${escapeHtml(url)}"
                   target="_blank"
                   rel="noopener noreferrer">

                    <span>
                        ${escapeHtml(link.label || "関連サイト")}
                    </span>

                    <i class="bi bi-box-arrow-up-right"></i>

                </a>
            `;
        })
        .join("");

    if (!linksHtml) return "";

    return `
        <div class="timetable-links">
            ${linksHtml}
        </div>
    `;
}


// ==================================================
// 05. 自動スクロール
// ==================================================

// 予定便・次発便までスクロール
function scrollToTimetableDeparture(modalElement) {

    const body = modalElement.querySelector(
        ".modal-body"
    );

    if (!body) return;

    // 初期位置をリセット
    body.scrollTop = 0;

    // 次発便を優先し、なければ予定便を取得
    const target =
        body.querySelector(".timetable-row.is-next") ??
        body.querySelector(".timetable-row.is-planned");

    if (!target) return;

    // 対象の便が中央付近に来るように調整
    const targetTop =
        target.getBoundingClientRect().top -
        body.getBoundingClientRect().top +
        body.scrollTop;

    body.scrollTop = Math.max(
        0,
        targetTop - body.clientHeight / 2 +
        target.offsetHeight / 2
    );
}