import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { createProduct, getProductById, updateProduct } from "../../api/products";
import styles from "./ProductForm.module.css";

const empty = {
    name: "", sku: "", category: "", unit_price: "",
    current_stock: "0", min_stock_alert: "0", warehouse: "",
};

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            getProductById(id)
                .then(({ data }) => {
                    const p = data.data;
                    setForm({
                        name: p.name || "",
                        sku: p.sku || "",
                        category: p.category || "",
                        unit_price: p.unit_price || "",
                        current_stock: p.current_stock ?? "0",
                        min_stock_alert: p.min_stock_alert ?? "0",
                        warehouse: p.warehouse || "",
                    });
                })
                .catch(() => toast.error("Failed to load product"))
                .finally(() => setFetching(false));
        }
    }, [id]);

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await updateProduct(id, form);
                toast.success("Product updated");
            } else {
                await createProduct(form);
                toast.success("Product added");
            }
            navigate("/products");
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Something went wrong";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    if (fetching) return <Layout><div className={styles.loading}>Loading...</div></Layout>;

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => navigate("/products")}>← Back</button>
                    <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Product Details</h2>
                        <div className={styles.grid}>
                            <div className={`${styles.field} ${styles.span2}`}>
                                <label>Product Name *</label>
                                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Industrial Bearing 6205" />
                            </div>
                            <div className={styles.field}>
                                <label>SKU / Code *</label>
                                <input name="sku" value={form.sku} onChange={handleChange} required placeholder="e.g. BRG-6205" style={{ textTransform: "uppercase" }} />
                            </div>
                            <div className={styles.field}>
                                <label>Category</label>
                                <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Bearings" />
                            </div>
                            <div className={styles.field}>
                                <label>Unit Price (₹) *</label>
                                <input name="unit_price" type="number" min="0" step="0.01" value={form.unit_price} onChange={handleChange} required placeholder="0.00" />
                            </div>
                            <div className={styles.field}>
                                <label>Warehouse / Location</label>
                                <input name="warehouse" value={form.warehouse} onChange={handleChange} placeholder="e.g. Warehouse A" />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Stock Settings</h2>
                        <div className={styles.grid}>
                            {!isEdit && (
                                <div className={styles.field}>
                                    <label>Opening Stock</label>
                                    <input name="current_stock" type="number" min="0" value={form.current_stock} onChange={handleChange} placeholder="0" />
                                    <span className={styles.hint}>This will be logged as initial stock movement</span>
                                </div>
                            )}
                            <div className={styles.field}>
                                <label>Min Stock Alert</label>
                                <input name="min_stock_alert" type="number" min="0" value={form.min_stock_alert} onChange={handleChange} placeholder="0" />
                                <span className={styles.hint}>You'll see a Low Stock warning below this quantity</span>
                            </div>
                        </div>
                        {isEdit && (
                            <p className={styles.stockNote}>
                                ⚠️ To change current stock, use the <strong>Stock Adjustment</strong> option on the product detail page.
                            </p>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => navigate("/products")}>Cancel</button>
                        <button type="submit" className={styles.saveBtn} disabled={loading}>
                            {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
