// ==================================================
// 01. スポット詳細モーダルの表示
// ==================================================

// スポット詳細モーダルを開く
function openSpotDetail(spotId, scrollToMenu = false) {

    const spot = getSpotById(spotId);

    if (!spot) return;

    const modalElement =
        document.getElementById("spot-detail-modal");

    if (!modalElement) return;

    const $modal = $(modalElement);
    const opener = document.activeElement;
    $modal.off("hidden.bs.modal.spotDetail")
        .one("hidden.bs.modal.spotDetail", () => opener?.isConnected && opener.focus());

    // 詳細内容を描画
    $("#spot-detail-content").html(
        renderSpotDetail(spot)
    );

    // 画像の読み込み失敗時は写真領域を非表示
    $modal.find("img").each(function () {

        const hideImage = () => {
            if ($(this).closest(".spot-detail-photo-inner").length) { $(this).remove(); return; }
            $(this).closest(
                ".spot-detail-photo, " +
                ".spot-detail-gallery-photo, " +
                ".spot-highlight-photo, " +
                ".spot-menu-photo"
            ).hide();
        };

        $(this).one("error", hideImage);

        if (this.complete && this.naturalWidth === 0) {
            hideImage();
        }
    });

    // モーダル表示後の処理
    $modal
        .off("shown.bs.modal.spotDetail")
        .one("shown.bs.modal.spotDetail", function () {

            const body = modalElement.querySelector(
                ".modal-body"
            );

            body.scrollTop = 0;

            // メニューボタンから開いた場合
            if (scrollToMenu) {

                const menu = document.getElementById(
                    "spot-detail-menu"
                );

                if (menu) {
                    body.scrollTop =
                        menu.getBoundingClientRect().top -
                        body.getBoundingClientRect().top +
                        body.scrollTop;
                }
            }
        });

    // Bootstrapモーダルを表示
    const modal = bootstrap.Modal.getOrCreateInstance(
        modalElement
    );

    modal.show();
}


// ==================================================
// 02. スポット詳細全体の描画
// ==================================================

// スポット詳細のHTMLを生成
function renderSpotDetail(spot) {
    const photoHtml = spot.image ? `
        <figure class="spot-detail-photo">
            <div class="spot-detail-photo-inner">
                <div class="spot-detail-placeholder"><i class="${getSpotIcon(spot.type)}"></i><span>KYOTO</span></div>
                <img src="${escapeHtml(spot.image)}" alt="${escapeHtml(spot.name)}">
            </div>
        </figure>` : "";
    const tags = [spot.area, getSpotTypeName(spot.type), !isScheduledSpot(spot.id) ? "候補" : null]
        .filter(Boolean).map(tag => `<span class="spot-detail-tag">${escapeHtml(tag)}</span>`).join("");

    return `
        <article class="spot-detail">
            ${photoHtml}
            <div class="spot-detail-heading">
                <div class="spot-detail-title-line">
                    <i class="${getSpotIcon(spot.type)} spot-detail-type-icon" aria-hidden="true"></i>
                    <h2 class="spot-detail-name">${escapeHtml(spot.name)}</h2>
                    ${renderSpotMapLink(spot, true)}
                </div>
                ${spot.reading ? `<div class="spot-detail-reading">${escapeHtml(spot.reading)}</div>` : ""}
                ${tags ? `<div class="spot-detail-tags">${tags}</div>` : ""}
                ${spot.description ? `<p class="spot-detail-description">${escapeHtml(spot.description)}</p>` : ""}
            </div>
            ${renderSpotDetailFacts(spot)}
            ${renderSpotDetailReservations(spot)}
            ${renderSpotDetailHighlights(spot)}
            ${renderMenu(spot)}
            ${renderSpotDetailGallery(spot)}
            ${renderSpotDetailNote(spot)}
            ${renderSpotDetailLinks(spot)}
        </article>
    `;
}


// Reference-style, compact factual rows. Duration belongs to the itinerary, not a spot.
function renderSpotDetailFacts(spot) {
    const row = (icon, label, content) => `<div class="spot-fact-row">
        <dt><i class="${icon}" aria-hidden="true"></i><span>${escapeHtml(label)}</span></dt>
        <dd>${content}</dd>
    </div>`;
    const sub = value => value ? `<small>${escapeHtml(value)}</small>` : "";
    const hours = (spot.businessHours ?? []).map(h => {
        const time = formatTimeRange(h.openTime, h.closeTime);
        const label = h.label || "営業時間";
        return row("bi bi-clock", label === "拝観・営業" ? (["temple", "shrine"].includes(spot.type) ? "拝観時間" : "営業時間") : label,
            `${escapeHtml(time || "未定")}${sub(h.lastAdmissionTime ? `最終受付 ${h.lastAdmissionTime}` : "")}${sub(h.note)}`);
    }).join("");
    const fees = (spot.fees ?? []).map(f => row("bi bi-currency-yen", ["temple", "shrine"].includes(spot.type) ? "拝観料" : "料金",
        `${f.label && f.label !== "料金" ? `<span class="spot-fact-qualifier">${escapeHtml(f.label)}</span> ` : ""}${escapeHtml(formatPrice(f.price))}${sub(f.note)}`)).join("");
    const other = [
        ["bi bi-calendar3", "定休日", spot.closedDays],
        ["bi bi-geo-alt", "住所", spot.address],
        ["bi bi-signpost", "アクセス", spot.access],
        ["bi bi-telephone", "電話番号", spot.phone]
    ].filter(([, , value]) => value).map(([icon, label, value]) => row(icon, label, escapeHtml(value))).join("");
    return hours || fees || other ? `<dl class="spot-facts">${hours}${fees}${other}</dl>` : "";
}


// ==================================================
// 03. 共通セクション
// ==================================================

// 詳細情報のセクションを生成
function renderSpotDetailSection(title, icon, content) {

    if (!content || !content.trim()) return "";

    return `
        <section class="spot-detail-section">

            <h3 class="spot-detail-section-title">
                <i class="${icon}"></i>
                ${escapeHtml(title)}
            </h3>

            ${content}

        </section>
    `;
}


// ==================================================
// 04. 外部リンク
// ==================================================

// 地図・公式サイトへのリンクを描画
function renderSpotMapLink(spot, iconOnly = false) {

    const coordinates = Number.isFinite(spot.latitude) && Number.isFinite(spot.longitude)
        ? `${spot.latitude},${spot.longitude}`
        : null;
    const query = coordinates ?? spot.address ?? `${spot.name} 京都`;
    const mapUrl = getSafeUrl(spot.mapUrl) ||
        (spot.id === "sample-restaurant" ? null :
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);

    return mapUrl
        ? `
            <a class="spot-detail-link ${iconOnly ? "spot-name-map" : "spot-map-action"}"
               aria-label="地図を開く"
               href="${escapeHtml(mapUrl)}"
               target="_blank"
               rel="noopener noreferrer">

                <i class="bi bi-geo-alt"></i>
                ${iconOnly ? "" : "地図を開く"}

            </a>
        `
        : "";

}

function renderSpotDetailLinks(spot) {
    const officialUrl = getSafeUrl(spot.officialUrl);
    const officialHtml = officialUrl
        ? `
            <a class="spot-detail-link"
               href="${escapeHtml(officialUrl)}"
               target="_blank"
               rel="noopener noreferrer">

                <i class="bi bi-box-arrow-up-right"></i>
                公式サイト

            </a>
        `
        : "";

    const tabelogUrl = getSafeUrl(spot.tabelogUrl);
    const tabelogHtml = tabelogUrl ? `<a class="spot-detail-link" href="${escapeHtml(tabelogUrl)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> 食べログ</a>` : "";
    const mapHtml = renderSpotMapLink(spot);
    if (!mapHtml && !officialHtml && !tabelogHtml) return "";

    return `
        <div class="spot-detail-links spot-detail-actions">
            ${mapHtml}
            ${officialHtml}
            ${tabelogHtml}
        </div>
    `;
}


// ==================================================
// 05. 予約情報
// ==================================================

// スポットに関連する予約情報を描画
function renderSpotDetailReservations(spot) {

    const reservations = getReservationsBySpotId(
        spot.id
    );

    if (reservations.length === 0) return "";

    const content = reservations.map(reservation => {

        const date = reservation.date ?? getTrip().date;

        const time = reservation.reservationTime
            ?? "時間指定なし";

        const linksHtml = (reservation.links ?? [])
            .map(link => {

                const url = getSafeUrl(link.url);

                if (!url) return "";

                return `
                    <a class="spot-detail-link"
                       href="${escapeHtml(url)}"
                       target="_blank"
                       rel="noopener noreferrer">

                        ${escapeHtml(link.label)}
                        <i class="bi bi-box-arrow-up-right"></i>

                    </a>
                `;
            })
            .join("");

        return `
            <div class="spot-detail-reservation">

                <div class="spot-detail-reservation-title">
                    ${escapeHtml(reservation.title)}
                </div>

                <div class="spot-detail-reservation-time">
                    ${escapeHtml(formatDateJP(date))}
                    ${escapeHtml(time)}
                </div>

                ${reservation.note
                    ? `
                        <div class="spot-detail-subtext">${escapeHtml(reservation.note)}</div>
                    `
                    : ""
                }

                ${linksHtml
                    ? `
                        <div class="spot-detail-links">
                            ${linksHtml}
                        </div>
                    `
                    : ""
                }

            </div>
        `;
    }).join("");

    return renderSpotDetailSection(
        "予約情報",
        "bi bi-calendar-check",
        content
    );
}


// ==================================================
// 06. 営業時間・定休日
// ==================================================

// 営業時間を描画
function renderSpotDetailHours(spot) {

    const hoursHtml = (spot.businessHours ?? [])
        .map(hours => `
            <div class="spot-detail-data-item">

                <div class="spot-detail-data-row">

                    <span class="spot-detail-data-label">
                        ${escapeHtml(
                            hours.label || "営業時間"
                        )}
                    </span>

                    <span class="spot-detail-data-value">
                        ${escapeHtml(
                            formatTimeRange(
                                hours.openTime,
                                hours.closeTime
                            ) || "未定"
                        )}
                    </span>

                </div>

                ${hours.lastAdmissionTime
                    ? `
                        <div class="spot-detail-admission">
                            最終受付
                            ${escapeHtml(
                                hours.lastAdmissionTime
                            )}
                        </div>
                    `
                    : ""
                }

                ${hours.note
                    ? `
                        <div class="spot-detail-subtext">
                            ${escapeHtml(hours.note)}
                        </div>
                    `
                    : ""
                }

            </div>
        `)
        .join("");

    const closedDaysHtml = spot.closedDays
        ? `
            <div class="spot-detail-data-item">

                <div class="spot-detail-data-row">

                    <span class="spot-detail-data-label">
                        定休日
                    </span>

                    <span class="spot-detail-data-value">
                        ${escapeHtml(spot.closedDays)}
                    </span>

                </div>

            </div>
        `
        : "";

    return renderSpotDetailSection(
        "拝観・営業時間",
        "bi bi-clock",
        hoursHtml + closedDaysHtml
    );
}


// ==================================================
// 07. 料金
// ==================================================

// 料金情報を描画
function renderSpotDetailFees(spot) {

    const content = (spot.fees ?? [])
        .map(fee => `
            <div class="spot-detail-data-item">

                <div class="spot-detail-data-row">

                    <span class="spot-detail-data-label">
                        ${escapeHtml(fee.label || "料金")}
                    </span>

                    <span class="spot-detail-data-value">
                        ${escapeHtml(
                            formatPrice(fee.price)
                        )}
                    </span>

                </div>

                ${fee.note
                    ? `
                        <div class="spot-detail-subtext">
                            ${escapeHtml(fee.note)}
                        </div>
                    `
                    : ""
                }

            </div>
        `)
        .join("");

    return renderSpotDetailSection(
        "料金",
        "bi bi-currency-yen",
        content
    );
}


// ==================================================
// 08. 見どころ
// ==================================================

// 見どころ一覧を描画
function renderSpotDetailHighlights(spot) {

    const content = (spot.highlights ?? [])
        .map(highlight => `
            <div class="spot-highlight-item">

                ${highlight.image
                    ? `
                        <div class="spot-highlight-photo">

                            <img
                                src="${escapeHtml(
                                    highlight.image
                                )}"
                                alt="${escapeHtml(
                                    highlight.title
                                )}"
                                loading="lazy">

                        </div>
                    `
                    : ""
                }

                <div class="spot-highlight-title">
                    ${escapeHtml(highlight.title)}
                </div>

                ${highlight.description
                    ? `
                        <div class="spot-highlight-description">
                            ${escapeHtml(
                                highlight.description
                            )}
                        </div>
                    `
                    : ""
                }

            </div>
        `)
        .join("");

    return renderSpotDetailSection(
        "見どころ",
        "bi bi-camera",
        content
    );
}


// ==================================================
// 09. フォトギャラリー
// ==================================================

// 追加写真を描画
function renderSpotDetailGallery(spot) {

    const images = [...new Set(spot.images ?? [])]
        .filter(image => image && image !== spot.image);

    if (images.length === 0) return "";

    const imagesHtml = images.map(image => `
        <div class="spot-detail-gallery-photo">

            <img src="${escapeHtml(image)}"
                 alt="${escapeHtml(spot.name)}"
                 loading="lazy">

        </div>
    `).join("");

    return renderSpotDetailSection(
        "写真",
        "bi bi-images",
        `
            <div class="spot-detail-gallery">
                ${imagesHtml}
            </div>
        `
    );
}


// ==================================================
// 10. アクセス・施設情報
// ==================================================

// アクセス情報を描画
function renderSpotDetailAccess(spot) {

    const items = [
        {
            label: "住所",
            value: spot.address
        },
        {
            label: "アクセス",
            value: spot.access
        },
        {
            label: "電話番号",
            value: spot.phone
        }
    ];

    const content = items
        .filter(item => item.value)
        .map(item => `
            <div class="spot-detail-access-item">

                <div class="spot-detail-access-label">
                    ${escapeHtml(item.label)}
                </div>

                <div class="spot-detail-access-value">
                    ${escapeHtml(item.value)}
                </div>

            </div>
        `)
        .join("");

    return renderSpotDetailSection(
        "アクセス・施設情報",
        "bi bi-geo-alt",
        content
    );
}


// ==================================================
// 11. 補足メモ
// ==================================================

// スポットの補足メモを描画
function renderSpotDetailNote(spot) {
    if (!spot.note) return "";
    return `<p class="spot-detail-note editorial-note"><i class="bi bi-info-circle" aria-hidden="true"></i><span>${escapeHtml(spot.note)}</span></p>`;
}
