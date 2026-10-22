# RouterOS WebUI Automated Test Suite — Expanded Audit Edition (AUD-UI-07)

import os
import json
import re
import unittest

WORKSPACE = r"C:\RouterOS"

class TestRouterOSWorkspace(unittest.TestCase):
    def test_workspace_isolation(self):
        """Pastikan seluruh path yang diuji berada di C:\\RouterOS"""
        self.assertTrue(os.path.exists(WORKSPACE))
        self.assertEqual(os.path.abspath(WORKSPACE), r"C:\RouterOS")

    def test_required_html_modules(self):
        """Pastikan semua modul HTML yang dijanjikan tersedia"""
        modules = [
            "index.html",
            "includes/header.html",
            "includes/sidebar.html",
            "includes/footer.html",
            "packages/interfaces/interfaces.html",
            "packages/switch/switch.html",
            "packages/bridge/bridge.html",
            "packages/system/system.html",
            "packages/qos/qos.html",
            "packages/vpn/vpn.html",
            "packages/ip/ip.html",
            "packages/wireguard/wireguard.html",
            "packages/wireless/wireless.html"
        ]
        for mod in modules:
            path = os.path.join(WORKSPACE, mod)
            self.assertTrue(os.path.exists(path), f"Modul hilang: {mod}")

    def test_required_css_files(self):
        """Pastikan seluruh stylesheet modular mitrautama-* ada dan tidak ada mitrautama-winbox"""
        required_css = [
            "assets/css/mitrautama.css",
            "assets/css/mitrautama-dark.css",
            "assets/css/mitrautama-auto.css",
            "assets/css/mitrautama-tabel.css",
            "assets/css/mitrautama-tost.css",
            "assets/css/mitrautama-all-min.css"
        ]
        for css in required_css:
            path = os.path.join(WORKSPACE, css)
            self.assertTrue(os.path.exists(path), f"CSS hilang: {css}")
        
        forbidden = os.path.join(WORKSPACE, "assets/css/mitrautama-winbox.css")
        self.assertFalse(os.path.exists(forbidden), "mitrautama-winbox.css tidak boleh ada!")

    def test_required_js_modules(self):
        """Pastikan modul-modul JS esensial ada dan terpisah (tidak monolitik)"""
        js_files = [
            "assets/js/navigation.js",
            "assets/js/modal.js",
            "assets/js/toast.js",
            "assets/js/charts.js",
            "assets/js/theme.js",
            "assets/js/theme-ui.js",
            "assets/js/module-loader.js",
            "assets/js/data-loader.js"
        ]
        for js in js_files:
            path = os.path.join(WORKSPACE, js)
            self.assertTrue(os.path.exists(path), f"JS hilang: {js}")

    def test_json_data_validity(self):
        """Validasi integritas sintaks config.json dan interfaces.json"""
        json_targets = [
            "config.json",
            "packages/interfaces/interfaces.json"
        ]
        for jt in json_targets:
            path = os.path.join(WORKSPACE, jt)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertIsInstance(data, (dict, list), f"Data bukan JSON valid: {jt}")

    def test_naming_conventions_in_index(self):
        """Pastikan kelas dan atribut mitrautama- konsisten pada index.html"""
        with open(os.path.join(WORKSPACE, "index.html"), "r", encoding="utf-8") as f:
            html = f.read()
        self.assertIn("mitrautama-app-wrapper", html)
        self.assertIn("mitrautama-fixed-header", html)
        self.assertIn("mitrautama-body-container", html)
        self.assertIn("mitrautama-sidebar", html)
        self.assertIn("mitrautama-fixed-footer", html)

    def test_svg_iconography(self):
        """Pastikan modul interfaces.html tidak menggunakan emoji dalam tabel atau tombol aksi"""
        path = os.path.join(WORKSPACE, "packages/interfaces/interfaces.html")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        emojis = ["🔌", "📶", "🌉", "🔒", "⚙️", "✅", "❌", "🗑️", "➕"]
        for em in emojis:
            self.assertNotIn(em, content, f"Emoji ditemukan dalam interfaces.html: {em}")

    def test_modal_manual_close_rule(self):
        """Verifikasi bahwa modal dialog hanya memiliki penutupan manual (Strict Manual Close)"""
        with open(os.path.join(WORKSPACE, "assets/js/modal.js"), "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("data-mitrautama-modal-close", js)
        self.assertNotIn("backdropClose = true", js)

    def test_module_loader_wiring(self):
        """Verifikasi bahwa module-loader.js memuat daftar modul yang sesuai"""
        with open(os.path.join(WORKSPACE, "assets/js/module-loader.js"), "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("includes/header.html", js)
        self.assertIn("includes/sidebar.html", js)
        self.assertIn("includes/footer.html", js)
        self.assertIn("packages/interfaces/interfaces.html", js)
        self.assertIn("packages/switch/switch.html", js)
        self.assertIn("packages/bridge/bridge.html", js)

    def test_theme_system_integrity(self):
        """Verifikasi fungsionalitas tema Auto, Light, dan Dark"""
        with open(os.path.join(WORKSPACE, "assets/js/theme.js"), "r", encoding="utf-8") as f:
            theme_js = f.read()
        self.assertIn("class ThemeManager", theme_js)
        self.assertIn("setTheme", theme_js)
        self.assertIn("data-theme", theme_js)

    def test_chart_module_cleanup(self):
        """Verifikasi bahwa charts.js memiliki fungsi pembersihan interval dan instance saat beralih modul"""
        with open(os.path.join(WORKSPACE, "assets/js/charts.js"), "r", encoding="utf-8") as f:
            chart_js = f.read()
        self.assertIn("clearInterval", chart_js)
        self.assertIn("destroy()", chart_js)

    def test_navigation_dropright_support(self):
        """Verifikasi event binding drop-right submenu di navigation.js"""
        with open(os.path.join(WORKSPACE, "assets/js/navigation.js"), "r", encoding="utf-8") as f:
            nav_js = f.read()
        self.assertIn("bindDropRightSubMenus", nav_js)
        self.assertIn("mitrautama-submenu-toggle", nav_js)

    def test_data_loader_xss_protection(self):
        """Verifikasi bahwa fungsi render di data-loader.js menerapkan escapeHtml"""
        loader_path = os.path.join(WORKSPACE, "assets/js/data-loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("escapeHtml", js)

    def test_all_subviews_mitrane_window_class(self):
        """Verifikasi keseragaman arsitektur .mitrane-window pada modul utama"""
        for mod in ["packages/interfaces/interfaces.html", "packages/qos/qos.html", "packages/ip/ip.html"]:
            path = os.path.join(WORKSPACE, mod)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("mitrane-window", content, f"{mod} missing .mitrane-window")

    def test_dashboard_kpi_cards_and_charts_structure(self):
        """Verifikasi struktur kartu 4 KPI dan 2 grafik responsif pada dashboard index.html"""
        idx_path = os.path.join(WORKSPACE, "index.html")
        with open(idx_path, "r", encoding="utf-8") as f:
            html = f.read()
        self.assertIn('class="mitrautama-kpi-grid"', html)
        self.assertIn('id="kpi-wan-rx"', html)
        self.assertIn('id="kpi-cpu-val"', html)
        self.assertIn('id="trafficChart"', html)
        self.assertIn('id="cpuChart"', html)

    def test_dashboard_kpi_css_rules_present(self):
        """Verifikasi kehadiran CSS grid dan kartu KPI di assets/css/mitrautama-all-min.css"""
        css_path = os.path.join(WORKSPACE, "assets", "css", "mitrautama-all-min.css")
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn('.mitrautama-kpi-grid', css)
        self.assertIn('.mitrautama-kpi-card', css)
        self.assertIn('.mitrautama-chart-card', css)

    def test_dashboard_chart_lifecycle_in_navigation(self):
        """Verifikasi integrasi chart lifecycle saat berpindah view di navigation.js"""
        nav_path = os.path.join(WORKSPACE, "assets", "js", "navigation.js")
        with open(nav_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("window.chartController.initTrafficChart()", js)
        self.assertIn("window.chartController.stopStream()", js)

    def test_aud_ui_07_shell_layout_hierarchy(self):
        """AUD-UI-07: Verifikasi hirarki DOM 3-area: header di atas, sidebar di kiri, main-column (content + footer) di kanan"""
        idx_path = os.path.join(WORKSPACE, "index.html")
        with open(idx_path, "r", encoding="utf-8") as f:
            html = f.read()
        self.assertIn('class="mitrautama-main-column"', html)
        main_col_pos = html.find('class="mitrautama-main-column"')
        footer_pos = html.find('id="footer-container"')
        self.assertTrue(main_col_pos != -1 and footer_pos != -1)
        self.assertTrue(footer_pos > main_col_pos, "footer-container harus berada di dalam mitrautama-main-column")

    def test_aud_ui_07_sidebar_collapse_and_dropright(self):
        """AUD-UI-07: Verifikasi CSS sidebar width, collapsed width, dan flyout popover drop-right"""
        css_path = os.path.join(WORKSPACE, "assets", "css", "mitrautama-all-min.css")
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn('.mitrautama-main-column', css)
        self.assertIn('.mitrautama-sidebar', css)
        self.assertIn('.mitrautama-sidebar.collapsed', css)
        self.assertIn('.mitrautama-submenu-list', css)
        self.assertIn('left: 100%', css)


    def test_master_implementation_local_assets_only(self):
        """Verifikasi bahwa tidak ada CDN eksternal (http/https) di index.html"""
        idx_path = os.path.join(WORKSPACE, "index.html")
        with open(idx_path, "r", encoding="utf-8") as f:
            html = f.read()
        self.assertNotIn("https://cdn.jsdelivr.net", html)
        self.assertIn("assets/css/bootstrap.min.css", html)
        self.assertIn("assets/js/bootstrap.bundle.min.js", html)
        self.assertIn("assets/js/chart.umd.min.js", html)

    def test_master_implementation_mobile_drawer_and_responsive(self):
        """Verifikasi mobile drawer backdrop, breakpoint 768px dan 480px di CSS"""
        css_path = os.path.join(WORKSPACE, "assets", "css", "mitrautama-all-min.css")
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn(".mitrautama-mobile-backdrop", css)
        self.assertIn("mitrautama-mobile-drawer-open", css)
        self.assertIn("@media (max-width: 768px)", css)
        self.assertIn("@media (max-width: 480px)", css)

    def test_master_implementation_route_alias_mapping(self):
        """Verifikasi registry pemetaan rute submenu drop-right di navigation.js"""
        nav_path = os.path.join(WORKSPACE, "assets", "js", "navigation.js")
        with open(nav_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("routeAliasMap", js)
        self.assertIn("switch-ports", js)
        self.assertIn("system-resources", js)
        self.assertIn("activateSubTab", js)

    def test_master_implementation_sidebar_flush_height(self):
        """Verifikasi sidebar-container dan sidebar memiliki height 100% rata dengan dasar footer"""
        css_path = os.path.join(WORKSPACE, "assets", "css", "mitrautama-all-min.css")
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn("#sidebar-container", css)
        self.assertIn("height: 100% !important", css)

if __name__ == "__main__":
    unittest.main()
