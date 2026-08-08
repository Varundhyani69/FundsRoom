import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import Badge from "../../components/Badge";
import { getCustomers } from "../../api/customers";
import styles from "./CustomerList.module.css";

export default function CustomerList() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [customerType, setCustomerType] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    async function fetchCustomers() {
        setLoading(true);
        try {
            const { data } = await getCustomers({
                search: search || undefined,
                status: status || undefined,
                customer_type: customerType || undefined,
                page,
                limit: 10,
            });
            setCustomers(data.data);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCustomers();
    }, [page, status, customerType]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchCustomers();
    }

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Customers</h1>
                    <button className={styles.addBtn} onClick={() => navigate("/customers/new")}>
                        + Add Customer
                    </button>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search by name, mobile, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>Search</button>
                    </form>

                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={styles.select}>
                        <option value="">All Status</option>
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select value={customerType} onChange={(e) => { setCustomerType(e.target.value); setPage(1); }} className={styles.select}>
                        <option value="">All Types</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="distributor">Distributor</option>
                    </select>
                </div>

                {/* Table */}
                <div className={styles.tableWrap}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : customers.length === 0 ? (
                        <div className={styles.empty}>No customers found</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Business</th>
                                    <th>Mobile</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Follow-up</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c, i) => (
                                    <tr key={c.id}>
                                        <td>{(page - 1) * 10 + i + 1}</td>
                                        <td className={styles.nameCell}>
                                            <span className={styles.name}>{c.name}</span>
                                            <span className={styles.email}>{c.email}</span>
                                        </td>
                                        <td>{c.business_name || "—"}</td>
                                        <td>{c.mobile}</td>
                                        <td><Badge text={c.customer_type} /></td>
                                        <td><Badge text={c.status} /></td>
                                        <td>{c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : "—"}</td>
                                        <td className={styles.actions}>
                                            <button className={styles.viewBtn} onClick={() => navigate(`/customers/${c.id}`)}>View</button>
                                            <button className={styles.editBtn} onClick={() => navigate(`/customers/${c.id}/edit`)}>Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
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
