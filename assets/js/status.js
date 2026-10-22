/**
 * MitraUtama Network Status & Stats Formatter Module
 * Mengonversi durasi waktu RouterOS (e.g. 2d3h15m20s) menjadi format ramah pengguna,
 * format byte kecepatan / kuota (B, KB, MB, GB), dan kalkulasi progress pemakaian.
 */

export class StatusFormatter {
    /**
     * Parse format waktu RouterOS (e.g. "1w2d3h4m5s", "2h30m12s", "45s")
     */
    static parseDuration(str) {
        if (!str || str === '0s') return '0 Detik';

        let res = '';
        const weeks = str.match(/(\d+)w/);
        const days = str.match(/(\d+)d/);
        const hours = str.match(/(\d+)h/);
        const mins = str.match(/(\d+)m/);
        const secs = str.match(/(\d+)s/);

        const parts = [];
        if (weeks) parts.push(`${weeks[1]} Minggu`);
        if (days) parts.push(`${days[1]} Hari`);
        if (hours) parts.push(`${hours[1]} Jam`);
        if (mins) parts.push(`${mins[1]} Menit`);
        if (secs) parts.push(`${secs[1]} Detik`);

        return parts.length > 0 ? parts.join(' ') : str;
    }

    /**
     * Hitung persentase kuota jika ada batas total
     */
    static calculateQuotaPercent(usedBytes, totalBytes) {
        if (!totalBytes || totalBytes <= 0) return 0;
        const pct = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
        return pct;
    }

    /**
     * Format angka bytes menjadi ukuran yang mudah dibaca
     */
    static formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    /**
     * Format IP dan MAC ke tampilan rapi
     */
    static formatMac(mac) {
        return (mac || '').toUpperCase();
    }
}

// Inisialisasi otomatis jika elemen status ada di halaman
document.addEventListener('DOMContentLoaded', () => {
    const uptimeElems = document.querySelectorAll('[data-ros-duration]');
    uptimeElems.forEach(el => {
        const raw = el.textContent.trim();
        if (raw) {
            el.textContent = StatusFormatter.parseDuration(raw);
        }
    });
});
