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
