# RouterOS WebUI Automated Test Suite — Expanded Audit Edition

import os
import json
import re
import unittest

WORKSPACE = r"C:\RouterOS"

class TestRouterOSWorkspace(unittest.TestCase):
    def test_workspace_isolation(self):
        """Pastikan seluruh path yang diuji berada di C:\RouterOS"""
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
            "packages/queues/queues.html",
            "packages/ppp/ppp.html",
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

    def test_json_fixtures_validity(self):
        """Pastikan config.json dan interfaces.json valid JSON syntax"""
        config_path = os.path.join(WORKSPACE, "config.json")
        self.assertTrue(os.path.exists(config_path))
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            self.assertIn("app", cfg)
            self.assertIn("navigation", cfg)

        iface_path = os.path.join(WORKSPACE, "packages", "interfaces", "interfaces.json")
        self.assertTrue(os.path.exists(iface_path))
        with open(iface_path, "r", encoding="utf-8") as f:
            ifaces = json.load(f)
            self.assertIn("interfaces", ifaces)
            self.assertGreater(len(ifaces["interfaces"]), 0)

    def test_sidebar_naming_standards(self):
        """Pastikan penamaan atribut menggunakan mitrautama-"""
        sb_path = os.path.join(WORKSPACE, "includes", "sidebar.html")
        with open(sb_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("data-mitrautama-view", content)
            self.assertIn("mitrautama-menu-item", content)

    def test_home_dashboard_active_default(self):
        """Pastikan Home Dashboard adalah tampilan aktif default"""
        idx_path = os.path.join(WORKSPACE, "index.html")
        with open(idx_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn('data-mitrautama-view="dashboard"', content)
            self.assertIn('id="view-dashboard"', content)

    def test_interfaces_16_subtabs_present(self):
        """Verifikasi bahwa 16 sub-tab Interfaces terdaftar secara lengkap"""
        iface_path = os.path.join(WORKSPACE, "packages", "interfaces", "interfaces.html")
        with open(iface_path, "r", encoding="utf-8") as f:
            html = f.read()
        
        expected_tabs = [
            "interface", "interface-list", "ethernet", "eoip-tunnel",
            "ip-tunnel", "gre-tunnel", "vlan", "bridge",
            "vxlan", "vrf", "vrrp", "lacc",
            "macsec", "macvlan", "vether", "vether-tunnel"
        ]
        for t in expected_tabs:
            pattern = f'data-mitrautama-subtab="{t}"'
            self.assertIn(pattern, html, f"Sub-tab '{t}' tidak ditemukan di interfaces.html")

    def test_modal_manual_close_policy(self):
        """Verifikasi bahwa modal.js memiliki proteksi manual close (tidak auto-close pada backdrop)"""
        modal_js_path = os.path.join(WORKSPACE, "assets", "js", "modal.js")
        with open(modal_js_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("modal-shake", js)
        self.assertIn("data-mitrautama-modal-close", js)

    def test_crud_simulation_engine(self):
        """Verifikasi bahwa data-loader.js menyediakan metode simulasi CRUD lengkap"""
        loader_path = os.path.join(WORKSPACE, "assets", "js", "data-loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("addInterface", js)
        self.assertIn("removeSelectedInterface", js)
        self.assertIn("toggleSelectedStatus", js)
        self.assertIn("getSelectedInterface", js)

    def test_chart_buffer_bounding(self):
        """Verifikasi bahwa charts.js membatasi panjang titik data buffer (anti memory leak)"""
        chart_js_path = os.path.join(WORKSPACE, "assets", "js", "charts.js")
        with open(chart_js_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("maxDataPoints", js)
        self.assertIn("this.timeLabels.shift()", js)

    def test_crud_edit_interface(self):
        """Verifikasi implementasi edit interface di data-loader.js dan modal edit di index.html"""
        loader_path = os.path.join(WORKSPACE, "assets", "js", "data-loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("updateSelectedInterface", js)
        self.assertIn("notifySelectionChange", js)

        idx_path = os.path.join(WORKSPACE, "index.html")
        with open(idx_path, "r", encoding="utf-8") as f:
            html = f.read()
        self.assertIn('id="modal-edit-interface"', html)
        self.assertIn('id="btn-save-edit-interface"', html)

    def test_charts_timer_cleanup(self):
        """Verifikasi chart timer cleanup dan destroyCharts di js/charts.js"""
        chart_js_path = os.path.join(WORKSPACE, "assets", "js", "charts.js")
        with open(chart_js_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("stopStream", js)
        self.assertIn("destroyCharts", js)
        self.assertIn("clearInterval(this.streamTimer)", js)

    def test_html_escaping(self):
        """Verifikasi sanitasi escapeHtml pada rendering data-loader.js"""
        loader_path = os.path.join(WORKSPACE, "assets", "js", "data-loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("escapeHtml", js)

    def test_all_subviews_mitrane_window_class(self):
        """Verifikasi keseragaman arsitektur .mitrane-window pada modul utama"""
        for mod in ["packages/interfaces/interfaces.html", "packages/queues/queues.html", "packages/ip/ip.html"]:
            path = os.path.join(WORKSPACE, mod)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("mitrane-window", content, f"{mod} missing .mitrane-window")

if __name__ == "__main__":
    unittest.main()
