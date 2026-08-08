require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./connection");

const users = [
    { name: "Admin User", email: "admin@erp.com", password: "Admin@123", role: "admin" },
    { name: "Sales Person", email: "sales@erp.com", password: "Sales@123", role: "sales" },
    { name: "Warehouse Staff", email: "warehouse@erp.com", password: "Warehouse@123", role: "warehouse" },
    { name: "Accounts Team", email: "accounts@erp.com", password: "Accounts@123", role: "accounts" },
];

async function seed() {
    try {
        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 12);
            await pool.query(
                `INSERT INTO users (name, email, password, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
                [u.name, u.email, hash, u.role]
            );

            console.log(`Seeded: ${u.email}  (${u.role})`);
        }

        console.log("\nAll seed users created. Test credentials:");
        users.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email}  /  ${u.password}`));
    } catch (err) {
        console.error("Seed failed:", err.message);
    } finally {
        await pool.end();
    }
}

seed();
