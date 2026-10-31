import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('brightloop_demo_token') || localStorage.getItem('brightloop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Seed Initial Mock State for Offline / Demo Resilience
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Business Software Suite',
    type: 'software',
    sales_price: 2000,
    cost_price: 800,
    notes: 'Core enterprise resource planning and billing system.',
    variants: [
      { id: 101, name: 'Standard (Standalone)', additional_price: 0 },
      { id: 102, name: 'Odoo Integration Pack', additional_price: 560 },
      { id: 103, name: 'Cloud Multi-Tenant Edition', additional_price: 950 },
    ],
  },
  {
    id: 2,
    name: 'Advanced Analytics & AI Forecasting',
    type: 'addon',
    sales_price: 1500,
    cost_price: 450,
    notes: 'Predictive revenue forecasting and churn detector module.',
    variants: [
      { id: 104, name: 'Basic Reporting', additional_price: 0 },
      { id: 105, name: 'Real-time AI Streams', additional_price: 750 },
    ],
  },
  {
    id: 3,
    name: '24/7 Dedicated Support SLA',
    type: 'service',
    sales_price: 800,
    cost_price: 300,
    notes: '1-hour guaranteed incident response time with dedicated TAM.',
    variants: [],
  },
];

const INITIAL_PLANS = [
  {
    id: 1,
    name: 'Growth Monthly Plan',
    price: 3000,
    billing_frequency: 'monthly',
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    auto_closure: false,
    early_closure_allowed: true,
    pause_allowed: true,
    renewal_allowed: true,
  },
  {
    id: 2,
    name: 'Enterprise Annual Plan',
    price: 32000,
    billing_frequency: 'yearly',
    min_quantity: 5,
    start_date: '2026-01-01',
    end_date: '2027-12-31',
    auto_closure: false,
    early_closure_allowed: false,
    pause_allowed: true,
    renewal_allowed: true,
  },
  {
    id: 3,
    name: 'Weekly Sprint Pilot',
    price: 850,
    billing_frequency: 'weekly',
    min_quantity: 1,
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    auto_closure: true,
    early_closure_allowed: true,
    pause_allowed: false,
    renewal_allowed: false,
  },
];

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Acme Technologies Ltd',
    contact_name: 'Rahul Verma',
    email: 'rahul@acmecorp.in',
    phone: '+91 98765 43210',
    address: 'Tower B, Cyber City, Gurugram, Haryana',
    tax_id: 'GSTIN07AABCB1234F1Z5',
  },
  {
    id: 2,
    name: 'Zenith Logistics Global',
    contact_name: 'Ananya Deshmukh',
    email: 'ananya@zenithlog.com',
    phone: '+91 98200 11223',
    address: 'BKC Bandra East, Mumbai, Maharashtra',
    tax_id: 'GSTIN27AACCA5678K1Z2',
  },
  {
    id: 3,
    name: 'Nexus Retail Innovations',
    contact_name: 'Karan Mehra',
    email: 'karan@nexusretail.com',
    phone: '+91 91234 56789',
    address: 'Indiranagar 100ft Road, Bengaluru, Karnataka',
    tax_id: 'GSTIN29AABCR9012M1Z8',
  },
];

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 1,
    subscription_number: 'SUB-2026-001',
    customer_id: 1,
    customer_name: 'Acme Technologies Ltd',
    plan_id: 1,
    plan_name: 'Growth Monthly Plan',
    status: 'active', // draft, quotation, confirmed, active, paused, closed
    start_date: '2026-10-01',
    expiry_date: '2027-10-01',
    next_billing_date: '2026-11-01',
    payment_terms: 'Net 15',
    quantity: 2,
    unit_price: 2560,
    taxes: 921.6, // 18% GST
    total_amount: 6041.6,
    items: [
      {
        product_id: 1,
        product_name: 'Business Software Suite',
        variant_id: 102,
        variant_name: 'Odoo Integration Pack',
        quantity: 2,
        unit_price: 2560,
        amount: 5120,
      },
    ],
  },
  {
    id: 2,
    subscription_number: 'SUB-2026-002',
    customer_id: 2,
    customer_name: 'Zenith Logistics Global',
    plan_id: 2,
    plan_name: 'Enterprise Annual Plan',
    status: 'active',
    start_date: '2026-09-15',
    expiry_date: '2027-09-15',
    next_billing_date: '2026-10-15', // DUE for invoice!
    payment_terms: 'Immediate',
    quantity: 5,
    unit_price: 32000,
    taxes: 28800,
    total_amount: 188800,
    items: [
      {
        product_id: 1,
        product_name: 'Business Software Suite',
        variant_id: 103,
        variant_name: 'Cloud Multi-Tenant Edition',
        quantity: 5,
        unit_price: 2950,
        amount: 14750,
      },
      {
        product_id: 2,
        product_name: 'Advanced Analytics & AI Forecasting',
        variant_id: 105,
        variant_name: 'Real-time AI Streams',
        quantity: 5,
        unit_price: 2250,
        amount: 11250,
      },
    ],
  },
  {
    id: 3,
    subscription_number: 'SUB-2026-003',
    customer_id: 3,
    customer_name: 'Nexus Retail Innovations',
    plan_id: 3,
    plan_name: 'Weekly Sprint Pilot',
    status: 'quotation',
    start_date: '2026-10-25',
    expiry_date: '2026-11-25',
    next_billing_date: '2026-11-01',
    payment_terms: 'Net 30',
    quantity: 1,
    unit_price: 850,
    taxes: 153,
    total_amount: 1003,
    items: [
      {
        product_id: 1,
        product_name: 'Business Software Suite',
        variant_id: 101,
        variant_name: 'Standard (Standalone)',
        quantity: 1,
        unit_price: 2000,
        amount: 2000,
      },
    ],
  },
];

const INITIAL_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-2026-001',
    subscription_id: 1,
    subscription_number: 'SUB-2026-001',
    customer_id: 1,
    customer_name: 'Acme Technologies Ltd',
    customer_email: 'rahul@acmecorp.in',
    billing_period_start: '2026-10-01',
    billing_period_end: '2026-10-31',
    due_date: '2026-10-15',
    subtotal: 5120,
    tax_amount: 921.6,
    discount_amount: 0,
    final_amount: 6041.6,
    paid_amount: 6041.6,
    outstanding_amount: 0,
    status: 'paid', // draft, confirmed, paid, overdue
    items: [
      {
        description: 'Business Software Suite (Odoo Integration Pack) x2',
        quantity: 2,
        unit_price: 2560,
        amount: 5120,
      },
    ],
  },
  {
    id: 2,
    invoice_number: 'INV-2026-002',
    subscription_id: 2,
    subscription_number: 'SUB-2026-002',
    customer_id: 2,
    customer_name: 'Zenith Logistics Global',
    customer_email: 'ananya@zenithlog.com',
    billing_period_start: '2026-09-15',
    billing_period_end: '2026-10-14',
    due_date: '2026-09-30', // overdue!
    subtotal: 26000,
    tax_amount: 4680,
    discount_amount: 2000,
    final_amount: 28680,
    paid_amount: 10000,
    outstanding_amount: 18680,
    status: 'overdue', // overdue because due_date passed and outstanding > 0
    items: [
      {
        description: 'Business Software Suite (Cloud Multi-Tenant) x5',
        quantity: 5,
        unit_price: 2950,
        amount: 14750,
      },
      {
        description: 'Advanced Analytics (AI Streams) x5',
        quantity: 5,
        unit_price: 2250,
        amount: 11250,
      },
    ],
  },
];

const INITIAL_PAYMENTS = [
  {
    id: 1,
    invoice_id: 1,
    invoice_number: 'INV-2026-001',
    customer_name: 'Acme Technologies Ltd',
    payment_method: 'Bank Transfer (NEFT)',
    amount: 6041.6,
    payment_date: '2026-10-12',
    note: 'UTR: SBIN00293817293 - Full settlement',
  },
  {
    id: 2,
    invoice_id: 2,
    invoice_number: 'INV-2026-002',
    customer_name: 'Zenith Logistics Global',
    payment_method: 'UPI / Corporate NetBanking',
    amount: 10000,
    payment_date: '2026-09-28',
    note: 'Part payment installment 1',
  },
];

const INITIAL_DISCOUNTS = [
  {
    id: 1,
    code: 'FESTIVE10',
    name: 'Festive Season 10% Off',
    type: 'percentage',
    value: 10,
    min_purchase: 5000,
    min_quantity: 1,
    start_date: '2026-09-01',
    end_date: '2026-11-30',
    usage_limit: 50,
    times_used: 12,
    is_active: true,
  },
  {
    id: 2,
    code: 'ENTERPRISE2K',
    name: 'Enterprise Flat ₹2,000 Off',
    type: 'fixed',
    value: 2000,
    min_purchase: 20000,
    min_quantity: 3,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 20,
    times_used: 4,
    is_active: true,
  },
];

// Helper to retrieve or persist state in localStorage for resilient demo
function getStorage(key, initial) {
  const saved = localStorage.getItem(`brightloop_data_${key}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  localStorage.setItem(`brightloop_data_${key}`, JSON.stringify(initial));
  return initial;
}

function setStorage(key, data) {
  localStorage.setItem(`brightloop_data_${key}`, JSON.stringify(data));
}

// Check if backend API is alive
export async function checkBackendHealth() {
  try {
    const res = await api.get('/auth/me', { timeout: 1500 });
    return { isLive: true, data: res.data };
  } catch (err) {
    return { isLive: false, error: err.message };
  }
}

// Exported Service Methods with automatic live API try + demo fallback
export const ProductService = {
  async getAll() {
    try {
      const res = await api.get('/products');
      return res.data;
    } catch {
      return getStorage('products', INITIAL_PRODUCTS);
    }
  },
  async create(data) {
    try {
      const res = await api.post('/products', data);
      return res.data;
    } catch {
      const products = getStorage('products', INITIAL_PRODUCTS);
      const newProd = { ...data, id: Date.now(), variants: data.variants || [] };
      const updated = [newProd, ...products];
      setStorage('products', updated);
      return newProd;
    }
  },
  async update(id, data) {
    try {
      const res = await api.put(`/products/${id}`, data);
      return res.data;
    } catch {
      const products = getStorage('products', INITIAL_PRODUCTS);
      const updated = products.map(p => p.id === id ? { ...p, ...data } : p);
      setStorage('products', updated);
      return { ...data, id };
    }
  },
};

export const PlanService = {
  async getAll() {
    try {
      const res = await api.get('/plans');
      return res.data;
    } catch {
      return getStorage('plans', INITIAL_PLANS);
    }
  },
  async create(data) {
    try {
      const res = await api.post('/plans', data);
      return res.data;
    } catch {
      const plans = getStorage('plans', INITIAL_PLANS);
      const newPlan = { ...data, id: Date.now() };
      const updated = [newPlan, ...plans];
      setStorage('plans', updated);
      return newPlan;
    }
  },
};

export const CustomerService = {
  async getAll() {
    try {
      const res = await api.get('/customers');
      return res.data;
    } catch {
      return getStorage('customers', INITIAL_CUSTOMERS);
    }
  },
  async create(data) {
    try {
      const res = await api.post('/customers', data);
      return res.data;
    } catch {
      const customers = getStorage('customers', INITIAL_CUSTOMERS);
      const newCust = { ...data, id: Date.now() };
      const updated = [newCust, ...customers];
      setStorage('customers', updated);
      return newCust;
    }
  },
};

export const SubscriptionService = {
  async getAll() {
    try {
      const res = await api.get('/subscriptions');
      return res.data;
    } catch {
      return getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
    }
  },
  async getById(id) {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      return res.data;
    } catch {
      const subs = getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
      return subs.find(s => s.id === Number(id));
    }
  },
  async create(data) {
    try {
      const res = await api.post('/subscriptions', data);
      return res.data;
    } catch {
      const subs = getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
      const count = subs.length + 1;
      const subNum = `SUB-2026-${String(count).padStart(3, '0')}`;
      const newSub = {
        ...data,
        id: Date.now(),
        subscription_number: subNum,
        status: data.status || 'draft',
      };
      const updated = [newSub, ...subs];
      setStorage('subscriptions', updated);
      return newSub;
    }
  },
  async updateStatus(id, newStatus) {
    try {
      const res = await api.patch(`/subscriptions/${id}/status`, { status: newStatus });
      return res.data;
    } catch {
      const subs = getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
      const updated = subs.map(s => s.id === Number(id) ? { ...s, status: newStatus } : s);
      setStorage('subscriptions', updated);
      return updated.find(s => s.id === Number(id));
    }
  },
};

export const InvoiceService = {
  async getAll() {
    try {
      const res = await api.get('/invoices');
      return res.data;
    } catch {
      return getStorage('invoices', INITIAL_INVOICES);
    }
  },
  async getById(id) {
    try {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    } catch {
      const invs = getStorage('invoices', INITIAL_INVOICES);
      return invs.find(i => i.id === Number(id));
    }
  },
  async generateDueInvoices() {
    try {
      const res = await api.post('/billing/generate-due');
      return res.data;
    } catch {
      // Automatic invoice generation simulation based on Section 3.G & Section 7:
      // - Finds eligible active subscriptions
      // - Prevents duplicate invoices for the same subscription & billing period
      const subs = getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
      const existingInvoices = getStorage('invoices', INITIAL_INVOICES);
      const generated = [];

      const activeSubs = subs.filter(s => s.status === 'active');
      const today = new Date().toISOString().split('T')[0];

      activeSubs.forEach(sub => {
        // Calculate billing period
        const periodStart = sub.start_date || today;
        const periodEnd = sub.next_billing_date || today;

        // Check duplicate prevention: same subscription & period
        const isDuplicate = existingInvoices.some(
          inv => inv.subscription_id === sub.id && inv.billing_period_start === periodStart
        );

        if (!isDuplicate) {
          const invCount = existingInvoices.length + generated.length + 1;
          const invNumber = `INV-2026-${String(invCount).padStart(3, '0')}`;
          
          const subtotal = sub.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || (sub.quantity * sub.unit_price);
          const tax = Number((subtotal * 0.18).toFixed(2));
          const discount = 0;
          const finalAmount = Number((subtotal + tax - discount).toFixed(2));

          const newInv = {
            id: Date.now() + generated.length,
            invoice_number: invNumber,
            subscription_id: sub.id,
            subscription_number: sub.subscription_number,
            customer_id: sub.customer_id,
            customer_name: sub.customer_name,
            customer_email: `billing@${sub.customer_name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            billing_period_start: periodStart,
            billing_period_end: periodEnd,
            due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            subtotal,
            tax_amount: tax,
            discount_amount: discount,
            final_amount: finalAmount,
            paid_amount: 0,
            outstanding_amount: finalAmount,
            status: 'confirmed',
            items: sub.items || [
              {
                description: `${sub.plan_name} Subscription`,
                quantity: sub.quantity,
                unit_price: sub.unit_price,
                amount: subtotal,
              }
            ],
          };
          generated.push(newInv);
        }
      });

      if (generated.length > 0) {
        const updated = [...generated, ...existingInvoices];
        setStorage('invoices', updated);
      }

      return {
        success: true,
        generated_count: generated.length,
        invoices: generated,
        message: generated.length > 0 
          ? `Generated ${generated.length} new invoices automatically (duplicates prevented).`
          : 'All active subscriptions are already up to date. No duplicate invoices created.',
      };
    }
  },
  async updateStatus(id, newStatus) {
    try {
      const res = await api.patch(`/invoices/${id}/status`, { status: newStatus });
      return res.data;
    } catch {
      const invs = getStorage('invoices', INITIAL_INVOICES);
      const updated = invs.map(i => i.id === Number(id) ? { ...i, status: newStatus } : i);
      setStorage('invoices', updated);
      return updated.find(i => i.id === Number(id));
    }
  },
};

export const PaymentService = {
  async getAll() {
    try {
      const res = await api.get('/payments');
      return res.data;
    } catch {
      return getStorage('payments', INITIAL_PAYMENTS);
    }
  },
  async recordPayment(paymentData) {
    try {
      const res = await api.post('/payments', paymentData);
      return res.data;
    } catch {
      const payments = getStorage('payments', INITIAL_PAYMENTS);
      const invoices = getStorage('invoices', INITIAL_INVOICES);

      const inv = invoices.find(i => i.id === Number(paymentData.invoice_id));
      const payAmount = Number(paymentData.amount);

      const newPayment = {
        id: Date.now(),
        invoice_id: Number(paymentData.invoice_id),
        invoice_number: inv ? inv.invoice_number : `INV-${paymentData.invoice_id}`,
        customer_name: inv ? inv.customer_name : 'Customer',
        payment_method: paymentData.payment_method,
        amount: payAmount,
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        note: paymentData.note || 'Direct payment settlement',
      };

      const updatedPayments = [newPayment, ...payments];
      setStorage('payments', updatedPayments);

      // Update invoice paid & outstanding amounts
      if (inv) {
        const newPaid = Number((inv.paid_amount + payAmount).toFixed(2));
        const newOutstanding = Number(Math.max(0, inv.final_amount - newPaid).toFixed(2));
        let newStatus = inv.status;
        if (newOutstanding === 0) {
          newStatus = 'paid';
        } else if (newPaid > 0) {
          newStatus = 'confirmed'; // partially paid
        }

        const updatedInvoices = invoices.map(i => 
          i.id === inv.id 
            ? { ...i, paid_amount: newPaid, outstanding_amount: newOutstanding, status: newStatus }
            : i
        );
        setStorage('invoices', updatedInvoices);
      }

      return newPayment;
    }
  },
};

export const DiscountService = {
  async getAll() {
    try {
      const res = await api.get('/discounts');
      return res.data;
    } catch {
      return getStorage('discounts', INITIAL_DISCOUNTS);
    }
  },
  async create(data) {
    try {
      const res = await api.post('/discounts', data);
      return res.data;
    } catch {
      const discounts = getStorage('discounts', INITIAL_DISCOUNTS);
      const newDisc = {
        ...data,
        id: Date.now(),
        times_used: 0,
        is_active: true,
      };
      const updated = [newDisc, ...discounts];
      setStorage('discounts', updated);
      return newDisc;
    }
  },
};

export const DashboardService = {
  async getSummary() {
    try {
      const res = await api.get('/dashboard/summary');
      return res.data;
    } catch {
      const subs = getStorage('subscriptions', INITIAL_SUBSCRIPTIONS);
      const invs = getStorage('invoices', INITIAL_INVOICES);
      const payments = getStorage('payments', INITIAL_PAYMENTS);

      const activeSubs = subs.filter(s => s.status === 'active').length;
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalOutstanding = invs.reduce((sum, i) => sum + Number(i.outstanding_amount || 0), 0);
      const overdueCount = invs.filter(i => i.status === 'overdue' || (i.outstanding_amount > 0 && new Date(i.due_date) < new Date())).length;

      return {
        active_subscriptions: activeSubs,
        total_revenue: totalRevenue,
        outstanding_amount: totalOutstanding,
        overdue_invoices: overdueCount,
        total_invoices: invs.length,
        total_customers: getStorage('customers', INITIAL_CUSTOMERS).length,
      };
    }
  },
  async getRevenueChart() {
    try {
      const res = await api.get('/dashboard/revenue');
      return res.data;
    } catch {
      return [
        { month: 'Jun 2026', revenue: 14500, invoices: 8 },
        { month: 'Jul 2026', revenue: 22000, invoices: 12 },
        { month: 'Aug 2026', revenue: 28400, invoices: 16 },
        { month: 'Sep 2026', revenue: 36200, invoices: 21 },
        { month: 'Oct 2026', revenue: 44721.6, invoices: 26 },
      ];
    }
  },
  async getPlanDistribution() {
    return [
      { name: 'Growth Monthly Plan', count: 14, value: 42000 },
      { name: 'Enterprise Annual Plan', count: 8, value: 256000 },
      { name: 'Weekly Sprint Pilot', count: 5, value: 4250 },
    ];
  },
};

export default api;

