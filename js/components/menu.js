// ==================================================
// 01. メニュー一覧の描画
// ==================================================

// スポットのメニュー一覧を描画
function renderMenu(spot) {

    const menus = spot.menus ?? [];

    // メニューがない場合は表示しない
    if (menus.length === 0) {
        return "";
    }

    // メニュー一覧のHTML生成
    const menusHtml = menus
        .map(menu => renderMenuItem(menu))
        .join("");

    return `
        <section class="spot-detail-section"
                 id="spot-detail-menu">

            <h3 class="spot-detail-section-title">
                <i class="fa-solid fa-utensils"></i>
                お品書き
            </h3>

            <div class="spot-menu-list">
                ${menusHtml}
            </div>

        </section>
    `;
}


// ==================================================
// 02. メニュー項目の描画
// ==================================================

// メニュー1件分のHTMLを生成
function renderMenuItem(menu) {

    // メニュー写真
    const imageHtml = menu.image
        ? `
            <div class="spot-menu-photo">
                <img src="${escapeHtml(menu.image)}"
                     alt="${escapeHtml(menu.name)}"
                     loading="lazy">
            </div>
        `
        : "";

    // メニューの説明
    const descriptionHtml = menu.description
        ? `
            <div class="spot-menu-description">
                ${escapeHtml(menu.description)}
            </div>
        `
        : "";

    return `
        <div class="spot-menu-item">

            ${imageHtml}

            <div class="spot-menu-info">

                <div class="spot-menu-name">
                    ${escapeHtml(menu.name)}
                </div>

                <div class="spot-menu-price">
                    ${escapeHtml(formatPrice(menu.price))}
                </div>

                ${descriptionHtml}

            </div>

        </div>
    `;
}