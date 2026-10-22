/**
 * MitraUtama Theme Management Module
 * Mendukung mode:
 * - light (cerah default)
 * - dark (mitrautama-dark.css)
 * - auto (mitrautama-auto.css berdasarkan waktu: fajar, pagi, siang, senja, malam)
 */

export class ThemeManager {
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
     * - Fajar (Dawn): 04:30 - 06:14 (Cahaya lembut fajar keemasan pastel)
     * - Pagi (Morning): 06:15 - 11:29 (Cerah segar biru langit & putih hangat)
     * - Siang (Afternoon): 11:30 - 15:29 (Ultra-bright, kontras tajam, cerah maksimal)
     * - Senja (Dusk / Golden Sunset): 15:30 - 18:29 (Hangat jingga lembayung)
     * - Malam (Night): 18:30 - 04:29 (Deep night, biru pekat nyaman elegan)
     */
    getTimePeriod(date = new Date()) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const timeVal = hours * 60 + minutes;

        if (timeVal >= 4 * 60 + 30 && timeVal < 6 * 60 + 15) {
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
        } else if (timeVal >= 11 * 60 + 30 && timeVal < 15 * 60 + 30) {
            return {
                name: 'siang',
                label: 'Siang (Afternoon)',
                icon: '🌞',
                greeting: 'Selamat Siang'
            };
        } else if (timeVal >= 15 * 60 + 30 && timeVal < 18 * 60 + 30) {
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

        if (mode === 'dark') {
            themeLink.href = 'css/mitrautama-dark.css';
            autoLink.disabled = true;
            document.documentElement.removeAttribute('data-period');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (mode === 'light') {
            themeLink.href = 'css/mitrautama.css';
            autoLink.disabled = true;
            document.documentElement.removeAttribute('data-period');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // mode === 'auto'
            themeLink.href = 'css/mitrautama.css'; // base terang
            autoLink.disabled = false;
            document.documentElement.setAttribute('data-theme', 'auto');
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

export const themeManager = new ThemeManager();
