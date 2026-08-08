import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { getStockMovements } from "../../api/products";
import styles from "./StockMovements.module.css";

export default function StockMovements() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [movType, setMovType] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const productIdFilter = searchParams.get("product_id");

    async function fetchMovements() {
        setLoading(true);
        try {
            const { data } = await getStockMovements({
                product_id: productIdFilter || undefined,
                movement_type: movType || undefined,
                page,
                limit: 15,
            });
            setMovements(data.data);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load stock movements");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchMovements(); }, [page, movType, productIdFilter]);

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <button className={styles.back} onClick={() => navigate("/products")}>← Back to Products</button>
                        <h1>Stock Movement Log</h1>
                        {productIdFilter && (
                            <p className={styles.filterNote}>Filtered by product #{productIdFilter}</p>
                        )}
                    </div>
                </div>

                <div className={styles.filters}>
                    <select value={movType} onChange={(e) => { setMovType(e.target.value); setPage(1); }} className={styles.select}>
                        <option value="">All Movements</option>
                        <option value="IN">Stock IN only</option>
                        <option value="OUT">Stock OUT only</option>
                    </select>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : movements.length === 0 ? (
                    <div className={styles.empty}>No stock movements found</div>
                ) : (
                    <>
                        {/* ── Desktop table ── */}
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Reason</th>
                                        <th>Done By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map((m) => (
                                        <tr key={m.id}>
                                            <td className={styles.date}>{new Date(m.created_at).toLocaleString()}</td>
                                            <td className={styles.productName} onClick={() => navigate(`/products/${m.product_id}`)}>
                                                {m.product_name}
                                            </td>
                                            <td className={styles.sku}>{m.sku}</td>
                                            <td>
                                                <span className={`${styles.typeBadge} ${m.movement_type === "IN" ? styles.typeIn : styles.typeOut}`}>
                                                    {m.movement_type === "IN" ? "▲ IN" : "▼ OUT"}
                                                </span>
                                            </td>
                                            <td className={`${styles.qty} ${m.movement_type === "IN" ? styles.qtyIn : styles.qtyOut}`}>
                                                {m.movement_type === "IN" ? "+" : "-"}{m.quantity}
                                            </td>
                                            <td className={styles.reason}>{m.reason || "—"}</td>
                                            <td>{m.created_by_name || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile cards ── */}
                        <div className={styles.cardList}>
                            {movements.map((m) => (
                                <div key={m.id} className={styles.card}>
                                    <div className={styles.cardTop}>
                                        <div>
                                            <div
                                                className={styles.cardProduct}
                                                onClick={() => navigate(`/products/${m.product_id}`)}
                                            >
                                                {m.product_name}
                                            </div>
                                            <div className={styles.cardSku}>{m.sku}</div>
                                        </div>
                                        <div className={styles.cardRight}>
                                            <span className={`${styles.cardQty} ${m.movement_type === "IN" ? styles.qtyIn : styles.qtyOut}`}>
                                                {m.movement_type === "IN" ? "+" : "-"}{m.quantity}
                                            </span>
                                            <span className={`${styles.typeBadge} ${m.movement_type === "IN" ? styles.typeIn : styles.typeOut}`}>
                                                {m.movement_type === "IN" ? "▲ IN" : "▼ OUT"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        {m.reason && <span>📝 {m.reason}</span>}
                                        <span>👤 {m.created_by_name || "—"}</span>
                                        <span>🕐 {new Date(m.created_at).toLocaleString()}</span>
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
