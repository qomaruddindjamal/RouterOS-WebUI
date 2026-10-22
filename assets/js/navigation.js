/**
 * MitraUtama Dashboard Navigation & View Switcher
 * Mengontrol pembukaan Menu, Sub-Menu Drop-Right, Tab-Menu, Filter Tabel, Collapse Sidebar, dan Aksi SweetAlert
 * Menggunakan class dan selector awalan mitrautama-
 */

import { toastManager } from './toast.js';

export class NavigationManager {
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

        // Pastikan view awal aktif
        this.switchView('dashboard', 'Home');
    }

    bindSidebarCollapse() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('sidebarMenu');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                const isCollapsed = sidebar.classList.contains('collapsed');
                document.body.classList.toggle('mitrautama-sidebar-collapsed', isCollapsed);
                localStorage.setItem('mitra_sidebar_collapsed', isCollapsed ? 'true' : 'false');
                toastManager.show({
                    title: isCollapsed ? 'Sidebar Diciutkan' : 'Sidebar Diperluas',
                    message: isCollapsed ? 'Navigasi mode icon minimalis.' : 'Navigasi mode lengkap.',
                    type: 'info',
                    duration: 1500
                });
            });

            // Restore state
            if (localStorage.getItem('mitra_sidebar_collapsed') === 'true') {
                sidebar.classList.add('collapsed');
                document.body.classList.add('mitrautama-sidebar-collapsed');
            }
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
                
                document.querySelectorAll('.mitrautama-menu-group').forEach(g => {
                    if (g !== parentGroup) g.classList.remove('open');
                });

                if (parentGroup) {
                    parentGroup.classList.toggle('open');
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
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mitrautama-menu-group')) {
                document.querySelectorAll('.mitrautama-menu-group').forEach(g => g.classList.remove('open'));
            }
        });
    }

        bindWinboxSubTabs() {
        // 1. Selector untuk sub-tabs mitrautama standard dan mitrane tabs
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
                    tabPanes.forEach(p => p.classList.remove('active'));
                    const targetContent = parentView.querySelector(#subtab-) || parentView.querySelector(#);
                    if (targetContent) {
                        targetContent.classList.add('active');
                        targetContent.style.display = 'block';
                    }
                }

                toastManager.show({
                    title: 'Sub-Tab Aktif',
                    message: Membuka tampilan tab: ,
                    type: 'info',
                    duration: 1200
                });
            });
        });
    }

    switchView(viewId, titleLabel = '') {
        this.activeView = viewId;
        const allSections = document.querySelectorAll('.mitrautama-view-section');
        allSections.forEach(sec => {
            sec.style.display = 'none';
        });

        const targetSection = document.getElementById(`view-${viewId}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            const container = document.querySelector('.mitrautama-content-area');
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });

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

        toastManager.show({
            title: 'Menu Terbuka',
            message: `Modul Aktif: ${titleLabel || viewId}`,
            type: 'success',
            duration: 2000
        });
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
                    <button class="mitrautama-toolbar-btn text-success" onclick="toastManager.show({title:'Enable', message:'Item diaktifkan', type:'success'})">
                        ✓ Enable
                    </button>
                    <button class="mitrautama-toolbar-btn text-danger" onclick="toastManager.show({title:'Disable', message:'Item dinonaktifkan', type:'warning'})">
                        ✕ Disable
                    </button>
                    <button class="mitrautama-toolbar-btn text-muted" onclick="toastManager.show({title:'Comment', message:'Dialog komentar', type:'info'})">
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
                            <td>0</td>
                            <td><strong>Default-${viewId}</strong></td>
                            <td>Active Enabled</td>
                            <td>1. WAN (172.16.92.230)</td>
                            <td><span class="mitrautama-badge mitrautama-badge-success">● RUNNING</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="Swal.fire('Detail', 'Modul ${titleLabel} siap dioperasikan.', 'info')">Edit</button>
                            </td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td><strong>Hardware Policy</strong></td>
                            <td>RB3011UiAS Switch Chip (QCA8337)</td>
                            <td>2. LAN (10.10.16.254)</td>
                            <td><span class="mitrautama-badge mitrautama-badge-info">Slave</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="Swal.fire('Detail', 'Modul ${titleLabel} siap dioperasikan.', 'info')">Edit</button>
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

export const navigationManager = new NavigationManager();
window.navigationManager = navigationManager;
