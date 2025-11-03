// 行事曆分頁渲染函數
function renderCalendar(subPage) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="h-[50px] flex items-center justify-around border-b border-gray-200 bg-white">
            <button data-subtab="overview" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'overview' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">總覽</button>
            <button data-subtab="schedule" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'schedule' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">行程表</button>
            <button data-subtab="notifications" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'notifications' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">訊息通知</button>
        </div>
        <div id="sub-page-content" class="overflow-y-auto" style="height: calc(100% - 50px);"></div>`;
    
    const subPageContent = document.getElementById('sub-page-content');
    // 導出清理函式供其他頁面在切換時解除監聽
    try { window.__calendarCleanup = cleanupRealtimeSchedulesListeners; } catch (e) {}
    // 初始化即時監聽，確保首次進入非「行程表」分頁也能載入資料
    try { initRealtimeSchedulesListeners(); } catch (e) {}
    try { initRealtimeSettingsListener(); } catch (e) {}
    if (subPage === 'overview') {
        renderCalendarOverview(subPageContent);
    } else if (subPage === 'schedule') {
        renderCalendarSchedule(subPageContent);
    } else if (subPage === 'notifications') {
        renderCalendarNotifications(subPageContent);
    }
    
    // 添加子分頁切換事件監聽器
    setTimeout(() => {
        mainContent.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const subtab = btn.dataset.subtab;
                console.log('Switching to subtab:', subtab);
                
                // 更新按鈕狀態
                mainContent.querySelectorAll('.sub-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-red-100', 'text-red-600');
                    b.classList.add('text-gray-600');
                });
                btn.classList.remove('text-gray-600');
                btn.classList.add('active', 'bg-red-100', 'text-red-600');
                
                // 渲染對應的子分頁內容
                const subPageContent = document.getElementById('sub-page-content');
                if (subtab === 'overview') {
                    renderCalendarOverview(subPageContent);
                } else if (subtab === 'schedule') {
                    renderCalendarSchedule(subPageContent);
                } else if (subtab === 'notifications') {
                    renderCalendarNotifications(subPageContent);
                }
            });
        });
    }, 100);
}

// 總覽子分頁 - 月曆表格
function renderCalendarOverview(container) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    // 使用可變日期狀態以支援連續月份切換
    let displayedDate = new Date(currentYear, currentMonth, 1);
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const markedTitle = `${mm}-${dd} 日期行程表`;
    
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">行事曆總覽</h2>
                    <div class="flex items-center space-x-2">
                        <button id="prev-month" class="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <span id="current-month-year" class="text-lg font-semibold px-4">${currentYear}年${currentMonth + 1}月</span>
                        <button id="next-month" class="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                        <button id="go-today" class="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200">
                            今日
                        </button>
                    </div>
                </div>
                <div id="calendar-grid" class="grid grid-cols-7 gap-1">
                    <!-- 月曆將在這裡動態生成 -->
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <h3 id="marked-title" class="text-lg font-bold text-gray-800 mb-3">${markedTitle}</h3>
                <div id="monthly-events" class="space-y-2">
                    <!-- 標註日期的行程與提醒將在這裡顯示 -->
                </div>
            </div>
    </div>`;
    
    // 載入假日設定後生成月曆，讓假日套用灰底
    fetchHolidaySettingsOnce()
        .catch(() => {})
        .finally(() => {
            generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
            // 初始選取當月中的今天，若非本月則選取本月第一天
            const year = displayedDate.getFullYear();
            const month = displayedDate.getMonth();
            const todayIso = formatYMD(today);
            const isTodayInMonth = (today.getFullYear() === year && today.getMonth() === month);
            const initialIso = isTodayInMonth ? todayIso : formatYMD(new Date(year, month, 1));
            onCalendarDateSelect(initialIso);
            // 一次性載入行程，讓總覽不依賴即時監聽即可顯示
            try { loadSchedulesOnceForOverview(); } catch (e) {}
        });
    
    // 月份切換事件
    document.getElementById('prev-month').addEventListener('click', () => {
        // 向前一個月（自目前顯示的月份）
        displayedDate.setMonth(displayedDate.getMonth() - 1);
        generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
        const y = displayedDate.getFullYear();
        const m = displayedDate.getMonth();
        const isTodayInMonth = (today.getFullYear() === y && today.getMonth() === m);
        const initialIso = isTodayInMonth ? formatYMD(today) : formatYMD(new Date(y, m, 1));
        onCalendarDateSelect(initialIso);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        // 向後一個月（自目前顯示的月份）
        displayedDate.setMonth(displayedDate.getMonth() + 1);
        generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
        const y = displayedDate.getFullYear();
        const m = displayedDate.getMonth();
        const isTodayInMonth = (today.getFullYear() === y && today.getMonth() === m);
        const initialIso = isTodayInMonth ? formatYMD(today) : formatYMD(new Date(y, m, 1));
        onCalendarDateSelect(initialIso);
    });

    // 回到今天
    document.getElementById('go-today').addEventListener('click', () => {
        displayedDate = new Date(today.getFullYear(), today.getMonth(), 1);
        generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
        onCalendarDateSelect(formatYMD(today));
    });
}

// 生成月曆表格
function generateCalendar(year, month) {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('current-month-year');
    
    monthYearSpan.textContent = `${year}年${month + 1}月`;
    
    // 清空現有內容
    calendarGrid.innerHTML = '';
    
    // 星期標題
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'p-2 text-center font-semibold text-gray-600 bg-gray-50';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 獲取月份第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 生成日期格子
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'p-2 min-h-[60px] border border-gray-200 cursor-pointer hover:bg-gray-50';
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        
        if (!isCurrentMonth) {
            dayCell.classList.add('text-gray-400', 'bg-gray-50');
        }
        
        if (isToday) {
            dayCell.classList.add('bg-red-100', 'border-red-300');
        }
        
        // 依國定假日（及設定的週末假日）套用灰底，僅針對本月日期
        try {
            const settings = window.__holidaySettingsCache;
            if (isCurrentMonth && settings) {
                const iso = formatYMD(currentDate);
                const holidaysSet = new Set(settings.holidays || []);
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                const isHoliday = holidaysSet.has(iso) || (settings.weekendIsHoliday && isWeekend);
                if (isHoliday && !isToday) {
                    dayCell.classList.add('bg-gray-200');
                }
            }
        } catch (e) {
            // ignore
        }

        dayCell.dataset.ymd = formatYMD(currentDate);
        dayCell.innerHTML = `
            <div class="text-sm ${isToday ? 'font-bold text-red-600' : ''}">${currentDate.getDate()}</div>
            <div class="text-xs text-gray-500 mt-1" id="events-${currentDate.getTime()}">
                <!-- 事件將在這裡顯示 -->
            </div>
        `;

        dayCell.addEventListener('click', () => {
            onCalendarDateSelect(dayCell.dataset.ymd);
        });
        calendarGrid.appendChild(dayCell);
    }

    // 依使用者上班設定與打卡狀態標色（工作日淺藍、完成綠、異常淺紅）
    applyCalendarStatus(year, month).catch(() => {});
    // 在當月的週五標註值班徽章與人員
    applyFridayDutyBadges(year, month).catch(() => {});
    // 額外事件標記：月事件/個人行程
    applyExtraEventMarkers(year, month).catch(() => {});
}

// 點選月曆日期後，更新下方「日期行程表」內容（目前顯示週五值班名單）
async function onCalendarDateSelect(iso) {
    try {
        try { window.__selectedCalendarIso = iso; } catch (e) {}
        // 更新標題為所選日期
        const title = document.getElementById('marked-title');
        if (title) {
            const d = new Date(iso);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            title.textContent = `${mm}-${dd} 日期行程表`;
        }

        // 高亮選定的日期格（簡單描邊）
        try {
            document.querySelectorAll('#calendar-grid [data-ymd]').forEach(el => {
                el.classList.remove('ring-2','ring-blue-400');
            });
            const selected = document.querySelector(`#calendar-grid [data-ymd="${iso}"]`);
            selected?.classList.add('ring-2','ring-blue-400');
        } catch (e) {}

        await loadDailyMarkedSchedule(iso);
    } catch (e) {
        console.warn('更新選定日期行程表失敗', e);
    }
}

// 載入指定日期的標註行程（整合：週五值班、月事件、個人行程、通知）
async function loadDailyMarkedSchedule(iso) {
    try {
        const listEl = document.getElementById('monthly-events');
        if (!listEl) return;
        const fs = window.__fs;
        const db = window.__db;
        const items = [];

        // 週五值班（settings.general.fridayDutyRoster）僅顯示個人（以 UID 為準，兼容舊姓名資料）
        try {
            if (fs && db) {
                const auth = window.__auth;
                const myUid = auth?.currentUser?.uid || '';
                const usersMap = await fetchUsersOnce().catch(() => ({}));
                const myName = auth?.currentUser ? (usersMap[auth.currentUser.uid] || auth.currentUser.displayName || auth.currentUser.email || '') : '';
                const { doc, getDoc } = fs;
                const settingsRef = doc(db, 'settings', 'general');
                const snap = await getDoc(settingsRef);
                const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};
                const arr = roster[iso] || [];
                const normalize = (s) => (s || '').trim();
                if ((myUid && Array.isArray(arr) && arr.includes(myUid)) || (myName && Array.isArray(arr) && arr.some(n => normalize(n) === normalize(myName)))) {
                    items.push({ type: 'duty', title: '週五值班', detail: '（我）', date: new Date(iso) });
                }
            }
        } catch (e) { /* 忽略載入值班錯誤 */ }

        // 已移除假月事件：僅顯示個人行程與通知

        // 行程（總覽優先使用全員行程，否則退回個人）
        try {
            const schedules = Array.isArray(window.__overviewSchedules)
                ? window.__overviewSchedules
                : (Array.isArray(window.__personalSchedules) ? window.__personalSchedules : []);
            schedules.filter(s => formatYMD(s.date) === iso).forEach(s => {
                items.push({ type: 'personal', title: s.title, detail: `${s.time} ${s.location || ''}`.trim(), date: s.date });
            });
        } catch (e) { /* 忽略行程錯誤 */ }

        // 通知（若已載入至全域，當日通知）
        try {
            const notifs = Array.isArray(window.__notifications) ? window.__notifications : [];
            notifs.filter(n => formatYMD(n.time) === iso).forEach(n => {
                items.push({ type: n.type || 'system', title: `通知：${n.title}`, detail: n.message || '', date: n.time });
            });
        } catch (e) { /* 忽略通知錯誤 */ }

        // 渲染
        listEl.innerHTML = '';
        if (items.length === 0) {
            listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本日暫無標註行程</p>';
            return;
        }
        // 依時間排序（同日顯示即可）
        items.sort((a, b) => a.date - b.date);
        items.forEach(ev => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-md';
            eventDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${getEventColor(ev.type)}"></div>
                    <span class="font-medium">${ev.title}</span>
                    ${ev.detail ? `<span class="text-sm text-gray-600">${ev.detail}</span>` : ''}
                </div>
                <span class="text-sm text-gray-500">${ev.date.getDate()}日</span>
            `;
            listEl.appendChild(eventDiv);
        });
    } catch (e) {
        console.warn('載入指定日期行程失敗', e);
        const listEl = document.getElementById('monthly-events');
        if (listEl) listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本日暫無標註行程</p>';
    }
}

async function applyCalendarStatus(year, month) {
    try {
        const user = window.__auth?.currentUser;
        const fs = window.__fs;
        const db = window.__db;
        if (!user || !fs || !db) return;
        const { doc, getDoc, collection, query, where, getDocs, Timestamp } = fs;

        const ymId = `${year}-${String(month + 1).padStart(2,'0')}`;
        const ref = doc(db, 'users', user.uid, 'workdays', ymId);
        const snap = await getDoc(ref);
        const rawDays = new Set((snap.exists() ? (snap.data().days || []) : []).map(n => Number(n)));

        // 假日優先：過濾出「非假日且週一~週四」的上班日
        let isHoliday = () => false;
        try {
            if (typeof fetchHolidaySettingsOnce === 'function') await fetchHolidaySettingsOnce();
            const hs = window.__holidaySettingsCache || { weekendIsHoliday: false, holidays: [] };
            const holidaysSet = new Set(hs.holidays || []);
            isHoliday = (date) => {
                const ymd = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                return holidaysSet.has(ymd) || (hs.weekendIsHoliday && weekend);
            };
        } catch (e) { /* ignore */ }
        const workdays = new Set(Array.from(rawDays).filter(d => {
            const dt = new Date(year, month, d);
            const w = dt.getDay();
            return !isHoliday(dt) && (w >= 1 && w <= 4); // 週一~週四
        }));

        // 讀取「我」的值班名單（本月週五）作為可標示的天
        let dutySet = new Set();
        try {
            const generalRef = doc(db, 'settings', 'general');
            const setSnap = await getDoc(generalRef);
            const roster = setSnap.exists() ? (setSnap.data().fridayDutyRoster || {}) : {};
            const myUid = user.uid || '';
            const myName = user.displayName || user.email || '';
            Object.keys(roster).forEach(iso => {
                const dt = new Date(iso);
                const arr = roster[iso] || [];
                const normalize = (s) => (s || '').trim();
                const isMine = Array.isArray(arr) && ((myUid && arr.includes(myUid)) || (myName && arr.some(n => normalize(n) === normalize(myName))));
                if (dt.getFullYear() === year && dt.getMonth() === month && isMine) dutySet.add(iso);
            });
        } catch (e) {
            // 無法載入值班名單時略過
        }

        const startTS = Timestamp?.fromDate ? Timestamp.fromDate(new Date(year, month, 1)) : new Date(year, month, 1);
        const endTS = Timestamp?.fromDate ? Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59, 999)) : new Date(year, month + 1, 0, 23, 59, 59, 999);
        const q = query(
            collection(db, 'clockInRecords'),
            where('userId', '==', user.uid),
            where('timestamp', '>=', startTS),
            where('timestamp', '<=', endTS)
        );
        const rs = await getDocs(q);
        const map = new Map(); // iso -> { start:boolean, end:boolean }
        rs.forEach(d => {
            const r = d.data();
            const dt = r.timestamp?.toDate?.() || (r.timestamp ? new Date(r.timestamp) : null);
            if (!dt) return;
            const iso = formatYMD(dt);
            const obj = map.get(iso) || { start:false, end:false };
            if (r.type === '上班') obj.start = true;
            if (r.type === '下班' || r.type === '自動下班') obj.end = true;
            map.set(iso, obj);
        });

        // 讀取本使用者的請假單（核准或審核中），用於月曆橘底標示
        let leaveRanges = [];
        try {
            const leavesRef = collection(db, 'leaves');
            // 僅過濾使用者與狀態，其餘於客端判斷與本月是否相交
            const lq = query(
                leavesRef,
                where('userId', '==', user.uid),
                // Firestore in 查詢：核准或審核中皆視為請假
                where('status', 'in', ['approved', 'pending'])
            );
            const lSnap = await getDocs(lq);
            const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
            lSnap.forEach(docSnap => {
                const lv = docSnap.data() || {};
                const s = lv.leaveStartTime?.toDate?.() || (lv.leaveStartTime ? new Date(lv.leaveStartTime) : null);
                const e = lv.leaveEndTime?.toDate?.() || (lv.leaveEndTime ? new Date(lv.leaveEndTime) : null);
                if (!s || !e) return;
                // 僅保留與本月有交集的請假範圍
                if (e >= monthStart && s <= monthEnd) {
                    leaveRanges.push({ start: s, end: e });
                }
            });
        } catch (e) {
            // 若請假載入失敗，不影響其他標色
        }

        const isLeaveDay = (dateObj) => {
            if (!leaveRanges.length) return false;
            const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
            const dayEnd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
            return leaveRanges.some(r => r.end >= dayStart && r.start <= dayEnd);
        };

        // 套用標色
        const cells = document.querySelectorAll('#calendar-grid [data-ymd]');
        cells.forEach(cell => {
            const iso = cell.dataset.ymd;
            const dt = new Date(iso);
            const d = dt.getDate();
            // 當月日期才標色
            if (dt.getMonth() !== month) return;
            const isTodayCell = cell.classList.contains('bg-red-100');

            const status = map.get(iso);
            if (status && status.start && status.end) {
                cell.classList.remove('bg-gray-200','bg-blue-100','border-blue-300','bg-red-100','border-red-300');
                cell.classList.add('bg-green-100','border-green-300');
                return;
            }
            if (status && (status.start !== status.end)) {
                cell.classList.remove('bg-gray-200','bg-blue-100','border-blue-300','bg-green-100','border-green-300');
                cell.classList.add('bg-red-100','border-red-300');
                return;
            }
            // 請假日優先於一般上班/值班的淺藍色
            if (isLeaveDay(dt)) {
                cell.classList.remove('bg-gray-200','bg-blue-100','border-blue-300','bg-green-100','border-green-300','bg-red-100','border-red-300');
                cell.classList.add('bg-orange-100','border-orange-300');
                return;
            }
            if (workdays.has(d) || dutySet.has(iso)) {
                cell.classList.remove('bg-gray-200');
                cell.classList.add('bg-blue-100','border-blue-300');
                return;
            }
            // 非上班日一律灰色底（保留「今天」樣式）
            if (!isTodayCell) {
                cell.classList.remove('bg-blue-100','border-blue-300','bg-green-100','border-green-300','bg-red-100','border-red-300');
                cell.classList.add('bg-gray-200');
            }
        });
    } catch (e) {
        console.warn('套用行事曆狀態失敗', e);
    }
}

// 載入月份事件
function loadMonthlyEvents(year, month) {
    const monthlyEventsContainer = document.getElementById('monthly-events');
    
    // 模擬事件數據（實際應用中應從Firebase獲取）
    const events = [
        { date: new Date(year, month, 5), title: '月會', type: 'meeting' },
        { date: new Date(year, month, 15), title: '員工訓練', type: 'training' },
        { date: new Date(year, month, 25), title: '績效評估', type: 'evaluation' }
    ];
    
    monthlyEventsContainer.innerHTML = '';
    
    if (events.length === 0) {
        monthlyEventsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無重要事項</p>';
        return;
    }
    
    events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-md';
        eventDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full ${getEventColor(event.type)}"></div>
                <span class="font-medium">${event.title}</span>
            </div>
            <span class="text-sm text-gray-500">${event.date.getDate()}日</span>
        `;
        monthlyEventsContainer.appendChild(eventDiv);
    });
}

// 行程表子分頁
function renderCalendarSchedule(container) {
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">個人行程表</h2>
                    <button id="add-schedule" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>新增行程</span>
                    </button>
                </div>
                
                <div class="space-y-3" id="schedule-list">
                    <!-- 行程列表將在這裡顯示 -->
                </div>
            </div>
        </div>`;
    
    loadPersonalSchedule();
    // 啟用即時監聽（個人與共享行程、設定值班名單）
    try { initRealtimeSchedulesListeners(); } catch (e) {}
    try { initRealtimeSettingsListener(); } catch (e) {}
    
    document.getElementById('add-schedule').addEventListener('click', showAddScheduleModal);
}

// 初始化即時監聽，讓行程與通知即時更新
function initRealtimeSchedulesListeners() {
    try {
        const auth = window.__auth;
        const fs = window.__fs;
        const db = window.__db;
        if (!auth?.currentUser || !fs || !db) return;
        const { collection, collectionGroup, query, where } = fs;

        if (!window.__unsubOwnSchedules && fs?.onSnapshot) {
            const ownRef = collection(db, 'users', auth.currentUser.uid, 'schedules');
            window.__unsubOwnSchedules = fs.onSnapshot(ownRef, async (rs) => {
                try {
                    const usersMap = await fetchUsersOnce().catch(() => ({}));
                    const map = window.__ownSchedulesMap || new Map();
                    map.clear();
                    rs.forEach(d => {
                        const data = d.data();
                        const dateTime = data.dateTime?.toDate?.() || data.date?.toDate?.() ||
                                         (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                        const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                            ? data.time
                            : ((dateTime && typeof dateTime.getHours === 'function')
                                ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                                : '');
                        const schedObj = {
                            id: d.id,
                            title: data.title || '',
                            date: dateTime,
                            time: timeStr,
                            reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                            location: data.location || '',
                            description: data.description || '',
                            remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                            participants: Array.isArray(data.participants) ? data.participants : [],
                            participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                            ownerId: auth.currentUser.uid,
                            origin: 'own'
                        };
                        map.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
                    });
                    window.__ownSchedulesMap = map;
                    rebuildSchedulesFromRealtime();
                } catch (e) { /* ignore */ }
            });
        }

        if (!window.__unsubSharedSchedules && fs?.onSnapshot && typeof collectionGroup === 'function' && typeof query === 'function' && typeof where === 'function') {
            const cg = collectionGroup(db, 'schedules');
            const q = query(cg, where('participants', 'array-contains', auth.currentUser.uid));
            window.__unsubSharedSchedules = fs.onSnapshot(q, async (rs) => {
                try {
                    const usersMap = await fetchUsersOnce().catch(() => ({}));
                    const map = window.__sharedSchedulesMap || new Map();
                    map.clear();
                    rs.forEach(d => {
                        try {
                            const data = d.data();
                            const ownerId = d.ref?.parent?.parent?.id || null;
                            if (ownerId && ownerId === auth.currentUser.uid) return; // 自己的已載入
                            const dateTime = data.dateTime?.toDate?.() || data.date?.toDate?.() ||
                                             (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                            const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                                ? data.time
                                : ((dateTime && typeof dateTime.getHours === 'function')
                                    ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                                    : '');
                            const schedObj = {
                                id: d.id,
                                title: data.title || '',
                                date: dateTime,
                                time: timeStr,
                                reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                                location: data.location || '',
                                description: data.description || '',
                                remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                                participants: Array.isArray(data.participants) ? data.participants : [],
                                participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                                ownerId,
                                origin: 'shared'
                            };
                            map.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
                        } catch (e) { /* ignore */ }
                    });
                    window.__sharedSchedulesMap = map;
                    rebuildSchedulesFromRealtime();
                } catch (e) { /* ignore */ }
            });
        }
    } catch (e) { /* ignore */ }
}

// 初始化即時監聽（settings/general），讓值班名單與標註日期即時更新
function initRealtimeSettingsListener() {
    try {
        const fs = window.__fs; const db = window.__db;
        if (!fs || !db || !fs.onSnapshot || !fs.doc) return;
        if (window.__unsubSettings) return; // 已初始化
        const { doc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        window.__unsubSettings = fs.onSnapshot(settingsRef, (snap) => {
            try {
                const data = snap.exists() ? snap.data() : {};
                window.__fridayDutyRoster = data.fridayDutyRoster || {};
                // 更新通知（合併行程與值班通知，保留已讀與刪除黑名單）
                try { refreshNotificationsFromRealtime(); } catch (e) {}
                // 刷新月曆值班徽章與「標註日期行程表」
                try {
                    const ymText = document.getElementById('current-month-year')?.textContent || '';
                    const y = parseInt(ymText.split('年')[0]);
                    const m = parseInt(ymText.split('年')[1]) - 1;
                    if (!Number.isNaN(y) && !Number.isNaN(m)) {
                        applyFridayDutyBadges(y, m).catch(() => {});
                        loadMarkedSchedule(y, m).catch(() => {});
                    }
                } catch (e) {}
                // 若目前有選定日期，刷新右側列表
                try {
                    const iso = window.__selectedCalendarIso;
                    if (iso) loadDailyMarkedSchedule(iso).catch(() => {});
                } catch (e) {}
            } catch (e) { /* ignore */ }
        });
    } catch (e) { /* ignore */ }
}

// 由快取的值班名單產出通知（避免每次重新抓取設定文件）
function computeDutyNotificationsFromRoster() {
    try {
        const roster = window.__fridayDutyRoster || {};
        const usersMap = window.__usersCache || {};
        const out = [];
        Object.keys(roster).forEach(iso => {
            const fri = new Date(iso);
            if (String(fri) === 'Invalid Date') return;
            const mon = new Date(fri.getTime() - 4 * 86400000);
            const arr = Array.isArray(roster[iso]) ? roster[iso] : [];
            const nameList = arr.map(v => usersMap[v] || v);
            const msgNames = nameList.length ? nameList.join('、') : '（名單未設定）';
            mon.setHours(9, 0, 0, 0);
            out.push({
                id: `duty_${iso}`,
                title: '週五值班通知',
                message: `本週五（${iso}）值班：${msgNames}`,
                time: mon,
                read: false,
                type: 'duty'
            });
        });
        out.sort((a,b) => a.time - b.time);
        return out;
    } catch (e) { return []; }
}

// 合併即時行程與值班通知，保留已讀與黑名單
function refreshNotificationsFromRealtime() {
    try {
        const schedules = Array.isArray(window.__personalSchedules) ? window.__personalSchedules : [];
        const scheduleNotifications = computeScheduleNotifications(schedules);
        const dutyNotifications = computeDutyNotificationsFromRoster();
        const prev = Array.isArray(window.__notifications) ? window.__notifications : [];
        const statusMap = new Map(prev.map(n => [String(n.id), n.status]));
        const byId = new Map();
        const mergeIn = (n) => {
            const id = String(n.id);
            const prevN = byId.get(id);
            byId.set(id, { ...n, status: prevN?.status || statusMap.get(id) || n.status || 'unread' });
        };
        scheduleNotifications.forEach(mergeIn);
        dutyNotifications.forEach(mergeIn);
        let next = Array.from(byId.values()).sort((a,b) => a.time - b.time);
        const deleted = window.__deletedNotificationIds;
        if (deleted && deleted.size) {
            next = next.filter(n => !deleted.has(String(n.id)));
        }
        window.__notifications = next;
        // 若通知列表當前顯示，同步刷新
        try { if (document.getElementById('notifications-list')) loadNotifications(); } catch (e) {}
    } catch (e) { /* ignore */ }
}

// 依據即時監聽資料重建行程與通知並更新 UI
function rebuildSchedulesFromRealtime() {
    try {
        const own = window.__ownSchedulesMap ? Array.from(window.__ownSchedulesMap.values()) : [];
        const shared = window.__sharedSchedulesMap ? Array.from(window.__sharedSchedulesMap.values()) : [];
        const schedules = own.concat(shared);
        schedules.sort((a,b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0));
        // 無論是否在「行程表」子頁都更新全域行程資料，以便總覽月曆即時顯示
        window.__personalSchedules = schedules;

        // 合併行程與值班通知（保留已讀與刪除黑名單）
        refreshNotificationsFromRealtime();

        // 若在「行程表」子頁，才渲染行程列表 UI
        const scheduleList = document.getElementById('schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = '';
            if (schedules.length === 0) {
                scheduleList.innerHTML = '<p class="text-gray-500 text-center py-8">暫無行程安排</p>';
            } else {
                schedules.forEach(schedule => {
                    const scheduleDiv = document.createElement('div');
                    scheduleDiv.className = 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50';
                    const dateText = schedule.date ? schedule.date.toLocaleDateString('zh-TW') : '';
                    scheduleDiv.innerHTML = `
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800">${schedule.title}</h3>
                                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span><i data-lucide=\"calendar\" class=\"w-4 h-4 inline mr-1\"></i>${dateText}</span>
                                    <span><i data-lucide=\"clock\" class=\"w-4 h-4 inline mr-1\"></i>${schedule.time}</span>
                                </div>
                                ${Array.isArray(schedule.participantsNames) && schedule.participantsNames.length ? `<div class=\"mt-2 text-xs text-gray-500\">陪同：${schedule.participantsNames.join('、')}</div>` : ''}
                            </div>
                            <div class="flex items-center space-x-2">
                                ${schedule.origin === 'own' ? `
                                <button class="text-blue-600 hover:text-blue-800 text-sm" data-action="edit" data-id="${schedule.id}">編輯</button>
                                <button class="text-red-600 hover:text-red-800 text-sm" data-action="delete" data-id="${schedule.id}">刪除</button>
                                ` : `
                                <span class="text-xs text-gray-400">共享（僅檢視）</span>
                                `}
                            </div>
                        </div>`;
                    scheduleList.appendChild(scheduleDiv);
                });

                // 綁定編輯/刪除事件
                scheduleList.querySelectorAll('button[data-action="edit"]').forEach(btn => {
                    btn.addEventListener('click', () => showEditScheduleModal(btn.getAttribute('data-id')));
                });
                scheduleList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
                    btn.addEventListener('click', () => deleteSchedule(btn.getAttribute('data-id')));
                });
            }
        }

        // 若通知列表當前顯示，同步刷新（已在 refreshNotificationsFromRealtime 中處理）

        // 刷新月曆彩點（如果當前月份可解析）
        try {
            const ymText = document.getElementById('current-month-year')?.textContent || '';
            const y = parseInt(ymText.split('年')[0]);
            const m = parseInt(ymText.split('年')[1]) - 1;
            if (!Number.isNaN(y) && !Number.isNaN(m)) {
                applyExtraEventMarkers(y, m);
                // 同步刷新標註日期行程表（值班與其他標註）
                loadMarkedSchedule(y, m).catch(() => {});
            }
        } catch (e) {}

        // 若目前有選定日期，刷新右側列表
        try {
            const iso = window.__selectedCalendarIso;
            if (iso) loadDailyMarkedSchedule(iso).catch(() => {});
        } catch (e) {}
    } catch (e) { /* ignore */ }
}

// 總覽一次性載入行程資料，避免首次進入依賴即時監聽延遲
async function loadSchedulesOnceForOverview() {
    try {
        const auth = window.__auth;
        const fs = window.__fs;
        const db = window.__db;
        if (!auth?.currentUser || !fs || !db) return;
        const { collection, getDocs, collectionGroup, query, where } = fs;

        const schedulesMap = new Map();
        const usersMap = await fetchUsersOnce().catch(() => ({}));

        // 載入自己的行程
        try {
            const ownRef = collection(db, 'users', auth.currentUser.uid, 'schedules');
            const ownSnap = await getDocs(ownRef);
            ownSnap.forEach(d => {
                const data = d.data();
                const dateTime = data.dateTime?.toDate?.() || data.date?.toDate?.() ||
                                 (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                    ? data.time
                    : ((dateTime && typeof dateTime.getHours === 'function')
                        ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                        : '');
                const schedObj = {
                    id: d.id,
                    title: data.title || '',
                    date: dateTime,
                    time: timeStr,
                    reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                    location: data.location || '',
                    description: data.description || '',
                    remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                    participants: Array.isArray(data.participants) ? data.participants : [],
                    participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                    ownerId: auth.currentUser.uid,
                    origin: 'own'
                };
                schedulesMap.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
            });
        } catch (e) { /* ignore */ }

        // 載入共享行程（當前使用者為參與者）
        try {
            if (typeof collectionGroup === 'function' && typeof query === 'function' && typeof where === 'function') {
                const cg = collectionGroup(db, 'schedules');
                const q = query(cg, where('participants', 'array-contains', auth.currentUser.uid));
                const sharedSnap = await getDocs(q);
                sharedSnap.forEach(d => {
                    try {
                        const data = d.data();
                        const ownerId = d.ref?.parent?.parent?.id || null;
                        if (ownerId && ownerId === auth.currentUser.uid) return; // 排除自己的（已載入）
                        const dateTime = data.dateTime?.toDate?.() || data.date?.toDate?.() ||
                                         (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                        const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                            ? data.time
                            : ((dateTime && typeof dateTime.getHours === 'function')
                                ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                                : '');
                        const schedObj = {
                            id: d.id,
                            title: data.title || '',
                            date: dateTime,
                            time: timeStr,
                            reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                            location: data.location || '',
                            description: data.description || '',
                            remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                            participants: Array.isArray(data.participants) ? data.participants : [],
                            participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                            ownerId,
                            origin: 'shared'
                        };
                        schedulesMap.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
                    } catch (e) { /* ignore */ }
                });
            }
        } catch (e) { /* ignore */ }

        // 載入所有人的行程（不篩 participants；滿足「總覽顯示所有人」需求）
        try {
            if (typeof collectionGroup === 'function') {
                const cgAll = collectionGroup(db, 'schedules');
                const allSnap = await getDocs(cgAll);
                allSnap.forEach(d => {
                    try {
                        const data = d.data();
                        const ownerId = d.ref?.parent?.parent?.id || null;
                        const key = `${ownerId}:${d.id}`;
                        if (!ownerId || schedulesMap.has(key)) return; // 跳過已載入（自己/共享）
                        const dateTime = data.dateTime?.toDate?.() || data.date?.toDate?.() ||
                                         (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                        const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                            ? data.time
                            : ((dateTime && typeof dateTime.getHours === 'function')
                                ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                                : '');
                        const schedObj = {
                            id: d.id,
                            title: data.title || '',
                            date: dateTime,
                            time: timeStr,
                            reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                            location: data.location || '',
                            description: data.description || '',
                            remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                            participants: Array.isArray(data.participants) ? data.participants : [],
                            participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                            ownerId,
                            origin: ownerId === auth.currentUser.uid ? 'own' : (Array.isArray(data.participants) && data.participants.includes(auth.currentUser.uid) ? 'shared' : 'others')
                        };
                        schedulesMap.set(key, schedObj);
                    } catch (e) { /* ignore */ }
                });
            }
        } catch (e) { /* ignore */ }

        const schedules = Array.from(schedulesMap.values()).sort((a,b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0));
        // 僅更新總覽的行程資料，不影響個人行程與通知
        window.__overviewSchedules = schedules;
        try {
            const ymText = document.getElementById('current-month-year')?.textContent || '';
            const y = parseInt(ymText.split('年')[0]);
            const m = parseInt(ymText.split('年')[1]) - 1;
            if (!Number.isNaN(y) && !Number.isNaN(m)) {
                applyExtraEventMarkers(y, m);
                loadMarkedSchedule(y, m).catch(() => {});
            }
        } catch (e) {}
        try {
            const iso = window.__selectedCalendarIso;
            if (iso) loadDailyMarkedSchedule(iso).catch(() => {});
        } catch (e) {}
    } catch (e) { /* ignore */ }
}

// 解除即時監聽（在切換出行事曆分頁或頁面卸載時呼叫）
function cleanupRealtimeSchedulesListeners() {
    try {
        if (window.__unsubOwnSchedules) {
            try { window.__unsubOwnSchedules(); } catch (e) {}
            window.__unsubOwnSchedules = null;
        }
        if (window.__unsubSharedSchedules) {
            try { window.__unsubSharedSchedules(); } catch (e) {}
            window.__unsubSharedSchedules = null;
        }
        if (window.__unsubSettings) {
            try { window.__unsubSettings(); } catch (e) {}
            window.__unsubSettings = null;
        }
    } catch (e) { /* ignore */ }
}

// 頁面卸載時自動清理，避免殘留監聽
try { window.addEventListener('beforeunload', cleanupRealtimeSchedulesListeners); } catch (e) {}

// 載入個人行程
function loadPersonalSchedule() {
    const scheduleList = document.getElementById('schedule-list');
    const auth = window.__auth;
    const fs = window.__fs;
    const db = window.__db;
    if (!scheduleList) return;

    (async () => {
        try {
            if (!auth?.currentUser || !fs || !db) {
                scheduleList.innerHTML = '<p class="text-gray-500 text-center py-8">請先登入</p>';
                return;
            }
            const { collection, getDocs, collectionGroup, query, where } = fs;
            const ref = collection(db, 'users', auth.currentUser.uid, 'schedules');
            const snap = await getDocs(ref);
            const schedulesMap = new Map();
            // 載入使用者名單供顯示陪同參與人員名稱
            const usersMap = await fetchUsersOnce().catch(() => ({}));
            snap.forEach(d => {
                const data = d.data();
                const dateTime = data.dateTime?.toDate?.() ||
                                  data.date?.toDate?.() ||
                                  (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                    ? data.time
                    : ((dateTime && typeof dateTime.getHours === 'function')
                        ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                        : '');
                const schedObj = {
                    id: d.id,
                    title: data.title || '',
                    date: dateTime,
                    time: timeStr,
                    reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                    location: data.location || '',
                    description: data.description || '',
                    remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                    participants: Array.isArray(data.participants) ? data.participants : [],
                    participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                    ownerId: auth.currentUser.uid,
                    origin: 'own'
                };
                schedulesMap.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
            });
            // 讀取共享給本人的他人行程（collection group 查詢）
            try {
                if (typeof collectionGroup === 'function' && typeof query === 'function' && typeof where === 'function') {
                    const cg = collectionGroup(db, 'schedules');
                    const q = query(cg, where('participants', 'array-contains', auth.currentUser.uid));
                    const rs = await getDocs(q);
                    rs.forEach(d => {
                        try {
                            const data = d.data();
                            const ownerId = d.ref?.parent?.parent?.id || null;
                            if (ownerId && ownerId === auth.currentUser.uid) return; // 自己的已載入
                            const dateTime = data.dateTime?.toDate?.() ||
                                             data.date?.toDate?.() ||
                                             (data.dateTime ? new Date(data.dateTime) : (data.date ? new Date(data.date) : null));
                            const timeStr = (data.time && typeof data.time === 'string' && data.time.includes(':'))
                                ? data.time
                                : ((dateTime && typeof dateTime.getHours === 'function')
                                    ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
                                    : '');
                            const schedObj = {
                                id: d.id,
                                title: data.title || '',
                                date: dateTime,
                                time: timeStr,
                                reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                                location: data.location || '',
                                description: data.description || '',
                                remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                                participants: Array.isArray(data.participants) ? data.participants : [],
                                participantsNames: Array.isArray(data.participants) ? data.participants.map(uid => usersMap?.[uid] || uid) : [],
                                ownerId,
                                origin: 'shared'
                            };
                            schedulesMap.set(`${schedObj.ownerId}:${schedObj.id}`, schedObj);
                        } catch (e) {}
                    });
                }
            } catch (e) {
                console.warn('讀取共享行程失敗', e);
            }
            const schedules = Array.from(schedulesMap.values());
            schedules.sort((a,b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0));
            try { window.__personalSchedules = schedules; } catch (e) {}
            try {
                const prev = Array.isArray(window.__notifications) ? window.__notifications : [];
                const statusMap = new Map(prev.map(n => [String(n.id), n.status]));
                let next = computeScheduleNotifications(schedules).map(n => ({
                    ...n,
                    // 嘗試保留舊版 ID 的已讀狀態（sched_<scheduleId>_<d>）
                    status: (statusMap.get(String(n.id)) ||
                            (() => { try { const p = String(n.id).split('_'); return statusMap.get(`sched_${p[2]}_${p[3]}`); } catch (e) { return null; } })() ||
                            n.status || 'unread')
                }));
                // 若存在刪除黑名單，忽略被刪除的通知
                const deleted = window.__deletedNotificationIds;
                if (deleted && deleted.size) {
                    next = next.filter(n => !deleted.has(String(n.id)));
                }
                window.__notifications = next;
            } catch (e) {}

            scheduleList.innerHTML = '';
            if (schedules.length === 0) {
                scheduleList.innerHTML = '<p class="text-gray-500 text-center py-8">暫無行程安排</p>';
                return;
            }
            schedules.forEach(schedule => {
                const scheduleDiv = document.createElement('div');
                scheduleDiv.className = 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50';
                const dateText = schedule.date ? schedule.date.toLocaleDateString('zh-TW') : '';
                scheduleDiv.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800">${schedule.title}</h3>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><i data-lucide="calendar" class="w-4 h-4 inline mr-1"></i>${dateText}</span>
                                <span><i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>${schedule.time}</span>
                                <span><i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i>${schedule.location}</span>
                            </div>
                            <p class="text-gray-600 mt-2">${schedule.description}</p>
                            ${Array.isArray(schedule.participantsNames) && schedule.participantsNames.length ? `
                            <p class="text-gray-600 mt-2 text-sm"><i data-lucide="users" class="w-4 h-4 inline mr-1"></i>陪同人員：${schedule.participantsNames.join('、')}</p>
                            ` : ''}
                        </div>
                    <div class="flex space-x-2">
                        ${schedule.ownerId === (auth?.currentUser?.uid || '') ? `
                        <button class="text-blue-600 hover:text-blue-800" onclick="editSchedule('${schedule.id}')">
                            <i data-lucide=\"edit\" class=\"w-4 h-4\"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="deleteSchedule('${schedule.id}')">
                            <i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
                scheduleList.appendChild(scheduleDiv);
            });
            try { window.lucide?.createIcons?.(); } catch (e) {}
        } catch (e) {
            console.warn('載入個人行程失敗', e);
            scheduleList.innerHTML = '<p class="text-gray-500 text-center py-8">載入行程失敗</p>';
        }
    })();
}

// 訊息通知子分頁
function renderCalendarNotifications(container) {
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">訊息通知</h2>
                    <button id="mark-all-read" class="text-blue-600 hover:text-blue-800 text-sm">
                        全部標記為已讀
                    </button>
                </div>
                
                <div class="space-y-3" id="notifications-list">
                    <!-- 通知列表將在這裡顯示 -->
                </div>
            </div>
        </div>`;
    
    // 確保即時監聽已初始化
    try { initRealtimeSchedulesListeners(); } catch (e) {}
    try { initRealtimeSettingsListener(); } catch (e) {}
    loadNotifications();
    
    document.getElementById('mark-all-read').addEventListener('click', markAllNotificationsRead);
}

// 載入通知
async function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    const fromSchedules = Array.isArray(window.__personalSchedules) ? window.__personalSchedules : [];
    const existing = Array.isArray(window.__notifications) ? window.__notifications : [];
    const scheduleNotifications = computeScheduleNotifications(fromSchedules);
    let dutyNotifications = [];
    try { dutyNotifications = await computeDutyNotifications(); } catch (e) { dutyNotifications = []; }
    // 合併所有訊息來源（保留既有已讀狀態），確保「顯示所有訊息」
    const byId = new Map();
    // 先放入既有通知（可能包含手動或其它來源）
    existing.forEach(n => {
        byId.set(String(n.id), n);
    });
    // 合併行程提醒與值班通知
    const mergeIn = (n) => {
        const id = String(n.id);
        const prev = byId.get(id);
        byId.set(id, { ...n, status: prev?.status || n.status || 'unread' });
    };
    scheduleNotifications.forEach(mergeIn);
    dutyNotifications.forEach(mergeIn);
    let notifications = Array.from(byId.values()).sort((a, b) => a.time - b.time);
    // 忽略已被刪除的通知（持久化於前端黑名單）
    const deleted = window.__deletedNotificationIds;
    if (deleted && deleted.size) {
        notifications = notifications.filter(n => !deleted.has(String(n.id)));
    }
    try { window.__notifications = notifications; } catch (e) {}

    notificationsList.innerHTML = '';
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="text-gray-500 text-center py-8">暫無通知</p>';
        return;
    }

    notifications.forEach(notification => {
        const notificationDiv = document.createElement('div');
        const readClass = notification.status === 'read' ? 'opacity-60' : '';
        notificationDiv.className = `border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${readClass}`;
        notificationDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-semibold text-gray-800">${notification.title}</h3>
                    </div>
                    <p class="text-gray-600 mt-1">${notification.message}</p>
                    <span class="text-xs text-gray-500 mt-2">${formatTimeAgo(notification.time)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full ${getNotificationColor(notification.type)}"></div>
                    <button class="text-gray-400 hover:text-gray-600" onclick="(event && event.stopPropagation ? event.stopPropagation() : null); deleteNotification('${notification.id}')">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;

        notificationDiv.addEventListener('click', () => markNotificationRead(notification.id));
        notificationsList.appendChild(notificationDiv);
    });

    try { window.lucide?.createIcons?.(); } catch (e) {}
}

// 輔助函數
function getEventColor(type) {
    const colors = {
        'meeting': 'bg-blue-500',
        'training': 'bg-green-500',
        'evaluation': 'bg-yellow-500',
        'duty': 'bg-yellow-500',
        'personal': 'bg-purple-500',
        'default': 'bg-gray-500'
    };
    return colors[type] || colors.default;
}

function getNotificationColor(type) {
    const colors = {
        'meeting': 'bg-blue-500',
        'clock-in': 'bg-green-500',
        'system': 'bg-yellow-500',
        'reminder': 'bg-purple-500',
        'duty': 'bg-yellow-500',
        'default': 'bg-gray-500'
    };
    return colors[type] || colors.default;
}

// 由個人行程產生提醒通知（僅本人的資料）
function computeScheduleNotifications(schedules) {
    try {
        const arr = Array.isArray(schedules) ? schedules : [];
        const out = [];
        arr.forEach(s => {
            const baseDate = s?.date instanceof Date ? s.date : (s?.date ? new Date(s.date) : null);
            if (!baseDate) return;
            // 將行程的時間字串套用到日期（若存在）
            const eventTimeStr = (typeof s.time === 'string' && s.time.includes(':')) ? s.time : null;
            const dt = new Date(baseDate);
            if (eventTimeStr) {
                const [eh, em] = eventTimeStr.split(':').map(v => parseInt(v, 10));
                if (!Number.isNaN(eh) && !Number.isNaN(em)) {
                    dt.setHours(eh, em, 0, 0);
                }
            }
            if (!dt) return;
            const daysArr = Array.isArray(s.remindersDays) ? s.remindersDays : [2,1];
            daysArr.forEach(d => {
                if (typeof d !== 'number') return;
                // 設定提醒時間字串（若有）到 t
                const t = new Date(dt.getTime() - d * 86400000);
                const reminderTimeStr = (typeof s.reminderTime === 'string' && s.reminderTime.includes(':'))
                    ? s.reminderTime
                    : (eventTimeStr || '09:00');
                const [rh, rm] = reminderTimeStr.split(':').map(v => parseInt(v, 10));
                if (!Number.isNaN(rh) && !Number.isNaN(rm)) {
                    t.setHours(rh, rm, 0, 0);
                }
                const ownerPart = s.ownerId || (window.__auth?.currentUser?.uid || 'me');
                out.push({
                    id: `sched_${ownerPart}_${s.id}_${d}`,
                    title: s.title || '行程提醒',
                    message: `行程「${s.title || ''}」於 ${formatYMD(dt)} ${s.time || ''} ${s.location || ''}`.trim(),
                    time: t,
                    read: false,
                    type: 'reminder'
                });
            });
        });
        out.sort((a,b) => a.time - b.time);
        return out;
    } catch (e) {
        console.warn('產生行程提醒通知失敗', e);
        return [];
    }
}

// 由週五值班名單產生通知（於該週一早上發送）
async function computeDutyNotifications() {
    try {
        const fs = window.__fs; const db = window.__db;
        if (!fs || !db) return [];
        const { doc, getDoc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};
        const usersMap = await fetchUsersOnce().catch(() => ({}));
        const out = [];
        Object.keys(roster).forEach(iso => {
            const fri = new Date(iso);
            if (String(fri) === 'Invalid Date') return;
            const mon = new Date(fri.getTime() - 4 * 86400000);
            const arr = Array.isArray(roster[iso]) ? roster[iso] : [];
            const nameList = arr.map(v => usersMap[v] || v);
            const msgNames = nameList.length ? nameList.join('、') : '（名單未設定）';
            // 設定週一 09:00 發送
            mon.setHours(9, 0, 0, 0);
            out.push({
                id: `duty_${iso}`,
                title: '週五值班通知',
                message: `本週五（${iso}）值班：${msgNames}`,
                time: mon,
                read: false,
                type: 'duty'
            });
        });
        out.sort((a,b) => a.time - b.time);
        return out;
    } catch (e) {
        console.warn('產生值班通知失敗', e);
        return [];
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = date - now; // 未來為正值
    const abs = Math.abs(diff);
    const minutes = Math.floor(abs / 60000);
    const hours = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    const suffix = diff >= 0 ? '後' : '前';
    if (minutes < 60) {
        return `${minutes}分鐘${suffix}`;
    } else if (hours < 24) {
        return `${hours}小時${suffix}`;
    } else {
        return `${days}天${suffix}`;
    }
}

// 事件處理函數
function showAddScheduleModal() {
    try {
        const overlay = document.createElement('div');
        overlay.id = 'schedule-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-lg w-full max-w-lg';
        modal.innerHTML = `
            <div class="p-4 border-b flex items-center justify-between">
                <h3 class="text-lg font-semibold">新增行程</h3>
                <button class="text-gray-500 hover:text-gray-700" id="schedule-close">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="p-4 space-y-3">
                <div>
                    <label class="block text-sm text-gray-700">標題</label>
                    <input id="schedule-title" type="text" class="w-full border rounded px-3 py-2" placeholder="輸入標題" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm text-gray-700">日期</label>
                        <input id="schedule-date" type="date" class="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label class="block text-sm text-gray-700">時間</label>
                        <input id="schedule-time" type="time" class="w-full border rounded px-3 py-2" />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm text-gray-700">提醒時間</label>
                        <input id="schedule-reminder-time" type="time" class="w-full border rounded px-3 py-2" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-700">提醒天數（可複選）</label>
                    <div id="schedule-reminder-days" class="flex items-center space-x-4 mt-1">
                        <label class="inline-flex items-center"><input type="checkbox" value="2" class="mr-2" checked>2天前</label>
                        <label class="inline-flex items-center"><input type="checkbox" value="1" class="mr-2" checked>1天前</label>
                        <label class="inline-flex items-center"><input type="checkbox" value="0" class="mr-2">當天</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-700">陪同參與人員（依帳號，可複選）</label>
                    <div id="participants-list" class="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                        <div class="text-sm text-gray-500">載入人員名單中...</div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-700">地點</label>
                    <input id="schedule-location" type="text" class="w-full border rounded px-3 py-2" placeholder="輸入地點（可選）" />
                </div>
                <div>
                    <label class="block text-sm text-gray-700">備註</label>
                    <textarea id="schedule-desc" class="w-full border rounded px-3 py-2" rows="3" placeholder="輸入備註（可選）"></textarea>
                </div>
            </div>
            <div class="p-4 border-t flex justify-end space-x-2">
                <button id="schedule-cancel" class="px-4 py-2 rounded border">取消</button>
                <button id="schedule-save" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">儲存</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        try { window.lucide?.createIcons?.(); } catch (e) {}

        const close = () => { try { overlay.remove(); } catch (e) {} };
        document.getElementById('schedule-close').onclick = close;
        document.getElementById('schedule-cancel').onclick = close;

        const today = new Date();
        document.getElementById('schedule-date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        document.getElementById('schedule-time').value = '09:00';
        document.getElementById('schedule-reminder-time').value = '09:00';

        // 載入人員名單並生成複選項
        (async () => {
            try {
                const users = await fetchUsersOnce();
                const container = document.getElementById('participants-list');
                container.innerHTML = '';
                const auth = window.__auth;
                const entries = Object.entries(users || {});
                if (!entries.length) {
                    container.innerHTML = '<div class="text-sm text-gray-500">目前沒有可選的人員</div>';
                } else {
                    entries.forEach(([uid, name]) => {
                        if (auth?.currentUser?.uid && uid === auth.currentUser.uid) return; // 排除自己
                        const row = document.createElement('label');
                        row.className = 'flex items-center';
                        row.innerHTML = `<input type="checkbox" class="mr-2" value="${uid}"><span class="text-sm">${name}</span>`;
                        container.appendChild(row);
                    });
                }
            } catch (e) {
                console.warn('載入人員名單失敗', e);
            }
        })();

        document.getElementById('schedule-save').onclick = async () => {
            try {
                const title = document.getElementById('schedule-title').value.trim();
                const dateStr = document.getElementById('schedule-date').value;
                const time = document.getElementById('schedule-time').value.trim();
                const reminderTime = document.getElementById('schedule-reminder-time').value.trim();
                const reminderDays = Array.from(document.querySelectorAll('#schedule-reminder-days input[type="checkbox"]'))
                    .filter(el => el.checked)
                    .map(el => parseInt(el.value, 10))
                    .filter(v => !Number.isNaN(v));
                const participants = Array.from(document.querySelectorAll('#participants-list input[type="checkbox"]'))
                    .filter(el => el.checked)
                    .map(el => el.value);
                const location = document.getElementById('schedule-location').value.trim();
                const description = document.getElementById('schedule-desc').value.trim();
                if (!title) { alert('請輸入標題'); return; }
                if (!dateStr) { alert('請選擇日期'); return; }
                const auth = window.__auth; const fs = window.__fs; const db = window.__db;
                if (!auth?.currentUser || !fs || !db) { alert('請先登入'); return; }
                const { collection, addDoc, Timestamp, serverTimestamp } = fs;
                const date = new Date(dateStr);
                const ref = collection(db, 'users', auth.currentUser.uid, 'schedules');
                await addDoc(ref, {
                    title,
                    date: Timestamp?.fromDate ? Timestamp.fromDate(date) : dateStr,
                    time,
                    reminderTime,
                    remindersDays: (Array.isArray(reminderDays) && reminderDays.length) ? reminderDays : [2,1],
                    participants: Array.isArray(participants) ? participants : [],
                    location,
                    description,
                    createdAt: serverTimestamp?.() || new Date().toISOString(),
                    updatedAt: serverTimestamp?.() || new Date().toISOString()
                });
                close();
                loadPersonalSchedule();
                // 重新標記月曆彩點
                try {
                    const ymText = document.getElementById('current-month-year')?.textContent || '';
                    const y = parseInt(ymText.split('年')[0]);
                    const m = parseInt(ymText.split('年')[1]) - 1;
                    if (!Number.isNaN(y) && !Number.isNaN(m)) {
                        applyExtraEventMarkers(y, m);
                    }
                } catch (e) {}
                // 若目前有選定日期，刷新右側列表
                try {
                    const iso = window.__selectedCalendarIso;
                    if (iso) onCalendarDateSelect(iso);
                } catch (e) {}
            } catch (e) {
                console.warn('新增行程失敗', e);
                alert('新增行程失敗');
            }
        };
    } catch (e) {
        console.warn('開啟新增行程視窗失敗', e);
        alert('無法開啟新增行程視窗');
    }
}

function editSchedule(id) {
    try {
        const schedules = Array.isArray(window.__personalSchedules) ? window.__personalSchedules : [];
        let item = schedules.find(s => s.id === id);
        const auth = window.__auth; const fs = window.__fs; const db = window.__db;
        if (!auth?.currentUser || !fs || !db) { alert('請先登入'); return; }
        const { doc, getDoc } = fs;
        (async () => {
            try {
                if (!item) {
                    const ref = doc(db, 'users', auth.currentUser.uid, 'schedules', id);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const data = snap.data();
                        item = {
                            id,
                            title: data.title || '',
                            date: data.date?.toDate?.() || (data.date ? new Date(data.date) : new Date()),
                            time: data.time || '',
                            reminderTime: (typeof data.reminderTime === 'string' && data.reminderTime.includes(':')) ? data.reminderTime : '09:00',
                            remindersDays: Array.isArray(data.remindersDays) ? data.remindersDays : [2,1],
                            participants: Array.isArray(data.participants) ? data.participants : [],
                            location: data.location || '',
                            description: data.description || ''
                        };
                    } else {
                        alert('找不到行程');
                        return;
                    }
                }

                const overlay = document.createElement('div');
                overlay.id = 'schedule-modal-overlay';
                overlay.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
                const modal = document.createElement('div');
                modal.className = 'bg-white rounded-lg shadow-lg w-full max-w-lg';
                const dateValue = `${item.date.getFullYear()}-${String(item.date.getMonth()+1).padStart(2,'0')}-${String(item.date.getDate()).padStart(2,'0')}`;
                modal.innerHTML = `
                    <div class="p-4 border-b flex items-center justify-between">
                        <h3 class="text-lg font-semibold">編輯行程</h3>
                        <button class="text-gray-500 hover:text-gray-700" id="schedule-close">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="p-4 space-y-3">
                        <div>
                            <label class="block text-sm text-gray-700">標題</label>
                            <input id="schedule-title" type="text" class="w-full border rounded px-3 py-2" value="${item.title}" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm text-gray-700">日期</label>
                                <input id="schedule-date" type="date" class="w-full border rounded px-3 py-2" value="${dateValue}" />
                            </div>
                            <div>
                                <label class="block text-sm text-gray-700">時間</label>
                                <input id="schedule-time" type="time" class="w-full border rounded px-3 py-2" value="${item.time || '09:00'}" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm text-gray-700">提醒時間</label>
                                <input id="schedule-reminder-time" type="time" class="w-full border rounded px-3 py-2" value="${item.reminderTime || '09:00'}" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-700">提醒天數（可複選）</label>
                            <div id="schedule-reminder-days" class="flex items-center space-x-4 mt-1">
                                <label class="inline-flex items-center"><input type="checkbox" value="2" class="mr-2">2天前</label>
                                <label class="inline-flex items-center"><input type="checkbox" value="1" class="mr-2">1天前</label>
                                <label class="inline-flex items-center"><input type="checkbox" value="0" class="mr-2">當天</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-700">陪同參與人員（依帳號，可複選）</label>
                            <div id="participants-list" class="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                                <div class="text-sm text-gray-500">載入人員名單中...</div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-700">地點</label>
                            <input id="schedule-location" type="text" class="w-full border rounded px-3 py-2" value="${item.location}" />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-700">備註</label>
                            <textarea id="schedule-desc" class="w-full border rounded px-3 py-2" rows="3">${item.description}</textarea>
                        </div>
                    </div>
                    <div class="p-4 border-t flex justify-end space-x-2">
                        <button id="schedule-cancel" class="px-4 py-2 rounded border">取消</button>
                        <button id="schedule-save" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">儲存</button>
                    </div>
                `;
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                try { window.lucide?.createIcons?.(); } catch (e) {}
                const close = () => { try { overlay.remove(); } catch (e) {} };
                document.getElementById('schedule-close').onclick = close;
                document.getElementById('schedule-cancel').onclick = close;

                // 預設提醒天數勾選
                const days = Array.isArray(item.remindersDays) ? item.remindersDays : [2,1];
                Array.from(document.querySelectorAll('#schedule-reminder-days input[type="checkbox"]')).forEach(el => {
                    const v = parseInt(el.value, 10);
                    if (!Number.isNaN(v) && days.includes(v)) el.checked = true;
                });

                // 載入人員名單並生成複選項，預設勾選既有參與人員
                (async () => {
                    try {
                        const users = await fetchUsersOnce();
                        const container = document.getElementById('participants-list');
                        container.innerHTML = '';
                        const auth = window.__auth;
                        const entries = Object.entries(users || {});
                        const selected = Array.isArray(item.participants) ? item.participants : [];
                        if (!entries.length) {
                            container.innerHTML = '<div class="text-sm text-gray-500">目前沒有可選的人員</div>';
                        } else {
                            entries.forEach(([uid, name]) => {
                                if (auth?.currentUser?.uid && uid === auth.currentUser.uid) return; // 排除自己
                                const row = document.createElement('label');
                                row.className = 'flex items-center';
                                const checked = selected.includes(uid) ? 'checked' : '';
                                row.innerHTML = `<input type="checkbox" class="mr-2" value="${uid}" ${checked}><span class="text-sm">${name}</span>`;
                                container.appendChild(row);
                            });
                        }
                    } catch (e) {
                        console.warn('載入人員名單失敗', e);
                    }
                })();

                document.getElementById('schedule-save').onclick = async () => {
                    try {
                        const title = document.getElementById('schedule-title').value.trim();
                        const dateStr = document.getElementById('schedule-date').value;
                        const time = document.getElementById('schedule-time').value.trim();
                        const reminderTime = document.getElementById('schedule-reminder-time').value.trim();
                        const reminderDays = Array.from(document.querySelectorAll('#schedule-reminder-days input[type="checkbox"]'))
                            .filter(el => el.checked)
                            .map(el => parseInt(el.value, 10))
                            .filter(v => !Number.isNaN(v));
                        const participants = Array.from(document.querySelectorAll('#participants-list input[type="checkbox"]'))
                            .filter(el => el.checked)
                            .map(el => el.value);
                        const location = document.getElementById('schedule-location').value.trim();
                        const description = document.getElementById('schedule-desc').value.trim();
                        if (!title) { alert('請輸入標題'); return; }
                        if (!dateStr) { alert('請選擇日期'); return; }
                        const { doc, updateDoc, Timestamp, serverTimestamp } = fs;
                        const ref = doc(db, 'users', auth.currentUser.uid, 'schedules', id);
                        const date = new Date(dateStr);
                        await updateDoc(ref, {
                            title,
                            date: Timestamp?.fromDate ? Timestamp.fromDate(date) : dateStr,
                            time,
                            reminderTime,
                            remindersDays: (Array.isArray(reminderDays) && reminderDays.length) ? reminderDays : [2,1],
                            participants: Array.isArray(participants) ? participants : [],
                            location,
                            description,
                            updatedAt: serverTimestamp?.() || new Date().toISOString()
                        });
                        close();
                        loadPersonalSchedule();
                        // 重新標記月曆彩點
                        try {
                            const ymText = document.getElementById('current-month-year')?.textContent || '';
                            const y = parseInt(ymText.split('年')[0]);
                            const m = parseInt(ymText.split('年')[1]) - 1;
                            if (!Number.isNaN(y) && !Number.isNaN(m)) {
                                applyExtraEventMarkers(y, m);
                            }
                        } catch (e) {}
                        // 若目前有選定日期，刷新右側列表
                        try {
                            const iso = window.__selectedCalendarIso;
                            if (iso) onCalendarDateSelect(iso);
                        } catch (e) {}
                    } catch (e) {
                        console.warn('更新行程失敗', e);
                        alert('更新行程失敗');
                    }
                };
            } catch (e) {
                console.warn('載入行程資料失敗', e);
                alert('載入行程失敗');
            }
        })();
    } catch (e) {
        console.warn('開啟編輯行程視窗失敗', e);
        alert('無法開啟編輯視窗');
    }
}

function deleteSchedule(id) {
    try {
        if (!confirm('確定要刪除此行程嗎？')) return;
        const auth = window.__auth; const fs = window.__fs; const db = window.__db;
        if (!auth?.currentUser || !fs || !db) { alert('請先登入'); return; }
        const { doc, deleteDoc } = fs;
        (async () => {
            try {
                const ref = doc(db, 'users', auth.currentUser.uid, 'schedules', id);
                await deleteDoc(ref);
                loadPersonalSchedule();
                // 重新標記月曆彩點
                try {
                    const ymText = document.getElementById('current-month-year')?.textContent || '';
                    const y = parseInt(ymText.split('年')[0]);
                    const m = parseInt(ymText.split('年')[1]) - 1;
                    if (!Number.isNaN(y) && !Number.isNaN(m)) {
                        applyExtraEventMarkers(y, m);
                    }
                } catch (e) {}
                // 若目前有選定日期，刷新右側列表
                try {
                    const iso = window.__selectedCalendarIso;
                    if (iso) onCalendarDateSelect(iso);
                } catch (e) {}
            } catch (e) {
                console.warn('刪除行程失敗', e);
                alert('刪除行程失敗');
            }
        })();
    } catch (e) {
        console.warn('刪除行程流程發生錯誤', e);
        alert('刪除行程時發生錯誤');
    }
}

function markNotificationRead(id) {
    try {
        const arr = Array.isArray(window.__notifications) ? window.__notifications : [];
        const idx = arr.findIndex(n => String(n.id) === String(id));
        if (idx >= 0) {
            arr[idx] = { ...arr[idx], status: 'read' };
            window.__notifications = arr;
            loadNotifications();
        }
    } catch (e) {
        console.warn('標記通知為已讀失敗', e);
    }
}

function deleteNotification(id) {
    try {
        if (!confirm('確定要刪除此通知嗎？')) return;
        const arr = Array.isArray(window.__notifications) ? window.__notifications : [];
        const next = arr.filter(n => String(n.id) !== String(id));
        // 將刪除的通知加入黑名單，避免重新生成時再顯示
        try {
            if (!window.__deletedNotificationIds) {
                window.__deletedNotificationIds = new Set();
            }
            window.__deletedNotificationIds.add(String(id));
        } catch (e) {}
        window.__notifications = next;
        loadNotifications();
    } catch (e) {
        console.warn('刪除通知失敗', e);
    }
}

function markAllNotificationsRead() {
    try {
        if (!confirm('確定要將所有通知標記為已讀嗎？')) return;
        const arr = Array.isArray(window.__notifications) ? window.__notifications : [];
        window.__notifications = arr.map(n => ({ ...n, status: 'read' }));
        loadNotifications();
    } catch (e) {
        console.warn('全部標記為已讀失敗', e);
    }
}

// 假日設定載入與工具
function formatYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 週五值班徽章套用
async function applyFridayDutyBadges(year, month) {
    try {
        const fs = window.__fs;
        const db = window.__db;
        if (!fs || !db) return;
        const { doc, getDoc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};
        const auth = window.__auth;
        const usersMap = await fetchUsersOnce().catch(() => ({}));
        const myUid = auth?.currentUser?.uid || '';
        const myName = auth?.currentUser ? (usersMap[auth.currentUser.uid] || auth.currentUser.displayName || auth.currentUser.email || '') : '';

        // 逐一把本月有名單的週五加上徽章
        Object.keys(roster).forEach(iso => {
            const dt = new Date(iso);
            if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
            const arr = roster[iso] || [];
            if (!Array.isArray(arr) || arr.length === 0) return;
            const normalize = (s) => (s || '').trim();
            const isMine = (myUid && arr.includes(myUid)) || (myName && arr.some(n => normalize(n) === normalize(myName)));
            if (!isMine) return; // 僅顯示本人
            const cell = document.querySelector(`#calendar-grid [data-ymd="${iso}"]`);
            if (!cell) return;
            // 值班日視同上班日：未完成打卡與非異常，套用淺藍底
            // 但若為請假日（橘底）則不覆蓋
            if (!cell.classList.contains('bg-green-100') && !cell.classList.contains('bg-red-100') && !cell.classList.contains('bg-orange-100')) {
                cell.classList.remove('bg-gray-200');
                cell.classList.add('bg-blue-100','border-blue-300');
            }
            // 移除舊徽章避免重複疊加
            Array.from(cell.querySelectorAll('.duty-badge-wrap')).forEach(el => el.remove());
            const badgeWrap = document.createElement('div');
            badgeWrap.className = 'mt-1 duty-badge-wrap';
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-300';
            badge.textContent = '值班';
            badge.title = '您本日值班';
            badgeWrap.appendChild(badge);
            cell.appendChild(badgeWrap);
        });
    } catch (e) {
        console.warn('套用週五值班徽章失敗', e);
    }
}

// 額外事件標記：在日期格下加入彩色小點（月事件、個人行程）
async function applyExtraEventMarkers(year, month) {
    try {
        // 僅彙整個人行程（移除假月事件）
        const markers = new Map(); // iso -> [types]

        // 彙整行程（總覽優先使用全員行程）
        const schedules = Array.isArray(window.__overviewSchedules)
            ? window.__overviewSchedules
            : (Array.isArray(window.__personalSchedules) ? window.__personalSchedules : []);
        schedules.forEach(s => {
            if (!s?.date) return;
            const dt = new Date(s.date);
            if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
            const iso = formatYMD(dt);
            const arr = markers.get(iso) || [];
            arr.push('personal');
            markers.set(iso, arr);
        });

        // 套用於月曆日期格（避免重複疊加，先清除現有標記）
        markers.forEach((types, iso) => {
            const cell = document.querySelector(`#calendar-grid [data-ymd="${iso}"]`);
            if (!cell) return;
            // 移除既有標記
            Array.from(cell.querySelectorAll('.extra-markers')).forEach(el => el.remove());
            const wrap = document.createElement('div');
            wrap.className = 'mt-1 flex items-center space-x-1 extra-markers';
            types.slice(0, 4).forEach(t => {
                const dot = document.createElement('span');
                dot.className = `inline-block w-2 h-2 rounded-full ${getEventColor(t)}`;
                wrap.appendChild(dot);
            });
            cell.appendChild(wrap);
        });
    } catch (e) {
        console.warn('套用額外事件標記失敗', e);
    }
}

// 載入「標註日期行程表」：目前包含週五值班提醒，可擴充其他提醒
async function loadMarkedSchedule(year, month) {
    try {
        const listEl = document.getElementById('monthly-events');
        if (!listEl) return;
        const fs = window.__fs;
        const db = window.__db;
        if (!fs || !db) {
            listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
            return;
        }
        const { doc, getDoc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};
        const auth = window.__auth;
        const usersMap = await fetchUsersOnce().catch(() => ({}));
        const myUid = auth?.currentUser?.uid || '';
        const myName = auth?.currentUser ? (usersMap[auth.currentUser.uid] || auth.currentUser.displayName || auth.currentUser.email || '') : '';

        const events = [];
        Object.keys(roster).forEach(iso => {
            const dt = new Date(iso);
            if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
            const arr = roster[iso] || [];
            if (!Array.isArray(arr) || arr.length === 0) return;
            const normalize = (s) => (s || '').trim();
            const isMine = (myUid && arr.includes(myUid)) || (myName && arr.some(n => normalize(n) === normalize(myName)));
            if (!isMine) return; // 僅顯示個人
            events.push({ date: dt, title: '週五值班', type: 'duty', names: ['我'] });
        });

        events.sort((a, b) => a.date - b.date);
        listEl.innerHTML = '';

        if (events.length === 0) {
            listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
            return;
        }

        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-md';
            eventDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${getEventColor(event.type)}"></div>
                    <span class="font-medium">${event.title}</span>
                    <span class="text-sm text-gray-600">${Array.isArray(event.names) ? event.names.join('、') : ''}</span>
                </div>
                <span class="text-sm text-gray-500">${event.date.getDate()}日</span>
            `;
            listEl.appendChild(eventDiv);
        });
    } catch (e) {
        console.warn('載入標註日期行程表失敗', e);
        const listEl = document.getElementById('monthly-events');
        if (listEl) listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
    }
}

function fetchHolidaySettingsOnce() {
    return new Promise(async (resolve, reject) => {
        try {
            if (window.__holidaySettingsCache) {
                resolve(window.__holidaySettingsCache);
                return;
            }
            const fs = window.__fs;
            const db = window.__db;
            if (!fs || !db || !fs.doc || !fs.getDoc) {
                // 無法讀取 Firestore，使用空設定
                window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
                resolve(window.__holidaySettingsCache);
                return;
            }
            const { doc, getDoc } = fs;
            const ref = doc(db, 'settings', 'holidays');
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                window.__holidaySettingsCache = { weekendIsHoliday: !!data.weekendIsHoliday, holidays: data.holidays || [] };
            } else {
                window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
            }
            resolve(window.__holidaySettingsCache);
        } catch (e) {
            window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
            reject(e);
        }
    });
}

// 讀取並快取使用者名單（供陪同參與人員勾選與顯示）
function fetchUsersOnce() {
    return new Promise(async (resolve, reject) => {
        try {
            if (window.__usersCache) {
                resolve(window.__usersCache);
                return;
            }
            const fs = window.__fs;
            const db = window.__db;
            if (!fs || !db) {
                window.__usersCache = {};
                resolve(window.__usersCache);
                return;
            }
            const { collection, getDocs } = fs;
            const ref = collection(db, 'users');
            const snap = await getDocs(ref);
            const map = {};
            snap.forEach(d => {
                const data = d.data();
                const name = data?.displayName || data?.name || data?.account || d.id;
                map[d.id] = String(name);
            });
            window.__usersCache = map;
            resolve(map);
        } catch (e) {
            window.__usersCache = {};
            reject(e);
        }
    });
}
