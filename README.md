# RouterOS WebUI

A modern, responsive, information-dense web user interface designed for MikroTik RouterOS (inspired by WinBox 4.x patterns).

## Architecture & Design Principles

- **Modular HTML & ES6 JavaScript:** Sub-views located in dedicated directories (`interfaces/`, `switch/`, `bridge/`, `system/`, `queues/`, `ppp/`, `wireguard/`, `wireless/`, `ip/`, `includes/`).
- **Strict Theme System:** Centralized CSS token architecture with persistent `localStorage` selection, instant early-detection rendering in `<head>`, and seamless dynamic header integration:
  - `css/mitrautama.css`: Base clean bright theme with CSS custom properties.
  - `css/mitrautama-dark.css`: Dark midnight navy theme (`[data-theme="dark"]`).
  - `css/mitrautama-auto.css`: Dynamic time-based theme with 5 atmospheric periods:
    - **Fajar (`04:00 - 06:14`):** Cahaya lembut keemasan pastel (`[data-period="fajar"]`).
    - **Pagi (`06:15 - 11:29`):** Cerah segar biru langit & putih hangat (`[data-period="pagi"]`).
    - **Siang (`11:30 - 15:59`):** Ultra-bright kontras tajam & cerah maksimal (`[data-period="siang"]`).
    - **Senja (`16:00 - 17:59`):** Hangat jingga lembayung sunset (`[data-period="senja"]`).
    - **Malam (`18:00 - 03:59`):** Deep night dark mode elegan (`[data-period="malam"]` + `mitrautama-dark.css`).
  - `css/mitrautama-tabel.css`: Compact high-density data grid tables with status badges.
  - `css/mitrautama-tost.css`: Floating toast alerts with progress bars.
  - `css/mitrautama-all-min.css`: Core layout shell, fixed header/footer, collapsible sidebar (230px / 58px), drop-right flyout submenus.
- **Interactive Home KPI Dashboard:** Default active view displaying WAN live traffic stream, CPU history graphs, hardware health indicators, and memory usage metrics.
- **Interfaces Operational Window:** Complete WinBox-styled 16-tab navigation (`Interface`, `Interface List`, `Ethernet`, `EoIP Tunnel`, `IP Tunnel`, `GRE Tunnel`, `VLAN`, `Bridge`, `VXLAN`, `VRF`, `VRRP`, `LACC`, `MACsec`, `MACVLAN`, `vEther`, `vEther Tunnel`) and interactive CRUD simulation.
- **Strict Safety:** Modal dialogs use manual-close only (no auto-close on backdrop click). Local state modifications are clearly bounded as simulations.

## Automated Verification

Run unit & integration tests:
```bash
python test_suite.py
```

## License
MIT License - See [LICENSE](LICENSE) for details.
