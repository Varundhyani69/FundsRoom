import { useState } from "react";
import Sidebar from "./Sidebar";
import styles from "./Layout.module.css";

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={styles.content}>
                {/* Mobile topbar */}
                <header className={styles.topbar}>
                    <button
                        className={styles.menuBtn}
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>
                    <span className={styles.topbarTitle}>⚡ ERP Portal</span>
                </header>

                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
}
