/**
 * MitraUtama Toast Modular Notification System (mitrautama- namespace + SVG Icons)
 */

export class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (!document.querySelector('.mitrautama-toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'mitrautama-toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.mitrautama-toast-container');
        }
    }

    show({ title = 'Notifikasi', message = '', type = 'info', duration = 4000 }) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `mitrautama-toast mitrautama-toast-${type}`;

        const svgIcons = {
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
            info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
        };

        toast.innerHTML = `
            <div class="mitrautama-toast-icon">${svgIcons[type] || svgIcons.info}</div>
            <div class="mitrautama-toast-content">
                <div class="mitrautama-toast-title">${title}</div>
                <div class="mitrautama-toast-message">${message}</div>
            </div>
            <button type="button" class="mitrautama-toast-close" title="Tutup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="mitrautama-toast-progress" style="transition: width ${duration}ms linear; width: 100%;"></div>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            const progress = toast.querySelector('.mitrautama-toast-progress');
            if (progress) progress.style.width = '0%';
        }, 50);

        const closeBtn = toast.querySelector('.mitrautama-toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('hiding')) return;
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

export const toastManager = new ToastManager();
