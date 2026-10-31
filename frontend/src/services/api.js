import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'brightloop_token';
export const USER_STORAGE_KEY = 'brightloop_user';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !['/auth/login', '/auth/register'].includes(error.config?.url)) {
      window.dispatchEvent(new Event('brightloop:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export async function checkBackendHealth() {
  try {
    const response = await api.get('/health');
    return { isLive: true, data: response.data };
  } catch (error) {
    return { isLive: false, error: error.message };
  }
}

export const AuthService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
    return data;
  },
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const ProductService = {
  async getAll() { return (await api.get('/products')).data; },
  async create(data) { return (await api.post('/products', data)).data; },
  async update(id, data) { return (await api.put(`/products/${id}`, data)).data; },
};

export const PlanService = {
  async getAll() { return (await api.get('/plans')).data; },
  async create(data) { return (await api.post('/plans', data)).data; },
};

export const CustomerService = {
  async getAll() { return (await api.get('/customers')).data.items; },
  async create(data) { return (await api.post('/customers', data)).data; },
};

export const SubscriptionService = {
  async getAll() { return (await api.get('/subscriptions')).data; },
  async getById(id) { return (await api.get(`/subscriptions/${id}`)).data; },
  async create(data) { return (await api.post('/subscriptions', data)).data; },
  async updateStatus(id, status) { return (await api.patch(`/subscriptions/${id}/status`, { status })).data; },
};

export const InvoiceService = {
  async getAll() { return (await api.get('/invoices')).data; },
  async getById(id) { return (await api.get(`/invoices/${id}`)).data; },
  async generateDueInvoices() { return (await api.post('/billing/generate-due')).data; },
  async updateStatus(id, status) { return (await api.patch(`/invoices/${id}/status`, { status })).data; },
};

export const PaymentService = {
  async getAll() { return (await api.get('/payments')).data; },
  async recordPayment(data) { return (await api.post('/payments', data)).data; },
};

export const DiscountService = {
  async getAll() { return (await api.get('/discounts')).data; },
  async create(data) { return (await api.post('/discounts', data)).data; },
};

export const DashboardService = {
  async getSummary() { return (await api.get('/dashboard/summary')).data; },
  async getRevenueChart() { return (await api.get('/dashboard/revenue')).data; },
  async getPlanDistribution() {
    const [subscriptions, plans] = await Promise.all([
      api.get('/subscriptions'),
      api.get('/plans'),
    ]);
    const counts = new Map();
    for (const subscription of subscriptions.data) {
      if (subscription.status !== 'active') continue;
      const existing = counts.get(subscription.plan_id) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += Number(subscription.total_amount || 0);
      counts.set(subscription.plan_id, existing);
    }
    return [...counts.entries()].map(([planId, metrics]) => ({
      name: plans.data.find((plan) => plan.id === planId)?.name || 'Plan',
      ...metrics,
    }));
  },
};

export default api;
