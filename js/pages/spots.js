function getSpotCollection(spot) {
    if (["restaurant", "cafe"].includes(spot.type)) return "food";
    if (spot.type === "shop") return "souvenir";
    if (spot.area === "嵐山") return "arashiyama";
    if (["東山", "祇園", "河原町"].includes(spot.area)) return "higashiyama";
    return null;
}

function renderSpots() {
    const $page = $(".spots-page");
    const $grid = $page.find("#spots-grid");
    const spots = [...getScheduledSpots(), ...getCandidateSpots()];

    function showCollection(filter) {
        const visible = spots.filter(spot => filter === "all" || getSpotCollection(spot) === filter || (filter === "souvenir" && spot.id === "ito"));
        $page.find("#spots-count").text(`${visible.length}件のスポット`);
        $page.find("[data-spot-filter]").each(function () {
            this.setAttribute("aria-pressed", String(this.dataset.spotFilter === filter));
        });
        $grid.html(visible.map(spot => `
            <button class="spots-card" type="button" data-detail-spot="${escapeHtml(spot.id)}">
                <span class="spots-card-photo" aria-hidden="true">
                    <i class="${getSpotIcon(spot.type)}"></i><small>KYOTO</small>
                    ${spot.image ? `<img src="${escapeHtml(spot.image)}" alt="" loading="lazy">` : ""}
                </span>
                <span class="spots-card-meta">
                    ${escapeHtml(spot.area ?? getSpotTypeName(spot.type))}
                    ${isScheduledSpot(spot.id) ? "" : '<span class="spots-candidate">候補</span>'}
                </span>
                <span class="spots-card-name">${escapeHtml(spot.name)}</span>
            </button>
        `).join("") || '<p class="spots-empty">この分類のスポットはまだありません。</p>');

        $grid.find("img").each(function () {
            const image = this;
            const removeImage = () => image.remove();
            image.addEventListener("error", removeImage, { once: true });
            if (image.complete && !image.naturalWidth) removeImage();
        });
    }

    $page.on("click.spots", "[data-spot-filter]", function () {
        showCollection(this.dataset.spotFilter);
    });
    $page.on("click.spots", "[data-detail-spot]", function () {
        openSpotDetail(this.dataset.detailSpot);
    });
    showCollection("all");
    return () => $page.off(".spots");
}
