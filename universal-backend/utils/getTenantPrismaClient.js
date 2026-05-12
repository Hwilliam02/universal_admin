import mysql from 'mysql2/promise';

async function getTenantConnection(tenantDbUri) {
  console.log(tenantDbUri,'database')
  try {
    // Use createConnection for single connection
    const connection = await mysql.createConnection(tenantDbUri);
    console.log("✅ Connected to tenant DB:", tenantDbUri);
    return connection; // connection.execute(...) will work
  } catch (error) {
    console.error("❌ Failed to connect to tenant DB:", error.message);
    throw error;
  }
}

export { getTenantConnection  };
