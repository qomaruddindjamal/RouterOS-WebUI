/**
 * MitraUtama Modal Manager Module
 * Rules:
 * 1. Modal TIDAK BOLEH auto-close (tidak tertutup saat klik backdrop / overlay di luar modal).
 * 2. Modal TIDAK BOLEH auto-close dengan timer atau keyboard Escape (kecuali tombol manual ditekan).
 * 3. Modal HANYA BISA ditutup secara manual melalui tombol close [X], tombol 'Tutup' / 'Batal'.
 * 4. Mendukung atribut awalan mitrautama-:
 *    - data-mitrautama-modal-open="modalId"
 *    - data-mitrautama-modal-close="modalId"
 *    - (backward compatible dengan data-modal-open / data-modal-close)
 */

export class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // Cegah klik backdrop overlay menutup modal secara otomatis
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.preventDefault();
                e.stopPropagation();

                // Beri efek shake halus untuk mengindikasikan modal harus ditutup manual
                const modalBox = e.target.querySelector('.modal-box');
                if (modalBox) {
                    modalBox.classList.add('modal-shake');
                    setTimeout(() => modalBox.classList.remove('modal-shake'), 400);
                }
            }
        });

        // Event listener delegasi untuk tombol penutup manual
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('[data-mitrautama-modal-close], [data-modal-close]');
            if (closeBtn) {
                const modalId = closeBtn.getAttribute('data-mitrautama-modal-close') ||
                                closeBtn.getAttribute('data-modal-close') ||
                                closeBtn.closest('.modal-overlay')?.id;
                if (modalId) {
                    this.close(modalId);
                }
            }
        });

        // Event listener delegasi untuk tombol pembuka modal
        document.addEventListener('click', (e) => {
            const openBtn = e.target.closest('[data-mitrautama-modal-open], [data-modal-open]');
            if (openBtn) {
                const modalId = openBtn.getAttribute('data-mitrautama-modal-open') ||
                                openBtn.getAttribute('data-modal-open');
                if (modalId) {
                    this.open(modalId);
                }
            }
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found.`);
            return;
        }

        modal.classList.add('active');
        document.body.classList.add('modal-open');
        this.activeModals.add(modalId);

        modal.dispatchEvent(new CustomEvent('modal:opened', { detail: { modalId } }));
    }

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.activeModals.delete(modalId);

        if (this.activeModals.size === 0) {
            document.body.classList.remove('modal-open');
        }

        modal.dispatchEvent(new CustomEvent('modal:closed', { detail: { modalId } }));
    }

    isOpen(modalId) {
        return this.activeModals.has(modalId);
    }
}

export const modalManager = new ModalManager();
