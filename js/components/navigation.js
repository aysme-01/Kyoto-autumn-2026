// ナビゲーションの選択状態を更新
function updateNavigation(page) {
    $(".footer-link").removeClass("active");

    $(`.footer-link[data-page="${page}"]`).addClass("active");
}