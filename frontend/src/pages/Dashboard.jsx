import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { getDashboardStats } from "../api/dashboard";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(({ data }) => setStats(data.data))
            .catch(() => toast.error("Failed to load dashboard stats"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.welcomeRow}>
                    <div>
                        <h1 className={styles.heading}>Welcome back, {user.name} 👋</h1>
                        <p className={styles.sub}>
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            &nbsp;·&nbsp;<span className={styles.role}>{user.role}</span>
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>Loading stats...</div>
                ) : stats ? (
                    <>
                        {/* Stat cards */}
                        <div className={styles.statsGrid}>
                            <StatCard
                                icon="👥"
                                label="Total Customers"
                                value={stats.customers.total}
                                sub={`${stats.customers.active} active · ${stats.customers.leads} leads`}
                                color="blue"
                                onClick={() => navigate("/customers")}
                            />
                            <StatCard
                                icon="📦"
                                label="Products"
                                value={stats.products.total}
                                sub={`${stats.products.low_stock_count} low stock`}
                                color={stats.products.low_stock_count > 0 ? "orange" : "green"}
                                onClick={() => navigate("/products")}
                            />
                            <StatCard
                                icon="📋"
                                label="Total Challans"
                                value={stats.challans.total}
                                sub={`${stats.challans.confirmed} confirmed · ${stats.challans.drafts} drafts`}
                                color="purple"
                                onClick={() => navigate("/challans")}
                            />
                            <StatCard
                                icon="💰"
                                label="Confirmed Sales"
                                value={`₹${parseFloat(stats.challans.confirmed_value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                                sub="Total confirmed challan value"
                                color="green"
                                onClick={() => navigate("/challans?status=confirmed")}
                            />
                        </div>

                        <div className={styles.bottomGrid}>
                            {/* Recent Challans */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}>Recent Challans</h2>
                                    <button className={styles.cardLink} onClick={() => navigate("/challans")}>
                                        View all →
                                    </button>
                                </div>
                                {stats.recent_challans.length === 0 ? (
                                    <p className={styles.empty}>No challans yet</p>
                                ) : (
                                    <div className={styles.challanList}>
                                        {stats.recent_challans.map((ch) => (
                                            <div
                                                key={ch.id}
                                                className={styles.challanRow}
                                                onClick={() => navigate(`/challans/${ch.id}`)}
                                            >
                                                <div className={styles.challanLeft}>
                                                    <span className={styles.challanNo}>{ch.challan_number}</span>
                                                    <span className={styles.challanCustomer}>{ch.customer_name}</span>
                                                </div>
                                                <div className={styles.challanRight}>
                                                    <span className={styles.challanAmt}>
                                                        ₹{parseFloat(ch.total_amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                                    </span>
                                                    <Badge text={ch.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Low Stock Alert */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}>
                                        ⚠️ Low Stock Alert
                                        {stats.low_stock_products.length > 0 && (
                                            <span className={styles.alertCount}>{stats.low_stock_products.length}</span>
                                        )}
                                    </h2>
                                    <button className={styles.cardLink} onClick={() => navigate("/products?low_stock=true")}>
                                        View all →
                                    </button>
                                </div>
                                {stats.low_stock_products.length === 0 ? (
                                    <p className={styles.empty}>All products are well stocked ✓</p>
                                ) : (
                                    <div className={styles.stockList}>
                                        {stats.low_stock_products.map((p) => (
                                            <div
                                                key={p.id}
                                                className={styles.stockRow}
                                                onClick={() => navigate(`/products/${p.id}`)}
                                            >
                                                <div className={styles.stockInfo}>
                                                    <span className={styles.stockName}>{p.name}</span>
                                                    <span className={styles.stockSku}>{p.sku} · {p.warehouse || "No location"}</span>
                                                </div>
                                                <div className={styles.stockNums}>
                                                    <span className={styles.stockCurrent}>{p.current_stock}</span>
                                                    <span className={styles.stockMin}>min {p.min_stock_alert}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Upcoming Follow-ups */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}>📅 Follow-ups This Week</h2>
                                    <button className={styles.cardLink} onClick={() => navigate("/customers")}>
                                        View all →
                                    </button>
                                </div>
                                {stats.upcoming_followups.length === 0 ? (
                                    <p className={styles.empty}>No follow-ups due this week</p>
                                ) : (
                                    <div className={styles.followupList}>
                                        {stats.upcoming_followups.map((c) => (
                                            <div
                                                key={c.id}
                                                className={styles.followupRow}
                                                onClick={() => navigate(`/customers/${c.id}`)}
                                            >
                                                <div className={styles.followupInfo}>
                                                    <span className={styles.followupName}>{c.name}</span>
                                                    <span className={styles.followupMobile}>{c.mobile}</span>
                                                </div>
                                                <div className={styles.followupRight}>
                                                    <span className={styles.followupDate}>
                                                        {new Date(c.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </span>
                                                    <Badge text={c.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.loadingState}>Could not load stats</div>
                )}
            </div>
        </Layout>
    );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
    return (
        <div className={`${styles.statCard} ${styles[`statCard_${color}`]}`} onClick={onClick}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statBody}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
                <div className={styles.statSub}>{sub}</div>
            </div>
        </div>
    );
}
