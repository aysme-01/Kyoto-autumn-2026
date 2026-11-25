// ==================================================
// 01. データの読み込み
// ==================================================

let tripData = null;

// 旅行データの読み込み
async function loadTripData() {
    if (tripData !== null) {
        return tripData;
    }

    tripData = await $.getJSON("./data/trip.json?v=20261126-taxi4");

    return tripData;
}


// ==================================================
// 02. 旅行基本情報
// ==================================================

// 旅行基本情報の取得
function getTrip() {
    return tripData.trip;
}


// ==================================================
// 03. スケジュール情報
// ==================================================

// スケジュール一覧の取得
function getSchedules() {
    return tripData.schedules;
}

// IDに一致するスケジュールの取得
function getScheduleById(scheduleId) {
    return getSchedules().find(
        schedule => schedule.id === scheduleId
    );
}

// 表示順に並べたスケジュール一覧の取得
function getSortedSchedules() {
    return [...getSchedules()].sort(
        (a, b) => a.sortOrder - b.sortOrder
    );
}

// スポットに関連するスケジュール一覧の取得
function getSchedulesBySpot(spotId) {
    return getSortedSchedules().filter(
        schedule => schedule.spotIds.includes(spotId)
    );
}


// ==================================================
// 04. スポット情報
// ==================================================

// スポット一覧の取得
function getSpots() {
    return tripData.spots;
}

// IDに一致するスポット情報の取得
function getSpotById(spotId) {
    return getSpots().find(
        spot => spot.id === spotId
    );
}

// スケジュールに紐づくスポット一覧の取得
function getSpotsBySchedule(scheduleId) {
    const schedule = getScheduleById(scheduleId);

    if (!schedule) return [];

    return schedule.spotIds
        .map(spotId => getSpotById(spotId))
        .filter(spot => spot != null);
}

// 訪問予定のスポットかどうかを判定
function isScheduledSpot(spotId) {
    return getSchedules().some(
        schedule => schedule.spotIds.includes(spotId)
    );
}

// 訪問予定スポット一覧の取得
function getScheduledSpots() {
    return getSpots().filter(
        spot => isScheduledSpot(spot.id)
    );
}

// 候補スポット一覧の取得
function getCandidateSpots() {
    return getSpots().filter(
        spot => !isScheduledSpot(spot.id)
    );
}


// ==================================================
// 05. 移動経路情報
// ==================================================

// 移動経路一覧の取得
function getRoutes() {
    return tripData.routes;
}

// IDに一致する移動経路の取得
function getRouteById(routeId) {
    return getRoutes().find(
        route => route.id === routeId
    );
}

// スケジュールに紐づく移動経路の取得
function getRoutesBySchedule(scheduleId) {
    return getRoutes()
        .filter(route => route.scheduleId === scheduleId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}


// ==================================================
// 06. 予約情報
// ==================================================

// 予約情報一覧の取得
function getReservations() {
    return tripData.reservations;
}

// IDに一致する予約情報の取得
function getReservationById(reservationId) {
    return getReservations().find(
        reservation => reservation.id === reservationId
    );
}

// スポットに紐づく予約情報を取得
function getReservationsBySpot(scheduleId, spotId) {
    return getReservations().filter(reservation =>
        reservation.spotId === spotId &&
        (
            reservation.scheduleId == null ||
            reservation.scheduleId === scheduleId
        )
    );
}

// スケジュールに関連する予約情報を取得
function getReservationsBySchedule(scheduleId) {
    const schedule = getScheduleById(scheduleId);

    if (!schedule) return [];

    return getReservations().filter(reservation => {

        // スケジュールに直接紐づく予約
        if (reservation.scheduleId === scheduleId) {
            return true;
        }

        // スポットのみに紐づく予約
        return reservation.scheduleId == null &&
            schedule.spotIds.includes(reservation.spotId);
    });
}

// スポットに関連するすべての予約情報を取得
function getReservationsBySpotId(spotId) {
    return getReservations().filter(
        reservation => reservation.spotId === spotId
    );
}


// ==================================================
// 07. メモ情報
// ==================================================

// メモ一覧の取得
function getNotes() {
    return tripData.notes;
}

// ID順に並べたメモ一覧の取得
function getSortedNotes() {
    return [...getNotes()].sort(
        (a, b) => a.id.localeCompare(b.id)
    );
}