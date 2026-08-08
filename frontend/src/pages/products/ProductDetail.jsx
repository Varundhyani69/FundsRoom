import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { adjustStock, getProductById } from "../../api/products";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canEdit = ["admin", "warehouse"].includes(user.role);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [adjust, setAdjust] = useState({ quantity: "", movement_type: "IN", reason: "" });
    const [submitting, setSubmitting] = useState(false);

    async function fetchProduct() {
        try {
            const { data } = await getProductById(id);
            setProduct(data.data);
        } catch {
            toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProduct(); }, [id]);

    async function handleAdjust(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await adjustStock(id, adjust);
            toast.success(data.message);
            setShowModal(false);
            setAdjust({ quantity: "", movement_type: "IN", reason: "" });
            fetchProduct();
        } catch (err) {
            toast.error(err.response?.data?.message || "Adjustment failed");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Layout><div className={styles.loading}>Loading...</div></Layout>;
    if (!product) return <Layout><div className={styles.loading}>Product not found</div></Layout>;

    const isLow = product.current_stock <= product.min_stock_alert;

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => navigate("/products")}>← Back</button>
                    <div className={styles.headerRight}>
                        <div>
                            <h1>{product.name}</h1>
                            <span className={styles.skuTag}>{product.sku}</span>
                        </div>
                        <div className={styles.headerBtns}>
                            {canEdit && (
                                <>
                                    <button className={styles.adjustBtn} onClick={() => setShowModal(true)}>
                                        ± Adjust Stock
                                    </button>
                                    <button className={styles.editBtn} onClick={() => navigate(`/products/${id}/edit`)}>
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Info Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Product Info</h2>
                        <div className={styles.infoList}>
                            <InfoRow label="Category" value={product.category || "—"} />
                            <InfoRow label="Warehouse" value={product.warehouse || "—"} />
                            <InfoRow label="Unit Price" value={`₹${parseFloat(product.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
                            <InfoRow label="Added by" value={product.created_by_name || "—"} />
                        </div>

                        <div className={styles.stockBlock}>
                            <div className={`${styles.stockNum} ${isLow ? styles.stockLow : styles.stockOk}`}>
                                {product.current_stock}
                            </div>
                            <div className={styles.stockLabel}>Current Stock</div>
                            {isLow && (
                                <div className={styles.lowAlert}>
                                    ⚠️ Below minimum alert ({product.min_stock_alert} units)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Stock Movements */}
                    <div className={styles.card}>
                        <div className={styles.movHeader}>
                            <h2 className={styles.cardTitle}>Recent Stock Movements</h2>
                            <button className={styles.logLink} onClick={() => navigate(`/stock-movements?product_id=${id}`)}>
                                View all →
                            </button>
                        </div>

                        {!product.recent_movements?.length ? (
                            <p className={styles.empty}>No movements yet</p>
                        ) : (
                            <div className={styles.movList}>
                                {product.recent_movements.map((m) => (
                                    <div key={m.id} className={styles.movRow}>
                                        <span className={`${styles.movType} ${m.movement_type === "IN" ? styles.typeIn : styles.typeOut}`}>
                                            {m.movement_type === "IN" ? "▲" : "▼"} {m.movement_type}
                                        </span>
                                        <div className={styles.movInfo}>
                                            <span className={styles.movQty}>
                                                {m.movement_type === "IN" ? "+" : "-"}{m.quantity} units
                                            </span>
                                            <span className={styles.movReason}>{m.reason}</span>
                                        </div>
                                        <div className={styles.movMeta}>
                                            <span>{m.created_by_name || "—"}</span>
                                            <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stock Adjust Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Adjust Stock</h3>
                        <p className={styles.modalSub}>Current stock: <strong>{product.current_stock} units</strong></p>
                        <form onSubmit={handleAdjust} className={styles.modalForm}>
                            <div className={styles.modalField}>
                                <label>Movement Type</label>
                                <div className={styles.typeToggle}>
                                    {["IN", "OUT"].map((t) => (
                                        <button
                                            key={t} type="button"
                                            className={`${styles.typeBtn} ${adjust.movement_type === t ? (t === "IN" ? styles.typeBtnIn : styles.typeBtnOut) : ""}`}
                                            onClick={() => setAdjust((a) => ({ ...a, movement_type: t }))}
                                        >
                                            {t === "IN" ? "▲ Stock In" : "▼ Stock Out"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalField}>
                                <label>Quantity *</label>
                                <input
                                    type="number" min="1" required
                                    value={adjust.quantity}
                                    onChange={(e) => setAdjust((a) => ({ ...a, quantity: e.target.value }))}
                                    placeholder="Enter quantity"
                                    className={styles.modalInput}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>Reason *</label>
                                <input
                                    type="text" required
                                    value={adjust.reason}
                                    onChange={(e) => setAdjust((a) => ({ ...a, reason: e.target.value }))}
                                    placeholder="e.g. Purchase order received"
                                    className={styles.modalInput}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className={`${styles.confirmBtn} ${adjust.movement_type === "OUT" ? styles.confirmOut : ""}`} disabled={submitting}>
                                    {submitting ? "Saving..." : `Confirm ${adjust.movement_type}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
}
