import { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const links = [
    { to: "/dashboard", icon: "🏠", label: "Dashboard" },
    { to: "/customers", icon: "👥", label: "Customers" },
    { to: "/products", icon: "📦", label: "Products" },
    { to: "/challans", icon: "📋", label: "Challans" },
];

export default function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // close sidebar whenever route changes on mobile
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    // lock body scroll when sidebar is open on mobile
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
        <>
            {/* Overlay — only visible on mobile when sidebar is open */}
            {open && <div className={styles.overlay} onClick={onClose} />}

            <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
                <div className={styles.brand}>
                    <span className={styles.brandIcon}>⚡</span>
                    <span className={styles.brandName}>ERP Portal</span>
                    {/* Close button visible only on mobile */}
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">✕</button>
                </div>

                <nav className={styles.nav}>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `${styles.link} ${isActive ? styles.active : ""}`
                            }
                        >
                            <span className={styles.icon}>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userRole}>{user.role}</div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
