# JavaScript構成・責務設計書 ver.1.1

対象：AYtabi 秋の京都 旅のしおり

## 1. 基本方針

静的HTML・jQuery・Bootstrapを使用する。JSON取得、共通計算、画面描画、共通UI、起動処理を分離する。現段階では通常のscriptタグで読み込み、ES Modulesへの移行は必須としない。必要なファイルから順次作成する。画面の骨組みは views/ の部分HTMLに置き、動的なカード等はJSで生成する。JSON・部分HTMLの取得にはHTTP(S)環境を使用し、file:// での直接起動は対象外とする。

## 2. ディレクトリ構成

```text
AYtabi/
├── index.html
├── views/
│   ├── home.html
│   ├── schedule.html
│   └── spots.html
├── js/
│   ├── app.js                 起動・初期化
│   ├── core/
│   │   ├── data.js            JSON取得・データ参照
│   │   ├── utils.js           共通計算・整形
│   │   └── router.js          画面切替・遷移管理
│   ├── pages/
│   │   ├── home.js            ホーム画面
│   │   ├── schedule.js        スケジュール画面
│   │   └── spots.js           スポット一覧画面
│   └── components/
│       ├── header.js          共通ヘッダー・予約リスト
│       ├── navigation.js      下部ナビゲーション
│       ├── spot-detail.js     スポット詳細モーダル
│       ├── timetable.js       時刻表HTML生成・表示制御
│       └── menu.js            メニューHTML生成
├── css/
├── data/
└── assets/
```

## 3. ファイル別責務

関数名は実装時の候補であり、未実装の関数も含む。

| ファイル | 配置する処理 | 配置しない処理 | 関数例 |
|---|---|---|---|
| app.js | 初期化、初期画面表示、各初期化関数の呼び出し、起動エラー処理 | 個別HTML生成、JSON検索、日付計算 | 初期化コールバック |
| core/data.js | JSON取得・キャッシュ、旅行情報取得、ID検索、関連データ取得 | DOM操作、モーダル制御、表示用HTML生成 | loadTripData, getTrip, getSchedules, getSpotById, getRoutesByScheduleId, getReservations |
| core/utils.js | 日付・曜日・時刻・金額の整形、所要時間計算 | JSON取得、画面固有処理、DOM操作 | formatDate, getDayOfWeek, formatTime, formatPrice, calculateDuration |
| core/router.js | ハッシュ監視、部分HTML取得、app-content差し替え、画面別描画関数の呼び出し、解除関数管理、非同期遷移の競合防止 | 各画面のカード生成 | initRouter, loadPage |
| pages/home.js | NOW/NEXT、進捗表示、天気表示、メモなどホーム固有の描画・更新 | 共通ヘッダー、共通モーダルの内部実装 | renderHome, renderNowNext, renderProgress |
| pages/schedule.js | 縦タイムライン、予定カード、移動カード、現在時刻による強調、画面固有イベント | JSON直接取得、共通モーダル内部実装 | renderSchedule, renderScheduleCard, updateScheduleHighlight |
| pages/spots.js | スポット一覧、訪問予定・候補の分類、一覧のイベント | 詳細モーダルの内部実装 | renderSpots |
| components/header.js | 日付・曜日、予約ドロップダウン、予約なしの場合の非表示 | JSON直接取得、画面固有の予約表示 | renderHeader, renderHeaderDate, renderReservationList |
| components/navigation.js | 下部ナビのイベント、ハッシュ変更、選択状態の表示 | routerの直接呼び出し、部分ビューの取得・差し替え | initNavigation, updateNavigation |
| components/spot-detail.js | スポット詳細、写真、営業時間、料金、公式リンク、メニュー区画の表示 | スポット一覧の描画 | showSpotDetail |
| components/timetable.js | 時刻表HTML生成、予定便・次便の強調、モーダル表示・スクロール制御 | スケジュールカードの描画 | renderTimetable, showTimetable |
| components/menu.js | 飲食店のメニューHTML生成 | モーダルの開閉、飲食予定カードの描画 | renderMenu |

## 4. 依存関係

- app.js は data、header、navigation、router の初期化を呼び出す。
- router.js はページを切り替え、対応する pages の描画関数を呼び出す。
- pages と components は data.js の取得関数、utils.js の共通関数を利用できる。
- pages は共通モーダルの公開関数を呼び出す。
- navigation.js はクリック時に location.hash を変更するだけとし、router.js を直接呼び出さない。router.js は hashchange を監視し、描画完了後に updateNavigation() を呼び出す。依存方向は router → navigation とする。
- spot-detail.js は menu.js の renderMenu(spot) を利用する。時刻表・メニューのHTML生成関数はDOMを直接変更せず、呼び出し側が表示先を決める。
- data.js と utils.js は画面描画に依存しない。utils.js は旅行データを直接参照しない。

## 5. 初期化・画面遷移

1. DOM準備完了後、app.js の初期化処理を実行。
2. loadTripData() を await し、JSONを読み込む。
3. renderHeader() で共通ヘッダーを描画。
4. initNavigation() で共通ナビゲーションを初期化（実装後）。
5. initRouter() を呼び出し、hashchange を一度だけ登録する。
6. 初期ハッシュに対応する画面を表示する。未指定の場合はホームとする。

### 5-1. 画面遷移

1. ナビゲーション操作で location.hash を変更する（例：#schedule）。
2. router.js が hashchange を受け、home・schedule・spots の許可リストで遷移先を検証する。不正な値はホームへ正規化する。
3. loadPage(page) で `$.get()`により部分HTMLを取得する。
4. 最新の遷移要求であることを確認する。連番等で古い非同期応答を破棄する。
5. 現画面の解除関数を実行し、app-content を差し替える。
6. 対応する画面描画関数を呼び出し、返された解除関数を保持する。
7. updateNavigation(page) で選択状態を更新する。

画面切替時は原則JSONを再取得しない。URLのハッシュを直接指定したアクセスやブラウザの戻る・進むにも対応する。取得失敗時はエラーを通知し、取得済みの現画面を不用意に破棄しない。

### 5-2. 画面離脱時の解除

- 各画面の描画関数は、必要に応じて解除関数を返す。解除対象がなければ undefined でよい。
- router.js は次の画面への差し替え直前に保持した解除関数を一度だけ実行する。
- 画面固有のタイマー、外部DOMへのイベント登録、非同期更新等は各画面の解除関数で停止・解除する。
- 非同期の画面更新も離脱後にDOMを書き換えないようにする。
- 共通ヘッダーやナビゲーションのイベントは起動時に一度だけ登録する。

```javascript
function renderHome() {
    // ホーム固有の描画処理
    const timer = setInterval(updateNowNext, 60000);
    return () => clearInterval(timer);
}
```

## 6. script読み込み順序

全ファイル実装後の想定順序。存在しないファイルのscriptタグは追加しない。

```html
<!-- 外部ライブラリ：jQuery、Bootstrap Bundleの順に読み込む -->
<!-- 基盤 -->
<script src="js/core/utils.js"></script>
<script src="js/core/data.js"></script>
<!-- 共通UI -->
<script src="js/components/menu.js"></script>
<script src="js/components/navigation.js"></script>
<script src="js/components/header.js"></script>
<script src="js/components/spot-detail.js"></script>
<script src="js/components/timetable.js"></script>
<!-- 画面 -->
<script src="js/pages/home.js"></script>
<script src="js/pages/schedule.js"></script>
<script src="js/pages/spots.js"></script>
<!-- 遷移・起動 -->
<script src="js/core/router.js"></script>
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
- ハッシュ遷移と解除関数の管理を router.js に追加し、直接アクセス・戻る・進む・連続切替を確認する。
- 予約リスト以降は必要なファイルを順次作成する。

## 8. 実装上の補足

- 予約リストは header.js が担当する。reservation.js は現構成から除外し、予約詳細専用UIが必要になった時点で追加を検討する。
- renderMenu(spot) はHTML文字列を返す。スポット詳細内にメニュー区画を設け、予定画面のメニューボタンからはスポット詳細を開いて該当区画へスクロールする方針とする。Bootstrapモーダルは同時に複数開かない。
- renderTimetable(route) はHTML文字列を返す。showTimetable(route) はモーダルへの挿入・表示・スクロールを担当する。ホーム等への再利用時は必要な表示範囲を呼び出し側で指定する設計を検討する。
- 現在時刻による予定判定はホームと予定画面で共用するため、必要になった時点で共通の予定判定関数を検討する。純粋な時刻計算は utils.js、予定データに依存する判定は data.js または専用の共通ロジックへ分離する。
- JSON由来の文字列は原則 text() 等で安全に表示する。HTMLテンプレートに埋め込む場合は適切にエスケープし、外部URLも検証する。
- 本設計書は構成案であり、未実装の機能・関数名は実装時に見直す。

## 9. 更新履歴

- ver.1.0：初版。
- ver.1.1：部分HTML取得方式の明確化、ハッシュ遷移、解除関数管理、非同期競合対策、メニュー・時刻表のHTML生成部品化、予約詳細専用ファイルの除外。
