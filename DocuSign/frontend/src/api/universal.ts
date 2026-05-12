import axios from "axios";

const universalBaseURL =
  import.meta.env.VITE_UNIVERSAL_API_URL ||
  "http://localhost:4000/server1/api/v1";

const universalApi = axios.create({ baseURL: universalBaseURL, withCredentials: true });

export default universalApi;
