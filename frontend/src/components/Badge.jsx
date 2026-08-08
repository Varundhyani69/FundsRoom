import styles from "./Badge.module.css";

const colorMap = {
    lead: "orange",
    active: "green",
    inactive: "gray",
    draft: "orange",
    confirmed: "green",
    cancelled: "red",
    retail: "blue",
    wholesale: "purple",
    distributor: "teal",
    admin: "red",
    sales: "blue",
    warehouse: "orange",
    accounts: "green",
};

export default function Badge({ text }) {
    const color = colorMap[text?.toLowerCase()] || "gray";
    return (
        <span className={`${styles.badge} ${styles[color]}`}>
            {text}
        </span>
    );
}
