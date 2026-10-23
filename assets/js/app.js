// === MODULE: theme.js ===
/**
 * MitraUtama Theme Management Module
 * Mendukung mode:
 * - light (cerah default)
 * - dark (mitrautama-dark.css)
 * - auto (mitrautama-auto.css berdasarkan waktu: fajar, pagi, siang, senja, malam)
 */

class ThemeManager {
    constructor() {
        this.currentMode = localStorage.getItem('mitra_theme_mode') || 'auto'; // 'light', 'dark', 'auto'
        this.period = '';
        this.init();
    }

    init() {
        this.applyTheme(this.currentMode);
        
        // Cek update periode waktu berkala untuk mode auto
        setInterval(() => {
            if (this.currentMode === 'auto') {
                this.evaluateAutoTime();
            }
        }, 30000); // per 30 detik
    }

    /**
     * Hitung waktu fajar, pagi, siang, senja, malam
     * Waktu Indonesia / Tropis:
     * - Fajar (Dawn): 04:00 - 06:14 (Cahaya lembut keemasan pastel)
     * - Pagi (Morning): 06:15 - 11:29 (Cerah segar biru langit)
     * - Siang (Afternoon): 11:30 - 15:59 (Ultra-bright kontras tajam)
     * - Senja (Dusk): 16:00 - 17:59 (Hangat jingga lembayung sunset)
     * - Malam (Night): 18:00 - 03:59 (Deep night dark mode)
     */
    getTimePeriod(date = new Date()) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const timeVal = hours * 60 + minutes;

        if (timeVal >= 4 * 60 && timeVal < 6 * 60 + 15) {
            return {
                name: 'fajar',
                label: 'Fajar (Dawn)',
                icon: '🌅',
                greeting: 'Selamat Beribadah & Menjelang Pagi'
            };
        } else if (timeVal >= 6 * 60 + 15 && timeVal < 11 * 60 + 30) {
            return {
                name: 'pagi',
                label: 'Pagi (Morning)',
                icon: '☀️',
                greeting: 'Selamat Pagi'
            };
        } else if (timeVal >= 11 * 60 + 30 && timeVal < 16 * 60) {
            return {
                name: 'siang',
                label: 'Siang (Afternoon)',
                icon: '🌞',
                greeting: 'Selamat Siang'
            };
        } else if (timeVal >= 16 * 60 && timeVal < 18 * 60) {
            return {
                name: 'senja',
                label: 'Senja (Dusk)',
                icon: '🌇',
                greeting: 'Selamat Sore Menjelang Senja'
            };
        } else {
            return {
                name: 'malam',
                label: 'Malam (Night)',
                icon: '🌙',
                greeting: 'Selamat Malam'
            };
        }
    }

    evaluateAutoTime() {
        const periodInfo = this.getTimePeriod();
        document.documentElement.setAttribute('data-period', periodInfo.name);
        this.period = periodInfo.name;

        // Sync dark stylesheet and attribute if night period
        const themeLink = document.getElementById('theme-stylesheet');
        if (themeLink) {
            const timestamp = Date.now();
            if (periodInfo.name === 'malam') {
                themeLink.href = 'assets/css/mitrautama-dark.css?v=' + timestamp;
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                themeLink.href = 'assets/css/mitrautama.css?v=' + timestamp;
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }

        // Dispatch custom event agar modul UI lain bisa bereaksi (misal greeting badge)
        const event = new CustomEvent('themePeriodChange', { detail: periodInfo });
        window.dispatchEvent(event);
    }

    setTheme(mode) {
        this.currentMode = mode;
        localStorage.setItem('mitra_theme_mode', mode);
        this.applyTheme(mode);
    }

    applyTheme(mode) {
        const themeLink = document.getElementById('theme-stylesheet');
        const autoLink = document.getElementById('auto-theme-stylesheet');

        if (!themeLink || !autoLink) return;

        const timestamp = Date.now();
        if (mode === 'dark') {
            themeLink.href = 'assets/css/mitrautama-dark.css?v=' + timestamp;
            autoLink.disabled = true;
            document.documentElement.removeAttribute('data-period');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (mode === 'light') {
            themeLink.href = 'assets/css/mitrautama.css?v=' + timestamp;
            autoLink.disabled = true;
            document.documentElement.removeAttribute('data-period');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // mode === 'auto'
            autoLink.disabled = false;
            this.evaluateAutoTime();
        }

        const event = new CustomEvent('themeModeChange', {
            detail: { mode, period: this.period }
        });
        window.dispatchEvent(event);
    }

    getCurrentPeriod() {
        return this.getTimePeriod();
    }
}

const themeManager = new ThemeManager();
window.themeManager = themeManager;

// === MODULE: theme-ui.js ===
/**
 * MitraUtama Theme UI Controller & User Session Controller
 */


class ThemeUIController {
    constructor() {
        this.init();
    }

    init() {
        this.bindButtons();
        this.bindEvents();
        this.updateActiveButton(themeManager.currentMode);
    }

    bindButtons() {
        // Event delegation on document to handle dynamically loaded elements (e.g. from moduleLoader/includes/header.html)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-theme-set], [data-mitrautama-theme]');
            if (btn) {
                e.preventDefault();
                const mode = btn.getAttribute('data-theme-set') || btn.getAttribute('data-mitrautama-theme');
                if (mode) {
                    themeManager.setTheme(mode);
                    this.updateActiveButton(mode);
                }
            }
        });
        this.updateActiveButton(themeManager.currentMode);
    }

    updateActiveButton(mode) {
        const buttons = document.querySelectorAll('[data-theme-set], [data-mitrautama-theme]');
        buttons.forEach(btn => {
            const btnMode = btn.getAttribute('data-theme-set') || btn.getAttribute('data-mitrautama-theme');
            if (btnMode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const activeThemeText = document.getElementById('user-dropdown-active-theme');
        if (activeThemeText) {
            if (mode === 'auto') activeThemeText.textContent = 'Auto (Waktu)';
            else if (mode === 'light') activeThemeText.textContent = 'Cerah (Light)';
            else if (mode === 'dark') activeThemeText.textContent = 'Gelap (Dark)';
        }

        const label = document.getElementById('current-theme-label');
        if (label) {
            if (mode === 'auto') label.textContent = 'Auto Theme';
            else if (mode === 'light') label.textContent = 'Light Theme';
            else if (mode === 'dark') label.textContent = 'Dark Theme';
        }
    }

    bindEvents() {
        window.addEventListener('themeModeChange', (e) => {
            this.updateActiveButton(e.detail.mode);
        });
        window.addEventListener('modulesLoaded', () => {
            this.updateActiveButton(themeManager.currentMode);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeUIController = new ThemeUIController();
});

// === MODULE: toast.js ===
/**
 * MitraUtama Toast Modular Notification System (mitrautama- namespace + SVG Icons)
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (!document.querySelector('.mitrautama-toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'mitrautama-toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.mitrautama-toast-container');
        }
    }

    show({ title = 'Notifikasi', message = '', type = 'info', duration = 4000 }) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `mitrautama-toast mitrautama-toast-${type}`;

        const svgIcons = {
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
            info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
        };

        toast.innerHTML = `
            <div class="mitrautama-toast-icon">${svgIcons[type] || svgIcons.info}</div>
            <div class="mitrautama-toast-content">
                <div class="mitrautama-toast-title">${title}</div>
                <div class="mitrautama-toast-message">${message}</div>
            </div>
            <button type="button" class="mitrautama-toast-close" title="Tutup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="mitrautama-toast-progress" style="transition: width ${duration}ms linear; width: 100%;"></div>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            const progress = toast.querySelector('.mitrautama-toast-progress');
            if (progress) progress.style.width = '0%';
        }, 50);

        const closeBtn = toast.querySelector('.mitrautama-toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('hiding')) return;
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

const toastManager = new ToastManager();

// === MODULE: modal.js ===
/**
 * MitraUtama Modal Manager Module
 * Rules:
 * 1. Modal TIDAK BOLEH auto-close (tidak tertutup saat klik backdrop / overlay di luar modal).
 * 2. Modal TIDAK BOLEH auto-close dengan timer atau keyboard Escape (kecuali tombol manual ditekan).
 * 3. Modal HANYA BISA ditutup secara manual melalui tombol close [X], tombol 'Tutup' / 'Batal'.
 * 4. Mendukung atribut awalan mitrautama-:
 *    - data-mitrautama-modal-open="modalId"
 *    - data-mitrautama-modal-close="modalId"
 *    - (backward compatible dengan data-modal-open / data-modal-close)
 */

class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // Cegah klik backdrop overlay menutup modal secara otomatis
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.preventDefault();
                e.stopPropagation();

                // Beri efek shake halus untuk mengindikasikan modal harus ditutup manual
                const modalBox = e.target.querySelector('.modal-box');
                if (modalBox) {
                    modalBox.classList.add('modal-shake');
                    setTimeout(() => modalBox.classList.remove('modal-shake'), 400);
                }
            }
        });

        // Event listener delegasi untuk tombol penutup manual
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('[data-mitrautama-modal-close], [data-modal-close]');
            if (closeBtn) {
                const modalId = closeBtn.getAttribute('data-mitrautama-modal-close') ||
                                closeBtn.getAttribute('data-modal-close') ||
                                closeBtn.closest('.modal-overlay')?.id;
                if (modalId) {
                    this.close(modalId);
                }
            }
        });

        // Event listener delegasi untuk tombol pembuka modal
        document.addEventListener('click', (e) => {
            const openBtn = e.target.closest('[data-mitrautama-modal-open], [data-modal-open]');
            if (openBtn) {
                const modalId = openBtn.getAttribute('data-mitrautama-modal-open') ||
                                openBtn.getAttribute('data-modal-open');
                if (modalId) {
                    this.open(modalId);
                }
            }
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found.`);
            return;
        }

        modal.classList.add('active');
        document.body.classList.add('modal-open');
        this.activeModals.add(modalId);

        modal.dispatchEvent(new CustomEvent('modal:opened', { detail: { modalId } }));
    }

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.activeModals.delete(modalId);

        if (this.activeModals.size === 0) {
            document.body.classList.remove('modal-open');
        }

        modal.dispatchEvent(new CustomEvent('modal:closed', { detail: { modalId } }));
    }

    isOpen(modalId) {
        return this.activeModals.has(modalId);
    }
}

const modalManager = new ModalManager();
window.modalManager = modalManager;

// === MODULE: charts.js ===
/**
 * MitraUtama Traffic & Charts Module
 * Render realtime Chart.js untuk Traffic Throughput (Rx / Tx), CPU Load, Memory, dan Latency.
 * Dilengkapi lifecycle management: penghancuran timer lama untuk mencegah timer leak.
 */

class ChartController {
    constructor() {
        this.trafficChart = null;
        this.cpuChart = null;
        this.maxDataPoints = 25;
        this.timeLabels = [];
        this.rxData = [];
        this.txData = [];
        this.cpuData = [];
        this.streamTimer = null;
        this.init();
    }

    init() {
        this.initTrafficChart();
        this.initCpuChart();
        this.startSimulatedRealtimeStream();
        this.bindThemeChange();
    }

    isDarkMode() {
        if (typeof document === 'undefined') return false;
        const docTheme = document.documentElement.getAttribute('data-theme');
        const docPeriod = document.documentElement.getAttribute('data-period');
        return docTheme === 'dark' || docPeriod === 'malam';
    }

    getThemeColors() {
        const isDark = this.isDarkMode();
        return {
            gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.6)',
            tickColor: isDark ? '#94a3b8' : '#64748b'
        };
    }

    bindThemeChange() {
        if (typeof window === 'undefined') return;
        const updateColors = () => {
            const colors = this.getThemeColors();
            if (this.trafficChart) {
                if (this.trafficChart.options.scales.y) {
                    this.trafficChart.options.scales.y.grid.color = colors.gridColor;
                    this.trafficChart.options.scales.y.ticks.color = colors.tickColor;
                }
                if (this.trafficChart.options.scales.x) {
                    this.trafficChart.options.scales.x.ticks.color = colors.tickColor;
                }
                if (this.trafficChart.options.plugins.legend && this.trafficChart.options.plugins.legend.labels) {
                    this.trafficChart.options.plugins.legend.labels.color = colors.tickColor;
                }
                this.trafficChart.update('none');
            }
            if (this.cpuChart && this.cpuChart.options.scales.y) {
                this.cpuChart.options.scales.y.ticks.color = colors.tickColor;
                this.cpuChart.update('none');
            }
        };
        window.addEventListener('themeModeChange', updateColors);
        window.addEventListener('themePeriodChange', updateColors);
    }

    destroyCharts() {
        if (this.trafficChart) {
            this.trafficChart.destroy();
            this.trafficChart = null;
        }
        if (this.cpuChart) {
            this.cpuChart.destroy();
            this.cpuChart = null;
        }
    }

    initTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        if (this.trafficChart) {
            this.trafficChart.destroy();
            this.trafficChart = null;
        }

        // Inisialisasi awal 15 titik data jika belum ada
        if (this.timeLabels.length === 0) {
            const now = new Date();
            for (let i = 14; i >= 0; i--) {
                const t = new Date(now.getTime() - i * 2000);
                this.timeLabels.push(t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                this.rxData.push(Math.floor(12 + Math.random() * 8)); // Mbps
                this.txData.push(Math.floor(6 + Math.random() * 5));  // Mbps
            }
        }

        this.trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [
                    {
                        label: 'Download (Rx)',
                        data: this.rxData,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 0
                    },
                    {
                        label: 'Upload (Tx)',
                        data: this.txData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 11, family: 'Segoe UI' } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: { maxTicksLimit: 6, font: { size: 10 } }
                    },
                    y: {
                        display: true,
                        grid: { color: this.getThemeColors().gridColor },
                        ticks: {
                            font: { size: 10 },
                            callback: (val) => val + ' Mbps'
                        }
                    }
                }
            }
        });
    }

    initCpuChart() {
        const ctx = document.getElementById('cpuChart');
        if (!ctx) return;

        if (this.cpuChart) {
            this.cpuChart.destroy();
            this.cpuChart = null;
        }

        if (this.cpuData.length === 0) {
            for (let i = 14; i >= 0; i--) {
                this.cpuData.push(Math.floor(2 + Math.random() * 5));
            }
        }

        this.cpuChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [{
                    label: 'CPU Load (%)',
                    data: this.cpuData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    fill: true,
                    tension: 0.2,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { font: { size: 10 }, callback: (v) => v + '%' }
                    }
                }
            }
        });
    }

    startSimulatedRealtimeStream() {
        // Hentikan timer sebelumnya jika sudah aktif (mencegah duplikasi timer)
        if (this.streamTimer) {
            clearInterval(this.streamTimer);
            this.streamTimer = null;
        }

        this.streamTimer = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            // Random traffic pulse
            const newRx = Math.floor(10 + Math.random() * 18);
            const newTx = Math.floor(4 + Math.random() * 9);
            const newCpu = Math.floor(2 + Math.random() * 7);

            // Update live numbers di KPI
            const liveWanRx = document.getElementById('kpi-wan-rx');
            const liveWanTx = document.getElementById('kpi-wan-tx');
            const liveCpuVal = document.getElementById('kpi-cpu-val');
            const liveCpuBar = document.getElementById('kpi-cpu-bar');

            if (liveWanRx) liveWanRx.textContent = newRx + ' Mbps';
            if (liveWanTx) liveWanTx.textContent = newTx + ' Mbps';
            if (liveCpuVal) liveCpuVal.textContent = newCpu + '%';
            if (liveCpuBar) liveCpuBar.style.width = newCpu + '%';

            if (this.trafficChart) {
                this.timeLabels.push(timeStr);
                this.rxData.push(newRx);
                this.txData.push(newTx);

                if (this.timeLabels.length > this.maxDataPoints) {
                    this.timeLabels.shift();
                    this.rxData.shift();
                    this.txData.shift();
                }

                this.trafficChart.update('quiet');
            }

            if (this.cpuChart) {
                this.cpuData.push(newCpu);
                if (this.cpuData.length > this.maxDataPoints) {
                    this.cpuData.shift();
                }
                this.cpuChart.update('quiet');
            }
        }, 2000);
    }

    stopStream() {
        if (this.streamTimer) {
            clearInterval(this.streamTimer);
            this.streamTimer = null;
        }
    }
}

const chartController = new ChartController();
if (typeof window !== 'undefined') {
    window.chartController = chartController;
}

// === MODULE: navigation.js ===
/**
 * MitraUtama Dashboard Navigation & View Switcher
 * Mengontrol pembukaan Menu, Sub-Menu Drop-Right, Tab-Menu, Filter Tabel, Collapse Sidebar, dan Aksi SweetAlert
 * Menggunakan class dan selector awalan mitrautama-
 */


class NavigationManager {
    constructor() {
        this.activeView = 'dashboard'; // Defaultkan langsung ke interfaces agar langsung muncul
        this.init();
    }

    init() {
        this.bindSidebarCollapse();
        this.bindSidebarMenus();
        this.bindDropRightSubMenus();
        this.bindWinboxSubTabs();
        this.bindActionButtons();
        this.bindQuickSweetAlerts();
        this.bindTerminalEvents();

        // Pastikan view awal aktif
        this.switchView('dashboard', 'Home');
    }

    bindSidebarCollapse() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const logoIcon = document.querySelector('.mitrautama-header-left .mu-logo-icon') || document.querySelector('.mu-logo-icon');
        const sidebar = document.getElementById('sidebarMenu');
        
        const toggleSidebar = () => {
            if (!sidebar) return;
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // Saat mobile: Toggle drawer slide-in dari kiri
                const isDrawerOpen = document.body.classList.toggle('mitrautama-mobile-drawer-open');
                if (toggleBtn) {
                    toggleBtn.setAttribute('aria-expanded', isDrawerOpen ? 'true' : 'false');
                }
            } else {
                // Saat desktop: Collapse rail sidebar
                sidebar.classList.toggle('collapsed');
                const isCollapsed = sidebar.classList.contains('collapsed');
                document.body.classList.toggle('mitrautama-sidebar-collapsed', isCollapsed);
                if (toggleBtn) {
                    toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
                }
                localStorage.setItem('mitra_sidebar_collapsed', isCollapsed ? 'true' : 'false');
                
                // Trigger window resize event agar Chart.js merespons lebar canvas baru
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 260);
            }
        };

        // Buat Mobile Backdrop Overlay jika belum ada di DOM
        let backdrop = document.querySelector('.mitrautama-mobile-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'mitrautama-mobile-backdrop';
            document.body.appendChild(backdrop);
        }
        backdrop.addEventListener('click', () => {
            document.body.classList.remove('mitrautama-mobile-drawer-open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        });

        if (toggleBtn && sidebar) {
            toggleBtn.setAttribute('aria-expanded', sidebar.classList.contains('collapsed') ? 'false' : 'true');
            toggleBtn.addEventListener('click', toggleSidebar);
        }

        if (logoIcon) {
            logoIcon.addEventListener('click', () => {
                if (document.body.classList.contains('mitrautama-sidebar-collapsed') || (sidebar && sidebar.classList.contains('collapsed'))) {
                    toggleSidebar();
                }
            });
            logoIcon.title = 'MitraUtama WebUI (Klik untuk memperluas sidebar saat diciutkan)';
        }

        // Pulihkan state collapse dari localStorage jika ada
        if (localStorage.getItem('mitra_sidebar_collapsed') === 'true' && sidebar) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('mitrautama-sidebar-collapsed');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    bindSidebarMenus() {
        // Direct click pada menu item utama
        const mainLinks = document.querySelectorAll('.mitrautama-menu-item[data-mitrautama-view]');
        mainLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.getAttribute('data-mitrautama-view');
                const title = link.querySelector('.mitrautama-menu-text')?.textContent.trim() || viewId;
                this.switchView(viewId, title);

                document.querySelectorAll('.mitrautama-menu-item, .mitrautama-submenu-item').forEach(m => m.classList.remove('active'));
                link.classList.add('active');

                // Tutup semua popover flyout
                document.querySelectorAll('.mitrautama-menu-group').forEach(g => g.classList.remove('open'));

                // Saat mobile: tutup drawer sidebar langsung setelah menu diklik
                if (window.innerWidth <= 768) {
                    document.body.classList.remove('mitrautama-mobile-drawer-open');
                    const toggleBtn = document.getElementById('sidebar-toggle-btn');
                    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    bindDropRightSubMenus() {
        // Klik toggle submenu untuk membuka/menutup popover drop-right
        const subToggles = document.querySelectorAll('.mitrautama-submenu-toggle');
        subToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parentGroup = toggle.closest('.mitrautama-menu-group');
                const subList = parentGroup ? parentGroup.querySelector('.mitrautama-submenu-list') : null;
                
                const isOpen = parentGroup && parentGroup.classList.contains('open');

                document.querySelectorAll('.mitrautama-menu-group').forEach(g => {
                    g.classList.remove('open');
                });

                if (parentGroup && !isOpen) {
                    parentGroup.classList.add('open');

                    const isMobile = window.innerWidth <= 768;
                    if (!isMobile && subList) {
                        // Desktop: Flyout drop-right fixed positioning
                        const rect = toggle.getBoundingClientRect();
                        subList.style.position = 'fixed';
                        subList.style.left = (rect.right + 4) + "px";
                        subList.style.top = rect.top + "px";
                        subList.style.zIndex = '9999';

                        const listRect = subList.getBoundingClientRect();
                        const footerEl = document.querySelector('.mitrautama-fixed-footer');
                        const footerTop = footerEl ? footerEl.getBoundingClientRect().top : window.innerHeight;
                        const maxBottom = Math.min(window.innerHeight, footerTop) - 8;
                        if (listRect.bottom > maxBottom) {
                            const diff = listRect.bottom - maxBottom;
                            subList.style.top = Math.max(10, rect.top - diff) + "px";
                        }
                    } else if (isMobile && subList) {
                        // Mobile: Reset fixed coordinates to allow smooth in-line accordion dropdown
                        subList.style.position = '';
                        subList.style.left = '';
                        subList.style.top = '';
                        subList.style.zIndex = '';
                    }
                }
            });
        });

        // Klik langsung pada item sub-menu drop-right (misal: Host, Port Isolation, Ports, Rule, Settings, VLAN pada Switch)
        const subItems = document.querySelectorAll('.mitrautama-submenu-item[data-mitrautama-view]');
        subItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const viewId = item.getAttribute('data-mitrautama-view');
                const label = item.textContent.trim();

                this.switchView(viewId, label);

                document.querySelectorAll('.mitrautama-menu-item, .mitrautama-submenu-item').forEach(m => m.classList.remove('active'));
                item.classList.add('active');

                const parentGroup = item.closest('.mitrautama-menu-group');
                if (parentGroup) {
                    const parentMenu = parentGroup.querySelector('.mitrautama-menu-item');
                    if (parentMenu) parentMenu.classList.add('active');
                }

                // Saat mobile: tutup drawer sidebar langsung setelah sub-menu diklik
                if (window.innerWidth <= 768) {
                    document.body.classList.remove('mitrautama-mobile-drawer-open');
                    const toggleBtn = document.getElementById('sidebar-toggle-btn');
                    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mitrautama-menu-group')) {
                document.querySelectorAll('.mitrautama-menu-group').forEach(g => g.classList.remove('open'));
            }
        });
    }

    bindWinboxSubTabs() {
        // Selector untuk sub-tabs mitrautama standard, mitrane tabs, dan tab-target
        const subTabs = document.querySelectorAll('[data-mitrautama-subtab], .mitrautama-winbox-tab[data-tab-target], .mitrautama-subtab[data-mitrautama-subtab], .mitrane-tab-item');
        subTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const subtabName = tab.getAttribute('data-mitrautama-subtab') || tab.getAttribute('data-tab-target');
                const parentNav = tab.closest('.mitrane-tab-bar') || tab.closest('.mitrautama-subtabs-bar') || tab.parentElement;

                if (parentNav) {
                    parentNav.querySelectorAll('.active').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }

                // Jika ada tab-content yang berelasi
                const parentView = tab.closest('.mitrautama-subview') || tab.closest('.mitrautama-view-section') || document;
                const tabPanes = parentView.querySelectorAll('.mitrautama-tab-content, .mitrautama-tab-pane');
                if (tabPanes.length > 0 && subtabName) {
                    tabPanes.forEach(p => {
                        p.classList.remove('active');
                        p.style.display = 'none';
                    });
                    const targetContent = parentView.querySelector(`#subtab-${subtabName}`) || 
                                          parentView.querySelector(`#${subtabName}`) ||
                                          document.getElementById(subtabName);
                    if (targetContent) {
                        targetContent.classList.add('active');
                        targetContent.style.display = (targetContent.id.startsWith('subtab-wg-') || targetContent.id.startsWith('subtab-vpn-') || targetContent.id.startsWith('subtab-bridge-')) ? 'flex' : 'block';
                    }
                }

                // Update total items footer counter dynamically based on tab badge count
                const badge = tab.querySelector('.mitrane-tab-count-badge');
                const totalFooter = parentView.querySelector('#mitrane-total-items') || document.querySelector('#mitrane-total-items');
                if (totalFooter) {
                    if (badge) {
                        const countText = badge.textContent.trim();
                        totalFooter.textContent = `${countText} items`;
                    } else if (subtabName === 'interface') {
                        totalFooter.textContent = '30 items';
                    } else {
                        totalFooter.textContent = '0 items';
                    }
                }


            });
        });
    }

    switchView(viewId, titleLabel = '') {
        this.activeView = viewId;
        const allSections = document.querySelectorAll('.mitrautama-view-section');
        allSections.forEach(sec => {
            sec.style.display = 'none';
        });

        // 1. Pemetaan Alias Route ke Modul Spesifik
        // 1. Pemetaan Alias Route & Sub-Tab ke Modul Spesifik
        const routeConfigMap = {
            'terminal': { view: 'terminal' },
            'vpn': { view: 'ppp' },
            'qos': { view: 'queues' },
            'interfaces': { view: 'interfaces', subtab: 'interface' },
            'mpls-interfaces': { view: 'interfaces', subtab: 'interface' },
            'ip': { view: 'ip-addresses', subtab: 'ip-addr' },
            'ip-addresses': { view: 'ip-addresses', subtab: 'ip-addr' },
            'ip-routes': { view: 'ip-addresses', subtab: 'ip-routes' },
            'ip-dhcp-server': { view: 'ip-addresses', subtab: 'ip-dhcp' },
            'ip-dhcp-client': { view: 'ip-addresses', subtab: 'ip-dhcp' },
            'ip-pool': { view: 'ip-addresses', subtab: 'ip-pool' },
            'ip-firewall': { view: 'ip-addresses', subtab: 'ip-firewall' },
            'ip-dns': { view: 'ip-addresses', subtab: 'ip-routes' },
            'ip-hotspot': { view: 'ip-addresses', subtab: 'ip-dhcp' },
            'switch': { view: 'switch', subtab: 'switch-ports' },
            'switch-ports': { view: 'switch', subtab: 'switch-ports' },
            'switch-vlan': { view: 'switch', subtab: 'switch-vlan' },
            'switch-rule': { view: 'switch', subtab: 'switch-rule' },
            'switch-host': { view: 'switch', subtab: 'switch-host' },
            'switch-settings': { view: 'switch', subtab: 'switch-settings' },
            'switch-port-isolation': { view: 'switch', subtab: 'switch-port-isolation' },
            'system-resources': { view: 'system', subtab: 'sys-resources' },
            'system-routerboard': { view: 'system', subtab: 'sys-routerboard' },
            'system-users': { view: 'system', subtab: 'sys-users' },
            'wireless-tables': { view: 'wireless-tables', subtab: 'wireless-tables' },
            'wireless-security': { view: 'wireless-tables', subtab: 'wireless-security' },
            'wireless-registration': { view: 'wireless-tables', subtab: 'wireless-registration' },
            'wireless': { view: 'wireless-tables', subtab: 'wireless-tables' },
            'wireguard': { view: 'wireguard' },
            'bridge': { view: 'bridge' },
            'ppp': { view: 'ppp' },
            'queues': { view: 'queues' },
            'xolt': { view: 'xolt', subtab: 'xolt-pon-ports' },
            'xolt-onus': { view: 'xolt', subtab: 'xolt-onus' },
            'xolt-optical': { view: 'xolt', subtab: 'xolt-optical' },
            'xolt-dba': { view: 'xolt', subtab: 'xolt-dba' },
            'xolt-vlans': { view: 'xolt', subtab: 'xolt-vlans' },
            'ipv6-addresses': { view: 'ipv6', subtab: 'ipv6-addresses' },
            'ipv6-routes': { view: 'ipv6', subtab: 'ipv6-routes' },
            'ipv6-firewall': { view: 'ipv6', subtab: 'ipv6-firewall' },
            'ipv6': { view: 'ipv6', subtab: 'ipv6-addresses' },
            'routing-bgp': { view: 'routing', subtab: 'routing-bgp' },
            'routing-ospf': { view: 'routing', subtab: 'routing-ospf' },
            'routing': { view: 'routing', subtab: 'routing-bgp' },
            'mpls': { view: 'mpls', subtab: 'mpls-interfaces' },
            'mpls-ldp': { view: 'mpls', subtab: 'mpls-ldp' },
            'log': { view: 'log', subtab: 'log-all' },
            'files': { view: 'files', subtab: 'files-all' },
            'radius': { view: 'radius', subtab: 'radius-servers' },
            'tools-torch': { view: 'tools-torch', subtab: 'tools-torch-tab' },
            'tools': { view: 'tools-torch', subtab: 'tools-torch-tab' },
            'mesh': { view: 'mesh', subtab: 'mesh-interfaces' },
            'dot1x': { view: 'dot1x', subtab: 'dot1x-server' },
            'xray': { view: 'xray', subtab: 'xray-inbounds' },
            'kvm': { view: 'kvm', subtab: 'kvm-guests' },
            'devices': { view: 'devices', subtab: 'devices-usb' },
        };

        const routeEntry = routeConfigMap[viewId] || { view: viewId };
        const resolvedId = routeEntry.view;
        const targetSubtab = routeEntry.subtab;

        const targetSection = document.getElementById("view-" + resolvedId);
        if (targetSection) {
            targetSection.style.display = 'block';
            if (targetSubtab) {
                this.activateSubTab(targetSection, targetSubtab);
            }
            const container = document.querySelector('.mitrautama-content-area');
            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
                if (resolvedId !== 'dashboard') {
                    container.classList.add('winbox-mode');
                } else {
                    container.classList.remove('winbox-mode');
                }
            }
        // 2. Auto-activate specific SubTab if navigating from submenu item
        const subtabTargetMap = {
            'switch-ports': 'switch-ports',
            'switch-vlan': 'switch-vlan',
            'switch-rule': 'switch-rule',
            'switch-host': 'switch-host',
            'switch-settings': 'switch-settings',
            'switch-port-isolation': 'switch-port-isolation',
            'system-resources': 'sys-resources',
            'system-routerboard': 'sys-routerboard',
            'system-users': 'sys-users',
            'wireless-tables': 'wireless-tables',
            'xolt': 'xolt-pon-ports',
            'xolt-onus': 'xolt-onus',
            'xolt-optical': 'xolt-optical',
            'xolt-dba': 'xolt-dba',
            'xolt-vlans': 'xolt-vlans',
            'wireless-security': 'wireless-security',
            'wireless-registration': 'wireless-registration',
            'ip-addresses': 'ip-addr',
            'ip-routes': 'ip-routes',
            'ip-pool': 'ip-pool',
            'ip-firewall': 'ip-firewall'
        };

        if (subtabTargetMap[viewId] && targetSection) {
            this.activateSubTab(targetSection, subtabTargetMap[viewId]);
        }


            // Dashboard Chart Lifecycle Integration
            if (viewId === 'dashboard' && window.chartController) {
                window.chartController.initTrafficChart();
                window.chartController.initCpuChart();
                window.chartController.startSimulatedRealtimeStream();
            } else if (window.chartController) {
                window.chartController.stopStream();
            }
        } else {
            if (window.chartController) {
                window.chartController.stopStream();
            }
            this.renderDynamicView(viewId, titleLabel);
        }


    }

    activateSubTab(parentSection, subtabId) {
        if (!parentSection) return;
        const tabBtn = parentSection.querySelector('[data-mitrautama-subtab=\"' + subtabId + '\"], [data-tab-target=\"' + subtabId + '\"]');
        if (tabBtn) tabBtn.click();
    }

    renderDynamicView(viewId, titleLabel) {
        let genericSection = document.getElementById('view-generic-module');
        if (!genericSection) {
            genericSection = document.createElement('div');
            genericSection.id = 'view-generic-module';
            genericSection.className = 'mitrautama-view-section';
            document.querySelector('.mitrautama-content-area').appendChild(genericSection);
        }

        genericSection.innerHTML = `
            <div class="mitrautama-win-header">
                <div class="mitrautama-win-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span>${titleLabel || viewId}</span>
                </div>
            </div>

            <div class="mitrautama-winbox-toolbar">
                <div class="mitrautama-toolbar-actions">
                    <button class="mitrautama-toolbar-btn text-primary" onclick="Swal.fire('Tambah', 'Tambah entri pada ${titleLabel}', 'info')">
                        <strong>+</strong> New
                    </button>
                    <button class="mitrautama-toolbar-btn text-success" >
                        ✓ Enable
                    </button>
                    <button class="mitrautama-toolbar-btn text-danger" >
                        ✕ Disable
                    </button>
                    <button class="mitrautama-toolbar-btn text-muted" >
                        ✎ Comment
                    </button>
                </div>
                <div>
                    <input type="text" placeholder="Find / Filter..." class="form-control form-control-sm" style="height: 24px; font-size: 0.75rem; width: 140px;">
                </div>
            </div>

            <div class="mitrautama-table-container mt-0" style="border-radius: 0 0 8px 8px; border-top: none;">
                <table class="mitrautama-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Parameter / Item</th>
                            <th>Nilai Konfigurasi</th>
                            <th>Interface Target</th>
                            <th>Status Operasional</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center py-4 text-muted">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2 text-secondary"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                <div>Tidak ada data pada modul <strong>${titleLabel || viewId}</strong></div>
                                <small class="text-secondary">Konfigurasi parameter belum diatur pada RouterOS ini.</small>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        genericSection.style.display = 'block';
        const container = document.querySelector('.mitrautama-content-area');
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }

    bindActionButtons() {
        const pingBtn = document.getElementById('btn-action-ping');
        if (pingBtn) {
            pingBtn.addEventListener('click', () => {
                this.runPingTest();
            });
        }

        const rebootBtn = document.getElementById('btn-action-reboot');
        if (rebootBtn) {
            rebootBtn.addEventListener('click', () => {
                Swal.fire({
                    title: 'Konfirmasi Reboot Router',
                    text: 'Apakah Anda yakin ingin me-restart MikroTik RB3011 (172.16.92.230)?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Ya, Reboot Sekarang',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        toastManager.show({
                            title: 'Perintah Diterima',
                            message: 'Reboot aman disimulasikan (proteksi data aktif).',
                            type: 'warning',
                            duration: 4000
                        });
                        Swal.fire({
                            title: 'Simulasi Reboot',
                            text: 'Perintah reboot diuji dengan aman tanpa memutus koneksi produksi.',
                            icon: 'success'
                        });
                    }
                });
            });
        }

        const backupBtn = document.getElementById('btn-action-backup');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                Swal.fire({
                    title: 'Buat Backup Konfigurasi',
                    text: 'Menyimpan cadangan konfigurasi sistem RouterOS...',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Mulai Backup',
                    cancelButtonText: 'Tutup'
                }).then((res) => {
                    if (res.isConfirmed) {
                        toastManager.show({
                            title: 'Backup Berhasil',
                            message: 'File backup2026.backup siap diunduh.',
                            type: 'success',
                            duration: 3500
                        });
                    }
                });
            });
        }
    }

    runPingTest() {
        const pingOutput = document.getElementById('ping-results-box');
        if (!pingOutput) return;

        pingOutput.innerHTML = `<span class="text-primary">Mengirim 4 paket ICMP ke gateway 172.16.92.254...</span><br>`;

        let count = 1;
        const interval = setInterval(() => {
            if (count > 4) {
                clearInterval(interval);
                pingOutput.innerHTML += `<br><span class="text-success fw-bold">✓ Selesai: 4 packets transmitted, 4 received, 0% packet loss, avg RTT = 0.8ms</span>`;
                toastManager.show({
                    title: 'Ping Berhasil',
                    message: 'Koneksi ke gateway normal (loss 0%, RTT 0.8ms).',
                    type: 'success',
                    duration: 3000
                });
                return;
            }
            const rtt = (0.6 + Math.random() * 0.5).toFixed(1);
            pingOutput.innerHTML += `SEQ=${count} HOST=172.16.92.254 SIZE=56 TTL=64 TIME=${rtt}ms<br>`;
            count++;
        }, 600);
    }


    bindTerminalEvents() {
        let sessionCounter = 1;

        const setupInputListener = (pane) => {
            const input = pane.querySelector('.terminal-cli-input');
            const output = pane.querySelector('.terminal-history-output');
            if (!input || !output) return;

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const cmd = input.value.trim();
                    if (!cmd) return;

                    const userCmdLine = document.createElement('div');
                    userCmdLine.className = 'text-muted';
                    userCmdLine.textContent = `[admin@BACKBONE] > ${cmd}`;
                    output.appendChild(userCmdLine);

                    const responseLine = document.createElement('div');
                    responseLine.className = 'terminal-prompt';

                    if (cmd === '/interface print' || cmd === 'interface print' || cmd === 'ip link') {
                        responseLine.innerHTML = `Flags: R - RUNNING; S - SLAVE<br>
 0 R  name="ETH1" type=ether mtu=1500 actual-mtu=1500 l2mtu=1500<br>
 1    name="ETH2" type=ether mtu=1500 actual-mtu=1500 l2mtu=1500<br>
 2 R  name="LO" type=loopback mtu=65536 actual-mtu=65536<br>
 3 R  name="WG-BACKBONE" type=wireguard mtu=1420`;
                    } else if (cmd === '/system resource print' || cmd === 'system resource print') {
                        responseLine.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;uptime: 16h50m00s<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;version: 7.24.5 (stable)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;free-memory: 942.1MiB<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;total-memory: 1024.0MiB<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cpu: ARMv7<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cpu-count: 2<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cpu-frequency: 1400MHz<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cpu-load: 2%`;
                    } else if (cmd === 'clear' || cmd === '/clear') {
                        output.innerHTML = '';
                        input.value = '';
                        return;
                    } else if (cmd === '?' || cmd === 'help' || cmd === '/help') {
                        responseLine.innerHTML = `Available commands: /interface print, /system resource print, /ip address print, /ping 8.8.8.8, clear, exit`;
                    } else {
                        responseLine.style.color = '#ef4444';
                        responseLine.textContent = `bad command name ${cmd} (line 1 column 1)`;
                    }

                    output.appendChild(responseLine);
                    input.value = '';
                    pane.scrollTop = pane.scrollHeight;
                }
            });
        };

        // Initial setup for first session
        const firstPane = document.getElementById('terminal-session-1');
        if (firstPane) setupInputListener(firstPane);

        // Add New Terminal Tab Button Listener (Debounced single addition)
        const btnAddNew = document.getElementById('btn-add-new-terminal');
        const tabsContainer = document.getElementById('terminal-tabs-container');
        const sessionsContainer = document.getElementById('terminal-sessions-container');

        if (btnAddNew && tabsContainer && sessionsContainer) {
            let isAdding = false;
            btnAddNew.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isAdding) return;
                isAdding = true;

                sessionCounter++;
                const newId = sessionCounter;

                // Deactivate all existing tabs & panes
                tabsContainer.querySelectorAll('.mitrane-tab-item').forEach(t => t.classList.remove('active'));
                sessionsContainer.querySelectorAll('.terminal-session-pane').forEach(p => p.style.display = 'none');

                // Create new Tab Element with small close button
                const newTab = document.createElement('a');
                newTab.href = '#';
                newTab.className = 'mitrane-tab-item mitrautama-winbox-tab active';
                newTab.setAttribute('data-terminal-tab', newId);
                newTab.innerHTML = `<span>New Terminal</span><span class="mitrane-tab-close-btn close-tab-btn" title="Tutup Sesi Terminal" aria-label="Close Tab">&times;</span>`;
                tabsContainer.appendChild(newTab);

                // Create new Terminal Pane
                const newPane = document.createElement('div');
                newPane.className = 'terminal-session-pane flex-grow-1 p-3 font-monospace overflow-auto';
                newPane.id = `terminal-session-${newId}`;
                newPane.setAttribute('data-session-id', newId);
                newPane.style.height = '100%';
                newPane.style.fontSize = '0.85rem';
                newPane.style.lineHeight = '1.6';
                newPane.style.userSelect = 'text';

                newPane.innerHTML = `
                    <div class="terminal-ascii-art">
  MMM      MMM       KKK                          TTTTTTTTTTT      KKK<br>
  MMMM    MMMM       KKK                          TTTTTTTTTTT      KKK<br>
  MMM MMMM MMM  III  KKK  KKK  RRRRR   OOOOOO         TTT     III  KKK  KKK<br>
  MMM  MM  MMM  III  KKKKK     RR  RR OOO  OOO        TTT     III  KKKKK<br>
  MMM      MMM  III  KKK KKK   RRRRR  OOO  OOO        TTT     III  KKK KKK<br>
  MMM      MMM  III  KKK  KKK  RR  RR  OOOOOO         TTT     III  KKK  KKK<br>
                    </div>
                    <div class="mt-2 terminal-info-text">
                      MikroTik RouterOS 7.24.5 (c) 1999-2026 http://www.mikrotik.com/<br>
                      Board: RB3011UiAS-RM (ARM 2 Cores @ 1.4 GHz, 1024 MB RAM)<br>
                      Terminal Session: #${newId} [local admin console active]
                    </div>
                    <hr style="margin: 10px 0;">
                    <div class="terminal-history-output"></div>
                    <div class="d-flex align-items-center mt-2 terminal-prompt-line">
                      <span class="terminal-prompt fw-bold me-2">[admin@BACKBONE] &gt;</span>
                      <input type="text" class="terminal-cli-input terminal-input bg-transparent border-0 font-monospace flex-grow-1 p-0" style="outline: none; box-shadow: none; font-size: 0.85rem;" autofocus autocomplete="off" spellcheck="false" placeholder="type command (e.g. /interface print, /ping, ?)">
                    </div>
                `;
                sessionsContainer.appendChild(newPane);
                setupInputListener(newPane);

                // Tab Click Switching and Closing
                newTab.addEventListener('click', (ev) => {
                    if (ev.target.classList.contains('close-tab-btn')) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        newTab.remove();
                        newPane.remove();
                        // Activate first remaining
                        const firstRemainingTab = tabsContainer.querySelector('.mitrane-tab-item');
                        if (firstRemainingTab) firstRemainingTab.click();
                        return;
                    }
                    ev.preventDefault();
                    tabsContainer.querySelectorAll('.mitrane-tab-item').forEach(t => t.classList.remove('active'));
                    sessionsContainer.querySelectorAll('.terminal-session-pane').forEach(p => p.style.display = 'none');
                    newTab.classList.add('active');
                    newPane.style.display = 'block';
                    const inp = newPane.querySelector('.terminal-cli-input');
                    if (inp) inp.focus();
                });

                // Focus new input
                setTimeout(() => {
                    const inp = newPane.querySelector('.terminal-cli-input');
                    if (inp) inp.focus();
                    isAdding = false;
                }, 100);
            };

            // Delegate clicking on existing first tab
            const firstTab = tabsContainer.querySelector('[data-terminal-tab="1"]');
            if (firstTab && firstPane) {
                firstTab.onclick = (e) => {
                    e.preventDefault();
                    tabsContainer.querySelectorAll('.mitrane-tab-item').forEach(t => t.classList.remove('active'));
                    sessionsContainer.querySelectorAll('.terminal-session-pane').forEach(p => p.style.display = 'none');
                    firstTab.classList.add('active');
                    firstPane.style.display = 'block';
                    const inp = firstPane.querySelector('.terminal-cli-input');
                    if (inp) inp.focus();
                };
            }
        }
    }

    bindQuickSweetAlerts() {
        const alertTrigger = document.querySelectorAll('[data-mitrautama-swal]');
        alertTrigger.forEach(el => {
            el.addEventListener('click', () => {
                const type = el.getAttribute('data-mitrautama-swal');
                if (type === 'test') {
                    Swal.fire({
                        title: 'SweetAlert Terintegrasi!',
                        text: 'Pemberitahuan interaktif modern siap digunakan pada semua modul RouterOS.',
                        icon: 'success',
                        confirmButtonColor: '#0284c7'
                    });
                }
            });
        });
    }
}

const navigationManager = new NavigationManager();
window.navigationManager = navigationManager;

// === MODULE: data-loader.js ===
/**
 * MitraUtama JSON Data & Config Service
 * Membaca data dan konfigurasi dinamis langsung dari config.json dan interfaces/interfaces.json
 * Mendukung simulasi CRUD lokal: Create, Read, Update, Delete, Toggle Enable/Disable, dan Selection
 */

class JsonDataService {
    constructor() {
        this.config = null;
        this.interfacesData = null;
        this.selectedIndex = -1;
        this.currentFilter = '';
        this.onSelectionChangeCallbacks = [];
    }

    onSelectionChange(cb) {
        if (typeof cb === 'function') {
            this.onSelectionChangeCallbacks.push(cb);
        }
    }

    notifySelectionChange() {
        const item = this.getSelectedInterface();
        this.onSelectionChangeCallbacks.forEach(cb => cb(item, this.selectedIndex));
    }

    async loadConfig() {
        try {
            const res = await fetch('config.json');
            if (res.ok) {
                this.config = await res.json();
                return this.config;
            }
        } catch (e) {
            console.warn('[JsonDataService] Fetching config.json failed, falling back to default:', e);
        }
        return null;
    }

    async loadInterfaces() {
        try {
            const res = await fetch('packages/interfaces/interfaces.json?v=1792749829');
            if (res.ok) {
                this.interfacesData = await res.json();
                this.selectedIndex = -1;
                this.notifySelectionChange();
                return this.interfacesData;
            }
        } catch (e) {
            console.warn('[JsonDataService] Fetching interfaces.json failed:', e);
        }
        return null;
    }

            getInterfaceIconSvg(item, isChild = false) {
        const name = (item.name || '').toUpperCase();
        const type = (item.type || '').toUpperCase();
        const size = isChild ? 12 : 13;
        const style = isChild 
            ? 'vertical-align: middle; display: inline-block;' 
            : 'vertical-align: middle; margin-right: 4px; display: inline-block;';

        // 1. Wireless (WLAN1, WLAN2)
        if (type.includes('WIRELESS') || name.startsWith('WLAN')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" class="me-1" style="${style}"><path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path><path d="M7.76 16.24a6 6 0 0 1 0-8.48"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.48"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
        }

        // 2. VLAN (VLAN10, VLAN20, dll) - Distinct Tag / Layers icon
        if (type.includes('VLAN') || name.startsWith('VLAN')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.2" class="me-1" style="${style}"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
        }

        // 3. SFP / Fiber Optical (SFP-PLUS1, SFP-PLUS2)
        if (name.includes('SFP')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" class="me-1" style="${style}"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>`;
        }

        // 4. WireGuard (WG-BACKBONE) - Shield Security Key
        if (type.includes('WIREGUARD') || name.startsWith('WG')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" class="me-1" style="${style}"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
        }

        // 5. PPPoE / PPP (PPPoE Client, PPP0) - Key / Dial-up lock
        if (type.includes('PPPOE') || type.includes('PPP') || name.includes('PPPOE') || name.startsWith('PPP')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" class="me-1" style="${style}"><circle cx="7.5" cy="15.5" r="4.5"></circle><path d="M10.8 12.2L19 4h3v3l-2 2v2l-2 2z"></path></svg>`;
        }

        // 6. SSTP VPN - Secure Lock
        if (type.includes('SSTP') || name.includes('SSTP')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.2" class="me-1" style="${style}"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        }

        // 6b. L2TP Client / Tunnel - Key & Lock Link
        if (type.includes('L2TP') || name.includes('L2TP')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.2" class="me-1" style="${style}"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`;
        }

        // 6c. OpenVPN / OVPN Client - Shield Globe / Network Node
        if (type.includes('OVPN') || type.includes('OPENVPN') || name.includes('OVPN') || name.includes('OPENVPN')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" class="me-1" style="${style}"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
        }

        // 7. EoIP & IPIP - Network Bridge / Tunnel Pipe
        if (type.includes('EOIP') || type.includes('IPIP') || name.includes('EOIP') || name.includes('IPIP')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2" class="me-1" style="${style}"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="16" y2="12"></line><line x1="12" y1="16" x2="16" y2="12"></line></svg>`;
        }

        // 8. GRE & GRETAP - Fast Transfer / Routing arrows
        if (type.includes('GRE') || name.includes('GRE')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.2" class="me-1" style="${style}"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
        }

        // 9. VXLAN & ERSPAN - Cloud Tunnel
        if (type.includes('VXLAN') || type.includes('ERSPAN') || name.includes('VXLAN') || name.includes('ERSPAN')) {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" class="me-1" style="${style}"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`;
        }

        // 10. Loopback (LO)
        if (type.includes('LOOPBACK') || name === 'LO') {
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" class="me-1" style="${style}"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
        }

        // 11. Bridge / Master
        if (type === 'BRIDGE' || name === '1. WAN' || name === '2. LAN') {
            const color = name === '2. LAN' ? '#16a34a' : '#0284c7';
            return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" class="me-1" style="${style}"><rect x="2" y="7" width="5" height="10" rx="1"></rect><rect x="17" y="7" width="5" height="10" rx="1"></rect><path d="M7 10h10M7 14h10"></path></svg>`;
        }

        // 12. Overlay & Tunnels Parent
        if (name.includes('OVERLAY') || name.includes('TUNNELS')) {
            return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" class="me-1" style="${style}"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;
        }

        // 13. Default Ethernet (ETH1 s/d ETH10) - Port dual-jack icon
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" class="me-1" style="${style}"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>`;
    }

    renderInterfacesTable(containerId = 'mitrane-interfaces-table', filterText = '') {
        const tableBody = document.querySelector(`#${containerId} tbody`);
        if (!tableBody || !this.interfacesData) return;

        this.currentFilter = filterText;
        const term = (filterText || '').toLowerCase();

        // Daftar port anggota bridge untuk flag cheklis ganda (hijau + biru)
        const bridgePortNames = new Set();
        this.interfacesData.interfaces.forEach(it => {
            if (it.parent && (it.parent.includes('WAN') || it.parent.includes('LAN') || it.parent.toLowerCase().includes('bridge'))) {
                bridgePortNames.add(it.name);
            }
        });

        // 1. Grouping dinamis parent -> children dari data interfaces.json
        const childrenByParent = {};
        const roots = [];

        this.interfacesData.interfaces.forEach((item, idx) => {
            if (item.parent) {
                if (!childrenByParent[item.parent]) {
                    childrenByParent[item.parent] = [];
                }
                childrenByParent[item.parent].push({ item, idx });
            } else {
                roots.push({ item, idx });
            }
        });

        // Urutan preferensi tampil root agar rapi seperti layout Winbox/RouterOS:
        // Bridge (1. WAN, 2. LAN) -> Ethernet fisik/PPPoE (ETH1..ETH10, SFP) -> Wireless/VPN/Loopback -> Overlay & Tunnels
        const preferredOrder = [
            '1. WAN', '2. LAN',
            'ETH1', 'ETH2', 'ETH3', 'ETH5', 'ETH6', 'ETH10',
            'SFP-PLUS1', 'SFP-PLUS2', 'WLAN1', 'WLAN2',
            'LO', '3. OVERLAY & TUNNELS'
        ];

        roots.sort((a, b) => {
            const idxA = preferredOrder.indexOf(a.item.name);
            const idxB = preferredOrder.indexOf(b.item.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.idx - b.idx;
        });

        let totalRendered = 0;
        const htmlParts = [];

        // Helper render child row (supports recursive sub-children/grand-children)
        const renderChildRow = (item, idx, parentName, childDisplay, depth = 1) => {
            const isRunning = item.status === 'running';
            const isBridgeMember = bridgePortNames.has(item.name);

            let iconSvg;
            if (isBridgeMember) {
                iconSvg = `<svg width="17" height="13" viewBox="0 0 22 16" fill="none" style="vertical-align: middle; display: inline-block;" title="Running, Bridge Port"><polyline points="1.5 9 5.5 13 13.5 5" stroke="#16a34a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 9 11 13 19 5" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (isRunning) {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            } else {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            }

            const txRateClass = (item.tx && item.tx !== '0 B/s') ? 'mitrane-rate-active' : 'text-muted';
            const rxRateClass = (item.rx && item.rx !== '0 B/s') ? 'text-primary fw-semibold' : 'text-muted';
            const isSelected = this.selectedIndex === idx ? 'table-primary selected' : '';

            const safeName = this.escapeHtml(item.name || '');
            const safeSubname = this.escapeHtml(item.subname || '');
            const safeType = this.escapeHtml(item.type || 'Ethernet');
            const safeParentAttr = this.escapeHtml(parentName);
            const indentWidth = depth * 18;

            const subChildren = childrenByParent[item.name] || [];
            const hasSubChildren = subChildren.length > 0;
            const subNodeAttr = this.escapeHtml(item.name || '');
            const subMemberCount = subChildren.length;

            let rowHtml = '';
            if (hasSubChildren) {
                rowHtml = `
            <tr class="iface-tree-row iface-child-row iface-root-row ${isSelected}" data-iface-parent="${safeParentAttr}" data-iface-node="${subNodeAttr}" data-mitrautama-row-index="${idx}" style="${childDisplay} cursor: pointer; background: var(--mu-surface-muted, #f8fafc);">
                <td class="text-center" style="width: 28px;">${iconSvg}</td>
                <td>
                    <span style="display:inline-block; width: ${indentWidth}px;"></span>
                    <span class="btn-iface-toggle text-muted fw-bold me-1 user-select-none" data-iface-node="${subNodeAttr}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                        <svg class="iface-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s; transform: rotate(0deg);"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                    ${this.getInterfaceIconSvg(item, true)}
                    <strong style="color: #ec4899;">${safeName}</strong>
                    ${safeSubname ? `<span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>` : ''}
                    <span class="badge rounded-pill ms-1" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 0.7rem; font-weight: 700; padding: 0 5px; background-color: #ec4899; color: #ffffff;">${subMemberCount}</span>
                </td>
                <td><span class="mitrane-badge-type">${safeType}</span></td>
                <td>${item.actualMtu ?? 1500}</td>
                <td>${item.l2Mtu ?? 1500}</td>
                <td class="${txRateClass}">${item.tx ?? '0 B/s'}</td>
                <td class="${rxRateClass}">${item.rx ?? '0 B/s'}</td>
                <td>${item.txPkt ?? 0}</td>
                <td>${item.rxPkt ?? 0}</td>
                <td>${item.fpTx ?? (item.tx ?? '0 B/s')}</td>
                <td>${item.fpRx ?? (item.rx ?? '0 B/s')}</td>
                <td>${item.fpTxPkt ?? (item.txPkt ?? 0)}</td>
                <td>${item.fpRxPkt ?? (item.rxPkt ?? 0)}</td>
            </tr>`;
                subChildren.forEach(sc => {
                    rowHtml += renderChildRow(sc.item, sc.idx, item.name, 'display: none;', depth + 1);
                });
            } else {
                rowHtml = `
            <tr class="iface-tree-row iface-child-row ${isSelected}" data-iface-parent="${safeParentAttr}" data-mitrautama-row-index="${idx}" style="${childDisplay} cursor: pointer;">
                <td class="text-center" style="width: 28px;">${iconSvg}</td>
                <td>
                    <span style="display:inline-block; width: ${indentWidth}px;"></span>
                    ${this.getInterfaceIconSvg(item, true)}
                    <strong>${safeName}</strong>
                    ${safeSubname ? `<span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>` : ''}
                </td>
                <td><span class="mitrane-badge-type">${safeType}</span></td>
                <td>${item.actualMtu ?? 1500}</td>
                <td>${item.l2Mtu ?? 1500}</td>
                <td class="${txRateClass}">${item.tx ?? '0 B/s'}</td>
                <td class="${rxRateClass}">${item.rx ?? '0 B/s'}</td>
                <td>${item.txPkt ?? 0}</td>
                <td>${item.rxPkt ?? 0}</td>
                <td>${item.fpTx ?? (item.tx ?? '0 B/s')}</td>
                <td>${item.fpRx ?? (item.rx ?? '0 B/s')}</td>
                <td>${item.fpTxPkt ?? (item.txPkt ?? 0)}</td>
                <td>${item.fpRxPkt ?? (item.rxPkt ?? 0)}</td>
            </tr>`;
            }
            return rowHtml;
        };

        // Render setiap root (dan anak-anaknya jika ada)
        roots.forEach(({ item: rItem, idx: rIdx }) => {
            const children = childrenByParent[rItem.name] || [];
            const hasChildren = children.length > 0;

            // Filter term matching
            const matchingChildren = [];
            children.forEach(c => {
                const cItem = c.item;
                const cMatch = !term ||
                               (cItem.name && cItem.name.toLowerCase().includes(term)) ||
                               (cItem.subname && cItem.subname.toLowerCase().includes(term)) ||
                               (cItem.type && cItem.type.toLowerCase().includes(term)) ||
                               rItem.name.toLowerCase().includes(term);
                if (cMatch) matchingChildren.push(c);
            });

            const parentMatches = !term ||
                                  (rItem.name && rItem.name.toLowerCase().includes(term)) ||
                                  (rItem.subname && rItem.subname.toLowerCase().includes(term)) ||
                                  (rItem.type && rItem.type.toLowerCase().includes(term));

            if (!term || parentMatches || matchingChildren.length > 0) {
                totalRendered += 1 + matchingChildren.length;
                const isClosed = !term;
                const chevronTransform = isClosed ? 'rotate(0deg)' : 'rotate(90deg)';
                const childDisplay = isClosed ? 'display: none;' : '';
                const memberCount = children.length;

                const isRunning = rItem.status === 'running';
                const iconSvg = isRunning 
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

                const txRateClass = (rItem.tx && rItem.tx !== '0 B/s') ? 'mitrane-rate-active' : 'text-muted';
                const rxRateClass = (rItem.rx && rItem.rx !== '0 B/s') ? 'text-primary fw-semibold' : 'text-muted';
                const isSelected = this.selectedIndex === rIdx ? 'table-primary selected' : '';

                const safeName = this.escapeHtml(rItem.name || '');
                const safeSubname = this.escapeHtml(rItem.subname || '');
                const safeType = this.escapeHtml(rItem.type || 'Ethernet');
                const safeNodeAttr = this.escapeHtml(rItem.name || '');

                // Warna tema root berbasis tipe/grup secara global/desain generik
                let groupColor = '#0284c7';
                if (rItem.name === '2. LAN' || rItem.type === 'Bridge') groupColor = '#16a34a';
                else if (rItem.name.includes('OVERLAY') || rItem.name.includes('TUNNELS')) groupColor = '#8b5cf6';
                else if (rItem.name === 'ETH2') groupColor = '#6366f1';
                else if (rItem.name === 'ETH3') groupColor = '#eab308';
                else if (rItem.name === 'ETH5') groupColor = '#ec4899';

                // Tipe icon untuk root berbasis tipe interface
                const rootIconSvg = this.getInterfaceIconSvg(rItem, false);

                if (hasChildren) {
                    // Render Root Row dengan Accordion Toggle & Badge Counter
                    htmlParts.push(`
                    <tr class="iface-tree-row iface-root-row ${isSelected}" data-iface-node="${safeNodeAttr}" data-mitrautama-row-index="${rIdx}" style="cursor: pointer; background: var(--mu-surface-muted, #f8fafc);">
                        <td class="text-center" style="width: 28px;">${iconSvg}</td>
                        <td>
                            <span class="btn-iface-toggle text-muted fw-bold me-1 user-select-none" data-iface-node="${safeNodeAttr}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                                <svg class="iface-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s; transform: ${chevronTransform};"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                            ${rootIconSvg}
                            <strong style="color: ${groupColor};">${safeName}</strong>
                            ${safeSubname ? `<span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>` : ''}
                            <span class="badge rounded-pill ms-1" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 0.7rem; font-weight: 700; padding: 0 5px; background-color: ${groupColor}; color: #ffffff;">${memberCount}</span>
                        </td>
                        <td><span class="mitrane-badge-type">${safeType}</span></td>
                        <td>${rItem.actualMtu ?? 1500}</td>
                        <td>${rItem.l2Mtu ?? 1500}</td>
                        <td class="${txRateClass}">${rItem.tx ?? '0 B/s'}</td>
                        <td class="${rxRateClass}">${rItem.rx ?? '0 B/s'}</td>
                        <td>${rItem.txPkt ?? 0}</td>
                        <td>${rItem.rxPkt ?? 0}</td>
                        <td>${rItem.fpTx ?? (rItem.tx ?? '0 B/s')}</td>
                        <td>${rItem.fpRx ?? (rItem.rx ?? '0 B/s')}</td>
                        <td>${rItem.fpTxPkt ?? (rItem.txPkt ?? 0)}</td>
                        <td>${rItem.fpRxPkt ?? (rItem.rxPkt ?? 0)}</td>
                    </tr>`);

                    // Render child rows
                    matchingChildren.forEach(({ item, idx }) => {
                        htmlParts.push(renderChildRow(item, idx, rItem.name, childDisplay));
                    });
                } else {
                    // Render Standalone Row tanpa Accordion Toggle
                    htmlParts.push(`
                    <tr class="iface-tree-row iface-standalone-row ${isSelected}" data-mitrautama-row-index="${rIdx}" style="cursor: pointer;">
                        <td class="text-center" style="width: 28px;">${iconSvg}</td>
                        <td>
                            ${rootIconSvg}
                            <strong>${safeName}</strong>
                            ${safeSubname ? `<span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>` : ''}
                        </td>
                        <td><span class="mitrane-badge-type">${safeType}</span></td>
                        <td>${rItem.actualMtu ?? 1500}</td>
                        <td>${rItem.l2Mtu ?? 1500}</td>
                        <td class="${txRateClass}">${rItem.tx ?? '0 B/s'}</td>
                        <td class="${rxRateClass}">${rItem.rx ?? '0 B/s'}</td>
                        <td>${rItem.txPkt ?? 0}</td>
                        <td>${rItem.rxPkt ?? 0}</td>
                        <td>${rItem.fpTx ?? (rItem.tx ?? '0 B/s')}</td>
                        <td>${rItem.fpRx ?? (rItem.rx ?? '0 B/s')}</td>
                        <td>${rItem.fpTxPkt ?? (rItem.txPkt ?? 0)}</td>
                        <td>${rItem.fpRxPkt ?? (rItem.rxPkt ?? 0)}</td>
                    </tr>`);
                }
            }
        });

        tableBody.innerHTML = htmlParts.join('');

        const totalCounter = document.getElementById('mitrane-total-items');
        if (totalCounter) {
            totalCounter.textContent = `Total: ${totalRendered} items`;
        }
    }

    addInterface(newRecord) {
        if (!this.interfacesData) {
            this.interfacesData = { total: 0, interfaces: [] };
        }
        const record = {
            id: 'iface_' + Date.now(),
            name: newRecord.name || 'new-iface',
            subname: newRecord.subname || (newRecord.name ? newRecord.name.toLowerCase() : 'iface'),
            type: newRecord.type || 'Ethernet',
            status: 'running',
            actualMtu: Number(newRecord.actualMtu) || 1500,
            l2Mtu: 1500,
            tx: '0 B/s',
            rx: '0 B/s',
            txPkt: 0,
            rxPkt: 0,
            fpTx: '0 B/s',
            fpRx: '0 B/s',
            fpTxPkt: 0,
            fpRxPkt: 0
        };
        this.interfacesData.interfaces.unshift(record);
        this.interfacesData.total = this.interfacesData.interfaces.length;
        this.selectedIndex = 0;
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return record;
    }

    updateSelectedInterface(updatedFields) {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const item = this.interfacesData.interfaces[this.selectedIndex];
        if (updatedFields.name) {
            item.name = updatedFields.name;
            item.subname = updatedFields.subname || updatedFields.name.toLowerCase();
        }
        if (updatedFields.type) item.type = updatedFields.type;
        if (updatedFields.actualMtu) item.actualMtu = Number(updatedFields.actualMtu);

        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return item;
    }

    removeSelectedInterface() {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const removed = this.interfacesData.interfaces.splice(this.selectedIndex, 1)[0];
        this.interfacesData.total = this.interfacesData.interfaces.length;
        this.selectedIndex = -1;
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return removed;
    }

    toggleSelectedStatus(forceStatus = null) {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const item = this.interfacesData.interfaces[this.selectedIndex];
        if (forceStatus) {
            item.status = forceStatus;
        } else {
            item.status = (item.status === 'running') ? 'inactive' : 'running';
        }
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return item;
    }

    getSelectedInterface() {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        return this.interfacesData.interfaces[this.selectedIndex];
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const jsonDataService = new JsonDataService();
window.jsonDataService = jsonDataService;

// === MODULE: module-loader.js ===
/**
 * MitraUtama HTML Module Loader & JSON Data Initializer
 * Mengunggah file modul HTML (includes/, interfaces/, ip/, wireguard/, wireless/, switch/, bridge/, system/, queues/, ppp/)
 * dan memuat konfigurasi serta data dari config.json dan interfaces/interfaces.json
 */

class ModuleLoader {
    constructor() {
        this.modules = {
            'header-container': 'includes/header.html',
            'sidebar-container': 'includes/sidebar.html',
            'footer-container': 'includes/footer.html',
            'xolt-module-container': 'packages/xolt/xolt.html',
            'interfaces-module-container': 'packages/interfaces/interfaces.html',
            'ip-module-container': 'packages/ip/ip.html',
            'wireguard-module-container': 'packages/wireguard/wireguard.html',
            'wireless-module-container': 'packages/wireless/wireless.html',
            'switch-module-container': 'packages/switch/switch.html',
            'bridge-module-container': 'packages/bridge/bridge.html',
            'system-module-container': 'packages/system/system.html',
            'queues-module-container': 'packages/qos/qos.html',
            'ppp-module-container': 'packages/vpn/vpn.html',
            'ipv6-module-container': 'packages/ipv6/ipv6.html',
            'routing-module-container': 'packages/routing/routing.html',
            'mpls-module-container': 'packages/mpls/mpls.html',
            'log-module-container': 'packages/log/log.html',
            'files-module-container': 'packages/files/files.html',
            'radius-module-container': 'packages/radius/radius.html',
            'tools-module-container': 'packages/tools/tools.html',
            'mesh-module-container': 'packages/mesh/mesh.html',
            'dot1x-module-container': 'packages/dot1x/dot1x.html',
            'terminal-module-container': 'packages/terminal/terminal.html',
            'xray-module-container': 'packages/xray/xray.html',
            'kvm-module-container': 'packages/kvm/kvm.html',
            'devices-module-container': 'packages/devices/devices.html'
        };
    }

    async loadAll() {
        const loadPromises = Object.entries(this.modules).map(async ([containerId, filePath]) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            try {
                const response = await fetch(filePath + "?v=" + Date.now());
                if (response.ok) {
                    const html = await response.text();
                    container.innerHTML = html;
                    console.log(`[ModuleLoader] Loaded ${filePath} into #${containerId}`);
                }
            } catch (err) {
                console.info(`[ModuleLoader] Using inline fallback for ${filePath}`);
            }
        });

        await Promise.all(loadPromises);

        // Muat Data & Konfigurasi JSON
        await this.initJsonData();

        // Re-bind navigasi setelah template terinjeksi
        if (window.navigationManager) {
            window.navigationManager.init();
        }
    }

    async initJsonData() {
        try {
            const config = await jsonDataService.loadConfig();
            if (config && config.app) {
                const hostEl = document.getElementById('mitrane-header-host');
                if (hostEl) hostEl.textContent = config.app.hostname;
                const nameEl = document.getElementById('mitrane-app-name');
                if (nameEl) nameEl.textContent = config.app.title;
                const footerTitle = document.getElementById('mitrane-footer-title');
                if (footerTitle) footerTitle.textContent = config.app.title;
                const footerBadge = document.getElementById('mitrane-footer-badge');
                if (footerBadge) footerBadge.textContent = config.app.badge;
            }

            const ifaceData = await jsonDataService.loadInterfaces();
            if (ifaceData) {
                jsonDataService.renderInterfacesTable('mitrane-interfaces-table');
            }

            // Sync Edit & Action Buttons state when selection changes
            const editBtn = document.getElementById('btn-interface-edit');
            jsonDataService.onSelectionChange((selectedItem) => {
                if (editBtn) {
                    if (selectedItem) {
                        editBtn.removeAttribute('disabled');
                        editBtn.classList.remove('opacity-50');
                    } else {
                        editBtn.setAttribute('disabled', 'true');
                        editBtn.classList.add('opacity-50');
                    }
                }
            });

            // Bind Search Filter
            const searchInput = document.getElementById('mitrane-interface-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    jsonDataService.renderInterfacesTable('mitrane-interfaces-table', e.target.value);
                });
            }

// Bind Interfaces New Button Dropdown Menu
            const btnNewIface = document.getElementById('btn-interface-new');
            const menuNewIface = document.getElementById('menu-interface-new');

            if (btnNewIface && menuNewIface) {
                btnNewIface.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isShown = menuNewIface.classList.contains('show');
                    if (isShown) {
                        menuNewIface.classList.remove('show');
                        btnNewIface.setAttribute('aria-expanded', 'false');
                    } else {
                        menuNewIface.classList.add('show');
                        btnNewIface.setAttribute('aria-expanded', 'true');
                    }
                });

                // Klik salah satu tipe interface di menu dropdown
                menuNewIface.querySelectorAll('.mitrautama-new-dropdown-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        menuNewIface.classList.remove('show');
                        btnNewIface.setAttribute('aria-expanded', 'false');

                        const selectedType = item.getAttribute('data-iface-type') || 'VLAN';
                        
                        // Set tipe yang dipilih di modal add interface
                        const typeSelect = document.getElementById('select-new-iface-type');
                        if (typeSelect) {
                            typeSelect.value = selectedType;
                        }

                        // Berikan default prefix nama interface yang intuitif
                        const nameInput = document.getElementById('input-new-iface-name');
                        if (nameInput) {
                            let prefix = 'iface1';
                            if (selectedType === 'EoIP Tunnel') prefix = 'eoip-tunnel1';
                            else if (selectedType === 'IP Tunnel') prefix = 'ipip1';
                            else if (selectedType === 'GRE Tunnel') prefix = 'gre-tunnel1';
                            else if (selectedType === 'VLAN') prefix = 'vlan1';
                            else if (selectedType === 'VXLAN') prefix = 'vxlan1';
                            else if (selectedType === 'VRRP') prefix = 'vrrp1';
                            else if (selectedType === 'MACsec') prefix = 'macsec1';
                            else if (selectedType === 'MACVLAN') prefix = 'macvlan1';
                            else if (selectedType === 'Bonding') prefix = 'bonding1';
                            else if (selectedType === 'Bridge') prefix = 'bridge1';
                            else if (selectedType === 'Mesh') prefix = 'mesh1';
                            else if (selectedType === 'VPLS') prefix = 'vpls1';
                            else if (selectedType === 'WireGuard') prefix = 'wg1';
                            else if (selectedType === 'WiFi') prefix = 'wifi1';
                            else if (selectedType.includes('PPPoE Client')) prefix = '<pppoe-out2>';
                            else if (selectedType.includes('PPPoE')) prefix = 'pppoe-server1';
                            else if (selectedType.includes('L2TP Client')) prefix = 'l2tp-out1';
                            else if (selectedType.includes('L2TP')) prefix = 'l2tp-server1';
                            else if (selectedType.includes('OVPN')) prefix = 'ovpn-out1';
                            else if (selectedType.includes('SSTP')) prefix = 'sstp-out1';
                            else if (selectedType.includes('PPTP')) prefix = 'pptp-out1';
                            else if (selectedType.includes('6to4')) prefix = '6to4-tunnel1';
                            else if (selectedType.includes('IPIPv6')) prefix = 'ipipv6-tunnel1';
                            else if (selectedType.includes('EoIPv6')) prefix = 'eoipv6-tunnel1';
                            else if (selectedType.includes('GRE6')) prefix = 'gre6-tunnel1';
                            nameInput.value = prefix;
                        }

                        // Buka modal create interface
                        if (window.modalManager) {
                            window.modalManager.open('modal-add-interface');
                        }
                    });
                });

                // Tutup dropdown jika klik di luar
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('#dropdown-new-interface-container')) {
                        menuNewIface.classList.remove('show');
                        btnNewIface.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            // Bind Refresh Button
            const refreshBtn = document.getElementById('btn-interface-refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async () => {
                    await jsonDataService.loadInterfaces();
                    jsonDataService.renderInterfacesTable('mitrane-interfaces-table');

                });
            }

            // Bind Edit Button
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    const selected = jsonDataService.getSelectedInterface();
                    if (!selected) {

                        return;
                    }

                    // Populate fields in modal-edit-interface
                    const nameField = document.getElementById('input-edit-iface-name');
                    const typeField = document.getElementById('select-edit-iface-type');
                    const mtuField = document.getElementById('input-edit-iface-mtu');

                    if (nameField) nameField.value = selected.name;
                    if (typeField) typeField.value = selected.type;
                    if (mtuField) mtuField.value = selected.actualMtu;

                    if (window.modalManager) {
                        window.modalManager.open('modal-edit-interface');
                    }
                });
            }

            // Bind Save Edit Button inside Modal
            const saveEditBtn = document.getElementById('btn-save-edit-interface');
            if (saveEditBtn) {
                saveEditBtn.addEventListener('click', () => {
                    const nameField = document.getElementById('input-edit-iface-name');
                    const typeField = document.getElementById('select-edit-iface-type');
                    const mtuField = document.getElementById('input-edit-iface-mtu');

                    const newName = nameField ? nameField.value.trim() : '';
                    if (!newName) {
                        if (window.Swal) {
                            window.Swal.fire({
                                title: 'Nama Wajib Diisi',
                                text: 'Nama interface tidak boleh kosong.',
                                icon: 'error',
                                confirmButtonColor: '#ef4444'
                            });
                        }
                        return;
                    }

                    const updated = jsonDataService.updateSelectedInterface({
                        name: newName,
                        type: typeField ? typeField.value : 'VLAN',
                        actualMtu: mtuField ? mtuField.value : 1500
                    });

                    if (window.modalManager) {
                        window.modalManager.close('modal-edit-interface');
                    }

                    toastManager.show({
                        title: 'Perubahan Disimpan',
                        message: `Interface "${updated.name}" berhasil diperbarui (simulasi).`,
                        type: 'success',
                        duration: 2000
                    });
                });
            }

            // Bind Enable Button
            const enableBtn = document.getElementById('btn-interface-enable');
            if (enableBtn) {
                enableBtn.addEventListener('click', () => {
                    const updated = jsonDataService.toggleSelectedStatus('running');

                });
            }

            // Bind Disable Button
            const disableBtn = document.getElementById('btn-interface-disable');
            if (disableBtn) {
                disableBtn.addEventListener('click', () => {
                    const updated = jsonDataService.toggleSelectedStatus('inactive');

                });
            }

            // Bind Remove Button
            const removeBtn = document.getElementById('btn-interface-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    const selected = jsonDataService.getSelectedInterface();
                    if (!selected) {
                        return;
                    }

                    if (window.Swal) {
                        window.Swal.fire({
                            title: 'Hapus Interface?',
                            text: `Konfirmasi penghapusan interface demo: ${selected.name} (${selected.subname})`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ef4444',
                            cancelButtonColor: '#64748b',
                            confirmButtonText: 'Ya, Hapus (Demo)',
                            cancelButtonText: 'Batal'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                const removed = jsonDataService.removeSelectedInterface();
                                if (removed) {
                                    toastManager.show({
                                        title: 'Interface Dihapus',
                                        message: `${removed.name} telah dihapus dari tabel demonstrasi.`,
                                        type: 'success',
                                        duration: 2000
                                    });
                                }
                            }
                        });
                    }
                });
            }

            // Bind Comment Button
            const commentBtn = document.getElementById('btn-interface-comment');
            if (commentBtn) {
                commentBtn.addEventListener('click', () => {
                    const selected = jsonDataService.getSelectedInterface();
                    if (!selected) {
                        return;
                    }

                    if (window.Swal) {
                        window.Swal.fire({
                            title: `Komentar Interface [${selected.name}]`,
                            input: 'text',
                            inputLabel: 'Masukkan deskripsi atau catatan',
                            inputPlaceholder: 'Contoh: Uplink ISP Utama',
                            showCancelButton: true,
                            confirmButtonColor: '#0284c7',
                            confirmButtonText: 'Simpan',
                            cancelButtonText: 'Batal'
                        }).then((result) => {
                            if (result.isConfirmed && result.value) {
                                toastManager.show({
                                    title: 'Komentar Disimpan',
                                    message: `Catatan "${result.value}" disematkan ke ${selected.name}.`,
                                    type: 'success',
                                    duration: 2500
                                });
                            }
                        });
                    }
                });
            }

            // Bind Modal Save Interface Form (Create)
            const saveIfaceBtn = document.getElementById('btn-save-new-interface');
            if (saveIfaceBtn) {
                saveIfaceBtn.addEventListener('click', () => {
                    const nameInput = document.getElementById('input-new-iface-name');
                    const typeInput = document.getElementById('select-new-iface-type');
                    const nameVal = nameInput ? nameInput.value.trim() : '';
                    const typeVal = typeInput ? typeInput.value : 'VLAN';

                    if (!nameVal) {
                        if (window.Swal) {
                            window.Swal.fire({
                                title: 'Nama Wajib Diisi',
                                text: 'Silakan masukkan nama interface baru.',
                                icon: 'error',
                                confirmButtonColor: '#ef4444'
                            });
                        }
                        return;
                    }

                    const added = jsonDataService.addInterface({
                        name: nameVal,
                        subname: nameVal.toLowerCase(),
                        type: typeVal,
                        actualMtu: 1500
                    });

                    // Tutup modal secara manual via modalManager
                    if (window.modalManager) {
                        window.modalManager.close('modal-add-interface');
                    }
                    if (nameInput) nameInput.value = '';

                    toastManager.show({
                        title: 'Interface Dibuat',
                        message: `Interface demo "${added.name}" (${added.type}) berhasil ditambahkan.`,
                        type: 'success',
                        duration: 2500
                    });
                });
            }

        } catch (e) {
            console.warn('[ModuleLoader] JSON data init failed:', e);
        }
    }
}

const moduleLoader = new ModuleLoader();
window.moduleLoader = moduleLoader;

// Auto-start loader and navigation for standalone or local execution
document.addEventListener('DOMContentLoaded', () => {
    if (window.moduleLoader) {
        window.moduleLoader.loadAll();
    }
    if (window.navigationManager) {
        window.navigationManager.init();
    }
});
// Listener Tombol Logout Header User Dropdown
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('#header-btn-logout');
        if (logoutBtn) {
            e.preventDefault();
            if (window.Swal) {
                Swal.fire({
                    title: 'Konfirmasi Logout',
                    text: 'Apakah Anda yakin ingin keluar dari sesi RouterOS WebUI?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Logout',
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#ef4444'
                }).then((res) => {
                    if (res.isConfirmed) {
                        Swal.fire({
                            title: 'Sesi Berakhir',
                            text: 'Anda telah berhasil logout. Mengarahkan ke halaman login...',
                            icon: 'success',
                            timer: 1200,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = 'login.html';
                        });
                    }
                });
            } else {
                if (confirm('Apakah Anda yakin ingin logout?')) {
                    window.location.href = 'login.html';
                }
            }
        }
    });
});


// Global Helper untuk membuka dan mengisi data modal Interface Properties (WinBox Replica)
window.openQosModal = function(tr) {
    if (!tr) return;
    const nameSpan = tr.querySelector('td:nth-child(3) span:last-child');
    const queueName = nameSpan ? nameSpan.textContent.trim() : 'qos1';
    const targetTd = tr.querySelector('td:nth-child(4)');
    const queueTarget = targetTd ? targetTd.textContent.trim() : '0.0.0.0/0';
    const upLimitTd = tr.querySelector('td:nth-child(5)');
    const downLimitTd = tr.querySelector('td:nth-child(6)');

    const titleEl = document.getElementById('modal-queue-title-name');
    if (titleEl) titleEl.textContent = `<${queueName}>`;
    const nameInput = document.getElementById('modal-queue-name');
    if (nameInput) nameInput.value = queueName;
    const targetInput = document.getElementById('modal-queue-target');
    if (targetInput) targetInput.value = queueTarget;
    const maxUpInput = document.getElementById('modal-queue-max-upload');
    if (maxUpInput && upLimitTd) maxUpInput.value = upLimitTd.textContent.trim() || '0';
    const maxDownInput = document.getElementById('modal-queue-max-download');
    if (maxDownInput && downLimitTd) maxDownInput.value = downLimitTd.textContent.trim() || '0';

    if (window.modalManager) {
        window.modalManager.open('modal-qos');
    }
};

window.openInterfacePropertiesModal = function(item) {
    if (!item) return;

    const titleName = document.getElementById('modal-iface-title-name');
    const nameInput = document.getElementById('modal-iface-name');
    const defaultNameInput = document.getElementById('modal-iface-default-name');
    const typeInput = document.getElementById('modal-iface-type');
    const mtuInput = document.getElementById('modal-iface-mtu');
    const actualMtuInput = document.getElementById('modal-iface-actual-mtu');
    const l2MtuInput = document.getElementById('modal-iface-l2-mtu');
    const macInput = document.getElementById('modal-iface-mac');
    const enabledInput = document.getElementById('modal-iface-enabled');
    const commentInput = document.getElementById('modal-iface-comment');

    if (titleName) titleName.textContent = item.name.toLowerCase();
    if (nameInput) nameInput.value = item.name.toLowerCase();
    if (defaultNameInput) defaultNameInput.value = item.subname || item.name.toLowerCase();
    if (typeInput) typeInput.value = item.type || 'Ethernet';
    if (mtuInput) mtuInput.value = item.actualMtu || 1500;
    if (actualMtuInput) actualMtuInput.value = item.actualMtu || 1500;
    if (l2MtuInput) l2MtuInput.value = item.l2Mtu || 1598;
    if (macInput) macInput.value = item.macAddress || '2C:C8:1B:18:BE:2E';
    if (enabledInput) enabledInput.checked = (item.status === 'running');
    if (commentInput) commentInput.value = item.comment || '';

    // Bind subtab buttons inside modal
    const modalEl = document.getElementById('modal-interface-properties');
    if (modalEl) {
        const subtabs = modalEl.querySelectorAll('.winbox-subtab-btn');
        subtabs.forEach(btn => {
            btn.onclick = function() {
                subtabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
    }

    if (window.modalManager) {
        window.modalManager.open('modal-interface-properties');
    } else {
        const modal = document.getElementById('modal-interface-properties');
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    }
};

// Global Event Delegation: Klik 1x HANYA menyeleksi baris di SEMUA tabel list RouterOS
document.addEventListener('click', (e) => {
    const row = e.target.closest('.mitrane-grid-table tbody tr, .mitrautama-table tbody tr');
    if (!row) return;

    // Abaikan baris kosong / empty state (jangan di-select)
    if (
        row.classList.contains('mitrane-table-empty-row') ||
        row.classList.contains('mitrautama-table-empty-row') ||
        row.querySelector('.mitrane-empty-state-box') ||
        row.querySelector('td[colspan]') ||
        (row.querySelectorAll('td').length === 1 && row.textContent.trim().startsWith('No '))
    ) {
        return;
    }

    // Highlight selected row in its parent table body
    const tbody = row.closest('tbody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('table-primary', 'selected'));
        row.classList.add('table-primary', 'selected');
    }

    // Sinkronisasi index seleksi jika berada pada tabel interfaces
    if (row.closest('#mitrane-interfaces-table')) {
        const rowIndex = row.getAttribute('data-mitrautama-row-index');
        if (rowIndex !== null && window.jsonDataService) {
            const idx = parseInt(rowIndex, 10);
            if (!isNaN(idx)) {
                window.jsonDataService.selectedIndex = idx;
                window.jsonDataService.notifySelectionChange();
            }
        }
    }
});

// Global Event Delegation: Klik 2x (Double-Click) membuka modal properties/detail (Persis Standar WinBox)
document.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.mitrane-grid-table tbody tr, .mitrautama-table tbody tr');
    if (!row) return;

    // Abaikan baris kosong / empty state (tidak boleh membuka modal popup properties)
    if (
        row.classList.contains('mitrane-table-empty-row') ||
        row.classList.contains('mitrautama-table-empty-row') ||
        row.querySelector('.mitrane-empty-state-box') ||
        row.querySelector('td[colspan]') ||
        (row.querySelectorAll('td').length === 1 && row.textContent.trim().startsWith('No '))
    ) {
        return;
    }

    // Pastikan baris ditandai terpilih
    const tbody = row.closest('tbody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('table-primary', 'selected'));
        row.classList.add('table-primary', 'selected');
    }

    // 0. Jika pada QoS Simple QoS Table -> Buka Modal QoS (JANGAN fallback ke Interface Properties)
    if (row.closest('#table-queues-simple')) {
        if (typeof window.openQosModal === 'function') {
            window.openQosModal(row);
        }
        return;
    }

    // 1. Jika pada Interfaces Table -> Buka Modal Interface Properties WinBox Replica
    if (row.closest('#mitrane-interfaces-table')) {
        const rowIndex = row.getAttribute('data-mitrautama-row-index');
        if (rowIndex !== null && window.jsonDataService && window.jsonDataService.interfacesData && window.jsonDataService.interfacesData.interfaces) {
            const idx = parseInt(rowIndex, 10);
            if (!isNaN(idx) && window.jsonDataService.interfacesData.interfaces[idx]) {
                window.jsonDataService.selectedIndex = idx;
                window.jsonDataService.notifySelectionChange();
                window.openInterfacePropertiesModal(window.jsonDataService.interfacesData.interfaces[idx]);
                return;
            }
        }

        // Fallback ekstraksi nilai dari kolom baris tabel
        const strongEl = row.querySelector('strong');
        const name = strongEl ? strongEl.textContent.trim() : 'ether1';
        const subnameEl = row.querySelector('span.text-muted');
        const subname = subnameEl ? subnameEl.textContent.replace(/[()]/g, '').trim() : name.toLowerCase();
        const tds = row.querySelectorAll('td');
        const type = tds[2] ? tds[2].textContent.trim() : 'Ethernet';
        const actualMtu = tds[3] ? tds[3].textContent.trim() : '1500';
        const l2Mtu = tds[4] ? tds[4].textContent.trim() : '1500';
        const item = {
            name: name,
            subname: subname,
            type: type,
            status: 'running',
            actualMtu: parseInt(actualMtu, 10) || 1500,
            l2Mtu: parseInt(l2Mtu, 10) || 1500,
            macAddress: '2C:C8:1B:18:BE:2E'
        };
        window.openInterfacePropertiesModal(item);
        return;
    }

    // 2. Jika pada Bridge Table (Ports/VLANs) -> Buka Properties Bridge / Interface Properties
    if (row.closest('#view-bridge') || row.closest('#mitrane-bridge-ports-table')) {
        const tds = row.querySelectorAll('td');
        const name = tds[1] ? tds[1].textContent.trim() : (tds[0] ? tds[0].textContent.trim() : 'bridge1');
        const item = {
            name: name,
            subname: 'bridge-port',
            type: 'Bridge',
            status: 'running',
            actualMtu: 1500,
            l2Mtu: 1598,
            macAddress: '6C:3B:6B:1A:E2:40'
        };
        window.openInterfacePropertiesModal(item);
        return;
    }

    // 3. Jika pada VPN / PPP Table -> Buka Properties VPN Interface
    if (row.closest('#view-ppp') || row.closest('#view-vpn') || row.closest('#mitrane-vpn-table')) {
        const tds = row.querySelectorAll('td');
        const name = tds[1] ? tds[1].textContent.trim() : (tds[0] ? tds[0].textContent.trim() : 'vpn-tunnel');
        const type = tds[2] ? tds[2].textContent.trim() : 'PPTP-Client';
        const item = {
            name: name,
            subname: 'vpn',
            type: type,
            status: 'running',
            actualMtu: 1450,
            l2Mtu: 1500,
            macAddress: '00:00:5E:00:53:01'
        };
        window.openInterfacePropertiesModal(item);
        return;
    }

    // 4. Jika pada WireGuard Table (Interfaces / Peers) -> Buka Properties WireGuard
    if (row.closest('#view-wireguard') || row.closest('#mitrane-wg-table') || row.closest('#mitrane-wg-peers-table')) {
        const tds = row.querySelectorAll('td');
        const name = tds[1] ? tds[1].textContent.trim() : (tds[0] ? tds[0].textContent.trim() : 'wg0');
        const item = {
            name: name,
            subname: 'wireguard',
            type: 'WireGuard',
            status: 'running',
            actualMtu: 1420,
            l2Mtu: 1420,
            macAddress: 'none'
        };
        window.openInterfacePropertiesModal(item);
        return;
    }

    // 5. Tabel list lainnya -> Fallback buka modal interface properties untuk record terkait
    const tds = row.querySelectorAll('td');
    if (tds.length > 1) {
        const title = tds[1] ? tds[1].textContent.trim() : tds[0].textContent.trim();
        const item = {
            name: title || 'Item-01',
            subname: 'config',
            type: 'Generic',
            status: 'running',
            actualMtu: 1500,
            l2Mtu: 1500,
            macAddress: '2C:C8:1B:18:BE:2E'
        };
        window.openInterfacePropertiesModal(item);
    }
});

// Bind Apply and OK buttons
document.addEventListener('DOMContentLoaded', () => {
    const okBtn = document.getElementById('btn-ok-interface-properties');
    const applyBtn = document.getElementById('btn-apply-interface-properties');

    const handleSave = () => {
        const nameInput = document.getElementById('modal-iface-name');
        const mtuInput = document.getElementById('modal-iface-mtu');
        const selected = jsonDataService ? jsonDataService.getSelectedInterface() : null;
        if (selected && nameInput) {
            selected.name = nameInput.value.toUpperCase();
            if (mtuInput) selected.actualMtu = parseInt(mtuInput.value, 10) || 1500;
            jsonDataService.renderInterfacesTable('mitrane-interfaces-table');
            if (window.toastManager) {
                window.toastManager.show({title: 'Interface Saved', message: `Perubahan ${selected.name} disimpan.`, type: 'success'});
            }
        }
    };

    if (okBtn) {
        okBtn.addEventListener('click', () => {
            handleSave();
            if (window.modalManager) window.modalManager.close('modal-interface-properties');
        });
    }
    if (applyBtn) {
        applyBtn.addEventListener('click', handleSave);
    }

    // Bridge View Table Handlers (Filter, Selection, Refresh)
    const bridgeSearch = document.getElementById('mitrane-bridge-search');
    if (bridgeSearch) {
        bridgeSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const activePane = document.querySelector('#view-bridge .mitrautama-tab-pane.active') || document.querySelector('#subtab-bridge-ports');
            if (activePane) {
                const rows = activePane.querySelectorAll('tbody tr');
                rows.forEach(tr => {
                    const text = tr.textContent.toLowerCase();
                    tr.style.display = (!query || text.includes(query)) ? '' : 'none';
                });
            }
        });
    }

    // =========================================================================
        // Interfaces Accordion Tree View Toggle (Generic: matches data-iface-node with data-iface-parent)
    // =========================================================================
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-iface-toggle');
        const rootRow = e.target.closest('.iface-root-row');
        
        let nodeId = null;
        let btn = null;

        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            nodeId = toggleBtn.getAttribute('data-iface-node');
            btn = toggleBtn;
        } else if (rootRow) {
            btn = rootRow.querySelector('.btn-iface-toggle');
            if (btn) nodeId = btn.getAttribute('data-iface-node');
        }

        if (!nodeId || !btn) return;

        const table = btn.closest('table');
        if (!table) return;

        const chevron = btn.querySelector('.iface-chevron');
        // Support any special characters in nodeId safely
        const escapedNodeId = (window.CSS && CSS.escape) ? CSS.escape(nodeId) : nodeId.replace(/["\\]/g, '\\$&');
        const childRows = table.querySelectorAll(`tr[data-iface-parent="${escapedNodeId}"]`);
        if (!childRows || childRows.length === 0) return;

        const firstChild = childRows[0];
        const isCurrentlyClosed = firstChild ? (firstChild.style.display === 'none') : true;

        if (chevron) {
            chevron.style.transform = isCurrentlyClosed ? 'rotate(90deg)' : 'rotate(0deg)';
        }

        childRows.forEach(row => {
            row.style.display = isCurrentlyClosed ? '' : 'none';
            // If parent is being collapsed, also collapse any open child accordions recursively
            if (!isCurrentlyClosed) {
                const subNodeId = row.getAttribute('data-iface-node');
                if (subNodeId) {
                    const subChevron = row.querySelector('.iface-chevron');
                    if (subChevron) subChevron.style.transform = 'rotate(0deg)';
                    const escapedSub = (window.CSS && CSS.escape) ? CSS.escape(subNodeId) : subNodeId.replace(/["\\]/g, '\\$&');
                    const subRows = table.querySelectorAll(`tr[data-iface-parent="${escapedSub}"]`);
                    subRows.forEach(sr => sr.style.display = 'none');
                }
            }
        });
    });

    // Bridge Tree / Accordion Toggle Handler (QoS Style: + / -)
    document.addEventListener('click', (e) => {
        // Klik pada tombol toggle (+ / -) atau pada baris root bridge
        const toggleBtn = e.target.closest('.btn-bridge-toggle');
        const rootRow = e.target.closest('.bridge-root-row');
        
        let nodeId = null;
        let btn = null;

        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            nodeId = toggleBtn.getAttribute('data-bridge-node');
            btn = toggleBtn;
        } else if (rootRow) {
            btn = rootRow.querySelector('.btn-bridge-toggle');
            if (btn) nodeId = btn.getAttribute('data-bridge-node');
        }

        if (!nodeId || !btn) return;

        const table = btn.closest('table');
        if (!table) return;

        const chevron = btn.querySelector('.bridge-chevron');
        const firstChild = table.querySelector(`tr[data-bridge-parent="${nodeId}"]`);
        const isCurrentlyClosed = firstChild ? (firstChild.style.display === 'none') : true;

        if (chevron) {
            chevron.style.transform = isCurrentlyClosed ? 'rotate(90deg)' : 'rotate(0deg)';
        }

        const childRows = table.querySelectorAll(`tr[data-bridge-parent="${nodeId}"]`);
        childRows.forEach(row => {
            row.style.display = isCurrentlyClosed ? '' : 'none';
            // If parent is being collapsed, also collapse any open child accordions recursively
            if (!isCurrentlyClosed) {
                const subNodeId = row.getAttribute('data-iface-node');
                if (subNodeId) {
                    const subChevron = row.querySelector('.iface-chevron');
                    if (subChevron) subChevron.style.transform = 'rotate(0deg)';
                    const escapedSub = (window.CSS && CSS.escape) ? CSS.escape(subNodeId) : subNodeId.replace(/["\\]/g, '\\$&');
                    const subRows = table.querySelectorAll(`tr[data-iface-parent="${escapedSub}"]`);
                    subRows.forEach(sr => sr.style.display = 'none');
                }
            }
        });
    });

    const bridgeRefreshBtn = document.getElementById('btn-bridge-refresh');
    if (bridgeRefreshBtn) {
        bridgeRefreshBtn.addEventListener('click', () => {
            if (bridgeSearch) bridgeSearch.value = '';
            document.querySelectorAll('#view-bridge tbody tr').forEach(tr => {
                tr.style.display = '';
                tr.classList.remove('table-primary', 'selected');
            });
            if (window.toastManager) {
                window.toastManager.show({
                    title: 'Bridge Table',
                    message: 'Data tabel bridge disegarkan.',
                    type: 'success',
                    duration: 1500
                });
            }
        });
    }

    // Row selection for Bridge tables
    document.addEventListener('click', (e) => {
        const row = e.target.closest('#view-bridge .mitrane-grid-table tbody tr');
        if (!row) return;
        const tbody = row.closest('tbody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('table-primary', 'selected'));
            row.classList.add('table-primary', 'selected');
        }
    });
    // =========================================================================
    // Universal Live Table Filter (Find Input) for All Views
    // =========================================================================
    function filterTableRows(container, query) {
        if (!container) return;
        const q = query.toLowerCase().trim();
        // Cari tab content / pane aktif, atau fallback ke container itu sendiri
        let activeScope = container.querySelector('.mitrautama-tab-content.active, .mitrautama-tab-pane.active');
        if (!activeScope) {
            activeScope = container;
        }

        const tables = activeScope.querySelectorAll('table.mitrane-grid-table, table.mitrautama-table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            let matchCount = 0;
            rows.forEach(tr => {
                // Jangan sembunyikan pesan colspan 'no records'
                if (tr.querySelector('td[colspan]')) {
                    return;
                }
                const text = tr.textContent.toLowerCase();
                if (!q || text.includes(q)) {
                    tr.style.display = '';
                    matchCount++;
                } else {
                    tr.style.display = 'none';
                }
            });
        });
    }

    // Event Delegation: Tangani SEMUA input Find / Search secara dinamis
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!target) return;

        // Cek jika input merupakan Find search box di toolbar
        const isFindInput = target.matches('input[placeholder*="Find"], input[id*="search"], input[id*="find"]');
        if (isFindInput) {
            const viewSection = target.closest('.mitrautama-view-section') || target.closest('.mitrane-window') || target.closest('.mitrautama-content-area');
            if (viewSection) {
                filterTableRows(viewSection, target.value);
            }
        }
    });

    // Tangani reset pencarian pada tombol refresh di setiap view
    document.addEventListener('click', (e) => {
        const refreshBtn = e.target.closest('[id*="refresh"], .mitrane-toolbar-icon-btn[title*="Refresh"]');
        if (refreshBtn) {
            const viewSection = refreshBtn.closest('.mitrautama-view-section') || refreshBtn.closest('.mitrane-window');
            if (viewSection) {
                const searchInput = viewSection.querySelector('input[placeholder*="Find"], input[id*="search"], input[id*="find"]');
                if (searchInput && searchInput.value) {
                    searchInput.value = '';
                    filterTableRows(viewSection, '');
                }
            }
        }
    });

    // =========================================================================
    // QoS Manager Accordion Tree View Toggle (Chevron >)
    // =========================================================================
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-queue-toggle');
        const queueRow = e.target.closest('.queue-root, .queue-branch');
        
        let nodeId = null;
        let btn = null;

        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            nodeId = toggleBtn.getAttribute('data-queue-node');
            btn = toggleBtn;
        } else if (queueRow) {
            btn = queueRow.querySelector('.btn-queue-toggle');
            if (btn) nodeId = btn.getAttribute('data-queue-node');
        }

        if (!nodeId || !btn) return;

        const table = btn.closest('table');
        if (!table) return;

        const chevron = btn.querySelector('.queue-chevron');
        const directChildren = table.querySelectorAll(`tr[data-queue-parent="${nodeId}"]`);
        const firstChild = directChildren[0];
        const isCurrentlyClosed = firstChild ? (firstChild.style.display === 'none') : true;

        if (chevron) {
            chevron.style.transform = isCurrentlyClosed ? 'rotate(90deg)' : 'rotate(0deg)';
        }

        if (isCurrentlyClosed) {
            // Expand direct children
            directChildren.forEach(row => {
                row.style.display = '';
                // Jika direct child adalah branch yang sudah terbuka, tampilkan juga cucunya
                const childToggle = row.querySelector('.btn-queue-toggle');
                const childChevron = childToggle ? childToggle.querySelector('.queue-chevron') : null;
                if (childChevron && childChevron.style.transform === 'rotate(90deg)') {
                    const childNodeId = childToggle.getAttribute('data-queue-node');
                    const grandChildren = table.querySelectorAll(`tr[data-queue-parent="${childNodeId}"]`);
                    grandChildren.forEach(gc => gc.style.display = '');
                }
            });
        } else {
            // Collapse: sembunyikan semua descendants
            const children = table.querySelectorAll(`tr[data-queue-parent="${nodeId}"], tr[data-queue-ancestor="${nodeId}"]`);
            children.forEach(row => {
                row.style.display = 'none';
            });
        }
    });

    // =========================================================================
    // QoS WinBox Modal Dialog Handlers
    // =========================================================================
    // 1. Sub-tabs switching inside modal-qos
    document.addEventListener('click', (e) => {
        const subtabBtn = e.target.closest('#modal-queue-subtabs-bar .winbox-subtab-btn');
        if (!subtabBtn) return;
        e.preventDefault();

        const bar = document.getElementById('modal-queue-subtabs-bar');
        if (!bar) return;
        bar.querySelectorAll('.winbox-subtab-btn').forEach(btn => btn.classList.remove('active'));
        subtabBtn.classList.add('active');

        const targetSubtab = subtabBtn.getAttribute('data-subtab');
        const container = document.getElementById('modal-queue-tab-contents');
        if (container && targetSubtab) {
            container.querySelectorAll('.modal-queue-pane').forEach(pane => {
                pane.style.display = 'none';
            });
            const activePane = document.getElementById(`modal-queue-pane-${targetSubtab}`);
            if (activePane) {
                activePane.style.display = 'block';
            }
        }
    });

    // 2. Open QoS modal on table row double-click
    document.addEventListener('dblclick', (e) => {
        const tr = e.target.closest('#table-queues-simple tbody tr');
        if (!tr) return;
        if (e.target.closest('.btn-queue-toggle')) return;
        if (typeof window.openQosModal === 'function') {
            window.openQosModal(tr);
        }
    });

    // 3. Reset form when clicking "+ New" button
    document.addEventListener('click', (e) => {
        const newBtn = e.target.closest('#btn-queues-new');
        if (!newBtn) return;
        const titleEl = document.getElementById('modal-queue-title-name');
        if (titleEl) titleEl.textContent = 'New...';
        const nameInput = document.getElementById('modal-queue-name');
        if (nameInput) nameInput.value = 'qos1';
        const targetInput = document.getElementById('modal-queue-target');
        if (targetInput) targetInput.value = '0.0.0.0/0';
        const maxUpInput = document.getElementById('modal-queue-max-upload');
        if (maxUpInput) maxUpInput.value = '0';
        const maxDownInput = document.getElementById('modal-queue-max-download');
        if (maxDownInput) maxDownInput.value = '0';

        const bar = document.getElementById('modal-queue-subtabs-bar');
        if (bar) {
            bar.querySelectorAll('.winbox-subtab-btn').forEach(btn => btn.classList.remove('active'));
            const generalBtn = bar.querySelector('[data-subtab="general"]');
            if (generalBtn) generalBtn.classList.add('active');
        }
        const container = document.getElementById('modal-queue-tab-contents');
        if (container) {
            container.querySelectorAll('.modal-queue-pane').forEach(p => p.style.display = 'none');
            const genPane = document.getElementById('modal-queue-pane-general');
            if (genPane) genPane.style.display = 'block';
        }
    });

    // 4. Handle Apply and OK
    document.addEventListener('click', (e) => {
        const applyBtn = e.target.closest('#btn-apply-qos');
        const okBtn = e.target.closest('#btn-ok-qos');
        if (applyBtn || okBtn) {
            const nameInput = document.getElementById('modal-queue-name');
            const qName = nameInput ? nameInput.value : 'qos1';
            if (window.toastManager) {
                window.toastManager.show({
                    title: 'QoS Saved',
                    message: `Antrean ${qName} berhasil disimpan.`,
                    type: 'success'
                });
            }
            if (okBtn && window.modalManager) {
                window.modalManager.close('modal-qos');
            }
        }
    });
});


// ==========================================================================
// Dynamic Table Empty State Observer & Manager (Automatic Rule)
// If any table tbody is empty or has 0 rows -> auto-render clean white empty state with contextual icon
// If data rows are added -> automatically remove empty state
// ==========================================================================

window.TableEmptyStateManager = {
    // Mapping icon kontekstual berdasarkan modul / ID tabel
    getModuleMeta: function(table) {
        const id = table.id || '';
        const parentPane = table.closest('[id]') ? table.closest('[id]').id : '';
        const combined = (id + ' ' + parentPane).toLowerCase();

        // 1. Interfaces & Tunneling
        if (combined.includes('eoip')) {
            return {
                title: 'No EoIP Tunnels Configured',
                desc: 'Ethernet over IP tunnel list is currently empty on this router.',
                icon: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
            };
        }
        if (combined.includes('ip-tunnel') || combined.includes('ipip')) {
            return {
                title: 'No IP Tunnels Configured',
                desc: 'IPIP encapsulation tunnel interface list is currently empty.',
                icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>'
            };
        }
        if (combined.includes('gre')) {
            return {
                title: 'No GRE Tunnels Configured',
                desc: 'Generic Routing Encapsulation tunnel list is currently empty.',
                icon: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>'
            };
        }
        if (combined.includes('vlan')) {
            return {
                title: 'No VLAN Interfaces Configured',
                desc: 'No IEEE 802.1Q virtual LAN sub-interfaces defined.',
                icon: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>'
            };
        }
        if (combined.includes('vxlan')) {
            return {
                title: 'No VXLAN Interfaces Configured',
                desc: 'Virtual Extensible LAN VNI interfaces are not active.',
                icon: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>'
            };
        }
        if (combined.includes('vrf')) {
            return {
                title: 'No VRF Instances Defined',
                desc: 'Virtual Routing and Forwarding domain list is currently empty.',
                icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
            };
        }
        if (combined.includes('vrrp')) {
            return {
                title: 'No VRRP Instances Configured',
                desc: 'Virtual Router Redundancy Protocol failover daemon is inactive.',
                icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
            };
        }
        if (combined.includes('lacc') || combined.includes('bond')) {
            return {
                title: 'No Bonding Interfaces Configured',
                desc: 'Link Aggregation / 802.3ad trunk interfaces list is currently empty.',
                icon: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>'
            };
        }
        if (combined.includes('macsec')) {
            return {
                title: 'No MACsec Encryptions Configured',
                desc: 'IEEE 802.1AE Layer-2 security associations list is empty.',
                icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
            };
        }
        if (combined.includes('macvlan')) {
            return {
                title: 'No MACVLAN Interfaces Configured',
                desc: 'MACVLAN virtual sub-interfaces list is currently empty.',
                icon: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>'
            };
        }
        if (combined.includes('vether')) {
            return {
                title: 'No vEther Interfaces Configured',
                desc: 'Virtual container ethernet pairs are currently unallocated.',
                icon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'
            };
        }
        if (combined.includes('interface')) {
            return {
                title: 'No Interfaces Available',
                desc: 'There are no active or configured interfaces in this category.',
                icon: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>'
            };
        }

        // 2. WireGuard
        if (combined.includes('wg') || combined.includes('wireguard')) {
            return {
                title: 'No WireGuard Records Found',
                desc: 'WireGuard tunnels, peers, or status telemetry list is currently empty.',
                icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>'
            };
        }

        // 3. Wireless
        if (combined.includes('wire') || combined.includes('wifi') || combined.includes('wlan')) {
            return {
                title: 'No Wireless Radios / Clients',
                desc: 'No IEEE 802.11 wireless interfaces, registrations, or snooping found.',
                icon: '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>'
            };
        }

        // 4. IP / Routing
        if (combined.includes('route') || combined.includes('ip') || combined.includes('pool') || combined.includes('dhcp') || combined.includes('arp')) {
            return {
                title: 'No Network Records Configured',
                desc: 'Routing table, IP address pools, or ARP neighbors list is empty.',
                icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>'
            };
        }

        // 5. Default Fallback
        return {
            title: 'No Data Records Found',
            desc: 'There are no active records or configured items available in this table.',
            icon: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>'
        };
    },

    // Mengecek dan memperbarui satu tabel (aturan: jika baris data 0 -> render empty state)
    checkTable: function(table) {
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Hitung baris non-empty
        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const emptyRows = allRows.filter(r => r.classList.contains('mitrane-table-empty-row') || r.querySelector('.mitrane-empty-state-box'));
        const dataRows = allRows.filter(r => !r.classList.contains('mitrane-table-empty-row') && !r.querySelector('.mitrane-empty-state-box'));

        // Aturan: Jika tidak ada data row (dataRows.length === 0)
        if (dataRows.length === 0) {
            // Jika sudah ada empty row standar, tidak perlu render ulang
            if (emptyRows.length > 0) return;

            // Hitung jumlah kolom dari thead
            let colCount = 1;
            const theadRow = table.querySelector('thead tr');
            if (theadRow) {
                colCount = theadRow.querySelectorAll('th, td').length || 1;
            }

            const meta = this.getModuleMeta(table);
            const emptyTr = document.createElement('tr');
            emptyTr.className = 'mitrane-table-empty-row';
            emptyTr.innerHTML = `
                <td colspan="${colCount}" class="text-center p-0" style="border: none;">
                    <div class="mitrane-empty-state-box">
                        <div class="mitrane-empty-state-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                ${meta.icon}
                            </svg>
                        </div>
                        <div class="mitrane-empty-state-title">${meta.title}</div>
                        <div class="mitrane-empty-state-desc">${meta.desc}</div>
                    </div>
                </td>
            `;
            tbody.innerHTML = '';
            tbody.appendChild(emptyTr);
        } else {
            // Jika ada data baris nyata tapi ada sisa empty-row -> hapus empty row
            if (emptyRows.length > 0) {
                emptyRows.forEach(r => r.remove());
            }
        }
    },

    // Periksa semua tabel di dokumen
    checkAllTables: function() {
        document.querySelectorAll('.mitrane-grid-table, .mitrautama-table').forEach(table => {
            this.checkTable(table);
        });
    },

    // Inisialisasi observer otomatis
    init: function() {
        this.checkAllTables();

        // Pantau mutasi DOM pada semua tabel (jika ada data dihapus atau ditambahkan secara dinamis)
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    const target = mutation.target;
                    const table = target.closest ? target.closest('.mitrane-grid-table, .mitrautama-table') : null;
                    if (table) {
                        this.checkTable(table);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Jalankan otomatis saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.TableEmptyStateManager.init());
} else {
    window.TableEmptyStateManager.init();
}
