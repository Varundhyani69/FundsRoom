import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import Badge from "../../components/Badge";
import { getChallans } from "../../api/challans";
import styles from "./ChallanList.module.css";

export default function ChallanList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canCreate = ["admin", "sales"].includes(user.role);

    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    async function fetchChallans() {
        setLoading(true);
        try {
            const { data } = await getChallans({
                status: status || undefined,
                search: search || undefined,
                page,
                limit: 10,
            });
            setChallans(data.data);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load challans");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchChallans(); }, [page, status]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchChallans();
    }

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Sales Challans</h1>
                    {canCreate && (
                        <button className={styles.addBtn} onClick={() => navigate("/challans/new")}>
                            + New Challan
                        </button>
                    )}
                </div>

                <div className={styles.filters}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search challan number or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>Search</button>
                    </form>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={styles.select}>
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : challans.length === 0 ? (
                    <div className={styles.empty}>No challans found</div>
                ) : (
                    <>
                        {/* ── Desktop table ── */}
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Challan No.</th>
                                        <th>Customer</th>
                                        <th>Total Qty</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Created By</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {challans.map((ch) => (
                                        <tr key={ch.id}>
                                            <td className={styles.challanNo}>{ch.challan_number}</td>
                                            <td>
                                                <div className={styles.customerName}>{ch.customer_name}</div>
                                                {ch.business_name && <div className={styles.businessName}>{ch.business_name}</div>}
                                            </td>
                                            <td>{ch.total_quantity}</td>
                                            <td className={styles.amount}>
                                                ₹{parseFloat(ch.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td><Badge text={ch.status} /></td>
                                            <td>{ch.created_by_name || "—"}</td>
                                            <td className={styles.date}>{new Date(ch.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <button className={styles.viewBtn} onClick={() => navigate(`/challans/${ch.id}`)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile cards ── */}
                        <div className={styles.cardList}>
                            {challans.map((ch) => (
                                <div key={ch.id} className={styles.card} onClick={() => navigate(`/challans/${ch.id}`)}>
                                    <div className={styles.cardTop}>
                                        <div>
                                            <div className={styles.cardChallanNo}>{ch.challan_number}</div>
                                            <div className={styles.cardCustomer}>{ch.customer_name}</div>
                                            {ch.business_name && <div className={styles.cardBiz}>{ch.business_name}</div>}
                                        </div>
                                        <Badge text={ch.status} />
                                    </div>
                                    <div className={styles.cardBottom}>
                                        <div className={styles.cardAmount}>
                                            ₹{parseFloat(ch.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <span>{ch.total_quantity} items</span>
                                            <span>{new Date(ch.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={styles.pageBtn}>← Prev</button>
                        <span>Page {page} of {pagination.totalPages}</span>
                        <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)} className={styles.pageBtn}>Next →</button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
