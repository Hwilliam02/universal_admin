import mongoose from 'mongoose';

// Cache connections to avoid reconnecting constantly
const connections = {};

const connectToMongoDB = async (uri) => {
  if (connections[uri]) {
    return connections[uri];
  }
  
  const conn = mongoose.createConnection(uri);
  connections[uri] = conn;
  return conn;
};

// Lazy provisioning logic
const provisionUserInSatellite = async (product, globalUser, role) => {
  try {
    const { db_driver, db_uri } = product;

    if (!db_uri) {
      console.warn(`No DB URI configured for product ${product.name}, skipping lazy provisioning.`);
      return true; // Soft fail, maybe they handle it manually
    }

    if (db_driver === 'MONGODB') {
      const conn = await connectToMongoDB(db_uri);
      
      // Assume satellite DB has a Users collection 
      // where we inject the global_user_id and role
      const SatelliteUser = conn.models.User || conn.model('User', new mongoose.Schema({
        global_user_id: String,
        username: String,
        name: String,
        email: String,
        global_company_id: String,
        role: String,
        status: String
      }, { strict: false }), 'users');

      const displayName = globalUser.username || globalUser.email;
      const existingUser = await SatelliteUser.findOne({ global_user_id: globalUser.global_user_id });
      if (!existingUser) {
        await SatelliteUser.create({
          global_user_id: globalUser.global_user_id,
          username: globalUser.username,
          name: displayName,
          email: globalUser.email,
          global_company_id: globalUser.global_company_id,
          role: role,
          status: 'Active',
          provisioned_by: 'Universal-Master',
          provisioned_at: new Date()
        });
        console.log(`Provisioned user ${globalUser.email} in ${product.name} (MongoDB)`);
      }
      return true;

    } else if (db_driver === 'MYSQL') {
      // Basic MySQL provisioning stub
      console.log(`MySQL provisioning logic pending for ${product.name}.`);
      return true;
    } else {
      throw new Error(`Unsupported DB Driver: ${db_driver}`);
    }
  } catch (error) {
    console.error(`Failed to provision user in ${product.name}:`, error.message);
    throw error; // Or return false if we don't want to block token generation
  }
};

export { provisionUserInSatellite
 };
