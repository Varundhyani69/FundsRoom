import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";

const links = [
    { to: "/dashboard", icon: "🏠", label: "Dashboard" },
    { to: "/customers", icon: "👥", label: "Customers" },
    { to: "/products", icon: "📦", label: "Products" },
    { to: "/challans", icon: "📋", label: "Challans" },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <span className={styles.brandIcon}>⚡</span>
                <span className={styles.brandName}>ERP Portal</span>
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
    );
}
