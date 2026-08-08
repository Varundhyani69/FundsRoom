import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import Badge from "../../components/Badge";
import { addFollowup, getCustomerById } from "../../api/customers";
import styles from "./CustomerDetail.module.css";

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState("");
    const [followDate, setFollowDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function fetchCustomer() {
        try {
            const { data } = await getCustomerById(id);
            setCustomer(data.data);
        } catch {
            toast.error("Failed to load customer");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchCustomer(); }, [id]);

    async function handleAddNote(e) {
        e.preventDefault();
        if (!note.trim()) return;
        setSubmitting(true);
        try {
            await addFollowup(id, { note, follow_up_date: followDate || undefined });
            toast.success("Follow-up note added");
            setNote("");
            setFollowDate("");
            fetchCustomer(); // refresh
        } catch {
            toast.error("Failed to add note");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Layout><div className={styles.loading}>Loading...</div></Layout>;
    if (!customer) return <Layout><div className={styles.loading}>Customer not found</div></Layout>;

    return (
        <Layout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => navigate("/customers")}>← Back</button>
                    <div className={styles.headerRight}>
                        <h1>{customer.name}</h1>
                        <button className={styles.editBtn} onClick={() => navigate(`/customers/${id}/edit`)}>Edit</button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Customer Info Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Customer Info</h2>
                        <div className={styles.infoGrid}>
                            <InfoRow label="Business" value={customer.business_name || "—"} />
                            <InfoRow label="Mobile" value={customer.mobile} />
                            <InfoRow label="Email" value={customer.email || "—"} />
                            <InfoRow label="GST" value={customer.gst_number || "—"} />
                            <InfoRow label="Address" value={customer.address || "—"} />
                            <InfoRow
                                label="Status"
                                value={<Badge text={customer.status} />}
                            />
                            <InfoRow
                                label="Type"
                                value={<Badge text={customer.customer_type} />}
                            />
                            <InfoRow
                                label="Follow-up"
                                value={customer.follow_up_date
                                    ? new Date(customer.follow_up_date).toLocaleDateString()
                                    : "—"}
                            />
                            <InfoRow label="Added by" value={customer.created_by_name || "—"} />
                            <InfoRow label="Notes" value={customer.notes || "—"} />
                        </div>
                    </div>

                    {/* Follow-up Section */}
                    <div className={styles.followupSection}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Add Follow-up Note</h2>
                            <form onSubmit={handleAddNote} className={styles.noteForm}>
                                <textarea
                                    placeholder="Write your follow-up note here..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    required
                                    className={styles.noteInput}
                                />
                                <div className={styles.noteFooter}>
                                    <div className={styles.field}>
                                        <label>Next Follow-up Date</label>
                                        <input
                                            type="date"
                                            value={followDate}
                                            onChange={(e) => setFollowDate(e.target.value)}
                                            className={styles.dateInput}
                                        />
                                    </div>
                                    <button type="submit" className={styles.noteBtn} disabled={submitting}>
                                        {submitting ? "Saving..." : "Add Note"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Follow-up History */}
                        <div className={styles.card} style={{ marginTop: "1.2rem" }}>
                            <h2 className={styles.cardTitle}>Follow-up History ({customer.followups?.length || 0})</h2>
                            {!customer.followups?.length ? (
                                <p className={styles.empty}>No follow-ups yet</p>
                            ) : (
                                <div className={styles.timeline}>
                                    {customer.followups.map((f) => (
                                        <div key={f.id} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} />
                                            <div className={styles.timelineContent}>
                                                <p className={styles.timelineNote}>{f.note}</p>
                                                <div className={styles.timelineMeta}>
                                                    <span>By {f.added_by || "—"}</span>
                                                    {f.follow_up_date && (
                                                        <span>• Next: {new Date(f.follow_up_date).toLocaleDateString()}</span>
                                                    )}
                                                    <span>• {new Date(f.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
