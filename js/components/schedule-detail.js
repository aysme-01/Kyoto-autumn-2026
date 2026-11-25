
// ========================================
// 予定詳細モーダルを開く
// ========================================

function openScheduleDetail(scheduleId) {

    const schedule = getScheduleById(scheduleId);

    if (!schedule) return;

    ensureScheduleDetailModal();

    const $modal = $("#schedule-detail-modal");

    $modal.find("#schedule-detail-title")
        .text(schedule.title);

    const detailHtml = schedule.type === "transport"
        ? renderTransportBody(schedule)
        : renderScheduleBody(schedule);

    const reservationHtml =
        renderScheduleReservations(schedule.id);

    const noteHtml = renderScheduleNote(schedule);

    $modal.find("#schedule-detail-content").html(`

        <div class="schedule-detail-summary">

            <div class="schedule-detail-heading">

                <i class="${getScheduleIcon(schedule.type)}"></i>

                <h3>${escapeHtml(schedule.title)}</h3>

            </div>

            <div class="schedule-detail-time">

                <i class="bi bi-clock"></i>

                ${escapeHtml(
                    formatTimeRange(
                        schedule.startTime,
                        schedule.endTime
                    )
                )}

                <span>
                    ${escapeHtml(getHomeDuration(schedule))}
                </span>

            </div>

            ${schedule.description
                ? `<p>${escapeHtml(schedule.description)}</p>`
                : ""
            }

            ${reservationHtml
                ? `
                    <div class="schedule-spot-tags">
                        ${reservationHtml}
                    </div>
                `
                : ""
            }

        </div>

        <div class="schedule-detail-body">

            ${detailHtml.trim()
                ? detailHtml
                : '<p class="schedule-detail-empty">追加の詳細情報はありません。</p>'
            }

            ${noteHtml}

        </div>

    `);

    $modal.find(".modal-body").scrollTop(0);

    bootstrap.Modal
        .getOrCreateInstance($modal[0])
        .show();
}


// ========================================
// モーダルの初期生成
// ========================================

function ensureScheduleDetailModal() {

    if ($("#schedule-detail-modal").length) {
        return;
    }

    $("body").append(`

        <div class="modal fade schedule-detail-modal"
             id="schedule-detail-modal"
             tabindex="-1"
             aria-labelledby="schedule-detail-title"
             aria-hidden="true">

            <div class="modal-dialog
                        modal-dialog-centered
                        modal-dialog-scrollable">

                <div class="modal-content">

                    <div class="modal-header">

                        <h2 class="modal-title"
                            id="schedule-detail-title">
                            予定詳細
                        </h2>

                        <button type="button"
                                class="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="閉じる">
                        </button>

                    </div>

                    <div class="modal-body"
                         id="schedule-detail-content">
                    </div>

                    <div class="modal-footer">

                        <button type="button"
                                class="schedule-detail-close"
                                data-bs-dismiss="modal">
                            閉じる
                        </button>

                    </div>

                </div>

            </div>

        </div>

    `);

    bindScheduleDetailEvents();
}


// ========================================
// 詳細モーダル内のイベント
// ========================================

function bindScheduleDetailEvents() {

    const $modal = $("#schedule-detail-modal");

    // スポット詳細
    $modal.on(
        "click.scheduleDetail",
        ".schedule-spot-item",
        function (event) {

            if ($(event.target)
                .closest("a, .schedule-spot-menu").length) {
                return;
            }

            const spotId = $(this).attr("data-spot-id");

            if (!spotId) return;

            closeScheduleDetailThen(() => {
                openSpotDetail(spotId);
            });
        }
    );

    // メニュー
    $modal.on(
        "click.scheduleDetail",
        ".schedule-spot-menu",
        function (event) {

            event.stopPropagation();

            const spotId = $(this).attr("data-spot-id");

            if (!spotId) return;

            closeScheduleDetailThen(() => {
                openSpotDetail(spotId, true);
            });
        }
    );

    // 時刻表
    $modal.on(
        "click.scheduleDetail",
        ".schedule-route-timetable",
        function (event) {

            event.stopPropagation();

            const routeId = $(this).attr("data-route-id");

            if (!routeId) return;

            closeScheduleDetailThen(() => {
                openTimetable(routeId);
            });
        }
    );
}


// ========================================
// モーダルを閉じてから別のモーダルを開く
// ========================================

function closeScheduleDetailThen(callback) {

    const element =
        document.getElementById("schedule-detail-modal");

    const modal = bootstrap.Modal.getInstance(element);

    if (!modal || !element.classList.contains("show")) {

        callback();
        return;
    }

    element.addEventListener(
        "hidden.bs.modal",
        callback,
        { once: true }
    );

    modal.hide();
}
