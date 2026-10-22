/**
 * MitraUtama Traffic & Charts Module
 * Render realtime Chart.js untuk Traffic Throughput (Rx / Tx), CPU Load, Memory, dan Latency.
 * Dilengkapi lifecycle management: penghancuran timer lama untuk mencegah timer leak.
 */

export class ChartController {
    constructor() {
        this.trafficChart = null;
        this.cpuChart = null;
        this.maxDataPoints = 25;
        this.timeLabels = [];
        this.rxData = [];
        this.txData = [];
        this.cpuData = [];
        this.streamTimer = null;
        this.init();
    }

    init() {
        this.initTrafficChart();
        this.initCpuChart();
        this.startSimulatedRealtimeStream();
    }

    destroyCharts() {
        if (this.trafficChart) {
            this.trafficChart.destroy();
            this.trafficChart = null;
        }
        if (this.cpuChart) {
            this.cpuChart.destroy();
            this.cpuChart = null;
        }
    }

    initTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        if (this.trafficChart) {
            this.trafficChart.destroy();
            this.trafficChart = null;
        }

        // Inisialisasi awal 15 titik data jika belum ada
        if (this.timeLabels.length === 0) {
            const now = new Date();
            for (let i = 14; i >= 0; i--) {
                const t = new Date(now.getTime() - i * 2000);
                this.timeLabels.push(t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                this.rxData.push(Math.floor(12 + Math.random() * 8)); // Mbps
                this.txData.push(Math.floor(6 + Math.random() * 5));  // Mbps
            }
        }

        this.trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [
                    {
                        label: 'Download (Rx)',
                        data: this.rxData,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 0
                    },
                    {
                        label: 'Upload (Tx)',
                        data: this.txData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 11, family: 'Segoe UI' } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: { maxTicksLimit: 6, font: { size: 10 } }
                    },
                    y: {
                        display: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { size: 10 },
                            callback: (val) => val + ' Mbps'
                        }
                    }
                }
            }
        });
    }

    initCpuChart() {
        const ctx = document.getElementById('cpuChart');
        if (!ctx) return;

        if (this.cpuChart) {
            this.cpuChart.destroy();
            this.cpuChart = null;
        }

        if (this.cpuData.length === 0) {
            for (let i = 14; i >= 0; i--) {
                this.cpuData.push(Math.floor(2 + Math.random() * 5));
            }
        }

        this.cpuChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [{
                    label: 'CPU Load (%)',
                    data: this.cpuData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    fill: true,
                    tension: 0.2,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { font: { size: 10 }, callback: (v) => v + '%' }
                    }
                }
            }
        });
    }

    startSimulatedRealtimeStream() {
        // Hentikan timer sebelumnya jika sudah aktif (mencegah duplikasi timer)
        if (this.streamTimer) {
            clearInterval(this.streamTimer);
            this.streamTimer = null;
        }

        this.streamTimer = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            // Random traffic pulse
            const newRx = Math.floor(10 + Math.random() * 18);
            const newTx = Math.floor(4 + Math.random() * 9);
            const newCpu = Math.floor(2 + Math.random() * 7);

            // Update live numbers di KPI
            const liveWanRx = document.getElementById('kpi-wan-rx');
            const liveWanTx = document.getElementById('kpi-wan-tx');
            const liveCpuVal = document.getElementById('kpi-cpu-val');
            const liveCpuBar = document.getElementById('kpi-cpu-bar');

            if (liveWanRx) liveWanRx.textContent = newRx + ' Mbps';
            if (liveWanTx) liveWanTx.textContent = newTx + ' Mbps';
            if (liveCpuVal) liveCpuVal.textContent = newCpu + '%';
            if (liveCpuBar) liveCpuBar.style.width = newCpu + '%';

            if (this.trafficChart) {
                this.timeLabels.push(timeStr);
                this.rxData.push(newRx);
                this.txData.push(newTx);

                if (this.timeLabels.length > this.maxDataPoints) {
                    this.timeLabels.shift();
                    this.rxData.shift();
                    this.txData.shift();
                }

                this.trafficChart.update('quiet');
            }

            if (this.cpuChart) {
                this.cpuData.push(newCpu);
                if (this.cpuData.length > this.maxDataPoints) {
                    this.cpuData.shift();
                }
                this.cpuChart.update('quiet');
            }
        }, 2000);
    }

    stopStream() {
        if (this.streamTimer) {
            clearInterval(this.streamTimer);
            this.streamTimer = null;
        }
    }
}

export const chartController = new ChartController();
if (typeof window !== 'undefined') {
    window.chartController = chartController;
}
