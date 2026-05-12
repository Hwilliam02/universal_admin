import mongoose from 'mongoose';
import Company from '../models/Company.js';
import { getTenantConnection  } from './getTenantPrismaClient.js';
import { randomUUID  } from 'crypto';

const getTenant = async (id, res) => {
  console.log(id,'this is the id')
  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "Missing tenant id" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid tenant id" });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }
console.log(company.dbUri)
    const connection = await getTenantConnection(company.dbUri);
    return connection;

  } catch (error) {
    console.error("❌ Error in getTenant:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const generateUUIDv7 = ()=> {
  return randomUUID({ version: 7 });
};

 export { getTenant, generateUUIDv7 };