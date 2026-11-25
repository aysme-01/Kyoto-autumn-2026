// 画面遷移の識別番号
let navigationId = 0;

// 現在の画面の後処理関数
let pageCleanup = null;


// ==================================================
// 画面の読み込み
// ==================================================

async function loadPage(page) {
    const currentId = ++navigationId;

    // HTMLを取得
    const html = await $.get(`views/${page}.html?v=20261125-2215`);

    // 古い画面遷移の処理は中断
    if (currentId !== navigationId) {
        return false;
    }

    // 現在の画面の後処理
    if (pageCleanup) {
        pageCleanup();
        pageCleanup = null;
    }

    // HTMLを差し替え
    $("#app-content").html(html);

    return true;
}


// ==================================================
// 現在のページ名を取得
// ==================================================

function getCurrentPage() {
    const page = location.hash.slice(1);
    const pages = ["home", "schedule", "spots"];

    return pages.includes(page) ? page : "home";
}


// ==================================================
// ページ固有の描画処理
// ==================================================

function renderPage(page) {
    switch (page) {
        case "home":
            return renderHome();

        case "spots":
            return renderSpots();

        case "schedule":
            return renderSchedule();

        default:
            return null;
    }
}


// ==================================================
// 画面遷移
// ==================================================

async function navigate() {
    const page = getCurrentPage();
    const loaded = await loadPage(page);

    if (loaded) {

        // 描画処理を実行し、後処理関数を保持
        pageCleanup = renderPage(page);

        // フッターナビゲーションを更新
        updateNavigation(page);
        document.getElementById("app-content").scrollTop = 0;
        window.scrollTo(0, 0);
    }
}


// ==================================================
// ルーターの初期化
// ==================================================

async function initRouter() {
    $(window).on("hashchange", navigate);
    await navigate();
}