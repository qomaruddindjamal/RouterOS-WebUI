/**
 * MitraUtama Form Handler & Auth Helper
 * Mengatur pergantian mode Voucher / Member, formatting input huruf,
 * validasi form, dan CHAP hashing (dengan fallback md5).
 */

export class AuthFormHandler {
    constructor() {
        this.mode = localStorage.getItem('mitra_auth_mode') || 'voucher'; // 'voucher' or 'member'
        this.caseMode = 'none'; // 'none', 'uppercase', 'lowercase'
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const btnVoucher = document.getElementById('tab-voucher');
        const btnMember = document.getElementById('tab-member');
        const usernameInput = document.getElementById('username-input');
        const passwordField = document.getElementById('password-field');
        const passwordInput = document.getElementById('password-input');
        const infoMessage = document.getElementById('auth-info-text');

        if (!usernameInput) return;

        // Sync initial mode
        this.setMode(this.mode);

        if (btnVoucher) {
            btnVoucher.addEventListener('click', () => this.setMode('voucher'));
        }
        if (btnMember) {
            btnMember.addEventListener('click', () => this.setMode('member'));
        }

        // Live input sync untuk voucher (password otomatis sama dengan username)
        usernameInput.addEventListener('input', () => {
            this.handleUsernameInput(usernameInput, passwordInput);
        });

        // Toggle visibility password jika ada icon eye
        const togglePwd = document.getElementById('toggle-password');
        if (togglePwd && passwordInput) {
            togglePwd.addEventListener('click', () => {
                const isPass = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPass ? 'text' : 'password');
                togglePwd.classList.toggle('active', !isPass);
            });
        }
    }

    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('mitra_auth_mode', mode);

        const btnVoucher = document.getElementById('tab-voucher');
        const btnMember = document.getElementById('tab-member');
        const usernameInput = document.getElementById('username-input');
        const passwordField = document.getElementById('password-field');
        const passwordInput = document.getElementById('password-input');
        const infoMessage = document.getElementById('auth-info-text');
        const inputIcon = document.getElementById('user-input-icon');

        if (mode === 'voucher') {
            if (btnVoucher) btnVoucher.classList.add('active');
            if (btnMember) btnMember.classList.remove('active');
            if (passwordField) passwordField.style.display = 'none';
            if (usernameInput) {
                usernameInput.placeholder = 'Masukkan Kode Voucher';
                usernameInput.focus();
            }
            if (passwordInput && usernameInput) {
                passwordInput.value = usernameInput.value;
            }
            if (infoMessage) {
                infoMessage.innerHTML = 'Masukkan <strong>Kode Voucher</strong> yang tertera pada kartu internet Anda.';
            }
            if (inputIcon) {
                inputIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="15" x2="15.01" y2="15"></line></svg>`;
            }
        } else {
            // member mode
            if (btnMember) btnMember.classList.add('active');
            if (btnVoucher) btnVoucher.classList.remove('active');
            if (passwordField) passwordField.style.display = 'block';
            if (usernameInput) {
                usernameInput.placeholder = 'Username Member';
                usernameInput.focus();
            }
            if (infoMessage) {
                infoMessage.innerHTML = 'Gunakan <strong>Username & Password</strong> resmi akun pelanggan Anda.';
            }
            if (inputIcon) {
                inputIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            }
        }
    }

    handleUsernameInput(usernameInput, passwordInput) {
        if (this.caseMode === 'lowercase') {
            usernameInput.value = usernameInput.value.toLowerCase();
        } else if (this.caseMode === 'uppercase') {
            usernameInput.value = usernameInput.value.toUpperCase();
        }

        if (this.mode === 'voucher' && passwordInput) {
            passwordInput.value = usernameInput.value;
        }
    }
}

export const authForm = new AuthFormHandler();
