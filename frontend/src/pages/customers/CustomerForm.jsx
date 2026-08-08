import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { createCustomer, getCustomerById, updateCustomer } from "../../api/customers";
import styles from "./CustomerForm.module.css";

const empty = {
    name: "", mobile: "", email: "", business_name: "", gst_number: "",
    customer_type: "retail", address: "", status: "lead", follow_up_date: "", notes: "",
};

export default function CustomerForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            getCustomerById(id)
                .then(({ data }) => {
                    const c = data.data;
                    setForm({
                        name: c.name || "",
                        mobile: c.mobile || "",
                        email: c.email || "",
                        business_name: c.business_name || "",
                        gst_number: c.gst_number || "",
                        customer_type: c.customer_type || "retail",
                        address: c.address || "",
                        status: c.status || "lead",
                        follow_up_date: c.follow_up_date ? c.follow_up_date.split("T")[0] : "",
                        notes: c.notes || "",
                    });
                })
                .catch(() => toast.error("Failed to load customer"))
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
                await updateCustomer(id, form);
                toast.success("Customer updated");
            } else {
                await createCustomer(form);
                toast.success("Customer added");
            }
            navigate("/customers");
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
                    <button className={styles.back} onClick={() => navigate("/customers")}>← Back</button>
                    <h1>{isEdit ? "Edit Customer" : "Add Customer"}</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Basic Info</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Customer Name *</label>
                                <input name="name" value={form.name} onChange={handleChange} required placeholder="Full name" />
                            </div>
                            <div className={styles.field}>
                                <label>Mobile *</label>
                                <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="9876543210" />
                            </div>
                            <div className={styles.field}>
                                <label>Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                            </div>
                            <div className={styles.field}>
                                <label>Business Name</label>
                                <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Company / Shop name" />
                            </div>
                            <div className={styles.field}>
                                <label>GST Number</label>
                                <input name="gst_number" value={form.gst_number} onChange={handleChange} placeholder="Optional" />
                            </div>
                            <div className={styles.field}>
                                <label>Customer Type</label>
                                <select name="customer_type" value={form.customer_type} onChange={handleChange}>
                                    <option value="retail">Retail</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="distributor">Distributor</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Status & Follow-up</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="lead">Lead</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Follow-up Date</label>
                                <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Address & Notes</h2>
                        <div className={styles.field}>
                            <label>Address</label>
                            <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full address" />
                        </div>
                        <div className={styles.field} style={{ marginTop: "1rem" }}>
                            <label>Notes</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Any additional notes..." />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => navigate("/customers")}>Cancel</button>
                        <button type="submit" className={styles.saveBtn} disabled={loading}>
                            {loading ? "Saving..." : isEdit ? "Update Customer" : "Add Customer"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
