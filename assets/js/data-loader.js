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

        // 1. Bridges Paling Atas (1. WAN & 2. LAN)
        const bridgeGroups = [
            {
                id: 'iface-group-wan',
                title: '1. WAN',
                color: '#0284c7',
                members: ['ETH7', 'ETH8', 'ETH9'],
                type: 'Bridge'
            },
            {
                id: 'iface-group-bridge1',
                title: '2. LAN',
                parentName: '2. LAN',
                color: '#16a34a',
                members: ['ETH4'],
                type: 'Bridge'
            }
        ];

        // 2. Interface Port Induk VLAN (ETH2 induk VLAN10 & 20, ETH3 induk VLAN30 & 40)
        const vlanParentGroups = [
            {
                id: 'iface-group-eth2',
                parentName: 'ETH2',
                color: '#6366f1',
                members: ['VLAN10-MGMT', 'VLAN20-OFFICE']
            },
            {
                id: 'iface-group-eth3',
                parentName: 'ETH3',
                color: '#eab308',
                members: ['VLAN30-GUEST', 'VLAN40-HOTSPOT']
            }
        ];

        // 3. Standalone Interfaces Lainnya (setelah ETH1, ETH2, ETH3)
        const standaloneNames = ['ETH5', 'ETH6', 'ETH10', 'SFP-PLUS1', 'SFP-PLUS2', 'WLAN1', 'PPP0', 'WG-BACKBONE', 'SSTP-VPN', 'LO'];

        // 4. Kelompok Tunnels / Overlay (Paling Bawah)
        const otherGroups = [
            {
                id: 'iface-group-tunnels',
                title: '3. OVERLAY & TUNNELS',
                color: '#8b5cf6',
                members: ['WLAN2', 'EOIP-VPS', 'IPIP-VPS', 'GRE-VPS', 'VXLAN100', 'GRE0', 'GRETAP0', 'ERSPAN0'],
                type: 'List / OVERLAY'
            }
        ];

        // Daftar port anggota bridge untuk flag cheklis 2 (hijau + biru)
        const bridgePortNames = new Set(['ETH4', 'ETH7', 'ETH8', 'ETH9']);

        // Buat map pencarian interface berdasarkan name
        const ifaceMap = {};
        this.interfacesData.interfaces.forEach((item, idx) => {
            ifaceMap[item.name] = { item, idx };
        });

        let totalRendered = 0;
        let htmlParts = [];

        // Helper untuk render row child interface
        const renderChildRow = (item, idx, parentId, childDisplay) => {
            const isRunning = item.status === 'running';
            const isBridgeMember = bridgePortNames.has(item.name);

            let iconSvg;
            if (isBridgeMember) {
                // Cheklis 2 WhatsApp Style: Hijau (Running) + Biru (Bridge Member / Slave)
                iconSvg = `<svg width="17" height="13" viewBox="0 0 22 16" fill="none" style="vertical-align: middle; display: inline-block;" title="Running, Bridge Port"><polyline points="1.5 9 5.5 13 13.5 5" stroke="#16a34a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 9 11 13 19 5" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (isRunning) {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            } else {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            }

            const txRateClass = item.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
            const rxRateClass = item.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
            const isSelected = this.selectedIndex === idx ? 'table-primary selected' : '';

            const safeName = this.escapeHtml(item.name);
            const safeSubname = this.escapeHtml(item.subname);
            const safeType = this.escapeHtml(item.type);

            return `
            <tr class="iface-tree-row iface-child-row ${isSelected}" data-iface-parent="${parentId}" data-mitrautama-row-index="${idx}" style="${childDisplay} cursor: pointer;">
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
            </tr>`;
        };

        // Helper untuk render standalone interface row
        const renderStandaloneRow = (name) => {
            const entry = ifaceMap[name];
            if (!entry) return;
            const { item, idx } = entry;
            const matches = !term ||
                            item.name.toLowerCase().includes(term) ||
                            item.subname.toLowerCase().includes(term) ||
                            item.type.toLowerCase().includes(term);
            if (!matches) return;

            totalRendered++;
            const isRunning = item.status === 'running';
            const isBridgeMember = bridgePortNames.has(item.name);

            let iconSvg;
            if (isBridgeMember) {
                iconSvg = `<svg width="17" height="13" viewBox="0 0 22 16" fill="none" style="vertical-align: middle; display: inline-block;" title="Running, Bridge Port"><polyline points="1.5 9 5.5 13 13.5 5" stroke="#16a34a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 9 11 13 19 5" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (isRunning) {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            } else {
                iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            }

            const txRateClass = item.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
            const rxRateClass = item.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
            const isSelected = this.selectedIndex === idx ? 'table-primary selected' : '';

            const safeName = this.escapeHtml(item.name);
            const safeSubname = this.escapeHtml(item.subname);
            const safeType = this.escapeHtml(item.type);

            htmlParts.push(`
            <tr class="iface-tree-row iface-standalone-row ${isSelected}" data-mitrautama-row-index="${idx}" style="cursor: pointer;">
                <td class="text-center" style="width: 28px;">${iconSvg}</td>
                <td>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" class="me-1" style="vertical-align: middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
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
        };

        // =========================================================================
        // A. Render Bridges Paling Atas (1. WAN & 2. LAN)
        // =========================================================================
        bridgeGroups.forEach(bGrp => {
            const bEntry = bGrp.parentName ? ifaceMap[bGrp.parentName] : null;
            const bIdx = bEntry ? bEntry.idx : -1;
            const bItem = bEntry ? bEntry.item : {
                name: bGrp.title,
                subname: bGrp.title.toLowerCase(),
                type: 'Bridge',
                status: 'running',
                actualMtu: 1500,
                l2Mtu: 1500,
                tx: '15.2 KB/s',
                rx: '9.3 KB/s',
                txPkt: 21,
                rxPkt: 16,
                fpTx: '15.2 KB/s',
                fpRx: '9.3 KB/s',
                fpTxPkt: 21,
                fpRxPkt: 16
            };

            const matchingMembers = [];
            bGrp.members.forEach(mName => {
                const entry = ifaceMap[mName];
                if (!entry) return;
                const it = entry.item;
                const matches = !term ||
                                it.name.toLowerCase().includes(term) ||
                                it.subname.toLowerCase().includes(term) ||
                                it.type.toLowerCase().includes(term) ||
                                bGrp.title.toLowerCase().includes(term);
                if (matches) matchingMembers.push(entry);
            });

            const parentMatches = !term ||
                                  bGrp.title.toLowerCase().includes(term) ||
                                  bItem.name.toLowerCase().includes(term) ||
                                  bItem.subname.toLowerCase().includes(term);

            if (!term || parentMatches || matchingMembers.length > 0) {
                totalRendered += (bEntry ? 1 : 0) + matchingMembers.length;
                const isClosed = !term;
                const chevronTransform = isClosed ? 'rotate(0deg)' : 'rotate(90deg)';
                const childDisplay = isClosed ? 'display: none;' : '';
                const memberCount = matchingMembers.length;

                const isRunning = bItem.status === 'running';
                const iconSvg = isRunning 
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

                const txRateClass = bItem.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
                const rxRateClass = bItem.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
                const isSelected = (bIdx !== -1 && this.selectedIndex === bIdx) ? 'table-primary selected' : '';

                const safeName = this.escapeHtml(bGrp.title);
                const safeSubname = this.escapeHtml(bItem.subname);
                const safeType = this.escapeHtml(bGrp.type);

                const dataIdxAttr = bIdx !== -1 ? `data-mitrautama-row-index="${bIdx}"` : '';

                htmlParts.push(`
                <tr class="iface-tree-row iface-root-row ${isSelected}" data-iface-node="${bGrp.id}" ${dataIdxAttr} style="cursor: pointer; background: var(--mu-surface-muted, #f8fafc);">
                    <td class="text-center" style="width: 28px;">${iconSvg}</td>
                    <td>
                        <span class="btn-iface-toggle text-muted fw-bold me-1 user-select-none" data-iface-node="${bGrp.id}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                            <svg class="iface-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s; transform: ${chevronTransform};"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${bGrp.color}" stroke-width="2.5" stroke-linecap="round" class="me-1" style="vertical-align: middle;"><rect x="2" y="7" width="5" height="10" rx="1"></rect><rect x="17" y="7" width="5" height="10" rx="1"></rect><path d="M7 10h10M7 14h10"></path></svg>
                        <strong style="color: ${bGrp.color};">${safeName}</strong>
                        <span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>
                        <span class="badge rounded-pill ms-1" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 0.7rem; font-weight: 700; padding: 0 5px; background-color: ${bGrp.color}; color: #ffffff;">${memberCount}</span>
                    </td>
                    <td><span class="mitrane-badge-type">${safeType}</span></td>
                    <td>${bItem.actualMtu}</td>
                    <td>${bItem.l2Mtu}</td>
                    <td class="${txRateClass}">${bItem.tx}</td>
                    <td class="${rxRateClass}">${bItem.rx}</td>
                    <td>${bItem.txPkt}</td>
                    <td>${bItem.rxPkt}</td>
                    <td>${bItem.fpTx}</td>
                    <td>${bItem.fpRx}</td>
                    <td>${bItem.fpTxPkt}</td>
                    <td>${bItem.fpRxPkt}</td>
                </tr>`);

                matchingMembers.forEach(({ item, idx }) => {
                    htmlParts.push(renderChildRow(item, idx, bGrp.id, childDisplay));
                });
            }
        });

        // =========================================================================
        // B. Render ETH1, diikuti ETH2 (induk VLAN10,20) dan ETH3 (induk VLAN30,40)
        // =========================================================================
        // 1. ETH1 tepat di atas ETH2 & ETH3
        renderStandaloneRow('ETH1');

        // 2. ETH2 & ETH3 di bawah ETH1
        vlanParentGroups.forEach(vGrp => {
            const pEntry = ifaceMap[vGrp.parentName];
            if (!pEntry) return;
            const { item: pItem, idx: pIdx } = pEntry;

            const matchingVlans = [];
            vGrp.members.forEach(mName => {
                const entry = ifaceMap[mName];
                if (!entry) return;
                const it = entry.item;
                const matches = !term ||
                                it.name.toLowerCase().includes(term) ||
                                it.subname.toLowerCase().includes(term) ||
                                it.type.toLowerCase().includes(term) ||
                                pItem.name.toLowerCase().includes(term);
                if (matches) matchingVlans.push(entry);
            });

            const parentMatches = !term ||
                                  pItem.name.toLowerCase().includes(term) ||
                                  pItem.subname.toLowerCase().includes(term);

            if (!term || parentMatches || matchingVlans.length > 0) {
                totalRendered += 1 + matchingVlans.length;
                const isClosed = !term;
                const chevronTransform = isClosed ? 'rotate(0deg)' : 'rotate(90deg)';
                const childDisplay = isClosed ? 'display: none;' : '';
                const memberCount = matchingVlans.length;

                const isRunning = pItem.status === 'running';
                const iconSvg = isRunning 
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

                const txRateClass = pItem.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
                const rxRateClass = pItem.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
                const isSelected = this.selectedIndex === pIdx ? 'table-primary selected' : '';

                const safeName = this.escapeHtml(pItem.name);
                const safeSubname = this.escapeHtml(pItem.subname);
                const safeType = this.escapeHtml(pItem.type);

                htmlParts.push(`
                <tr class="iface-tree-row iface-root-row ${isSelected}" data-iface-node="${vGrp.id}" data-mitrautama-row-index="${pIdx}" style="cursor: pointer; background: var(--mu-surface-muted, #f8fafc);">
                    <td class="text-center" style="width: 28px;">${iconSvg}</td>
                    <td>
                        <span class="btn-iface-toggle text-muted fw-bold me-1 user-select-none" data-iface-node="${vGrp.id}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">
                            <svg class="iface-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s; transform: ${chevronTransform};"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" class="me-1" style="vertical-align: middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                        <strong style="color: ${vGrp.color};">${safeName}</strong>
                        <span class="text-muted" style="font-size: 0.72rem;">(${safeSubname})</span>
                        <span class="badge rounded-pill ms-1" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; font-size: 0.7rem; font-weight: 700; padding: 0 5px; background-color: ${vGrp.color}; color: #ffffff;">${memberCount}</span>
                    </td>
                    <td><span class="mitrane-badge-type">${safeType}</span></td>
                    <td>${pItem.actualMtu}</td>
                    <td>${pItem.l2Mtu}</td>
                    <td class="${txRateClass}">${pItem.tx}</td>
                    <td class="${rxRateClass}">${pItem.rx}</td>
                    <td>${pItem.txPkt}</td>
                    <td>${pItem.rxPkt}</td>
                    <td>${pItem.fpTx}</td>
                    <td>${pItem.fpRx}</td>
                    <td>${pItem.fpTxPkt}</td>
                    <td>${pItem.fpRxPkt}</td>
                </tr>`);

                matchingVlans.forEach(({ item, idx }) => {
                    htmlParts.push(renderChildRow(item, idx, vGrp.id, childDisplay));
                });
            }
        });

        // =========================================================================
        // C. Render Standalone Interfaces Lainnya (Port di luar bridge & non-parent)
        // =========================================================================
        standaloneNames.forEach(name => {
            renderStandaloneRow(name);
        });

        // =========================================================================
        // D. Render Kelompok Overlay & Tunnels (Paling Bawah)
        // =========================================================================
        otherGroups.forEach(grp => {
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

            if (term && matchingMembers.length === 0) return;

            const isClosed = !term;
            const chevronTransform = isClosed ? 'rotate(0deg)' : 'rotate(90deg)';
            const childDisplay = isClosed ? 'display: none;' : '';
            const memberCount = matchingMembers.length;
            totalRendered += memberCount;

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

            matchingMembers.forEach(({ item, idx }) => {
                htmlParts.push(renderChildRow(item, idx, grp.id, childDisplay));
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
