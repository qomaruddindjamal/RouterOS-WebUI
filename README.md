# RouterOS WebUI

A modern, responsive, information-dense web user interface designed for MikroTik RouterOS (inspired by WinBox 4.x patterns).

## Architecture & Design Principles

- **Modular HTML & ES6 JavaScript:** Sub-views located in dedicated directories (`interfaces/`, `switch/`, `bridge/`, `system/`, `queues/`, `ppp/`, `wireguard/`, `wireless/`, `ip/`, `includes/`).
- **Strict Theme System:** Centralized CSS token architecture:
  - `css/mitrautama.css`: Base clean bright theme with CSS custom properties.
  - `css/mitrautama-dark.css`: Dark midnight navy theme.
  - `css/mitrautama-auto.css`: Dynamic time-based theme (Fajar, Pagi, Siang, Senja, Malam).
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
