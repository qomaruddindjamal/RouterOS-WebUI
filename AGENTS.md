# AGENTS.md — Development Guidelines for C:\RouterOS

## 1. Absolute Isolation Rules
1. All read and write operations MUST be confined exclusively to `C:\RouterOS`.
2. NEVER modify, read from, write to, or run commands affecting `C:\mitranet`, `C:\asl`, or any other workspace directory.
3. Treat external repositories as strictly read-only and off-limits.
4. No destructive git commands without explicit authorization (`git reset --hard`, `git clean -fdx`).

## 2. Naming & Coding Standards
1. Use standard naming conventions: prefix custom UI classes and attributes with `mitrautama-` (e.g., `data-mitrautama-view`, `data-mitrautama-modal-open`, `.mitrautama-table`).
2. CSS files: Maintain `mitrautama.css`, `mitrautama-dark.css`, `mitrautama-auto.css`, `mitrautama-tabel.css`, `mitrautama-tost.css`, and `mitrautama-all-min.css`. DO NOT introduce `mitrautama-winbox.css`.
3. Modular JavaScript: Keep logic organized in separate ES6 modules inside `js/`. No monolithic JS files.
4. Modular HTML: Keep sub-views modular under their dedicated folders (`interfaces/`, `switch/`, `bridge/`, `system/`, `queues/`, `ppp/`, `wireguard/`, `wireless/`, `ip/`, `includes/`).
5. Iconography: Use SVG icons directly; do not use emojis in tables or primary UI buttons.
6. Modal behavior: Manual close only (`[X]` or Close button). Do not auto-close on backdrop click or outside click.
