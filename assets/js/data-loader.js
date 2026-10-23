/**
 * MitraUtama JSON Data & Config Service
 * Membaca data dan konfigurasi dinamis langsung dari config.json dan interfaces/interfaces.json
 * Mendukung simulasi CRUD lokal: Create, Read, Update, Delete, Toggle Enable/Disable, dan Selection
 */

export class JsonDataService {
    constructor() {
        this.config = null;
        this.interfacesData = null;
        this.selectedIndex = -1;
        this.currentFilter = '';
        this.onSelectionChangeCallbacks = [];
    }

    onSelectionChange(cb) {
        if (typeof cb === 'function') {
            this.onSelectionChangeCallbacks.push(cb);
        }
    }

    notifySelectionChange() {
        const item = this.getSelectedInterface();
        this.onSelectionChangeCallbacks.forEach(cb => cb(item, this.selectedIndex));
    }

    async loadConfig() {
        try {
            const res = await fetch('config.json');
            if (res.ok) {
                this.config = await res.json();
                return this.config;
            }
        } catch (e) {
            console.warn('[JsonDataService] Fetching config.json failed, falling back to default:', e);
        }
        return null;
    }

    async loadInterfaces() {
        try {
            const res = await fetch('packages/interfaces/interfaces.json');
            if (res.ok) {
                this.interfacesData = await res.json();
                this.selectedIndex = -1;
                this.notifySelectionChange();
                return this.interfacesData;
            }
        } catch (e) {
            console.warn('[JsonDataService] Fetching interfaces.json failed:', e);
        }
        return null;
    }

    renderInterfacesTable(containerId = 'mitrane-interfaces-table', filterText = '') {
        const tableBody = document.querySelector(`#${containerId} tbody`);
        if (!tableBody || !this.interfacesData) return;

        this.currentFilter = filterText;
        const term = (filterText || '').toLowerCase();

        // 4 Kelompok Interface List Standar
        const groupDefs = [
            {
                id: 'iface-group-wan',
                title: '1. WAN (Internet Uplinks)',
                color: '#0284c7',
                members: ['ETH1', 'PPP0', 'WG-BACKBONE', 'SSTP-VPN'],
                type: 'List / WAN'
            },
            {
                id: 'iface-group-lan',
                title: '2. LAN (Local Distribution)',
                color: '#16a34a',
                members: ['ETH2', 'ETH3', 'ETH4', 'ETH5', 'ETH6', 'ETH7', 'ETH8', 'ETH9', 'ETH10', 'SFP-PLUS1', 'SFP-PLUS2', 'BRIDGE1', 'WLAN1'],
                type: 'List / LAN'
            },
            {
                id: 'iface-group-mgmt',
                title: '3. MANAGEMENT (Admin & Core)',
                color: '#6366f1',
                members: ['VLAN10-MGMT', 'VLAN20-OFFICE', 'LO'],
                type: 'List / MGMT'
            },
            {
                id: 'iface-group-guest',
                title: '4. GUEST & TUNNELS (Overlay / VPN)',
                color: '#eab308',
                members: ['VLAN30-GUEST', 'VLAN40-HOTSPOT', 'WLAN2', 'EOIP-VPS', 'IPIP-VPS', 'GRE-VPS', 'VXLAN100', 'GRE0', 'GRETAP0', 'ERSPAN0'],
                type: 'List / OVERLAY'
            }
        ];

        // Buat map pencarian interface berdasarkan name
        const ifaceMap = {};
        this.interfacesData.interfaces.forEach((item, idx) => {
            ifaceMap[item.name] = { item, idx };
        });

        let totalRendered = 0;
        let htmlParts = [];

        groupDefs.forEach(grp => {
            // Filter anggota grup sesuai filterText
            const matchingMembers = [];
            grp.members.forEach(mName => {
                const entry = ifaceMap[mName];
                if (!entry) return;
                const it = entry.item;
                const matches = !term || 
                                it.name.toLowerCase().includes(term) || 
                                it.subname.toLowerCase().includes(term) || 
                                it.type.toLowerCase().includes(term) ||
                                grp.title.toLowerCase().includes(term);
                if (matches) {
                    matchingMembers.push(entry);
                }
            });

            // Jika sedang memfilter dan tidak ada yang cocok, lewati grup ini
            if (term && matchingMembers.length === 0) return;

            // Jika sedang ada pencarian filter, buka accordion secara otomatis agar terlihat; jika kosong, DEFAULT CLOSE
            const isClosed = !term;
            const chevronTransform = isClosed ? 'rotate(0deg)' : 'rotate(90deg)';
            const childDisplay = isClosed ? 'display: none;' : '';

            // Hitung ringkasan TX/RX grup
            const memberCount = matchingMembers.length;
            totalRendered += memberCount;

            // Render Baris Parent Grup (Default Closed dengan Chevron >)
            htmlParts.push(`
            <tr class="iface-tree-row iface-root-row" data-iface-node="${grp.id}" style="cursor: pointer; background: var(--mu-surface-muted, #f8fafc);">
                <td class="text-center" style="width: 28px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </td>
                <td>
                    <span class="btn-iface-toggle text-muted fw-bold me-1 user-select-none" data-iface-node="${grp.id}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                        <svg class="iface-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s; transform: ${chevronTransform};"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${grp.color}" stroke-width="2.5" stroke-linecap="round" class="me-1" style="vertical-align: middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                    <strong style="color: ${grp.color};">${grp.title}</strong>
                    <span class="badge rounded-pill ms-1" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 0.7rem; font-weight: 700; padding: 0 5px; background-color: ${grp.color}; color: #ffffff;">${memberCount}</span>
                </td>
                <td><span class="mitrane-badge-type">${grp.type}</span></td>
                <td>1500</td>
                <td>1500</td>
                <td class="mitrane-rate-active">15.2 KB/s</td>
                <td class="text-primary fw-semibold">9.3 KB/s</td>
                <td>21</td>
                <td>16</td>
                <td>15.2 KB/s</td>
                <td>9.3 KB/s</td>
                <td>21</td>
                <td>16</td>
            </tr>`);

            // Render Child Interface Rows
            matchingMembers.forEach(({ item, idx }) => {
                const isRunning = item.status === 'running';
                const iconSvg = isRunning 
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

                const txRateClass = item.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
                const rxRateClass = item.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
                const isSelected = this.selectedIndex === idx ? 'table-primary selected' : '';

                const safeName = this.escapeHtml(item.name);
                const safeSubname = this.escapeHtml(item.subname);
                const safeType = this.escapeHtml(item.type);

                htmlParts.push(`
                <tr class="iface-tree-row iface-child-row ${isSelected}" data-iface-parent="${grp.id}" data-mitrautama-row-index="${idx}" style="${childDisplay} cursor: pointer;">
                    <td class="text-center" style="width: 28px;">${iconSvg}</td>
                    <td>
                        <span style="display:inline-block; width: 18px;"></span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" class="me-1" style="vertical-align: middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                        <strong>${safeName}</strong>
                        <span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>
                    </td>
                    <td><span class="mitrane-badge-type">${safeType}</span></td>
                    <td>${item.actualMtu}</td>
                    <td>${item.l2Mtu}</td>
                    <td class="${txRateClass}">${item.tx}</td>
                    <td class="${rxRateClass}">${item.rx}</td>
                    <td>${item.txPkt}</td>
                    <td>${item.rxPkt}</td>
                    <td>${item.fpTx}</td>
                    <td>${item.fpRx}</td>
                    <td>${item.fpTxPkt}</td>
                    <td>${item.fpRxPkt}</td>
                </tr>`);
            });
        });

        tableBody.innerHTML = htmlParts.join('');

        const totalCounter = document.getElementById('mitrane-total-items');
        if (totalCounter) {
            totalCounter.textContent = `Total: ${totalRendered} items`;
        }
    }

    addInterface(newRecord) {
        if (!this.interfacesData) {
            this.interfacesData = { total: 0, interfaces: [] };
        }
        const record = {
            id: 'iface_' + Date.now(),
            name: newRecord.name || 'new-iface',
            subname: newRecord.subname || (newRecord.name ? newRecord.name.toLowerCase() : 'iface'),
            type: newRecord.type || 'Ethernet',
            status: 'running',
            actualMtu: Number(newRecord.actualMtu) || 1500,
            l2Mtu: 1500,
            tx: '0 B/s',
            rx: '0 B/s',
            txPkt: 0,
            rxPkt: 0,
            fpTx: '0 B/s',
            fpRx: '0 B/s',
            fpTxPkt: 0,
            fpRxPkt: 0
        };
        this.interfacesData.interfaces.unshift(record);
        this.interfacesData.total = this.interfacesData.interfaces.length;
        this.selectedIndex = 0;
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return record;
    }

    updateSelectedInterface(updatedFields) {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const item = this.interfacesData.interfaces[this.selectedIndex];
        if (updatedFields.name) {
            item.name = updatedFields.name;
            item.subname = updatedFields.subname || updatedFields.name.toLowerCase();
        }
        if (updatedFields.type) item.type = updatedFields.type;
        if (updatedFields.actualMtu) item.actualMtu = Number(updatedFields.actualMtu);

        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return item;
    }

    removeSelectedInterface() {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const removed = this.interfacesData.interfaces.splice(this.selectedIndex, 1)[0];
        this.interfacesData.total = this.interfacesData.interfaces.length;
        this.selectedIndex = -1;
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return removed;
    }

    toggleSelectedStatus(forceStatus = null) {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        const item = this.interfacesData.interfaces[this.selectedIndex];
        if (forceStatus) {
            item.status = forceStatus;
        } else {
            item.status = (item.status === 'running') ? 'inactive' : 'running';
        }
        this.renderInterfacesTable('mitrane-interfaces-table', this.currentFilter);
        this.notifySelectionChange();
        return item;
    }

    getSelectedInterface() {
        if (!this.interfacesData || this.selectedIndex < 0 || this.selectedIndex >= this.interfacesData.interfaces.length) {
            return null;
        }
        return this.interfacesData.interfaces[this.selectedIndex];
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

export const jsonDataService = new JsonDataService();
if (typeof window !== 'undefined') {
    window.jsonDataService = jsonDataService;
}
