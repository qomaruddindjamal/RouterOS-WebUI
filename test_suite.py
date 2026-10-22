# RouterOS WebUI Automated Test Suite

import os
import json
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
            "interfaces/interfaces.html",
            "switch/switch.html",
            "bridge/bridge.html",
            "system/system.html",
            "queues/queues.html",
            "ppp/ppp.html",
            "ip/ip.html",
            "wireguard/wireguard.html",
            "wireless/wireless.html"
        ]
        for mod in modules:
            path = os.path.join(WORKSPACE, mod)
            self.assertTrue(os.path.exists(path), f"Modul hilang: {mod}")

    def test_required_css_files(self):
        """Pastikan seluruh stylesheet modular mitrautama-* ada dan tidak ada mitrautama-winbox"""
        required_css = [
            "css/mitrautama.css",
            "css/mitrautama-dark.css",
            "css/mitrautama-auto.css",
            "css/mitrautama-tabel.css",
            "css/mitrautama-tost.css",
            "css/mitrautama-all-min.css"
        ]
        for css in required_css:
            path = os.path.join(WORKSPACE, css)
            self.assertTrue(os.path.exists(path), f"CSS hilang: {css}")
        
        forbidden = os.path.join(WORKSPACE, "css/mitrautama-winbox.css")
        self.assertFalse(os.path.exists(forbidden), "mitrautama-winbox.css tidak boleh ada!")

    def test_required_js_modules(self):
        """Pastikan modul-modul JS esensial ada dan terpisah (tidak monolitik)"""
        js_files = [
            "js/navigation.js",
            "js/modal.js",
            "js/toast.js",
            "js/charts.js",
            "js/theme.js",
            "js/theme-ui.js",
            "js/module-loader.js",
            "js/data-loader.js"
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

        iface_path = os.path.join(WORKSPACE, "interfaces", "interfaces.json")
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

if __name__ == "__main__":
    unittest.main()
