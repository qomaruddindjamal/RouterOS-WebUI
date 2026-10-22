/**
 * MitraUtama Theme UI Controller & User Session Controller
 */

import { themeManager } from './theme.js';

export class ThemeUIController {
    constructor() {
        this.init();
    }

    init() {
        this.bindButtons();
        this.bindEvents();
        this.updateActiveButton(themeManager.currentMode);
    }

    bindButtons() {
        const buttons = document.querySelectorAll('[data-theme-set], [data-mitrautama-theme]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = btn.getAttribute('data-theme-set') || btn.getAttribute('data-mitrautama-theme');
                themeManager.setTheme(mode);
                this.updateActiveButton(mode);
            });
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ThemeUIController();
});
