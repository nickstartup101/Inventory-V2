// --- STANDARD SHIFTS DEFINITIONS ---
const SHIFT_RULES = {
    'ກະ 1': { name: 'ກະ 1', startHour: 7, startMin: 0, endHour: 16, endMin: 0, stdHours: 8, startMins: 420, endMins: 960 },
    'ກະ 2': { name: 'ກະ 2', startHour: 11, startMin: 30, endHour: 20, endMin: 0, stdHours: 8, startMins: 690, endMins: 1200 }
};

// SMART AUTO SHIFT DETECTOR
function detectActualShift(clockInDate, defaultShiftName = 'ກະ 1') {
    const timeInfo = getLaosTimeInfo(clockInDate);
    const totalMins = timeInfo.totalMinutes;
    if (totalMins < 555) { // 09:15 AM threshold
        return SHIFT_RULES['ກະ 1'];
    } else {
        return SHIFT_RULES['ກະ 2'];
    }
}

// Helper: Get Total Days in Specific Month/Year
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// --- SUPABASE CLIENT CONFIGURATION ---
let supabaseUrl = localStorage.getItem('supabase_url') || '';
let supabaseKey = localStorage.getItem('supabase_key') || '';
let supabaseClient = null;

function initSupabase() {
    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
        try {
            supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            updateDbStatusUI(true);
            fetchDataFromSupabase();
        } catch (e) {
            console.error('Supabase Connection Error:', e);
            updateDbStatusUI(false);
        }
    } else {
        updateDbStatusUI(false);
    }
}

function updateDbStatusUI(isConnected) {
    const statusDotMobile = document.getElementById('db-status-mobile');
    const statusIndicator = document.getElementById('db-status-indicator');
    const dotDesktop = document.getElementById('db-dot-desktop');
    const textDesktop = document.getElementById('db-text-desktop');

    if (isConnected) {
        if (statusDotMobile) statusDotMobile.className = 'text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-full flex items-center gap-1';
        if (statusDotMobile) statusDotMobile.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Supabase Live';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-400';
        if (dotDesktop) dotDesktop.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
        if (textDesktop) textDesktop.textContent = 'Supabase Connected';
    } else {
        if (statusDotMobile) statusDotMobile.className = 'text-[10px] bg-red-500 text-white font-bold px-2 py-1 rounded-full flex items-center gap-1';
        if (statusDotMobile) statusDotMobile.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white"></span> Config API';
        if (statusIndicator) statusIndicator.className = 'w-2 h-2 rounded-full bg-red-400';
        if (dotDesktop) dotDesktop.className = 'w-2 h-2 rounded-full bg-red-500';
        if (textDesktop) textDesktop.textContent = 'Setup Supabase API';
    }
}

function saveSupabaseConfig(e) {
    e.preventDefault();
    supabaseUrl = document.getElementById('config-supabase-url').value.trim();
    supabaseKey = document.getElementById('config-supabase-key').value.trim();

    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);

    initSupabase();
    closeModal('supabase-config-modal');
    showToast('✓ ຕັ້ງຄ່າ ແລະ ເຊື່ອມຕໍ່ Supabase ແລ້ວ!');
}

// Safe Date Parser
function parseSafeDate(ts) {
    if (!ts) return new Date();
    if (ts instanceof Date) return ts;
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) {
        str = str.replace(' ', 'T');
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
}

function getLaosDateString(dateObj = new Date()) {
    const safeD = parseSafeDate(dateObj);
    const d = new Date(safeD.toLocaleString('en-US', { timeZone: 'Asia/Vientiane' }));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLaosTimeInfo(timestamp) {
    const dt = parseSafeDate(timestamp);
    const laosStr = dt.toLocaleTimeString('en-US', { timeZone: 'Asia/Vientiane', hour12: false });
    const parts = laosStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    const totalMinutes = hours * 60 + minutes;
    const totalSeconds = totalMinutes * 60 + seconds;
    return { hours, minutes, seconds, totalMinutes, totalSeconds };
}

function formatMinutesToHours(mins) {
    if (!mins || mins <= 0) return '0 ນາທີ';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h} ຊມ ${m} ນາທີ`;
    if (h > 0) return `${h} ຊົ່ວໂມງ`;
    return `${m} ນາທີ`;
}

function formatSecondsToExactTime(secs) {
    if (secs <= 0) return '0 ວິ';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m} ນາທີ ${s} ວິ`;
    return `${s} ວິນາທີ`;
}

function handleImageCompress(fileInput, targetInputId, previewImgId) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 200;
            const MAX_HEIGHT = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById(targetInputId).value = compressedBase64;
            document.getElementById(previewImgId).src = compressedBase64;
            showToast('✓ ບີບອັດຮູບພາບຮຽບຮ້ອຍແລ້ວ');
        };
    };
}

// --- FETCH DATA FROM SUPABASE ---
async function fetchDataFromSupabase() {
    if (!supabaseClient) return;

    try {
        const { data: stockRes } = await supabaseClient.from('main_inventory').select('*').not('sku', 'ilike', '%XS').order('sku');
        if (stockRes && stockRes.length > 0) {
            stockData = stockRes;
            renderStockTable();
            populateStockMovementDropdown();
            renderStockAnalytics();
        }
    } catch (e) { console.error("Stock Fetch Exception:", e); }

    try {
        const { data: staffRes } = await supabaseClient.from('staff').select('*').order('pin');
        if (staffRes && staffRes.length > 0) {
            partnersData = staffRes;
            renderEmployeesAndPayroll();
        }
    } catch (e) { console.error("Staff Fetch Exception:", e); }

    try {
        const { data: moveRes } = await supabaseClient.from('daily_inventory_movement').select('*').order('id', { ascending: false }).limit(50);
        if (moveRes) {
            stockMovements = moveRes;
            renderMovementLogs();
            renderStockAnalytics();
        }
    } catch (e) { console.error("Movement Fetch Exception:", e); }

    try {
        const { data: attRes } = await supabaseClient.from('attendance').select('*').order('id', { ascending: false });
        if (attRes) {
            attendanceLogs = attRes;
            renderTodayKioskAttendance();
            renderAdminAttendanceTable(currentAdminAttFilter);
            updateOnDutyStaffUI();
            renderEmployeesAndPayroll();
            renderEarlyComerStreakRanking();
        }
    } catch (e) { console.error("Attendance Fetch Exception:", e); }
}

// --- DATA ARRAYS ---
let isAdminLoggedIn = false;
let attendanceLogs = [];

let stockData = [
    { sku: 'P001', name: 'ຜົງໂກ້ໂກ້ (ຖົງ)', stock: 12, min_stock: 1, status: 'OK', category: 'ວັດຖຸດິບ', branch: 'ສາຂານ້ຳພຸ' },
    { sku: 'P006', name: 'ກາເຟຂົ້ວກາງ 1ກລ (ຖົງ)', stock: 25, min_stock: 1, status: 'OK', category: 'ວັດຖຸດິບ', branch: 'ສາຂານ້ຳພຸ' },
    { sku: 'P007', name: 'ກາເຟຂົ້ວເຂັ້ມ 1ກລ (ຖົງ)', stock: 18, min_stock: 1, status: 'OK', category: 'ວັດຖຸດິບ', branch: 'ສາຂານ້ຳພຸ' },
    { sku: 'P028', name: 'ນົມໂອດ (ຕຸກ)', stock: 8, min_stock: 1, status: 'OK', category: 'ວັດຖຸດິບ', branch: 'ສາຂານ້ຳພຸ' },
    { sku: 'P036', name: 'ໄຊຣັບຄາລາເມລ (ຕຸກ)', stock: 5, min_stock: 1, status: 'OK', category: 'ໄຊຮັບ', branch: 'ສາຂານ້ຳພຸ' },
    { sku: 'P080', name: 'ຈອກ 16 ອອນ (ໜ່ວຍ)', stock: 300, min_stock: 1, status: 'OK', category: 'ເຄື່ອງໃຊ້ທົ່ວໄປ', branch: 'ສາຂານ້ຳພຸ' }
];

let stockMovements = [
    { id: 1, sku: 'P007', name: 'ກາເຟຂົ້ວເຂັ້ມ 1ກລ (ຖົງ)', type: 'OUT', qty: 4, note: 'ໃຊ້ປະຈຳວັນ', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 2, sku: 'P031', name: 'ນົມສົດ 2000g (ຕຸກ)', type: 'OUT', qty: 6, note: 'ໃຊ້ປະຈຳວັນ', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 3, sku: 'P013', name: 'ມັດຊະ (ຖົງ)', type: 'OUT', qty: 2, note: 'ໃຊ້ປະຈຳວັນ', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() }
];

let partnersData = [
    { pin: '225588', staff_id: 'EMP0001', name: 'Keo', branch: 'NP branch', role: 'Barista', phone: '2057558813', dob: '15/08/1998', emp_type: 'Full-time', shift: 'ກະ 1', salary: 3800000, benefit: 500000, photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=60' },
    { pin: '147258', staff_id: 'EMP0002', name: 'Vieng', branch: 'NP Branch', role: 'Barista', phone: '2078081195', dob: '22/11/1999', emp_type: 'Full-time', shift: 'ກະ 1', salary: 4500000, benefit: 500000, photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60' },
    { pin: '112233', staff_id: 'EMP0003', name: 'Cherry', branch: 'NP Branch', role: 'Barista', phone: '2097363821', dob: '03/04/2000', emp_type: 'Part-time', shift: 'ກະ 1', salary: 2500000, benefit: 300000, photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=60' },
    { pin: '775533', staff_id: 'EMP0004', name: 'pakham', branch: 'NP Branch', role: 'Barista', phone: '2098382508', dob: '19/02/1997', emp_type: 'Full-time', shift: 'ກະ 2', salary: 4000000, benefit: 500000, photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60' },
    { pin: '181193', staff_id: 'EMP0005', name: 'Nut', branch: 'NP Branch', role: 'Barista', phone: '2077489078', dob: '12/07/1996', emp_type: 'Full-time', shift: 'ກະ 2', salary: 3600000, benefit: 420000, photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=60' },
    { pin: '920707', staff_id: 'EMP0006', name: 'AE', branch: 'NP Branch', role: 'Barista', phone: '2092070715', dob: '05/09/2001', emp_type: 'Full-time', shift: 'ກະ 2', salary: 3500000, benefit: 400000, photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=60' }
];

let selectedPartnerForClock = null;

// --- NAVIGATION CONTROLLER ---
const views = ['dashboard', 'current-stock', 'inventory', 'employees', 'payroll', 'kiosk'];

function navigateTo(viewId) {
    if ((viewId === 'employees' || viewId === 'payroll') && !isAdminLoggedIn) {
        openModal('admin-pin-modal');
        showToast('🔒 ຕ້ອງປົດລັອກລະຫັດ Admin ເພື່ອເຂົ້າ HRM Admin');
        return;
    }

    if (!views.includes(viewId)) viewId = 'dashboard';

    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.remove('active');
        
        const navEl = document.getElementById(`nav-${v}`);
        if (navEl) {
            navEl.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-bold');
            navEl.classList.add('text-primary-fixed-dim');
        }
    });

    const selectedView = document.getElementById(`view-${viewId}`);
    if (selectedView) selectedView.classList.add('active');

    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) {
        activeNav.classList.add('bg-primary-container', 'text-on-primary-container', 'font-bold');
        activeNav.classList.remove('text-primary-fixed-dim');
    }

    if (viewId === 'inventory') renderStockAnalytics();
    if (viewId === 'current-stock') renderStockTable();

    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openStockMovementKiosk() {
    navigateTo('kiosk');
    switchKioskTab('stock-movement');
}

function switchKioskTab(tabName) {
    const timeClockTab = document.getElementById('kiosk-tab-time-clock');
    const stockTab = document.getElementById('kiosk-tab-stock-movement');
    const timeClockView = document.getElementById('kiosk-subview-time-clock');
    const stockView = document.getElementById('kiosk-subview-stock-movement');

    if (tabName === 'time-clock') {
        timeClockTab.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-primary text-white transition-all flex items-center justify-center gap-1.5 shadow-sm';
        stockTab.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface transition-all flex items-center justify-center gap-1.5';
        timeClockView.classList.remove('hidden');
        stockView.classList.add('hidden');
        renderTodayKioskAttendance();
    } else {
        stockTab.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-primary text-white transition-all flex items-center justify-center gap-1.5 shadow-sm';
        timeClockTab.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface transition-all flex items-center justify-center gap-1.5';
        stockView.classList.remove('hidden');
        timeClockView.classList.add('hidden');
        
        populateStockMovementDropdown();
        renderMovementLogs();
    }
}

function populateStockMovementDropdown() {
    const select = document.getElementById('movement-item-select');
    select.innerHTML = '';

    stockData.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.sku;
        opt.textContent = `[${item.sku}] ${item.name} (Stock: ${item.stock || 0})`;
        select.appendChild(opt);
    });
}

function addQuickQty(amount) {
    const input = document.getElementById('movement-qty-input');
    const current = parseInt(input.value) || 0;
    input.value = current + amount;
}

async function handleKioskMovementSubmit(e) {
    e.preventDefault();
    const sku = document.getElementById('movement-item-select').value;
    const movementType = document.querySelector('input[name="movement-type"]:checked').value;
    const qty = parseInt(document.getElementById('movement-qty-input').value);
    const note = document.getElementById('movement-note-input').value.trim() || 'ບັນທຶກ Kiosk';

    const item = stockData.find(i => i.sku === sku);
    if (!item) return;

    const newStock = movementType === 'IN' ? ((item.stock || 0) + qty) : Math.max(0, (item.stock || 0) - qty);
    item.stock = newStock;

    if (supabaseClient) {
        await supabaseClient.from('daily_inventory_movement').insert([{
            sku: item.sku,
            name: item.name,
            type: movementType,
            qty: qty,
            note: note
        }]);

        await supabaseClient.from('main_inventory').update({ stock: newStock }).eq('sku', item.sku).eq('branch', item.branch || 'ສາຂານ້ຳພຸ');
    }

    renderStockTable();
    populateStockMovementDropdown();
    fetchDataFromSupabase();

    document.getElementById('movement-qty-input').value = 1;
    document.getElementById('movement-note-input').value = '';
    
    showToast(`✓ ບັນທຶກ (${movementType}) ${item.name} ຈຳນວນ ${qty} ແລ້ວ!`);
}

function renderMovementLogs() {
    const container = document.getElementById('kiosk-movement-logs-container');
    container.innerHTML = '';

    if (stockMovements.length === 0) {
        container.innerHTML = '<p class="text-outline text-center py-2">ບໍ່ມີປະວັດການເຄື່ອນໄຫວ</p>';
        return;
    }

    stockMovements.slice(0, 5).forEach(m => {
        const item = document.createElement('div');
        item.className = 'p-2 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between';
        item.innerHTML = `
            <div>
                <p class="font-bold text-on-surface">${m.name || m.sku}</p>
                <p class="text-[10px] text-on-surface-variant">${m.note || 'N/A'} • ${parseSafeDate(m.timestamp).toLocaleTimeString()}</p>
            </div>
            <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] ${m.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${m.type === 'IN' ? '+' : '-'}${m.qty}
            </span>
        `;
        container.appendChild(item);
    });
}

function renderStockAnalytics() {
    const chartContainer = document.getElementById('analytics-chart-container');
    const rankingTableBody = document.getElementById('top-ranking-table-body');
    if (!chartContainer || !rankingTableBody) return;

    chartContainer.innerHTML = '';
    rankingTableBody.innerHTML = '';

    const itemUsageMap = {};
    let totalBurnUnits = 0;

    stockMovements.forEach(m => {
        if (m.type === 'OUT') {
            const key = m.sku || m.name;
            if (!itemUsageMap[key]) {
                itemUsageMap[key] = { sku: m.sku, name: m.name || m.sku, totalOut: 0 };
            }
            itemUsageMap[key].totalOut += (m.qty || 0);
            totalBurnUnits += (m.qty || 0);
        }
    });

    const avgBurnRatePerDay = Math.round(totalBurnUnits / 7) || 2;
    document.getElementById('stat-avg-burn-rate').textContent = `${avgBurnRatePerDay} ລາຍການ/ມື້`;

    const sortedUsage = Object.values(itemUsageMap).sort((a, b) => b.totalOut - a.totalOut);

    let criticalCount = 0;
    if (sortedUsage.length > 0) {
        document.getElementById('stat-top-item-name').textContent = sortedUsage[0].name;
        document.getElementById('stat-top-item-qty').textContent = `ເບີກອອກລວມ: ${sortedUsage[0].totalOut} ລາຍການ`;
    } else {
        document.getElementById('stat-top-item-name').textContent = 'ກາເຟຂົ້ວເຂັ້ມ';
        document.getElementById('stat-top-item-qty').textContent = 'ອັນດັບ #1';
    }

    const top5 = sortedUsage.length > 0 ? sortedUsage.slice(0, 5) : [
        { sku: 'P007', name: 'ກາເຟຂົ້ວເຂັ້ມ 1ກລ', totalOut: 18 },
        { sku: 'P031', name: 'ນົມສົດ 2000g (ຕຸກ)', totalOut: 14 },
        { sku: 'P013', name: 'ມັດຊະ (ຖົງ)', totalOut: 8 },
        { sku: 'P080', name: 'ຈອກ 16 ອອນ (ໜ່ວຍ)', totalOut: 125 },
        { sku: 'P036', name: 'ໄຊຣັບຄາລາເມລ (ຕຸກ)', totalOut: 5 }
    ];

    top5.forEach((item, index) => {
        const stockItem = stockData.find(s => s.sku === item.sku) || { stock: 10 };
        const currentStock = stockItem.stock || 0;
        const dailyBurn = Math.max(1, Math.round(item.totalOut / 7));
        const daysLeft = Math.floor(currentStock / dailyBurn);

        if (daysLeft < 3) criticalCount++;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-low';
        tr.innerHTML = `
            <td class="p-2.5 font-bold text-primary">#${index + 1}</td>
            <td class="p-2.5 font-bold text-on-surface">${item.name} <span class="text-[10px] text-outline">(${item.sku})</span></td>
            <td class="p-2.5 font-mono font-bold text-red-700">-${item.totalOut}</td>
            <td class="p-2.5 font-mono">${dailyBurn}/ມື້</td>
            <td class="p-2.5 font-mono font-bold text-sm">${currentStock}</td>
            <td class="p-2.5 text-right font-mono font-bold ${daysLeft < 3 ? 'text-error' : 'text-emerald-700'}">
                ${daysLeft} ມື້
            </td>
        `;
        rankingTableBody.appendChild(tr);
    });

    document.getElementById('stat-critical-items').textContent = `${criticalCount} ລາຍການ`;

    const daysOfWeek = ['ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ', 'ອາທິດ'];
    const mockHeights = [65, 80, 45, 90, 75, 95, 50];

    daysOfWeek.forEach((day, i) => {
        const val = mockHeights[i];
        const bar = document.createElement('div');
        bar.className = 'w-1/7 bg-primary rounded-t-lg transition-all relative group flex flex-col justify-end items-center shadow-sm';
        bar.style.height = `${Math.max(20, val)}%`;
        bar.innerHTML = `
            <span class="text-[10px] font-bold text-primary mb-1 bg-primary-fixed/40 px-1 rounded">
                ${val}
            </span>
        `;
        chartContainer.appendChild(bar);
    });
}

function renderTodayKioskAttendance() {
    const container = document.getElementById('kiosk-today-attendance-container');
    if (!container) return;
    container.innerHTML = '';

    const todayStr = getLaosDateString();

    const todayLogs = attendanceLogs.filter(a => {
        const logDate = getLaosDateString(parseSafeDate(a.timestamp));
        return logDate === todayStr;
    });

    if (todayLogs.length === 0) {
        container.innerHTML = '<p class="text-outline text-center py-2">ບໍ່ມີປະວັດການປ້ຳໂມງໃນມື້ນີ້</p>';
        return;
    }

    const staffPairs = {};
    todayLogs.forEach(a => {
        if (!staffPairs[a.pin]) {
            staffPairs[a.pin] = { clockIn: null, clockOut: null };
        }
        const type = (a.type || '').toLowerCase();
        const logTime = parseSafeDate(a.timestamp);

        if (type.includes('in')) {
            if (!staffPairs[a.pin].clockIn || logTime < parseSafeDate(staffPairs[a.pin].clockIn.timestamp)) {
                staffPairs[a.pin].clockIn = a;
            }
        } else if (type.includes('out')) {
            if (!staffPairs[a.pin].clockOut || logTime > parseSafeDate(staffPairs[a.pin].clockOut.timestamp)) {
                staffPairs[a.pin].clockOut = a;
            }
        }
    });

    Object.keys(staffPairs).forEach(pin => {
        const staff = partnersData.find(p => p.pin === pin) || { name: 'PIN: ' + pin };
        const pair = staffPairs[pin];
        
        let inTime = pair.clockIn ? parseSafeDate(pair.clockIn.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        let outTime = pair.clockOut ? parseSafeDate(pair.clockOut.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        
        let durationText = 'ກຳລັງເຮັດວຽກຢູ່...';
        let durationBadgeClass = 'bg-emerald-100 text-emerald-800';

        if (pair.clockIn && pair.clockOut) {
            const diffMs = Math.max(0, parseSafeDate(pair.clockOut.timestamp) - parseSafeDate(pair.clockIn.timestamp));
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            durationText = `ເຮັດວຽກ: ${hours} ຊມ ${mins} ນາທີ`;
            durationBadgeClass = 'bg-blue-100 text-blue-900';
        }

        const item = document.createElement('div');
        item.className = 'p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${staff.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-9 h-9 rounded-full object-cover border border-primary/20">
                <div>
                    <p class="font-bold text-on-surface text-xs">${staff.name}</p>
                    <p class="text-[10px] text-on-surface-variant font-mono">
                        ເຂົ້າ: <span class="font-bold text-emerald-700">${inTime}</span> | ອອກ: <span class="font-bold text-amber-700">${outTime}</span>
                    </p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg font-bold text-[10px] ${durationBadgeClass}">
                ${durationText}
            </span>
        `;
        container.appendChild(item);
    });
}

let currentAdminAttFilter = 'daily';

function filterAdminAttendance(filterType) {
    currentAdminAttFilter = filterType;
    document.querySelectorAll('.admin-att-btn').forEach(b => {
        b.className = 'admin-att-btn px-3 py-1 rounded-lg text-on-surface-variant hover:bg-surface';
    });
    const activeBtn = document.getElementById(`btn-att-${filterType}`);
    if (activeBtn) activeBtn.className = 'admin-att-btn px-3 py-1 rounded-lg bg-primary text-white shadow-sm';

    renderAdminAttendanceTable(filterType);
}

function renderAdminAttendanceTable(filterType = 'daily') {
    const tbody = document.getElementById('admin-attendance-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const todayStr = getLaosDateString();
    const currentMonthStr = todayStr.substring(0, 7);

    let filteredLogs = attendanceLogs;

    if (filterType === 'daily') {
        filteredLogs = attendanceLogs.filter(a => getLaosDateString(parseSafeDate(a.timestamp)) === todayStr);
    } else if (filterType === 'monthly') {
        filteredLogs = attendanceLogs.filter(a => getLaosDateString(parseSafeDate(a.timestamp)).startsWith(currentMonthStr));
    }

    if (filteredLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-outline">ບໍ່ມີຂໍ້ມູນປະຫວັດການມາວຽກ</td></tr>';
        return;
    }

    filteredLogs.forEach(a => {
        const staff = partnersData.find(p => p.pin === a.pin) || { name: 'PIN: ' + a.pin, shift: 'ກະ 1' };
        const dt = parseSafeDate(a.timestamp);
        const isClockIn = (a.type || '').toLowerCase().includes('in');
        const detectedShift = detectActualShift(dt, staff.shift);

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-low';
        tr.innerHTML = `
            <td class="p-2.5 font-mono text-[11px]">${dt.toLocaleDateString('en-GB')} ${dt.toLocaleTimeString()}</td>
            <td class="p-2.5 font-bold text-on-surface">${staff.name} (PIN: ${a.pin})</td>
            <td class="p-2.5">
                <span class="px-2 py-0.5 rounded font-bold text-[10px] ${isClockIn ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${a.type || 'Clock-In'}
                </span>
            </td>
            <td class="p-2.5 font-mono font-bold text-xs text-primary">${detectedShift.name}</td>
            <td class="p-2.5 text-outline">${a.branch || 'NP Branch'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// =========================================================================
// REAL-TIME PAYROLL CALCULATION (FORMULA: Base / (MonthDays - 4) * DaysWorked)
// =========================================================================
function calculateRealtimePayroll(staff) {
    const todayStr = getLaosDateString();
    const currentMonthStr = todayStr.substring(0, 7);
    const [yearStr, monthStr] = currentMonthStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const daysInMonth = getDaysInMonth(year, month);
    const standardWorkDays = Math.max(1, daysInMonth - 4);

    const staffMonthLogs = attendanceLogs.filter(a => {
        const logMonth = getLaosDateString(parseSafeDate(a.timestamp)).substring(0, 7);
        return a.pin === staff.pin && logMonth === currentMonthStr;
    });

    const daysMap = {};
    staffMonthLogs.forEach(a => {
        const dateKey = getLaosDateString(parseSafeDate(a.timestamp));
        if (!daysMap[dateKey]) daysMap[dateKey] = { in: null, out: null };

        const logTime = parseSafeDate(a.timestamp);
        const type = (a.type || '').toLowerCase();

        if (type.includes('in')) {
            if (!daysMap[dateKey].in || logTime < daysMap[dateKey].in) {
                daysMap[dateKey].in = logTime;
            }
        } else if (type.includes('out')) {
            if (!daysMap[dateKey].out || logTime > daysMap[dateKey].out) {
                daysMap[dateKey].out = logTime;
            }
        }
    });

    let daysWorked = 0;
    let autoOtHours = 0;
    let onTimeDaysCount = 0;
    let dailyStreak = 0;
    let maxStreak = 0;

    const baseSalary = Number(staff.salary) || 3800000;
    const benefit = Number(staff.benefit) || 0;
    const dailyRate = baseSalary / standardWorkDays;

    const sortedDates = Object.keys(daysMap).sort();

    sortedDates.forEach(dateKey => {
        const day = daysMap[dateKey];

        if (day.in) {
            daysWorked++;

            const shiftRule = detectActualShift(day.in, staff.shift || 'ກະ 1');
            const inInfo = getLaosTimeInfo(day.in);

            if (inInfo.totalMinutes <= shiftRule.startMins) {
                dailyStreak++;
                onTimeDaysCount++;
            } else {
                dailyStreak = 0;
            }

            if (dailyStreak > maxStreak) maxStreak = dailyStreak;

            if (day.out && day.out > day.in) {
                const outInfo = getLaosTimeInfo(day.out);
                if (outInfo.totalMinutes > shiftRule.endMins) {
                    const postOtMins = outInfo.totalMinutes - shiftRule.endMins;
                    autoOtHours += (postOtMins / 60);
                }
            }
        }
    });

    const actualDaysPay = Math.round(daysWorked * dailyRate);
    const totalOtHours = Math.round((Number(staff.ot) || 0) + autoOtHours);
    const otPay = totalOtHours * 17000;
    const totalNetPay = actualDaysPay + otPay + benefit;

    return {
        daysInMonth,
        standardWorkDays,
        daysWorked,
        otHours: totalOtHours,
        dailyRate: Math.round(dailyRate),
        otPay,
        actualDaysPay,
        totalNetPay,
        onTimeDaysCount,
        currentStreak: dailyStreak,
        maxStreak
    };
}

function renderEmployeesAndPayroll() {
    const partnerContainer = document.getElementById('partner-list-container');
    const payrollBody = document.getElementById('payroll-table-body');
    
    partnerContainer.innerHTML = '';
    payrollBody.innerHTML = '';

    let superStreakCount = 0;

    const now = new Date();
    const daysInCurMonth = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
    const stdWorkDays = daysInCurMonth - 4;
    const curMonthName = now.toLocaleDateString('lo-LA', { month: 'long', year: 'numeric' });

    const pDesc = document.getElementById('payroll-header-desc');
    if (pDesc) {
        pDesc.innerHTML = `ເດືອນນີ້ (${curMonthName}) ມີ <b>${daysInCurMonth} ວັນ</b> | ມື້ເຮັດວຽກມາດຕະຖານ = <b>${stdWorkDays} ມື້</b> (${daysInCurMonth}-4 ວັນພັກ) | ຄ່າແຮງຕໍ່ມື້ = ເງິນເດືອນ ÷ ${stdWorkDays} | OT 17,000 ກີບ/ຊມ (ນັບສະເພາະຫຼັງເລີກກະ)`;
    }

    partnersData.forEach(p => {
        const payroll = calculateRealtimePayroll(p);
        if (payroll.currentStreak >= 3) superStreakCount++;

        const card = document.createElement('div');
        card.className = 'bg-surface rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex flex-col justify-between relative group';
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <img src="${p.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm">
                        <div>
                            <h3 class="font-headline font-bold text-sm text-on-surface">${p.name}</h3>
                            <p class="text-xs text-primary font-mono font-bold">${p.staff_id || 'EMP'}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-variant text-outline'}">${p.active !== false ? 'Active' : 'Off'}</span>
                        ${payroll.currentStreak >= 3 ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-sm"><span class="material-symbols-outlined text-[11px] icon-fill">local_fire_department</span> ${payroll.currentStreak} Streak</span>` : ''}
                    </div>
                </div>
                
                <div class="space-y-1 text-xs border-t border-surface-container-high pt-2 text-on-surface-variant">
                    <p><span class="text-outline font-semibold">ຕຳແໜ່ງ:</span> <strong>${p.role}</strong> (${p.emp_type || 'Full-time'})</p>
                    <p><span class="text-outline font-semibold">ກະຫຼັກ:</span> ${p.shift || 'ກະ 1'} <span class="text-[10px] text-emerald-700 font-bold">(Auto-detect)</span></p>
                    <p><span class="text-outline font-semibold">ເງິນເດືອນພື້ນຖານ:</span> <span class="font-mono font-bold text-emerald-800">${(Number(p.salary) || 0).toLocaleString()} ກີບ</span></p>
                    <p><span class="text-outline font-semibold">ຄ່າແຮງຕໍ່ມື້:</span> <span class="font-mono font-semibold text-primary">${payroll.dailyRate.toLocaleString()} ກີບ/ມື້</span> <span class="text-[10px] text-outline">(${payroll.daysInMonth}-4=${payroll.standardWorkDays}ມື້)</span></p>
                    <p><span class="text-outline font-semibold">ສະຫວັດດີການ:</span> <span class="font-mono text-amber-800">+${(Number(p.benefit) || 0).toLocaleString()} ກີບ</span></p>
                </div>
            </div>

            <div class="mt-3 pt-2 border-t border-surface-container-high flex justify-between items-center text-xs">
                <span class="text-outline">PIN: <code class="bg-surface-container-high px-1.5 py-0.5 rounded font-mono font-bold text-primary">${p.pin}</code></span>
                
                <div class="flex gap-2">
                    <button onclick="openEditStaffModal('${p.pin}')" class="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-bold transition-all flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">edit</span> ແກ້ໄຂ
                    </button>
                    <button onclick="deleteStaff('${p.pin}', '${p.name}')" class="px-2 py-1 bg-red-50 text-error hover:bg-red-600 hover:text-white rounded-lg font-bold transition-all flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">delete</span> ລຶບ
                    </button>
                </div>
            </div>
        `;
        partnerContainer.appendChild(card);

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-low';
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold text-primary">${p.pin} / ${p.staff_id || ''}</td>
            <td class="p-3 font-bold text-on-surface">${p.name}</td>
            <td class="p-3 font-bold text-outline">${p.shift || 'ກະ 1'}</td>
            <td class="p-3 font-mono font-bold">${(Number(p.salary) || 0).toLocaleString()} ກີບ</td>
            <td class="p-3 font-mono font-semibold text-primary">
                ${payroll.dailyRate.toLocaleString()} ກີບ <span class="text-[10px] text-outline font-normal">(/${payroll.standardWorkDays}ມື້)</span>
            </td>
            <td class="p-3 font-mono font-bold text-blue-700">
                ${payroll.daysWorked} ມື້ <span class="text-[10px] font-bold text-emerald-700">(+${(payroll.actualDaysPay).toLocaleString()} ກີບ)</span>
            </td>
            <td class="p-3 font-mono text-amber-800 font-bold">
                ${payroll.otHours} ຊມ <span class="text-[10px]">(+${payroll.otPay.toLocaleString()} ກີບ)</span>
            </td>
            <td class="p-3 font-mono text-amber-800">+${(Number(p.benefit) || 0).toLocaleString()} ກີບ</td>
            <td class="p-3 font-mono font-bold text-emerald-800 text-xs bg-emerald-50/50">${payroll.totalNetPay.toLocaleString()} ກີບ</td>
        `;
        payrollBody.appendChild(tr);
    });

    document.getElementById('dash-top-streak-count').textContent = `${superStreakCount} ຄົນ`;
}

// =========================================================================
// EARLY COMER RANKING & REAL-TIME WEEKDAY STREAK BAR
// =========================================================================
let currentEarlyRankingFilter = 'monthly';

function setEarlyRankingFilter(filterType) {
    currentEarlyRankingFilter = filterType;
    document.querySelectorAll('.early-rank-tab').forEach(btn => {
        btn.className = 'early-rank-tab px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-on-surface-variant hover:bg-surface';
    });
    const activeBtn = document.getElementById(`btn-early-${filterType}`);
    if (activeBtn) activeBtn.className = 'early-rank-tab px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-800 text-white shadow-sm';
    
    renderEarlyComerStreakRanking();
}

function renderEarlyComerStreakRanking() {
    const container = document.getElementById('early-ranking-container');
    const streakProgressBar = document.getElementById('streak-progress-bar');
    const streakTodayBadge = document.getElementById('streak-today-badge');
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();
    const laosNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Vientiane' }));
    const todayDayIndex = laosNow.getDay();
    const dayNamesLao = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
    const dayNamesEng = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    if (streakTodayBadge) {
        streakTodayBadge.innerHTML = `✨ ມາໄວ3ມື້=Super streak: <b>${dayNamesEng[todayDayIndex]} (ວັນ${dayNamesLao[todayDayIndex]})</b>`;
    }

    for (let i = 0; i < 7; i++) {
        const lbl = document.getElementById(`day-lbl-${i}`);
        if (lbl) {
            if (i === todayDayIndex) {
                lbl.className = 'text-white font-black text-[11px] scale-125 transition-transform drop-shadow';
            } else {
                lbl.className = 'text-amber-200/70 font-semibold text-[10px]';
            }
        }
    }

    const targetWidthPct = Math.round(((todayDayIndex + 1) / 7) * 100);
    if (streakProgressBar) {
        streakProgressBar.style.width = `${targetWidthPct}%`;
    }

    const todayStr = getLaosDateString();
    const currentMonthStr = todayStr.substring(0, 7);

    const earlyRankingList = partnersData.map(p => {
        const pLogs = attendanceLogs.filter(a => {
            const logDate = getLaosDateString(parseSafeDate(a.timestamp));
            const isTypeIn = (a.type || '').toLowerCase().includes('in');
            if (currentEarlyRankingFilter === 'daily') {
                return a.pin === p.pin && logDate === todayStr && isTypeIn;
            } else {
                return a.pin === p.pin && logDate.startsWith(currentMonthStr) && isTypeIn;
            }
        });

        const dayEarliestMap = {};
        pLogs.forEach(a => {
            const dateKey = getLaosDateString(parseSafeDate(a.timestamp));
            const logTime = parseSafeDate(a.timestamp);
            if (!dayEarliestMap[dateKey] || logTime < dayEarliestMap[dateKey]) {
                dayEarliestMap[dateKey] = logTime;
            }
        });

        let totalSecondsEarly = 0;
        let onTimeCount = 0;
        let dailyStreak = 0;
        let maxStreak = 0;

        const sortedDayKeys = Object.keys(dayEarliestMap).sort();

        sortedDayKeys.forEach(dateKey => {
            const clockInTime = dayEarliestMap[dateKey];
            const shiftRule = detectActualShift(clockInTime, p.shift);
            const inInfo = getLaosTimeInfo(clockInTime);
            const shiftStartSecs = shiftRule.startMins * 60;

            if (inInfo.totalSeconds <= shiftStartSecs) {
                const earlySecs = shiftStartSecs - inInfo.totalSeconds;
                totalSecondsEarly += earlySecs;
                onTimeCount++;
                dailyStreak++;
            } else {
                dailyStreak = 0;
            }

            if (dailyStreak > maxStreak) maxStreak = dailyStreak;
        });

        return {
            pin: p.pin,
            name: p.name,
            role: p.role,
            photo: p.photo_url,
            totalSecondsEarly,
            onTimeCount,
            currentStreak: dailyStreak,
            maxStreak
        };
    }).sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        if (b.onTimeCount !== a.onTimeCount) return b.onTimeCount - a.onTimeCount;
        return b.totalSecondsEarly - a.totalSecondsEarly;
    });

    if (earlyRankingList.length === 0 || (currentEarlyRankingFilter === 'daily' && earlyRankingList.every(i => i.onTimeCount === 0))) {
        container.innerHTML = `<p class="text-xs text-outline italic text-center py-3">ຍັງບໍ່ມີພະນັກງານປ້ຳໂມງເຂົ້າວຽກໃນມື້ນີ້</p>`;
        return;
    }

    const topOne = earlyRankingList[0];
    const isSuperStreak = topOne.currentStreak >= 3;

    const topCard = document.createElement('div');
    topCard.className = `p-3.5 rounded-2xl border ${isSuperStreak ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md' : 'bg-emerald-50 border-emerald-200'} mb-2.5`;
    topCard.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <img src="${topOne.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-11 h-11 rounded-full object-cover border-2 ${isSuperStreak ? 'border-amber-500 shadow-md' : 'border-emerald-500'}">
                    <span class="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow">👑</span>
                </div>
                <div>
                    <div class="flex items-center gap-1.5">
                        <h4 class="font-headline font-bold text-xs text-on-surface">${topOne.name}</h4>
                        ${isSuperStreak ? '<span class="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">local_fire_department</span> Super Streak</span>' : ''}
                    </div>
                    <p class="text-[10px] text-on-surface-variant font-semibold">
                        ${currentEarlyRankingFilter === 'daily' ? `ມາກ່ອນເວລາ: <b>${formatSecondsToExactTime(topOne.totalSecondsEarly)}</b>` : `ມາວຽກໄວ & ຕົງເວລາ: <b>${topOne.onTimeCount} ມື້</b> (Best Streak: ${topOne.maxStreak} ວັນ)`}
                    </p>
                </div>
            </div>

            <div class="text-right">
                <span class="font-headline font-extrabold text-sm ${isSuperStreak ? 'text-orange-600' : 'text-emerald-700'} block">
                    🔥 ${topOne.currentStreak} Day Streak
                </span>
                <span class="text-[9px] text-outline font-bold">On-Time Active</span>
            </div>
        </div>
    `;
    container.appendChild(topCard);

    earlyRankingList.slice(1).forEach((item, idx) => {
        const hasActiveStreak = item.currentStreak >= 3;
        const row = document.createElement('div');
        row.className = `p-2.5 rounded-xl border flex items-center justify-between ${hasActiveStreak ? 'bg-amber-50/60 border-amber-200' : 'bg-surface-container-low border-outline-variant/30'}`;
        row.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="font-mono font-bold text-xs text-on-surface-variant">#${idx + 2}</span>
                <img src="${item.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-7 h-7 rounded-full object-cover">
                <div>
                    <p class="font-bold text-on-surface text-xs flex items-center gap-1">
                        <span>${item.name}</span>
                        ${hasActiveStreak ? '<span class="text-amber-600 text-[10px]">🔥</span>' : ''}
                    </p>
                    <p class="text-[10px] text-outline">
                        ${currentEarlyRankingFilter === 'daily' ? `ກ່ອນເວລາ: ${formatSecondsToExactTime(item.totalSecondsEarly)}` : `ຕົງເວລາ ${item.onTimeCount} ມື້ • Best: ${item.maxStreak} ວັນ`}
                    </p>
                </div>
            </div>

            <div class="text-right">
                <span class="px-2 py-0.5 rounded font-bold font-mono text-[10px] ${hasActiveStreak ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'}">
                    ${item.currentStreak} Day Streak
                </span>
            </div>
        `;
        container.appendChild(row);
    });
}

// --- UPDATE ON DUTY STAFF BADGES ---
function updateOnDutyStaffUI() {
    const container = document.getElementById('on-duty-staff-container');
    if (!container) return;
    container.innerHTML = '';

    const todayStr = getLaosDateString();
    const todayLogs = attendanceLogs.filter(a => getLaosDateString(parseSafeDate(a.timestamp)) === todayStr);

    const latestStatusMap = {};
    todayLogs.forEach(a => {
        if (!latestStatusMap[a.pin]) {
            latestStatusMap[a.pin] = a.type;
        }
    });

    const activeStaffPins = Object.keys(latestStatusMap).filter(pin => (latestStatusMap[pin] || '').toLowerCase().includes('in'));

    document.getElementById('dash-active-staff').textContent = `${activeStaffPins.length} ຄົນ`;

    if (activeStaffPins.length === 0) {
        container.innerHTML = '<p class="text-xs text-outline italic">ບໍ່ມີພະນັກງານປ້ຳໂມງເຂົ້າວຽກໃນມື້ນີ້</p>';
        return;
    }

    activeStaffPins.forEach(pin => {
        const staff = partnersData.find(p => p.pin === pin);
        if (staff) {
            const badge = document.createElement('div');
            badge.className = 'flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 shadow-sm';
            badge.innerHTML = `
                <img src="${staff.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-6 h-6 rounded-full object-cover">
                <span>${staff.name} (${staff.role})</span>
            `;
            container.appendChild(badge);
        }
    });
}

// --- TIME CLOCK PIN & ATTENDANCE LOGIC ---
let currentPin = '';
const maxPin = 6;

function pressPinKey(num) {
    if (currentPin.length < maxPin) {
        currentPin += num;
        updatePinDots();
    }
    if (currentPin.length === maxPin) {
        verifyKioskPin();
    }
}

function clearPinKey() { currentPin = ''; updatePinDots(); }
function backspacePinKey() { if (currentPin.length > 0) { currentPin = currentPin.slice(0, -1); updatePinDots(); } }

function updatePinDots() {
    for (let i = 1; i <= maxPin; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) dot.className = `w-3.5 h-3.5 rounded-full border-2 border-outline-variant ${i <= currentPin.length ? 'bg-primary border-primary' : 'bg-surface'}`;
    }
}

function verifyKioskPin() {
    setTimeout(() => {
        if (currentPin === '7777' || currentPin === '777777') {
            unlockAdminMode();
            navigateTo('employees');
        } else {
            const partner = partnersData.find(p => p.pin === currentPin);
            if (partner) {
                selectedPartnerForClock = partner;

                const now = new Date();
                const detectedShift = detectActualShift(now, partner.shift);
                const nowInfo = getLaosTimeInfo(now);
                const startMins = detectedShift.startMins;

                let statusText = '';
                if (nowInfo.totalMinutes < startMins) {
                    const earlyMins = startMins - nowInfo.totalMinutes;
                    statusText = `<span class="text-emerald-700 font-bold block text-[11px] mt-1">✨ ມາກ່ອນເວລາ ${formatMinutesToHours(earlyMins)} (${detectedShift.name} Auto-Detect)</span>`;
                } else if (nowInfo.totalMinutes === startMins) {
                    statusText = `<span class="text-emerald-700 font-bold block text-[11px] mt-1">✓ ມາຕົງເວລາພໍດີ (${detectedShift.name})</span>`;
                } else {
                    const lateMins = nowInfo.totalMinutes - startMins;
                    statusText = `<span class="text-error font-bold block text-[11px] mt-1">⚠️ ມາຊ້າ ${formatMinutesToHours(lateMins)} (${detectedShift.name})</span>`;
                }

                document.getElementById('kiosk-user-info').innerHTML = `
                    <div class="flex items-center justify-center gap-3 mb-2">
                        <img src="${partner.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}" class="w-12 h-12 rounded-full object-cover">
                        <div class="text-left">
                            <h3 class="font-headline font-bold text-base text-primary">${partner.name}</h3>
                            <p class="text-xs text-on-surface-variant">${partner.staff_id} • ${partner.role}</p>
                            ${statusText}
                        </div>
                    </div>
                `;
                document.getElementById('kiosk-action-panel').classList.remove('hidden');
            } else {
                showToast('❌ ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ');
            }
        }
        clearPinKey();
    }, 200);
}

async function executeClockAction(actionType) {
    if (selectedPartnerForClock) {
        const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newLog = {
            pin: selectedPartnerForClock.pin,
            type: actionType,
            branch: selectedPartnerForClock.branch || 'NP Branch',
            timestamp: new Date().toISOString()
        };

        if (supabaseClient) {
            await supabaseClient.from('attendance').insert([newLog]);
        }

        attendanceLogs.unshift(newLog);
        renderTodayKioskAttendance();
        renderAdminAttendanceTable(currentAdminAttFilter);
        updateOnDutyStaffUI();
        renderEmployeesAndPayroll();
        renderEarlyComerStreakRanking();

        showToast(`✓ ບັນທຶກ ${actionType} ສຳເລັດ ສຳລັບ ${selectedPartnerForClock.name} (${nowStr})`);
        cancelClockAction();
    }
}

function cancelClockAction() {
    selectedPartnerForClock = null;
    document.getElementById('kiosk-action-panel').classList.add('hidden');
}

// --- EDIT / DELETE STAFF ---
function openEditStaffModal(pin) {
    const p = partnersData.find(item => item.pin === pin);
    if (!p) return;

    document.getElementById('edit-staff-pin-hidden').value = p.pin;
    document.getElementById('edit-staff-pin-disabled').value = p.pin;
    document.getElementById('edit-staff-id-input').value = p.staff_id || '';
    document.getElementById('edit-staff-name-input').value = p.name || '';
    document.getElementById('edit-staff-branch-input').value = p.branch || 'NP Branch';
    document.getElementById('edit-staff-role-input').value = p.role || 'Barista';
    document.getElementById('edit-staff-phone-input').value = p.phone || '';
    document.getElementById('edit-staff-salary-input').value = p.salary || 3800000;
    document.getElementById('edit-staff-benefit-input').value = p.benefit || 0;
    document.getElementById('edit-staff-type-input').value = p.emp_type || 'Full-time';
    document.getElementById('edit-staff-shift-input').value = p.shift || 'ກະ 1';
    document.getElementById('edit-staff-photo-input').value = p.photo_url || '';
    document.getElementById('edit-preview-img').src = p.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120';

    openModal('edit-staff-modal');
}

async function handleEditStaffSubmit(e) {
    e.preventDefault();
    const pin = document.getElementById('edit-staff-pin-hidden').value;

    const updatedData = {
        staff_id: document.getElementById('edit-staff-id-input').value.trim(),
        name: document.getElementById('edit-staff-name-input').value.trim(),
        branch: document.getElementById('edit-staff-branch-input').value.trim(),
        role: document.getElementById('edit-staff-role-input').value.trim(),
        phone: document.getElementById('edit-staff-phone-input').value.trim(),
        salary: parseInt(document.getElementById('edit-staff-salary-input').value) || 0,
        benefit: parseInt(document.getElementById('edit-staff-benefit-input').value) || 0,
        emp_type: document.getElementById('edit-staff-type-input').value,
        shift: document.getElementById('edit-staff-shift-input').value,
        photo_url: document.getElementById('edit-staff-photo-input').value.trim()
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('staff').update(updatedData).eq('pin', pin);
        if (error) {
            showToast('❌ ອັບເດດບໍ່ສົມບູນ: ' + error.message);
            return;
        }
    }

    const localStaff = partnersData.find(p => p.pin === pin);
    if (localStaff) Object.assign(localStaff, updatedData);

    fetchDataFromSupabase();
    renderEmployeesAndPayroll();
    closeModal('edit-staff-modal');
    showToast(`✓ ອັບເດດຂໍ້ມູນ ${updatedData.name} ສຳເລັດ!`);
}

async function deleteStaff(pin, name) {
    if (confirm(`ທ່ານຕ້ອງການລົບພະນັກງານ: ${name} (PIN: ${pin}) ອອກຈາກ Database ແທ້ບໍ?`)) {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('staff').delete().eq('pin', pin);
            if (error) {
                showToast('❌ ລົບບໍ່ສົມບູນ: ' + error.message);
                return;
            }
        }

        partnersData = partnersData.filter(p => p.pin !== pin);
        renderEmployeesAndPayroll();
        showToast(`✓ ລົບພະນັກງານ ${name} ແລ້ວ`);
    }
}

async function deleteStock(sku, branch, name) {
    if (confirm(`ທ່ານຕ້ອງການລົບສິນຄ້າ SKU: ${sku} (${name}) ແທ້ບໍ?`)) {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('main_inventory').delete().eq('sku', sku).eq('branch', branch);
            if (error) {
                showToast('❌ ລົບບໍ່ສົມບູນ: ' + error.message);
                return;
            }
        }

        stockData = stockData.filter(s => !(s.sku === sku && s.branch === branch));
        renderStockTable();
        populateStockMovementDropdown();
        showToast(`✓ ລົບສິນຄ້າ ${name} ແລ້ວ`);
    }
}

// --- HANDLE ADD NEW STAFF ---
async function handlePartnerSubmit(e) {
    e.preventDefault();
    const newStaff = {
        pin: document.getElementById('staff-pin-input').value.trim(),
        staff_id: document.getElementById('staff-id-input').value.trim(),
        name: document.getElementById('staff-name-input').value.trim(),
        branch: document.getElementById('staff-branch-input').value.trim(),
        role: document.getElementById('staff-role-input').value.trim(),
        phone: document.getElementById('staff-phone-input').value.trim(),
        salary: parseInt(document.getElementById('staff-salary-input').value) || 3800000,
        benefit: parseInt(document.getElementById('staff-benefit-input').value) || 0,
        emp_type: document.getElementById('staff-type-input').value,
        shift: document.getElementById('staff-shift-input').value,
        photo_url: document.getElementById('staff-photo-input').value.trim() || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
        active: true
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('staff').insert([newStaff]);
        if (error) {
            showToast('❌ Error: ' + error.message);
            return;
        }
    } else {
        partnersData.unshift(newStaff);
    }

    fetchDataFromSupabase();
    renderEmployeesAndPayroll();
    closeModal('partner-modal');
    showToast(`✓ ເພີ່ມພະນັກງານ ${newStaff.name} ລົງ Database ແລ້ວ!`);
}

async function handleStockSubmit(e) {
    e.preventDefault();
    const newItem = {
        sku: document.getElementById('modal-sku').value.trim(),
        branch: document.getElementById('modal-branch').value.trim(),
        name: document.getElementById('modal-item-name').value.trim(),
        category: document.getElementById('modal-item-category').value,
        stock: parseInt(document.getElementById('modal-item-qty').value) || 0,
        min_stock: parseInt(document.getElementById('modal-item-min').value) || 1,
        status: 'OK'
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('main_inventory').insert([newItem]);
        if (error) {
            showToast('❌ Error: ' + error.message);
            return;
        }
    } else {
        stockData.unshift(newItem);
    }

    fetchDataFromSupabase();
    renderStockTable();
    closeModal('stock-modal');
    showToast(`✓ ເພີ່ມ SKU ${newItem.sku} (${newItem.name}) ແລ້ວ!`);
}

// --- HRM ADMIN UNLOCK/LOCK CONTROLLER ---
function unlockAdminMode() {
    isAdminLoggedIn = true;
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    document.getElementById('admin-banner-sidebar').classList.remove('hidden');
    document.getElementById('top-admin-tag').classList.remove('hidden');
    renderStockTable();
    showToast('🔓 ປົດລັອກ HRM Admin ສຳເລັດແລ້ວ!');
}

function lockAdminMode() {
    isAdminLoggedIn = false;
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    document.getElementById('admin-banner-sidebar').classList.add('hidden');
    document.getElementById('top-admin-tag').classList.add('hidden');
    renderStockTable();
    
    if (window.location.hash === '#employees' || window.location.hash === '#payroll') {
        navigateTo('dashboard');
    }
    showToast('🔒 ອອກຈາກ Admin Mode ແລ້ວ');
}

function handleAdminPinSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('modal-admin-pin-input');
    const val = input.value.trim();

    if (val === '7777' || val === '777777') {
        unlockAdminMode();
        closeAdminModalForce();
        navigateTo('employees');
    } else {
        showToast('❌ ລະຫັດຜ່ານ Admin ບໍ່ຖືກຕ້ອງ');
    }
}

function closeAdminModalForce() {
    const modal = document.getElementById('admin-pin-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
    const input = document.getElementById('modal-admin-pin-input');
    if (input) input.value = '';
}

// --- RENDER STOCK TABLE WITH ADMIN-AWARE ACTIONS ---
let currentStockFilter = 'all';

function renderStockTable(filterCat = currentStockFilter) {
    currentStockFilter = filterCat;
    const tbody = document.getElementById('stock-table-body');
    const thActions = document.getElementById('th-stock-actions');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (thActions) {
        if (isAdminLoggedIn) {
            thActions.classList.remove('hidden');
        } else {
            thActions.classList.add('hidden');
        }
    }

    const filtered = filterCat === 'all' ? stockData : stockData.filter(i => i.category === filterCat);

    filtered.forEach(item => {
        const isLow = (item.stock || 0) <= (item.min_stock || 1);

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-low';
        tr.innerHTML = `
            <td class="p-3 font-mono font-bold text-primary">${item.sku}</td>
            <td class="p-3 font-bold text-on-surface">${item.name}</td>
            <td class="p-3 text-on-surface-variant font-medium">${item.category || 'N/A'}</td>
            <td class="p-3 text-outline">${item.branch || 'ສາຂານ້ຳພຸ'}</td>
            <td class="p-3 font-mono font-bold text-sm">${item.stock || 0}</td>
            <td class="p-3 font-mono text-outline">${item.min_stock || 1}</td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded font-bold text-[10px] ${isLow ? 'bg-red-100 text-error' : 'bg-emerald-100 text-emerald-800'}">
                    ${isLow ? '⚠️ ໄກ້ໝົດ' : '✓ OK'}
                </span>
            </td>
            ${isAdminLoggedIn ? `
            <td class="p-3 text-right space-x-1.5 whitespace-nowrap">
                <button onclick="adjustStockPrompt('${item.sku}', '${item.branch || 'ສາຂານ້ຳພຸ'}')" class="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all">
                    ປັບ Stock
                </button>
                <button onclick="deleteStock('${item.sku}', '${item.branch || 'ສາຂານ້ຳພຸ'}', '${item.name}')" class="px-2 py-1 bg-red-50 text-error hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all">
                    ລຶບ
                </button>
            </td>` : ''}
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('dash-total-items').textContent = `${stockData.length} ລາຍການ`;
    const lowCount = stockData.filter(i => (i.stock || 0) <= (i.min_stock || 1)).length;
    document.getElementById('dash-low-stock').textContent = `${lowCount} ລາຍການ`;
}

function filterStockCategory(category) {
    document.querySelectorAll('.stock-tab-btn').forEach(btn => {
        btn.className = 'stock-tab-btn whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface border border-outline-variant text-on-surface-variant';
    });
    const activeTab = document.getElementById(`tab-stock-${category}`);
    if (activeTab) activeTab.className = 'stock-tab-btn whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white';

    renderStockTable(category);
}

async function adjustStockPrompt(sku, branch) {
    if (!isAdminLoggedIn) {
        openModal('admin-pin-modal');
        return;
    }
    const item = stockData.find(i => i.sku === sku && i.branch === branch);
    if (item) {
        const newQty = prompt(`ປັບຈຳນວນ Stock ໃໝ່ສຳລັບ SKU: ${item.sku} (${item.name})`, item.stock || 0);
        if (newQty !== null && !isNaN(newQty)) {
            const parsedQty = parseInt(newQty);
            item.stock = parsedQty;

            if (supabaseClient) {
                await supabaseClient.from('main_inventory').update({ stock: parsedQty }).eq('sku', sku).eq('branch', branch);
            }

            renderStockTable();
            showToast(`✓ ອັບເດດ ${item.name} ເປັນ ${parsedQty} ແລ້ວ`);
        }
    }
}

// --- MODALS & TOAST ---
function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
    }
}
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'bg-primary text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto';
    toast.innerHTML = `<span class="material-symbols-outlined text-accent text-sm">info</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Live Clock
setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
    
    document.getElementById('top-live-clock').textContent = timeStr;
    document.getElementById('top-live-date').textContent = dateStr;
    document.getElementById('kiosk-digital-clock').textContent = timeStr;
    document.getElementById('kiosk-current-date').textContent = dateStr;
}, 1000);

// Sidebar Mobile Toggle
const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openMobileMenu() { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); }
function closeMobileMenu() { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); }
if (mobileBtn) { mobileBtn.onclick = openMobileMenu; overlay.onclick = closeMobileMenu; }

// Init App
window.addEventListener('DOMContentLoaded', () => {
    if (supabaseUrl) document.getElementById('config-supabase-url').value = supabaseUrl;
    if (supabaseKey) document.getElementById('config-supabase-key').value = supabaseKey;

    initSupabase();
    renderStockTable();
    renderEmployeesAndPayroll();
    populateStockMovementDropdown();
    renderMovementLogs();
    renderTodayKioskAttendance();
    renderAdminAttendanceTable('daily');
    updateOnDutyStaffUI();
    renderEarlyComerStreakRanking();
    navigateTo('dashboard');
});
