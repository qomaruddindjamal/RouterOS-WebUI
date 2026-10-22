/**
 * MitraUtama HTML Module Loader & JSON Data Initializer
 * Mengunggah file modul HTML (includes/, interfaces/, ip/, wireguard/, wireless/, switch/, bridge/, system/, queues/, ppp/)
 * dan memuat konfigurasi serta data dari config.json dan interfaces/interfaces.json
 */
import { jsonDataService } from './data-loader.js';
import { toastManager } from './toast.js';

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
                    toastManager.show({
                        title: 'Tabel Diperbarui',
                        message: 'Data interfaces dimuat ulang dari fixture JSON.',
                        type: 'success',
                        duration: 1500
                    });
                });
            }

            // Bind Enable Button
            const enableBtn = document.getElementById('btn-interface-enable');
            if (enableBtn) {
                enableBtn.addEventListener('click', () => {
                    const updated = jsonDataService.toggleSelectedStatus('running');
                    if (updated) {
                        toastManager.show({
                            title: 'Interface Enabled',
                            message: `Interface ${updated.name} kini berstatus Running (simulasi).`,
                            type: 'success',
                            duration: 2000
                        });
                    } else {
                        toastManager.show({
                            title: 'Pilih Baris',
                            message: 'Silakan pilih interface pada tabel terlebih dahulu.',
                            type: 'warning',
                            duration: 2000
                        });
                    }
                });
            }

            // Bind Disable Button
            const disableBtn = document.getElementById('btn-interface-disable');
            if (disableBtn) {
                disableBtn.addEventListener('click', () => {
                    const updated = jsonDataService.toggleSelectedStatus('inactive');
                    if (updated) {
                        toastManager.show({
                            title: 'Interface Disabled',
                            message: `Interface ${updated.name} kini berstatus Inactive (simulasi).`,
                            type: 'warning',
                            duration: 2000
                        });
                    } else {
                        toastManager.show({
                            title: 'Pilih Baris',
                            message: 'Silakan pilih interface pada tabel terlebih dahulu.',
                            type: 'warning',
                            duration: 2000
                        });
                    }
                });
            }

            // Bind Remove Button
            const removeBtn = document.getElementById('btn-interface-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    const selected = jsonDataService.getSelectedInterface();
                    if (!selected) {
                        toastManager.show({
                            title: 'Pilih Baris',
                            message: 'Silakan pilih interface yang akan dihapus.',
                            type: 'warning',
                            duration: 2000
                        });
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
                        toastManager.show({
                            title: 'Pilih Baris',
                            message: 'Silakan pilih interface untuk menambahkan komentar.',
                            type: 'warning',
                            duration: 2000
                        });
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

            // Bind Modal Save Interface Form
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

export const moduleLoader = new ModuleLoader();
