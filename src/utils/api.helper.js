import axios from 'axios';

/**
 * Generic API call helper
 * @param {Object} options              - Axios request options
 * @param {string} options.method       - HTTP method (GET, POST, etc.)
 * @param {string} options.url          - API URL
 * @param {Object} [options.headers]    - Request headers
 * @param {Object} [options.params]     - Query parameters
 * @param {Object} [options.data]       - POST body data
 * @returns {Promise<Object>}           - API response data
 */
export async function callApi({ method, url, headers = {}, params = {}, data = {} }) {
  try {
    const response = await axios({
      method,
      url,
      headers,
      params,
      data,
      timeout: 10000, // 10s timeout
    });

    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${url}`, error.message);
    throw new Error(error.response?.data?.error || error.message);
  }
}
