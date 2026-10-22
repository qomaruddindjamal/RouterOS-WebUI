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
        const filtered = this.interfacesData.interfaces.filter(item => {
            if (!filterText) return true;
            const term = filterText.toLowerCase();
            return item.name.toLowerCase().includes(term) || 
                   item.subname.toLowerCase().includes(term) ||
                   item.type.toLowerCase().includes(term);
        });

        tableBody.innerHTML = filtered.map((item, idx) => {
            const isRunning = item.status === 'running';
            const iconSvg = isRunning 
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

            const txRateClass = item.tx !== '0 B/s' ? 'mitrane-rate-active' : 'text-muted';
            const rxRateClass = item.rx !== '0 B/s' ? 'text-primary fw-semibold' : 'text-muted';
            const isSelected = this.selectedIndex === idx ? 'table-primary selected' : '';

            // Sanitasi teks dengan pengamanan textContent / escaping
            const safeName = this.escapeHtml(item.name);
            const safeSubname = this.escapeHtml(item.subname);
            const safeType = this.escapeHtml(item.type);

            return `
            <tr data-mitrautama-row-index="${idx}" class="${isSelected}" style="cursor: pointer;">
                <td class="text-center" style="width: 28px;">${iconSvg}</td>
                <td>
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
        }).join('');

        // Row Selection Listener
        tableBody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', (e) => {
                const idx = parseInt(tr.getAttribute('data-mitrautama-row-index'), 10);
                this.selectedIndex = (this.selectedIndex === idx) ? -1 : idx;
                this.renderInterfacesTable(containerId, this.currentFilter);
                this.notifySelectionChange();
            });
        });

        const totalCounter = document.getElementById('mitrane-total-items');
        if (totalCounter) {
            totalCounter.textContent = `Total: ${filtered.length} items`;
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
