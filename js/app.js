
// 初期化処理
$(async function () {
  try {
    // 旅行データの読み込み
    await loadTripData();

    // 共通ヘッダーの描画
    renderHeader();

    // 画面の読み込み
    await initRouter();

  } catch (error) {
    console.error("初期化に失敗しました", error);
  }
});


