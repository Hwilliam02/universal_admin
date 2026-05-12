import ProductRegistry from '../models/ProductRegistry.js';
import apiResponse from '../middleware/utils/apiResponse.js';

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const portalProductId = process.env.COMPANY_PORTAL_PRODUCT_ID;
    
    // Filter out the portal product
    const query = portalProductId ? { product_id: { $ne: portalProductId } } : {};
    
    const products = await ProductRegistry.find(query).select('-app_private_key');
    
    return apiResponse(res, 200, "success", "Products fetched successfully", products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return apiResponse(res, 500, false, error.message);
  }
};

export { 
    getAllProducts 
};
