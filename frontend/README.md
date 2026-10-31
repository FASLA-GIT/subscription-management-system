# Brightloop Frontend — SubSync UI & Accessibility Engine

Built with **React 18**, **Vite**, **Tailwind CSS**, **React Router v6**, **Recharts**, and **Lucide React**.

## Key Features & Accessibility Architecture

### 1. Universal Accessibility (Built-in)
- **High-Contrast Mode**: Dedicated toggle in the navigation bar applies strong contrast outlines, black/white high-visibility text, and enhanced border borders.
- **Adjustable Text Size**: Dynamic font scaling (`A` = 16px, `A+` = 18px, `A++` = 20px) configured across document root via CSS variables.
- **Screen Reader & Live Regions**: Dedicated `aria-live="polite"` region for real-time announcements when adding items, switching tabs, or modifying records.
- **Read Aloud (Web Speech API)**: "Read Summary" on Dashboard and "Read Aloud" on Invoices speak billing metrics and invoice details via browser speech synthesis.
- **Multi-channel Status Indicators**: Never relies on color alone. Every status badge pairs accessible SVG icons (`CheckCircle`, `Clock`, `AlertTriangle`, etc.) with explicit text labels and ARIA status attributes.
- **Keyboard Navigation & Skip Link**: `<a href="#main-content" className="skip-link">Skip to main content</a>` for keyboard users, paired with visible focus rings (`:focus-visible`).

### 2. Role-Based Views & 1-Click Demo Persona Switcher
- **Admin**: Full control over products, plans, subscriptions, automated billing, discounts, payments, and customers.
- **Staff**: Operational workflows for subscriptions, invoices, and customer management.
- **Customer**: Dedicated client self-service portal to view own subscriptions, review invoices, and record settlements.
- **Demo Switcher**: Top right dropdown lets hackathon judges test all three personas with a single click.

### 3. Automated Billing & Duplicate Prevention
- **⚡ Generate Due Invoices**: Scans active subscriptions, calculates billing periods, and automatically creates invoices.
- **Duplicate Prevention**: Re-running generation verifies existing invoices by `subscription_id` and `billing_period_start`, preventing double-billing.

### 4. Resilient API & Offline Mock Fallback
- Configured with Axios to talk to `http://localhost:8000/api` (via Vite proxy).
- If backend is offline or during testing, automatically falls back to reactive in-memory state with localStorage persistence.
- Live backend connection health indicator pill in top navigation bar (`API Live` vs `Demo Mode`).

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

