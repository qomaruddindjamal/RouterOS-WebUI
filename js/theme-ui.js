/**
 * MitraUtama Theme UI Controller & Period Badge Updater
 * Menghubungkan ThemeManager dengan tombol UI dan indikator periode waktu
 */

import { themeManager } from './theme.js';

export class ThemeUIController {
    constructor() {
        this.init();
    }

    init() {
        this.bindButtons();
        this.bindEvents();
        this.updateBadge(themeManager.getCurrentPeriod());
    }

    bindButtons() {
        const buttons = document.querySelectorAll('[data-theme-set]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-theme-set');
                themeManager.setTheme(mode);
                this.updateActiveButton(mode);
            });
        });

        // Set initial button active state
        this.updateActiveButton(themeManager.currentMode);
    }

    updateActiveButton(mode) {
        const buttons = document.querySelectorAll('[data-theme-set]');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-theme-set') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    bindEvents() {
        window.addEventListener('themePeriodChange', (e) => {
            this.updateBadge(e.detail);
        });

        window.addEventListener('themeModeChange', (e) => {
            if (e.detail.mode === 'auto') {
                this.updateBadge(themeManager.getCurrentPeriod());
            } else {
                this.clearBadge(e.detail.mode);
            }
        });
    }

    updateBadge(periodInfo) {
        const badge = document.getElementById('period-badge');
        const greeting = document.getElementById('period-greeting');

        if (badge) {
            badge.style.display = 'inline-flex';
            badge.innerHTML = `<span>${periodInfo.icon}</span> <span>Mode Auto: ${periodInfo.label}</span>`;
        }

        if (greeting) {
            greeting.textContent = periodInfo.greeting;
        }
    }

    clearBadge(mode) {
        const badge = document.getElementById('period-badge');
        if (badge) {
            if (mode === 'dark') {
                badge.style.display = 'inline-flex';
                badge.innerHTML = `<span>🌙</span> <span>Mode: Dark</span>`;
            } else if (mode === 'light') {
                badge.style.display = 'inline-flex';
                badge.innerHTML = `<span>☀️</span> <span>Mode: Bright Light</span>`;
            }
        }
    }
}

// Inisialisasi controller
document.addEventListener('DOMContentLoaded', () => {
    new ThemeUIController();
});
