import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import Badge from "../../components/Badge";
import { cancelChallan, confirmChallan, getChallanById } from "../../api/challans";
import styles from "./ChallanDetail.module.css";

export default function ChallanDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canAct = ["admin", "sales"].includes(user.role);

    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    async function fetchChallan() {
        try {
            const { data } = await getChallanById(id);
            setChallan(data.data);
        } catch {
            toast.error("Failed to load challan");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchChallan(); }, [id]);

    async function handleConfirm() {
        if (!window.confirm("Confirm this challan? Stock will be deducted immediately.")) return;
        setActing(true);
        try {
            const { data } = await confirmChallan(id);
            toast.success(data.message);
            fetchChallan();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to confirm");
        } finally {
            setActing(false);
        }
    }

    async function handleCancel() {
        if (!window.confirm("Cancel this challan? If confirmed, stock will be restored.")) return;
        setActing(true);
        try {
            const { data } = await cancelChallan(id);
            toast.success(data.message);
            fetchChallan();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel");
        } finally {
            setActing(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    if (loading) return <Layout><div className={styles.loading}>Loading...</div></Layout>;
    if (!challan) return <Layout><div className={styles.loading}>Challan not found</div></Layout>;

    return (
        <Layout>
            <div className={styles.page}>
                {/* Top bar */}
                <div className={styles.topBar}>
                    <button className={styles.back} onClick={() => navigate("/challans")}>← Back</button>
                    <div className={styles.topActions}>
                        <button className={styles.printBtn} onClick={handlePrint}>🖨️ Print</button>
                        {canAct && challan.status === "draft" && (
                            <>
                                <button className={styles.confirmBtn} onClick={handleConfirm} disabled={acting}>
                                    ✅ Confirm Challan
                                </button>
                                <button className={styles.cancelBtn} onClick={handleCancel} disabled={acting}>
                                    ✕ Cancel
                                </button>
                            </>
                        )}
                        {canAct && challan.status === "confirmed" && (
                            <button className={styles.cancelBtn} onClick={handleCancel} disabled={acting}>
                                ✕ Cancel & Restore Stock
                            </button>
                        )}
                    </div>
                </div>

                {/* Printable area */}
                <div className={styles.challanDoc} ref={printRef}>
                    {/* Header */}
                    <div className={styles.docHeader}>
                        <div className={styles.companyInfo}>
                            <h2 className={styles.companyName}>⚡ ERP Portal</h2>
                            <p className={styles.companyTagline}>Wholesale & Distribution</p>
                        </div>
                        <div className={styles.challanMeta}>
                            <h1 className={styles.challanTitle}>SALES CHALLAN</h1>
                            <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Challan No.</span>
                                <span className={styles.metaValue}>{challan.challan_number}</span>
                            </div>
                            <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Date</span>
                                <span className={styles.metaValue}>{new Date(challan.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Status</span>
                                <span className={styles.metaValue}><Badge text={challan.status} /></span>
                            </div>
                        </div>
                    </div>

                    {/* Customer + Created by */}
                    <div className={styles.infoStrip}>
                        <div className={styles.infoBlock}>
                            <p className={styles.infoBlockTitle}>Bill To</p>
                            <p className={styles.infoBlockMain}>{challan.customer_name}</p>
                            {challan.business_name && <p>{challan.business_name}</p>}
                            {challan.customer_address && <p>{challan.customer_address}</p>}
                            {challan.customer_mobile && <p>📞 {challan.customer_mobile}</p>}
                            {challan.customer_gst && <p>GST: {challan.customer_gst}</p>}
                        </div>
                        <div className={styles.infoBlock}>
                            <p className={styles.infoBlockTitle}>Created By</p>
                            <p className={styles.infoBlockMain}>{challan.created_by_name}</p>
                            <p className={styles.infoSmall}>
                                {new Date(challan.created_at).toLocaleString()}
                            </p>
                            {challan.notes && (
                                <>
                                    <p className={styles.infoBlockTitle} style={{ marginTop: "0.75rem" }}>Notes</p>
                                    <p>{challan.notes}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Line items */}
                    <table className={styles.itemsTable}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Unit Price</th>
                                <th>Quantity</th>
                                <th>Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {challan.items?.map((item, i) => (
                                <tr key={item.id}>
                                    <td>{i + 1}</td>
                                    <td className={styles.itemName}>{item.product_name}</td>
                                    <td className={styles.itemSku}>{item.product_sku}</td>
                                    <td>₹{parseFloat(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                    <td className={styles.itemQty}>{item.quantity}</td>
                                    <td className={styles.itemTotal}>
                                        ₹{parseFloat(item.line_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={4} className={styles.footLabel}>Total</td>
                                <td className={styles.footQty}>{challan.total_quantity}</td>
                                <td className={styles.footTotal}>
                                    ₹{parseFloat(challan.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className={styles.docFooter}>
                        <p>This is a computer-generated challan. No signature required.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
