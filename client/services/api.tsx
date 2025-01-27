import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import config from '../app/config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const accessToken = await SecureStore.getItemAsync('accessToken');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[DEBUG] Otrzymano odpowiedz 401, inercetor działa');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        alert('Token jest nieważny, musisz się ponownie zalogować');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${config.apiUrl}/refresh-token`, { refreshToken });
        const { accessToken } = response.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        error.config.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(error.config);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
