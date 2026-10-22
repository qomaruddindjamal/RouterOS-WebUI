/**
 * MitraUtama HTML Module Loader & JSON Data Initializer
 * Mengunggah file modul HTML (includes/, interfaces/, ip/, wireguard/, wireless/, switch/, bridge/, system/, queues/, ppp/)
 * dan memuat konfigurasi serta data dari config.json dan interfaces/interfaces.json
 */
import { jsonDataService } from './data-loader.js';

export class ModuleLoader {
    constructor() {
        this.modules = {
            'header-container': 'includes/header.html',
            'sidebar-container': 'includes/sidebar.html',
            'footer-container': 'includes/footer.html',
            'interfaces-module-container': 'interfaces/interfaces.html',
            'ip-module-container': 'ip/ip.html',
            'wireguard-module-container': 'wireguard/wireguard.html',
            'wireless-module-container': 'wireless/wireless.html',
            'switch-module-container': 'switch/switch.html',
            'bridge-module-container': 'bridge/bridge.html',
            'system-module-container': 'system/system.html',
            'queues-module-container': 'queues/queues.html',
            'ppp-module-container': 'ppp/ppp.html'
        };
    }

    async loadAll() {
        const loadPromises = Object.entries(this.modules).map(async ([containerId, filePath]) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            try {
                const response = await fetch(filePath);
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

            // Bind Search Filter
            const searchInput = document.getElementById('mitrane-interface-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    jsonDataService.renderInterfacesTable('mitrane-interfaces-table', e.target.value);
                });
            }

            // Bind Refresh Button
            const refreshBtn = document.getElementById('btn-interface-refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async () => {
                    await jsonDataService.loadInterfaces();
                    jsonDataService.renderInterfacesTable('mitrane-interfaces-table');
                    if (window.toastManager) {
                        window.toastManager.show({
                            title: 'Table Refreshed',
                            message: 'Interfaces loaded from interfaces.json',
                            type: 'success',
                            duration: 1500
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('[ModuleLoader] JSON data init failed:', e);
        }
    }
}

export const moduleLoader = new ModuleLoader();
