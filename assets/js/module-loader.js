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
            'interfaces-module-container': 'packages/interfaces/interfaces.html',
            'ip-module-container': 'packages/ip/ip.html',
            'wireguard-module-container': 'packages/wireguard/wireguard.html',
            'wireless-module-container': 'packages/wireless/wireless.html',
            'switch-module-container': 'packages/switch/switch.html',
            'bridge-module-container': 'packages/bridge/bridge.html',
            'system-module-container': 'packages/system/system.html',
            'queues-module-container': 'packages/queues/queues.html',
            'ppp-module-container': 'packages/ppp/ppp.html'
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

export const moduleLoader = new ModuleLoader();
