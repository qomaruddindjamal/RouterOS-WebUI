# RouterOS WebUI

A modern, responsive, high-density Web User Interface designed for MikroTik RouterOS management, inspired by WinBox 4.x patterns.

## Features & Modules

- **Collapsible WinBox Sidebar:** Fast navigation across all RouterOS modules with smooth collapse/expand states (230px full / 58px compact) and upward-oriented flyout submenus.
- **Interactive Home KPI Dashboard:** Live WAN throughput monitoring, CPU load graph, memory utilization, and real-time system health metrics.
- **Interfaces Manager:** Complete operational view with multi-tab navigation (`Interface`, `Interface List`, `Ethernet`, `EoIP Tunnel`, `IP Tunnel`, `GRE Tunnel`, `VLAN`, `Bridge`, `VRF`, etc.) and replica WinBox Properties modals.
- **QoS Manager:** Centralized bandwidth management module featuring:
  - **Simple QoS:** Tree and table bandwidth limits with expandable hierarchy.
  - **QoS Interfaces:** Per-interface queue assignment.
  - **QoS Tree:** Hierarchical parent-child bandwidth tree policies.
  - **QoS Types:** Queue scheduling algorithms (PCQ, SFQ, RED, FIFO).
  - **QoS Modal Dialog:** Dedicated WinBox-replica dialog with General, Advanced, Statistics, Traffic, and Total panes.
- **Bridge, Switch, Wireless, & WireGuard:** Deep management modules with granular port, VLAN, rule, and peer controls.
- **IP & Network Services:** Addresses, DHCP Server/Client, DNS, Firewall (Filter, NAT, Mangle, Raw), Pools, and Hotspot.
- **Tools & Utilities:** Integrated Torch traffic monitor, Ping, Traceroute, and Profile diagnostic utilities.

## Architecture & Design Principles

- **Modular Architecture:** Sub-views located in dedicated folders under `packages/` (`interfaces/`, `qos/`, `switch/`, `bridge/`, `system/`, `vpn/`, `wireguard/`, `wireless/`, `ip/`, `tools/`, `xray/`).
- **Comprehensive Theme System:** Instant early-detection theme script in `<head>` preventing FOUC (Flash of Unstyled Content):
  - `assets/css/mitrautama.css`: Base bright clean theme with CSS tokens.
  - `assets/css/mitrautama-dark.css`: Dark midnight navy theme (`[data-theme="dark"]`).
  - `assets/css/mitrautama-auto.css`: Dynamic solar-synced theme (Fajar, Pagi, Siang, Senja, Malam).
  - `assets/css/mitrautama-tabel.css`: WinBox-density compact grid tables with keyboard selection and double-click actions.
  - `assets/css/mitrautama-tost.css`: Non-blocking toast notifications with progress bars.
  - `assets/css/mitrautama-all-min.css`: Core application shell, fixed header/footer, modal overlay managers.
- **Modal System:** Strictly manual close (`[X]` or Cancel/OK button) preventing accidental dismissals during configuration.

## Getting Started

Serve the repository root via any static HTTP web server:
```bash
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.

## License

MIT License.
