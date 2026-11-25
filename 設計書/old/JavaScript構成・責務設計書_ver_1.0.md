# JavaScript構成・責務設計書 ver.1.0

対象：秋の京都 旅のしおり

## 1. 基本方針

静的HTML・jQuery・Bootstrapを使用する。JSON取得、共通計算、画面描画、共通UI、起動処理を分離する。現段階では通常のscriptタグで読み込み、ES Modulesへの移行は必須としない。必要なファイルから順次作成する。

## 2. ディレクトリ構成

```text
js/
├── app.js                 起動・初期化
├── core/
│   ├── data.js            JSON取得・データ参照
│   ├── utils.js           共通計算・整形
│   └── router.js          画面切替・遷移管理
├── pages/
│   ├── home.js            ホーム画面
│   ├── schedule.js        スケジュール画面
│   └── spots.js           スポット一覧画面
└── components/
    ├── header.js          共通ヘッダー・予約リスト
    ├── navigation.js      下部ナビゲーション
    ├── reservation.js     予約詳細UI（必要時）
    ├── spot-detail.js     スポット詳細モーダル
    ├── timetable.js       時刻表モーダル
    └── menu.js            メニューモーダル
```

## 3. ファイル別責務

関数名は実装時の候補であり、未実装の関数も含む。

| ファイル                  | 配置する処理                                                                    | 配置しない処理                         | 関数例                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| app.js                    | 初期化、初期画面表示、各初期化関数の呼び出し、起動エラー処理                    | 個別HTML生成、JSON検索、日付計算       | 初期化コールバック                                                                       |
| core/data.js              | JSON取得・キャッシュ、旅行情報取得、ID検索、関連データ取得                      | DOM操作、モーダル制御、表示用HTML生成  | loadTripData, getTrip, getSchedules, getSpotById, getRoutesByScheduleId, getReservations |
| core/utils.js             | 日付・曜日・時刻・金額の整形、所要時間計算                                      | JSON取得、画面固有処理、DOM操作        | formatDate, getDayOfWeek, formatTime, formatPrice, calculateDuration                     |
| core/router.js            | HTML部分ビュー取得、app-content差し替え、画面別描画関数の呼び出し、画面遷移管理 | 各画面のカード生成                     | loadPage                                                                                 |
| pages/home.js             | NOW/NEXT、進捗表示、天気表示、メモなどホーム固有の描画・更新                    | 共通ヘッダー、共通モーダルの内部実装   | renderHome, renderNowNext, renderProgress                                                |
| pages/schedule.js         | 縦タイムライン、予定カード、移動カード、現在時刻による強調、画面固有イベント    | JSON直接取得、共通モーダル内部実装     | renderSchedule, renderScheduleCard, updateScheduleHighlight                              |
| pages/spots.js            | スポット一覧、訪問予定・候補の分類、一覧のイベント                              | 詳細モーダルの内部実装                 | renderSpots                                                                              |
| components/header.js      | 日付・曜日、予約ドロップダウン、予約なしの場合の非表示                          | JSON直接取得、予約詳細モーダル内部実装 | renderHeader, renderHeaderDate, renderReservationList                                    |
| components/navigation.js  | 下部ナビのイベント、選択状態の表示、routerへの遷移依頼                          | 部分ビューの取得・差し替え             | initNavigation, updateNavigation                                                         |
| components/reservation.js | 予約詳細表示が必要になった場合の共通UI                                          | ヘッダーの一覧描画                     | showReservationDetail                                                                    |
| components/spot-detail.js | スポット詳細、写真、営業時間、料金、公式リンクの表示                            | スポット一覧の描画                     | showSpotDetail                                                                           |
| components/timetable.js   | 路線別時刻表、予定便・次便の強調、スクロール位置制御                            | スケジュールカードの描画               | showTimetable                                                                            |
| components/menu.js        | 飲食店のメニュー表示                                                            | 飲食予定カードの描画                   | showMenu                                                                                 |

## 4. 依存関係

- app.js は data、header、navigation、router の初期化を呼び出す。
- router.js はページを切り替え、対応する pages の描画関数を呼び出す。
- pages と components は data.js の取得関数、utils.js の共通関数を利用できる。
- pages は共通モーダルの公開関数を呼び出す。
- navigation.js は router.js に遷移を依頼する。router側から選択状態を更新する場合は、遷移処理を再発火させない。
- data.js と utils.js は画面描画に依存しない。utils.js は旅行データを直接参照しない。

## 5. 初期化・画面遷移

1. DOM準備完了後、app.js の初期化処理を実行。
2. loadTripData() を await し、JSONを読み込む。
3. renderHeader() で共通ヘッダーを描画。
4. initNavigation() で共通ナビゲーションを初期化（実装後）。
5. loadPage("home") を await し、部分ビューを取得・差し替え。
6. 対応する画面描画関数を呼び出す。
7. ナビゲーションの選択状態を更新する（実装後）。

画面切替時は原則JSONを再取得しない。差し替え後に画面固有イベントを設定する。タイマーやイベントの重複登録を防ぐため、画面離脱時に必要な解除処理を行う。

## 6. script読み込み順序

全ファイル実装後の想定順序。存在しないファイルのscriptタグは追加しない。

```html
<!-- 外部ライブラリ：jQuery、Bootstrap Bundleの順に読み込む -->
<!-- 基盤 -->
<script src="js/core/utils.js"></script>
<script src="js/core/data.js"></script>
<!-- 共通UI -->
<script src="js/components/header.js"></script>
<script src="js/components/reservation.js"></script>
<script src="js/components/spot-detail.js"></script>
<script src="js/components/timetable.js"></script>
<script src="js/components/menu.js"></script>
<!-- 画面 -->
<script src="js/pages/home.js"></script>
<script src="js/pages/schedule.js"></script>
<script src="js/pages/spots.js"></script>
<!-- 遷移・起動 -->
<script src="js/core/router.js"></script>
<script src="js/components/navigation.js"></script>
<script src="js/app.js"></script>
```

通常のscriptタグではグローバル名前空間を共有するため、関数・変数の重複命名に注意する。各ファイルのトップレベルで未読み込みの関数を実行しない。

## 7. 現時点の移行手順

- data.js を core/data.js に移動（名称維持）。
- common.js を core/utils.js に移動・改名。
- app.js の loadPage を core/router.js に移動。
- renderHeader を components/header.js に移動。必要に応じ renderHeaderDate と renderReservationList に分割。
- index.html のscriptパスを更新。app.js は最後に読み込む。
- JSON取得、日付・曜日表示、ホーム画面表示が従来通り動くことを確認。
- 予約リスト以降は必要なファイルを順次作成する。

## 8. 実装上の補足

- 予約リストは header.js が担当する。予約詳細専用UIが不要なら reservation.js は作成しない。
- 現在時刻による予定判定はホームと予定画面で共用するため、必要になった時点で共通の予定判定関数を検討する。純粋な時刻計算は utils.js、予定データに依存する判定は data.js または専用の共通ロジックへ分離する。
- JSON由来の文字列は原則 text() 等で安全に表示する。HTMLテンプレートに埋め込む場合は適切にエスケープし、外部URLも検証する。
- 本設計書は構成案であり、未実装の機能・関数名は実装時に見直す。
