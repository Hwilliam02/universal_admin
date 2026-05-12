import axios from 'axios';

const UNIVERSAL_URL = (process.env.UNIVERSAL_BACKEND_URL || 'http://localhost:4000/server1/api/v1') + '/universal-auth';

const masterLogin = async (req, res) => {
  try {
    const { email, password, product_id } = req.body;
    
    const response = await axios.post(`${UNIVERSAL_URL}/login`, {
        email,
        password,
        product_id
    }, {
        headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.ip
        }
    });


    return res.status(response.status).json(response.data);
  } catch (proxyError) {
    const status = proxyError.response?.status || 500;
    const data = proxyError.response?.data || { error: 'Failed to authenticate via Universal Backend' };
    return res.status(status).json(data);
  }
};

const masterVerify = async (req, res) => {
  try {
    const { email, verification_code, new_password } = req.body;
    
    const response = await axios.post(`${UNIVERSAL_URL}/verify`, {
        email,
        verification_code,
        new_password
    });
    
    return res.status(response.status).json(response.data);
  } catch (proxyError) {
    const status = proxyError.response?.status || 500;
    const data = proxyError.response?.data || { error: 'Failed to verify via Universal Backend' };
    return res.status(status).json(data);
  }
};

const refreshAppToken = async (req, res) => {
  try {
    const { refresh_token, product_id } = req.body; 

    const response = await axios.post(`${UNIVERSAL_URL}/refresh`, {
        refresh_token,
        product_id
    });
    
    return res.status(response.status).json(response.data);
  } catch (proxyError) {
    const status = proxyError.response?.status || 500;
    const data = proxyError.response?.data || { error: 'Failed to refresh token via Universal Backend' };
    return res.status(status).json(data);
  }
};

export { 
    masterLogin,
    masterVerify,
    refreshAppToken
};
