const mongoose = require("mongoose");
const dns = require("node:dns");

// Fallback to public DNS in case SRV URI strings are used on restrictive networks
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder("ipv4first");
    }
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
    // Ignore if not supported
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log(`MongoDB database: ${mongoose.connection.name}`);
        console.log("MongoDB connected successfully ✅");
    } catch (error) {
        console.error("MongoDB connection failed ❌");
        console.error(error.message);

        process.exit(1);
    }
};

module.exports = connectDB;
