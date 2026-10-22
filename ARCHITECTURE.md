# RouterOS WebUI Architecture & Canonical Inventory

## 1. Executive Summary & Repository Identity
- **Repository Root:** `C:\RouterOS`
- **Environment Isolation:** STRICT. `C:\mitranet`, `C:\asl`, dan direktori eksternal lainnya adalah READ-ONLY dan tidak disentuh.
- **Scope:** Standalone WebUI untuk MikroTik RouterOS RB3011UiAS-RM (v7.24.5) berbasis arsitektur modular HTML, vanilla CSS terstruktur (`mitrautama-*`), dan ES6 modular JavaScript.
- **Git HEAD:** Commit `7f5aca1` (Baseline).

## 2. Inventory Modul & Sumber Daya
### A. Modul HTML
1. `index.html`: Main Application Shell (Fixed Header, Collapsible Sidebar, Main Content Area, Fixed Status Footer).
2. `includes/header.html`: Header tetap dengan breadcrumb/home, host badge, time-based theme trigger, dan notifications.
3. `includes/sidebar.html`: Menu hierarki bergaya WinBox 4.x dengan drop-right flyout sub-menu bertingkat (`Switch`, `IP`, `Interfaces`, `Wireless`, `Bridge`, `Queues`, `System`, `PPP`).
4. `includes/footer.html`: Status bar tetap dengan informasi versi RouterOS, identitas board, uptime, tegangan, suhu, dan RAM bebas.
5. `interfaces/interfaces.html`: Window operasional Interfaces dengan toolbar WinBox, sub-tab (16 tab), dan tabel data padat.
6. `switch/switch.html`: Modul konfigurasi chip switch QCA8337 (Port, VLAN, Rule, Host).
7. `bridge/bridge.html`: Modul bridge dual-switch (Bridge, Ports, VLANs).
8. `ip/ip.html`: Sub-modul IP (ARP, Addresses, DHCP Server, Pools, Routes, NAT).
9. `wireguard/wireguard.html`: Sub-modul WireGuard (Interfaces, Peers).
10. `wireless/wireless.html`: Sub-modul Wireless Tables & CAPsMAN.
11. `system/system.html`: Sub-modul System (Resources, RouterBOARD, Health, Users).
12. `queues/queues.html`: Sub-modul Bandwidth Queues (Simple Queues, Tree, Types).
13. `ppp/ppp.html`: Sub-modul Point-to-Point Tunneling (Interfaces, PPPoE Servers, Secrets, Active).

### B. Modul CSS (`css/`)
1. `mitrautama.css`: CSS dasar tema cerah dengan tokens CSS variables terpusat.
2. `mitrautama-dark.css`: CSS tema gelap (midnight).
3. `mitrautama-auto.css`: Dynamic CSS pengatur tema otomatis berdasarkan waktu (Fajar, Pagi, Siang, Senja, Malam).
4. `mitrautama-tabel.css`: Styling tabel kompak dan status badge RouterOS.
5. `mitrautama-tost.css`: Styling notifikasi toast mengambang dengan icon SVG dan timer progress bar.
6. `mitrautama-all-min.css`: Core layout shell, fixed header/footer, collapsible sidebar (230px/58px), drop-right popovers, window toolbar, dan grid layout.

### C. Modul JavaScript (`js/`)
1. `js/config.js`: Konfigurasi global aplikasi.
2. `js/theme.js` & `js/theme-ui.js`: Logika evaluasi waktu dan dynamic theme switcher.
3. `js/modal.js`: Modal dialog manager manual-close (backdrop klik tidak auto-close).
4. `js/toast.js`: Toast notification system (`toastManager.show(...)`).
5. `js/charts.js`: Real-time Chart.js rendering untuk live traffic stream & CPU history.
6. `js/navigation.js`: Sidebar toggle collapse, drop-right flyout navigation, sub-tab switching, dan view router.
7. `js/module-loader.js`: Asynchronous module loader fetching HTML sub-modules.
8. `js/data-loader.js`: JSON data service untuk data rendering interaktif.
9. `js/auth.js`: Autentikasi dan login handling RouterOS.
10. `js/status.js`: Polling dan status visual router.

### D. Data Fixtures
1. `config.json`: Metadata aplikasi, menu, dan tab registry.
2. `interfaces/interfaces.json`: Fixture data interfaces terperinci.
3. `full_router_dump.json`: Snapshot data aktual router hardware RB3011UiAS-RM.
4. `router_snapshot.json`: Snapshot cadangan konfigurasi sistem.
