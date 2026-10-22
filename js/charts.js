/**
 * MitraUtama Traffic & Charts Module
 * Render realtime Chart.js untuk Traffic Throughput (Rx / Tx), CPU Load, Memory, dan Latency.
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
        this.init();
    }

    init() {
        this.initTrafficChart();
        this.initCpuChart();
        this.startSimulatedRealtimeStream();
    }

    initTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        // Inisialisasi awal 15 titik data
        const now = new Date();
        for (let i = 14; i >= 0; i--) {
            const t = new Date(now.getTime() - i * 2000);
            this.timeLabels.push(t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            this.rxData.push(Math.floor(12 + Math.random() * 8)); // Mbps
            this.txData.push(Math.floor(6 + Math.random() * 5));  // Mbps
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
                        pointRadius: 2,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Upload (Tx)',
                        data: this.txData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 2,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            callback: (val) => val + ' Mbps',
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 11, weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} Mbps`
                        }
                    }
                }
            }
        });
    }

    initCpuChart() {
        const ctx = document.getElementById('cpuChart');
        if (!ctx) return;

        for (let i = 14; i >= 0; i--) {
            this.cpuData.push(Math.floor(2 + Math.random() * 6)); // CPU % RB3011 Dual-Core
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
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { font: { size: 9 }, stepSize: 25 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    startSimulatedRealtimeStream() {
        setInterval(() => {
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
}

export const chartController = new ChartController();
