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
        this.bindTerminalEvents();

        // Pastikan view awal aktif (Restore dari Hash URL atau LocalStorage saat refresh)
        const initialHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
        const savedView = localStorage.getItem('mitrautama_active_view');
        const defaultView = initialHash || savedView || 'dashboard';
        this.switchView(defaultView);

        // Dengarkan event hashchange agar tombol Back/Forward browser berfungsi mulus
        window.addEventListener('hashchange', () => {
            const currentHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
            if (currentHash && currentHash !== this.activeView) {
                this.switchView(currentHash);
            }
        });
    }

    bindSidebarCollapse() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const logoIcon = document.querySelector('.mitrautama-header-left .mu-logo-icon') || document.querySelector('.mu-logo-icon');
        const sidebar = document.getElementById('sidebarMenu');
        
        const toggleSidebar = () => {
            if (!sidebar) return;
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


        };

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
        try {
            localStorage.setItem('mitrautama_active_view', viewId);
            const targetHash = '#' + viewId;
            if (window.location.hash !== targetHash) {
                history.replaceState(null, '', targetHash);
            }
        } catch (e) {}

        const allSections = document.querySelectorAll('.mitrautama-view-section');
        allSections.forEach(sec => {
            sec.style.display = 'none';
        });

        // 1. Pemetaan Alias Route & Sub-Tab ke Modul Spesifik
        const routeAliasMap = {}; // Backward-compat for test_suite
        const routeConfigMap = {
            'terminal': { view: 'terminal' },
            'vpn': { view: 'ppp' },
            'qos': { view: 'qos' },
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
            'queues': { view: 'qos' },
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

            // Dashboard Chart Lifecycle Integration
            // Sync sidebar and submenu active state
            document.querySelectorAll('.mitrautama-menu-item, .mitrautama-submenu-item').forEach(m => m.classList.remove('active'));
            const activeSidebarItem = document.querySelector(`.mitrautama-menu-item[data-mitrautama-view="${viewId}"], .mitrautama-menu-item[data-mitrautama-view="${resolvedId}"]`) ||
                                      document.querySelector(`.mitrautama-submenu-item[data-mitrautama-view="${viewId}"]`);
            if (activeSidebarItem) {
                activeSidebarItem.classList.add('active');
                const parentGrp = activeSidebarItem.closest('.mitrautama-menu-group');
                if (parentGrp) {
                    const parentMenu = parentGrp.querySelector('.mitrautama-menu-item');
                    if (parentMenu) parentMenu.classList.add('active');
                }
            }

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

export const navigationManager = new NavigationManager();
window.navigationManager = navigationManager;
