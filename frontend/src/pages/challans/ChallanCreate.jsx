import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { createChallan } from "../../api/challans";
import { getCustomers } from "../../api/customers";
import { getProducts } from "../../api/products";
import styles from "./ChallanCreate.module.css";

const emptyItem = { product_id: "", quantity: 1 };

export default function ChallanCreate() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [customerId, setCustomerId] = useState("");
    const [items, setItems] = useState([{ ...emptyItem }]);
    const [saveAs, setSaveAs] = useState("draft");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // load customers and products for selects
        getCustomers({ limit: 200 }).then(({ data }) => setCustomers(data.data)).catch(() => { });
        getProducts({ limit: 200 }).then(({ data }) => setProducts(data.data)).catch(() => { });
    }, []);

    // find product details by id
    function getProduct(id) {
        return products.find((p) => p.id === parseInt(id));
    }

    function handleItemChange(index, field, value) {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function addItem() {
        setItems((prev) => [...prev, { ...emptyItem }]);
    }

    function removeItem(index) {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    // compute totals
    const totals = items.reduce(
        (acc, item) => {
            const product = getProduct(item.product_id);
            const qty = parseInt(item.quantity) || 0;
            const price = product ? parseFloat(product.unit_price) : 0;
            return {
                qty: acc.qty + qty,
                amount: acc.amount + qty * price,
            };
        },
        { qty: 0, amount: 0 }
    );

    async function handleSubmit(e) {
        e.preventDefault();

        if (!customerId) {
            toast.error("Please select a customer");
            return;
        }

        const validItems = items.filter((i) => i.product_id && parseInt(i.quantity) > 0);
        if (validItems.length === 0) {
            toast.error("Add at least one product with quantity");
            return;
        }

        // check for duplicate products
        const productIds = validItems.map((i) => i.product_id);
        if (new Set(productIds).size !== productIds.length) {
            toast.error("Duplicate products found. Use a single line with combined quantity.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await createChallan({
                customer_id: parseInt(customerId),
                items: validItems.map((i) => ({
                    product_id: parseInt(i.product_id),
                    quantity: parseInt(i.quantity),
                })),
                status: saveAs,
                notes: notes || undefined,
            });

            toast.success(data.message);
            navigate(`/challans/${data.challanId}`);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to create challan";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => navigate("/challans")}>← Back</button>
                    <h1>New Sales Challan</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Customer select */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Customer</h2>
                        <div className={styles.field}>
                            <label>Select Customer *</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                                className={styles.selectInput}
                            >
                                <option value="">— Choose a customer —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.business_name ? ` — ${c.business_name}` : ""} ({c.mobile})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className={styles.section}>
                        <div className={styles.itemsHeader}>
                            <h2 className={styles.sectionTitle}>Products</h2>
                            <button type="button" className={styles.addItemBtn} onClick={addItem}>
                                + Add Row
                            </button>
                        </div>

                        <div className={styles.itemsTable}>
                            <div className={styles.itemsHead}>
                                <span>Product</span>
                                <span>Available</span>
                                <span>Unit Price</span>
                                <span>Qty</span>
                                <span>Line Total</span>
                                <span></span>
                            </div>

                            {items.map((item, index) => {
                                const product = getProduct(item.product_id);
                                const qty = parseInt(item.quantity) || 0;
                                const lineTotal = product ? qty * parseFloat(product.unit_price) : 0;
                                const isLow = product && qty > product.current_stock;

                                return (
                                    <div key={index} className={`${styles.itemRow} ${isLow ? styles.itemRowWarn : ""}`}>
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                                            className={styles.productSelect}
                                        >
                                            <option value="">— Select product —</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} [{p.sku}]
                                                </option>
                                            ))}
                                        </select>

                                        <span className={`${styles.stockAvail} ${product && product.current_stock <= product.min_stock_alert ? styles.stockWarn : ""}`}>
                                            {product ? product.current_stock : "—"}
                                        </span>

                                        <span className={styles.price}>
                                            {product ? `₹${parseFloat(product.unit_price).toLocaleString("en-IN")}` : "—"}
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                            className={`${styles.qtyInput} ${isLow ? styles.qtyWarn : ""}`}
                                        />

                                        <span className={styles.lineTotal}>
                                            {product ? `₹${lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                                        </span>

                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(index)}
                                            disabled={items.length === 1}
                                        >
                                            ✕
                                        </button>

                                        {isLow && (
                                            <div className={styles.warnMsg}>
                                                ⚠️ Requested {qty}, only {product.current_stock} available
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className={styles.totals}>
                            <div className={styles.totalRow}>
                                <span>Total Quantity</span>
                                <strong>{totals.qty}</strong>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Total Amount</span>
                                <strong className={styles.totalAmount}>
                                    ₹{totals.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Notes + Save options */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Notes & Save</h2>
                        <div className={styles.field}>
                            <label>Notes (optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Any special instructions..."
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.saveOptions}>
                            <label className={styles.saveLabel}>Save as:</label>
                            <div className={styles.saveToggle}>
                                {["draft", "confirmed"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`${styles.saveBtn} ${saveAs === s ? (s === "confirmed" ? styles.saveBtnConfirmed : styles.saveBtnDraft) : ""}`}
                                        onClick={() => setSaveAs(s)}
                                    >
                                        {s === "draft" ? "📝 Draft" : "✅ Confirmed"}
                                    </button>
                                ))}
                            </div>
                            {saveAs === "confirmed" && (
                                <p className={styles.confirmNote}>
                                    Stock will be deducted immediately when saved as Confirmed.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => navigate("/challans")}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating..." : `Create Challan (${saveAs})`}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
