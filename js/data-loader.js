/**
 * MitraUtama JSON Data & Config Service
 * Membaca data dan konfigurasi dinamis langsung dari config.json dan interfaces/interfaces.json
 */

export class JsonDataService {
    constructor() {
        this.config = null;
        this.interfacesData = null;
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
            const res = await fetch('interfaces/interfaces.json');
            if (res.ok) {
                this.interfacesData = await res.json();
                return this.interfacesData;
            }
        } catch (e) {
            console.warn('[JsonDataService] Fetching interfaces.json failed:', e);
        }
        return null;
    }

    renderInterfacesTable(containerId, filterText = '') {
        const tableBody = document.querySelector(`#${containerId} tbody`);
        if (!tableBody || !this.interfacesData) return;

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

            return `
            <tr data-mitrautama-row-index="${idx}">
                <td class="text-center" style="width: 28px;">${iconSvg}</td>
                <td>
                    <strong>${item.name}</strong> 
                    <span class="text-muted" style="font-size: 0.72rem;">(${item.subname})</span>
                </td>
                <td><span class="mitrane-badge-type">${item.type}</span></td>
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

        const totalCounter = document.getElementById('mitrane-total-items');
        if (totalCounter) {
            totalCounter.textContent = `Total: ${filtered.length} items`;
        }
    }
}

export const jsonDataService = new JsonDataService();
