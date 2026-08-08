import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import Badge from "../../components/Badge";
import { getProducts } from "../../api/products";
import styles from "./ProductList.module.css";

export default function ProductList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canEdit = ["admin", "warehouse"].includes(user.role);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [lowStock, setLowStock] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    async function fetchProducts() {
        setLoading(true);
        try {
            const { data } = await getProducts({
                search: search || undefined,
                category: category || undefined,
                low_stock: lowStock ? "true" : undefined,
                page,
                limit: 10,
            });
            setProducts(data.data);
            setCategories(data.categories || []);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProducts(); }, [page, category, lowStock]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    }

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Products & Inventory</h1>
                    <div className={styles.headerActions}>
                        <button className={styles.secondaryBtn} onClick={() => navigate("/stock-movements")}>
                            📊 Stock Log
                        </button>
                        {canEdit && (
                            <button className={styles.addBtn} onClick={() => navigate("/products/new")}>
                                + Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search by name, SKU, category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>Search</button>
                    </form>

                    <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={styles.select}>
                        <option value="">All Categories</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={lowStock}
                            onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
                        />
                        <span>Low Stock Only</span>
                    </label>
                </div>

                {/* Table */}
                <div className={styles.tableWrap}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : products.length === 0 ? (
                        <div className={styles.empty}>No products found</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Unit Price</th>
                                    <th>Stock</th>
                                    <th>Min Alert</th>
                                    <th>Warehouse</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => {
                                    const isLow = p.current_stock <= p.min_stock_alert;
                                    return (
                                        <tr key={p.id}>
                                            <td className={styles.sku}>{p.sku}</td>
                                            <td className={styles.name}>{p.name}</td>
                                            <td>{p.category || "—"}</td>
                                            <td>₹{parseFloat(p.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <span className={`${styles.stock} ${isLow ? styles.stockLow : ""}`}>
                                                    {p.current_stock}
                                                    {isLow && <span className={styles.lowBadge}>Low</span>}
                                                </span>
                                            </td>
                                            <td>{p.min_stock_alert}</td>
                                            <td>{p.warehouse || "—"}</td>
                                            <td className={styles.actions}>
                                                <button className={styles.viewBtn} onClick={() => navigate(`/products/${p.id}`)}>
                                                    View
                                                </button>
                                                {canEdit && (
                                                    <button className={styles.editBtn} onClick={() => navigate(`/products/${p.id}/edit`)}>
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

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
