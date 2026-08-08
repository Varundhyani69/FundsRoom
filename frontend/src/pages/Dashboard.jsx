import Layout from "../components/Layout";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <Layout>
            <div className={styles.page}>
                <h1 className={styles.heading}>Welcome back, {user.name} 👋</h1>
                <p className={styles.sub}>You are logged in as <strong>{user.role}</strong></p>

                <div className={styles.cards}>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>👥</div>
                        <div className={styles.cardLabel}>Customers</div>
                        <div className={styles.cardHint}>Manage your CRM</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>📦</div>
                        <div className={styles.cardLabel}>Products</div>
                        <div className={styles.cardHint}>Stock & inventory</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>📋</div>
                        <div className={styles.cardLabel}>Challans</div>
                        <div className={styles.cardHint}>Sales & dispatch</div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
