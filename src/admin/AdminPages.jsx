import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { ADMIN_USER_KEY } from "../services/api";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
const date = (v) =>
    v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "--";

const STATUS_LIST = ["Pending","Confirmed","Preparing","Ready","Out for Delivery","Delivered","Completed","Cancelled"];
const STATUS_COLORS = {
    Pending: "bg-amber-100 text-amber-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Preparing: "bg-yellow-100 text-yellow-800",
    Ready: "bg-purple-100 text-purple-800",
    "Out for Delivery": "bg-indigo-100 text-indigo-800",
    Delivered: "bg-emerald-100 text-emerald-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
};

function Badge({ children }) {
    const cls = STATUS_COLORS[children] || "bg-slate-100 text-slate-700";
    return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
function Loading() { return <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>; }
function ErrorBox({ error }) { return <div className="rounded-xl bg-red-50 p-5 text-red-700 shadow-sm"><b>Error:</b> {error}</div>; }
function Card({ label, value, color = "bg-white" }) { return <div className={`rounded-xl p-5 shadow-sm ${color}`}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function InfoPanel({ title, rows }) {
    return <div className="rounded-xl bg-white p-5 shadow-sm"><h3 className="font-bold">{title}</h3>{rows.map(([k, v]) => (<div className="mt-3 flex justify-between gap-3 text-sm" key={k}><span className="text-slate-500">{k}</span><b className="text-right">{v ?? "--"}</b></div>))}</div>;
}
function Panel({ title, items }) {
    const max = Math.max(...items.map((x) => x.count), 1);
    return <div className="rounded-xl bg-white p-5 shadow-sm"><h3 className="font-bold">{title}</h3><div className="mt-4 space-y-3">{items.length ? items.map((x) => (<div key={x._id}><div className="flex justify-between text-sm"><span>{x._id?.replaceAll("_", " ") || "Unknown"}</span><b>{x.count}</b></div><div className="mt-1 h-2 rounded bg-slate-100"><div style={{ width: `${(x.count / max) * 100}%` }} className="h-full rounded bg-amber-400" /></div></div>)) : <p className="text-sm text-slate-500">No data yet.</p>}</div></div>;
}
function Field({ label, ...props }) { return <label className="text-sm font-medium">{label}<input {...props} className="mt-1 w-full rounded-lg border p-3" /></label>; }
function FormShell({ error, children }) { return <div className="mt-5 max-w-2xl rounded-xl bg-white p-6 shadow-sm">{error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}{children}</div>; }

export function AdminDashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => { adminApi("/dashboard/stats").then(setData).catch((e) => setError(e.message)); }, []);
    if (error) return <ErrorBox error={error} />;
    if (!data) return <Loading />;
    return (
        <section>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-slate-500">Your restaurant business at a glance.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card label="Total Orders" value={data.totalOrders} />
                <Card label="Pending Orders" value={data.pendingOrders} color="bg-amber-50" />
                <Card label="Completed Orders" value={data.completedOrders} color="bg-emerald-50" />
                <Card label="Total Revenue" value={money(data.totalRevenue)} color="bg-violet-50" />
                <Card label="Customers" value={data.totalCustomers} />
                <Card label="Restaurants" value={data.totalRestaurants} />
                <Card label="Today Orders" value={data.todayOrders} />
                <Card label="Today Revenue" value={money(data.todayRevenue)} />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <Panel title="Order status" items={data.statuses} />
                <Panel title="Order type distribution" items={data.orderTypes} />
                <div className="rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold">Recent orders</h3>
                        <Link className="text-sm text-amber-700" to="/admin/orders">View all</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-slate-500">
                                <tr><th className="p-2">Customer</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.map((o) => (
                                    <tr className="border-b last:border-0" key={o._id}>
                                        <td className="p-2 font-medium">{o.customerName}</td>
                                        <td>{o.orderType.replaceAll("_", " ")}</td>
                                        <td>{money(o.totalAmount)}</td>
                                        <td><Badge>{o.status}</Badge></td>
                                        <td>{date(o.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function AdminOrders() {
    const [data, setData] = useState(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState("");
    const load = useCallback(() => {
        setError("");
        adminApi(`/orders?search=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}`)
            .then((res) => setData(res))
            .catch((e) => setError(e.message));
    }, [query, statusFilter]);
    useEffect(() => { load(); }, [statusFilter]);
    if (error) return <ErrorBox error={error} />;
    if (!data) return <Loading />;
    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Orders</h2>
                    <p className="text-slate-500">{data.pagination.total} orders found</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Customer or mobile" className="rounded-lg border px-3 py-2 flex-1 min-w-[160px] text-sm" />
                    <button onClick={load} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Search</button>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3">
                        <option value="">All</option>
                        {STATUS_LIST.map((x) => <option key={x}>{x}</option>)}
                    </select>
                </div>
            </div>
            <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>{["Order","Customer","Type","Items","Amount","Payment","Status","Date",""].map((x) => <th key={x} className="p-3">{x}</th>)}</tr>
                    </thead>
                    <tbody>
                        {data.orders.length ? data.orders.map((o) => (
                            <tr className="border-t" key={o._id}>
                                <td className="p-3 font-mono text-xs">#{o._id.slice(-6)}</td>
                                <td className="p-3"><b>{o.customerName}</b><br /><span className="text-slate-500">{o.mobile}</span></td>
                                <td className="p-3">{o.orderType.replaceAll("_", " ")}</td>
                                <td className="p-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                                <td className="p-3">{money(o.totalAmount)}</td>
                                <td className="p-3">{o.paymentMethod}<br /><Badge>{o.paymentStatus}</Badge></td>
                                <td className="p-3"><Badge>{o.status}</Badge></td>
                                <td className="p-3">{date(o.createdAt)}</td>
                                <td className="p-3"><Link className="font-semibold text-amber-700 hover:underline" to={`/admin/orders/${o._id}`}>View</Link></td>
                            </tr>
                        )) : <tr><td colSpan="9" className="p-8 text-center text-slate-500">No orders found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function AdminOrderDetails() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const loadOrder = useCallback(() => {
        setLoading(true);
        setError("");
        adminApi(`/orders/${id}`)
            .then(({ order: o }) => {
                setOrder(o);
                setSelectedStatus(o.status);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message || "Failed to load order");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => { loadOrder(); }, [loadOrder]);

    const handleUpdateStatus = async () => {
        if (selectedStatus === "Cancelled" && !window.confirm("Cancel this order?")) return;
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const res = await adminApi(`/orders/${id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: selectedStatus }),
            });
            setOrder(res.order);
            setSelectedStatus(res.order.status);
            setSuccessMsg(`Status updated to "${res.order.status}" successfully!`);
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (e) {
            setError(e.message || "Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    if (error && !order) return <ErrorBox error={error} />;

    return (
        <section>
            <Link to="/admin/orders" className="text-sm text-amber-700 hover:underline">
                Back to Orders
            </Link>
            <div className="mt-3 flex flex-wrap justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Order #{id.slice(-6)}</h2>
                    <p className="text-slate-500">Placed {date(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="rounded-lg border px-3 py-2">
                        {STATUS_LIST.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <button disabled={saving || selectedStatus === order.status} onClick={handleUpdateStatus} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
                        {saving ? "Saving..." : "Update Status"}
                    </button>
                </div>
            </div>
            {successMsg && <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">&#10003; {successMsg}</div>}
            {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">&#9888; {error}</div>}
            <div className="mt-2">Current status: <Badge>{order.status}</Badge></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
                    <h3 className="font-bold">Order Items</h3>
                    {order.items.map((item, n) => (
                        <div className="mt-4 flex justify-between border-b pb-3" key={n}>
                            <div><b>{item.name}</b><p className="text-sm text-slate-500">{money(item.price)} x {item.quantity}</p></div>
                            <b>{money(item.price * item.quantity)}</b>
                        </div>
                    ))}
                    {order.discountAmount > 0 && (
                        <div className="mt-4 space-y-1 text-sm border-t pt-3">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span><span>{money(order.originalSubtotal || (order.totalAmount + order.discountAmount))}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Discount ({order.couponCode ? `Coupon: ${order.couponCode}` : (order.sessionOfferTitle || "Offer")})</span>
                                <span>-{money(order.discountAmount)}</span>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 flex justify-between text-lg font-bold border-t pt-3">
                        <span>Total</span><span>{money(order.totalAmount)}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <InfoPanel title="Customer" rows={[["Name", order.customerName],["Mobile", order.mobile],["Address", order.address || "--"],["Table", order.tableNumber || "--"]]} />
                    <InfoPanel title="Payment" rows={[["Method", order.paymentMethod],["Payment Status", order.paymentStatus],["Order Status", order.status],["Order Type", order.orderType?.replaceAll("_", " ")]]} />
                </div>
            </div>
        </section>
    );
}

export function AdminCustomers() {
    const [customers, setCustomers] = useState(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const load = useCallback(() => {
        setError("");
        setCustomers(null);
        adminApi(`/customers?search=${encodeURIComponent(search)}`)
            .then((x) => setCustomers(x.customers))
            .catch((e) => setError(e.message));
    }, [search]);
    useEffect(() => { load(); }, []);
    if (error) return <ErrorBox error={error} />;
    if (!customers) return <Loading />;
    return (
        <section>
            <h2 className="text-2xl font-bold">Customers</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="rounded-lg border px-3 py-2 flex-1 min-w-[200px] text-sm" placeholder="Search name, email or mobile" />
                <button onClick={load} className="rounded-lg bg-slate-900 px-4 text-white">Search</button>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr><th className="p-3">Customer</th><th className="p-3">Mobile</th><th className="p-3">Orders</th><th className="p-3">Total Spent</th><th className="p-3">Joined</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody>
                        {customers.length ? customers.map((c) => (
                            <tr className="border-t" key={c._id}>
                                <td className="p-3"><b>{c.name}</b><br /><span className="text-slate-500">{c.email}</span></td>
                                <td className="p-3">{c.mobile || "--"}</td>
                                <td className="p-3">{c.orderCount}</td>
                                <td className="p-3">{money(c.totalSpent)}</td>
                                <td className="p-3">{date(c.createdAt)}</td>
                                <td className="p-3"><Link className="font-semibold text-amber-700 hover:underline" to={`/admin/customers/${c._id}`}>View</Link></td>
                            </tr>
                        )) : <tr><td colSpan="6" className="p-8 text-center text-slate-500">No customers found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function AdminCustomerDetails() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        setError("");
        adminApi(`/customers/${id}`)
            .then((res) => setData(res))
            .catch((e) => setError(e.message));
    }, [id]);
    if (error) return <ErrorBox error={error} />;
    if (!data) return <Loading />;
    const { customer, orders, orderCount, totalSpent } = data;
    return (
        <section>
            <Link to="/admin/customers" className="text-sm text-amber-700 hover:underline">Back to Customers</Link>
            <h2 className="mt-3 text-2xl font-bold">{customer.name}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Card label="Total Orders" value={orderCount} />
                <Card label="Total Spent" value={money(totalSpent)} color="bg-emerald-50" />
                <Card label="Joined" value={date(customer.createdAt)} />
            </div>
            <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                <h3 className="font-bold">Contact Details</h3>
                <p className="mt-3 text-sm"><span className="text-slate-500">Email:</span> {customer.email}</p>
                <p className="mt-1 text-sm"><span className="text-slate-500">Mobile:</span> {customer.mobile || "--"}</p>
                <p className="mt-1 text-sm"><span className="text-slate-500">Address:</span> {customer.address || "No saved address"}</p>
                <h3 className="mt-6 font-bold">Order History</h3>
                {orders.length ? orders.map((o) => (
                    <div key={o._id} className="mt-3 flex items-center justify-between border-t pt-3">
                        <div>
                            <Link className="font-semibold text-amber-700 hover:underline" to={`/admin/orders/${o._id}`}>#{o._id.slice(-6)}</Link>
                            <span className="ml-2"><Badge>{o.status}</Badge></span>
                            <p className="mt-0.5 text-xs text-slate-500">{date(o.createdAt)}</p>
                        </div>
                        <b>{money(o.totalAmount)}</b>
                    </div>
                )) : <p className="mt-3 text-slate-500">No orders yet.</p>}
            </div>
        </section>
    );
}

export function AdminFood() {
    const [foods, setFoods] = useState(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const load = () => { setError(""); adminApi("/foods").then((x) => setFoods(x.items)).catch((e) => setError(e.message)); };
    useEffect(load, []);
    const remove = async (id) => { if (window.confirm("Delete this food item?")) { await adminApi(`/foods/${id}`, { method: "DELETE" }); load(); } };
    const toggle = async (f) => { await adminApi(`/foods/${f._id}/availability`, { method: "PUT", body: JSON.stringify({ availability: !f.availability }) }); load(); };
    if (error) return <ErrorBox error={error} />;
    if (!foods) return <Loading />;

    const filteredFoods = (foods || [])
        .filter((f) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            const name = (f.name || "").toLowerCase();
            const category = (f.category || "").toLowerCase();
            const restaurantName = (f.restaurant?.name || "").toLowerCase();
            return name.includes(q) || category.includes(q) || restaurantName.includes(q);
        })
        .sort((a, b) => {
            const aAvail = a.availability !== false ? 1 : 0;
            const bAvail = b.availability !== false ? 1 : 0;
            return bAvail - aAvail;
        });

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Food Management</h2>
                    <p className="text-slate-500">Admin-managed menu records.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search food, category, restaurant..."
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
                    />
                    <Link to="/admin/food/add" className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-amber-500">
                        + Add Food
                    </Link>
                </div>
            </div>
            <div className="mt-5 max-h-[600px] overflow-y-auto overflow-x-auto rounded-xl bg-white shadow-sm border border-slate-200">
                <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 shadow-xs">
                        <tr>
                            <th className="p-3">Food</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Restaurant</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Availability</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFoods.length ? filteredFoods.map((f) => (
                            <tr className="border-t" key={f._id}>
                                <td className="p-3"><b>{f.name}</b><br /><span className="text-slate-500">{f.description}</span></td>
                                <td className="p-3">{f.category}</td>
                                <td className="p-3">{f.restaurant?.name || "--"}</td>
                                <td className="p-3">{money(f.price)}</td>
                                <td className="p-3">
                                    <button onClick={() => toggle(f)} title="Click to toggle availability" className="cursor-pointer">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${f.availability ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>{f.availability ? "Available" : "Unavailable"}</span>
                                    </button>
                                </td>
                                <td className="space-x-3 p-3">
                                    <Link className="text-amber-700 hover:underline" to={`/admin/food/edit/${f._id}`}>Edit</Link>
                                    <button className="text-red-600 hover:underline cursor-pointer" onClick={() => remove(f._id)}>Delete</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500">
                                    {search.trim() ? "No foods found matching your search." : "No food records yet. Add the first one."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function FoodForm({ edit = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [form, setForm] = useState({ name: "", description: "", price: "", category: "", restaurant: "", image: "", availability: true });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        adminApi("/restaurants").then((x) => setRestaurants(x.items)).catch((e) => setError(e.message));
        if (edit) {
            adminApi("/foods").then((x) => {
                const f = x.items.find((a) => a._id === id);
                if (!f) return setError("Food not found");
                setForm({ ...f, restaurant: f.restaurant?._id || f.restaurant, price: String(f.price) });
            }).catch((e) => setError(e.message));
        }
    }, [edit, id]);
    const set = (e) => setForm({ ...form, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
    const submit = async (e) => {
        e.preventDefault();
        if (Number(form.price) <= 0) return setError("Price must be greater than 0");
        setSaving(true);
        try {
            await adminApi(edit ? `/foods/${id}` : "/foods", { method: edit ? "PUT" : "POST", body: JSON.stringify({ ...form, price: Number(form.price) }) });
            navigate("/admin/food");
        } catch (e) { setError(e.message); } finally { setSaving(false); }
    };
    return (
        <section>
            <Link to="/admin/food" className="text-sm text-amber-700 hover:underline">Back to Food Management</Link>
            <h2 className="mt-3 text-2xl font-bold">{edit ? "Edit Food" : "Add Food"}</h2>
            <FormShell error={error}>
                <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                    <Field label="Food name" name="name" value={form.name} onChange={set} required />
                    <Field label="Category" name="category" value={form.category} onChange={set} required />
                    <label className="text-sm font-medium">Restaurant
                        <select name="restaurant" value={form.restaurant} onChange={set} required className="mt-1 w-full rounded-lg border p-3">
                            <option value="">Select restaurant</option>
                            {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </label>
                    <Field label="Price" name="price" type="number" min="1" value={form.price} onChange={set} required />
                    <Field label="Image URL" name="image" value={form.image} onChange={set} />
                    <label className="flex items-center gap-2 pt-6 text-sm font-medium"><input name="availability" type="checkbox" checked={form.availability} onChange={set} /> Available</label>
                    <label className="text-sm font-medium md:col-span-2">Description<textarea name="description" value={form.description} onChange={set} className="mt-1 min-h-24 w-full rounded-lg border p-3" /></label>
                    <button disabled={saving} className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white md:col-span-2 disabled:opacity-50">{saving ? "Saving..." : "Save Food"}</button>
                </form>
            </FormShell>
        </section>
    );
}

export function AdminRestaurants() {
    const [items, setItems] = useState(null);
    const [form, setForm] = useState({ name: "", category: "", location: "", deliveryTime: "", image: "" });
    const [error, setError] = useState("");
    const load = () => { setError(""); adminApi("/restaurants").then((x) => setItems(x.items)).catch((e) => setError(e.message)); };
    useEffect(load, []);
    const add = async (e) => {
        e.preventDefault();
        try { await adminApi("/restaurants", { method: "POST", body: JSON.stringify(form) }); setForm({ name: "", category: "", location: "", deliveryTime: "", image: "" }); load(); }
        catch (e) { setError(e.message); }
    };
    if (error) return <ErrorBox error={error} />;
    if (!items) return <Loading />;
    return (
        <section>
            <h2 className="text-2xl font-bold">Restaurants</h2>
            <div className="mt-5 grid gap-6 xl:grid-cols-3">
                <FormShell>
                    <h3 className="mb-3 font-bold">Add Restaurant</h3>
                    <form onSubmit={add} className="space-y-3">
                        {[["name","Name"],["category","Category"],["location","Location"],["deliveryTime","Delivery Time"],["image","Image URL"]].map(([name,label]) => (
                            <Field key={name} label={label} name={name} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={name === "name"} />
                        ))}
                        <button className="w-full rounded-lg bg-amber-400 py-3 font-semibold">Add Restaurant</button>
                    </form>
                </FormShell>
                <div className="space-y-3 xl:col-span-2">
                    {items.length ? items.map((r) => (
                        <div className="flex justify-between rounded-xl bg-white p-5 shadow-sm" key={r._id}>
                            <div><b>{r.name}</b><p className="text-sm text-slate-500">{r.category} - {r.location} - {r.deliveryTime}</p></div>
                            <button onClick={async () => { if (window.confirm("Delete this restaurant?")) { await adminApi(`/restaurants/${r._id}`, { method: "DELETE" }); load(); } }} className="text-sm text-red-600 hover:underline">Delete</button>
                        </div>
                    )) : <p className="rounded-xl bg-white p-6 text-slate-500">No restaurants added yet.</p>}
                </div>
            </div>
        </section>
    );
}

export function AdminReports() {
    const [data, setData] = useState(null);
    const [range, setRange] = useState("");
    const [error, setError] = useState("");
    const load = () => { setError(""); adminApi(`/reports${range ? `?from=${range}` : ""}`).then(setData).catch((e) => setError(e.message)); };
    useEffect(load, [range]);
    if (error) return <ErrorBox error={error} />;
    if (!data) return <Loading />;
    return (
        <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h2 className="text-2xl font-bold">Reports</h2><p className="text-slate-500">Live performance from completed orders.</p></div>
                <select className="rounded-lg border px-3" onChange={(e) => setRange(e.target.value)}>
                    <option value="">All time</option>
                    <option value={new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10)}>Last 7 days</option>
                    <option value={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)}>This month</option>
                </select>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Card label="Revenue" value={money(data.revenue)} color="bg-violet-50" />
                <Card label="Total Orders" value={data.totalOrders} />
                <Card label="Completed" value={data.completedOrders} color="bg-emerald-50" />
                <Card label="Cancelled" value={data.cancelledOrders} color="bg-red-50" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel title="Order statuses" items={data.statuses} />
                <Panel title="Order types" items={data.orderTypes} />
                <Panel title="Most ordered foods" items={data.popularFoods.map((x) => ({ _id: x._id, count: x.quantity }))} />
                <Panel title="Daily revenue (completed)" items={data.dailyRevenue.map((x) => ({ _id: x._id, count: x.revenue }))} />
            </div>
        </section>
    );
}

export function AdminSettings() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    useEffect(() => { adminApi("/profile").then(({ user }) => setForm((x) => ({ ...x, name: user.name, email: user.email }))).catch((e) => setError(e.message)); }, []);
    const save = async (e) => {
        e.preventDefault();
        setMessage(""); setError("");
        try {
            const { user } = await adminApi("/profile", { method: "PUT", body: JSON.stringify(form) });
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
            setForm({ ...form, password: "" });
            setMessage("Profile updated successfully.");
        } catch (e) { setError(e.message); }
    };
    return (
        <section>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-slate-500">Manage your administrator profile.</p>
            <FormShell error={error}>
                <form onSubmit={save} className="space-y-4">
                    <Field label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Field label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <Field label="New password (leave blank to keep current)" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    {message && <p className="text-sm text-emerald-700">{message}</p>}
                    <button className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white">Save Changes</button>
                </form>
            </FormShell>
        </section>
    );
}


// ==========================================
// COUPON MANAGEMENT
// ==========================================

const toInputDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    return dt.toISOString().slice(0, 16);
};

const COUPON_STATUS_COLORS = {
    active: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800",
    disabled: "bg-slate-100 text-slate-700",
    limit_reached: "bg-amber-100 text-amber-800"
};

export function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [actionMsg, setActionMsg] = useState("");

    const loadCoupons = useCallback(() => {
        setLoading(true);
        setError("");
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.append("search", search.trim());
        if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);

        adminApi(`/coupons?${queryParams.toString()}`)
            .then((data) => {
                setCoupons(data.coupons || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [search, statusFilter]);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    const handleToggle = async (coupon) => {
        try {
            const res = await adminApi(`/coupons/${coupon._id}/toggle`, { method: "PATCH" });
            setActionMsg(res.message || "Status updated");
            setTimeout(() => setActionMsg(""), 3000);
            loadCoupons();
        } catch (e) {
            alert(e.message || "Failed to update status");
        }
    };

    const handleDelete = async (coupon) => {
        if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
        try {
            await adminApi(`/coupons/${coupon._id}`, { method: "DELETE" });
            setActionMsg(`Coupon "${coupon.code}" deleted`);
            setTimeout(() => setActionMsg(""), 3000);
            loadCoupons();
        } catch (e) {
            alert(e.message || "Failed to delete coupon");
        }
    };

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">🏷️ Coupons Management</h2>
                    <p className="text-slate-500">Create, monitor, and manage discount promo codes.</p>
                </div>
                <Link
                    to="/admin/coupons/add"
                    className="rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 font-semibold text-white shadow-sm transition"
                >
                    + Create Coupon
                </Link>
            </div>

            {actionMsg && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    ✓ {actionMsg}
                </div>
            )}
            {error && <div className="mt-4"><ErrorBox error={error} /></div>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadCoupons()}
                    placeholder="Search by code or description..."
                    className="flex-1 min-w-[200px] rounded-lg border p-2.5 text-sm"
                />
                <button
                    onClick={loadCoupons}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Search
                </button>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border p-2.5 text-sm bg-white"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                    <option value="disabled">Disabled</option>
                    <option value="limit_reached">Limit Reached</option>
                </select>
            </div>

            {loading ? (
                <div className="mt-6"><Loading /></div>
            ) : (
                <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-3">Code</th>
                                <th className="p-3">Discount</th>
                                <th className="p-3">Min Order</th>
                                <th className="p-3">Validity</th>
                                <th className="p-3">Usage</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length ? (
                                coupons.map((c) => {
                                    const statusKey = c.status || (c.isActive ? "active" : "disabled");
                                    const badgeColor = COUPON_STATUS_COLORS[statusKey] || "bg-slate-100 text-slate-700";
                                    return (
                                        <tr key={c._id} className="border-t hover:bg-slate-50">
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                                    {c.code}
                                                </span>
                                                {c.description && (
                                                    <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">{c.description}</p>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <b>
                                                    {c.discountType === "percentage"
                                                        ? `${c.discountValue}% OFF`
                                                        : money(c.discountValue)}
                                                </b>
                                                {c.discountType === "percentage" && c.maxDiscount ? (
                                                    <p className="text-xs text-slate-500">Cap: {money(c.maxDiscount)}</p>
                                                ) : null}
                                            </td>
                                            <td className="p-3">{money(c.minSubtotal)}</td>
                                            <td className="p-3 text-xs text-slate-600">
                                                <span>{date(c.startDate)}</span>
                                                <br />
                                                <span className="text-slate-400">to</span> {date(c.endDate)}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-semibold">{c.redemptionCount || 0}</span>
                                                {c.usageLimit ? (
                                                    <span className="text-slate-400"> / {c.usageLimit}</span>
                                                ) : (
                                                    <span className="text-slate-400"> (No limit)</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
                                                    {statusKey.replace("_", " ").toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggle(c)}
                                                        className={`text-xs px-2.5 py-1 rounded border font-medium ${
                                                            c.isActive
                                                                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        {c.isActive ? "Disable" : "Enable"}
                                                    </button>
                                                    <Link
                                                        to={`/admin/coupons/edit/${c._id}`}
                                                        className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(c)}
                                                        className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 font-medium hover:bg-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No coupons found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export function CouponForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 20,
        minSubtotal: 0,
        maxDiscount: "",
        startDate: toInputDate(new Date()),
        endDate: toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        usageLimit: "",
        isActive: true
    });

    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        adminApi(`/coupons/${id}`)
            .then((data) => {
                const c = data.coupon;
                if (!c) throw new Error("Coupon not found");
                setForm({
                    code: c.code || "",
                    description: c.description || "",
                    discountType: c.discountType || "percentage",
                    discountValue: c.discountValue ?? 0,
                    minSubtotal: c.minSubtotal ?? 0,
                    maxDiscount: c.maxDiscount ?? "",
                    startDate: toInputDate(c.startDate),
                    endDate: toInputDate(c.endDate),
                    usageLimit: c.usageLimit ?? "",
                    isActive: c.isActive !== false
                });
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const payload = {
                code: form.code.trim().toUpperCase(),
                description: form.description.trim(),
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minSubtotal: Number(form.minSubtotal) || 0,
                maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
                usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
                isActive: Boolean(form.isActive)
            };

            if (isEdit) {
                await adminApi(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            } else {
                await adminApi("/coupons", { method: "POST", body: JSON.stringify(payload) });
            }

            navigate("/admin/coupons");
        } catch (err) {
            setError(err.message || "Failed to save coupon");
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <section>
            <Link to="/admin/coupons" className="text-sm text-amber-700 hover:underline">
                ← Back to Coupons
            </Link>
            <h2 className="mt-2 text-2xl font-bold">{isEdit ? "Edit Coupon" : "Create New Coupon"}</h2>
            <p className="text-slate-500">Configure discount amounts, minimum order requirements, and validity dates.</p>

            <FormShell error={error}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        label="Coupon Code"
                        required
                        placeholder="e.g. DIWALI20"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    />

                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            rows={2}
                            placeholder="e.g. Diwali Dhamaka 20% OFF above ₹499"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="mt-1 w-full rounded-lg border p-3 text-sm"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Discount Type</label>
                            <select
                                value={form.discountType}
                                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                className="mt-1 w-full rounded-lg border p-3 text-sm bg-white"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <Field
                            label={form.discountType === "percentage" ? "Discount Value (%)" : "Discount Value (₹)"}
                            type="number"
                            required
                            min={form.discountType === "percentage" ? 1 : 0}
                            max={form.discountType === "percentage" ? 100 : undefined}
                            step="any"
                            value={form.discountValue}
                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Minimum Subtotal (₹)"
                            type="number"
                            min="0"
                            placeholder="e.g. 499"
                            value={form.minSubtotal}
                            onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                        />
                        <Field
                            label="Maximum Discount Cap (₹) (Optional)"
                            type="number"
                            min="0"
                            placeholder="e.g. 200 (for percentage)"
                            value={form.maxDiscount}
                            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Start Date & Time"
                            type="datetime-local"
                            required
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                        <Field
                            label="End Date & Time"
                            type="datetime-local"
                            required
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                    </div>

                    <Field
                        label="Usage Limit (Total allowed redemptions, leave blank for unlimited)"
                        type="number"
                        min="1"
                        placeholder="e.g. 500"
                        value={form.usageLimit}
                        onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    />

                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="h-4 w-4 rounded text-orange-600"
                            />
                            Coupon is Active and Available for Customers
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/coupons")}
                            className="rounded-lg border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </FormShell>
        </section>
    );
}

// ==========================================
// SESSION OFFERS & DIWALI BANNER MANAGEMENT
// ==========================================

export function AdminSessionOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");

    const loadOffers = useCallback(() => {
        setLoading(true);
        setError("");
        adminApi("/session-offers")
            .then((data) => setOffers(data.offers || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    const handleToggleStatus = async (offer) => {
        try {
            const res = await adminApi(`/session-offers/${offer._id}/toggle`, { method: "PATCH" });
            setActionMsg(res.message || "Status updated");
            setTimeout(() => setActionMsg(""), 3000);
            loadOffers();
        } catch (e) {
            alert(e.message || "Failed to update status");
        }
    };

    const handleToggleBanner = async (offer) => {
        try {
            const res = await adminApi(`/session-offers/${offer._id}/banner`, { method: "PATCH" });
            setActionMsg(res.message || "Banner visibility updated");
            setTimeout(() => setActionMsg(""), 3000);
            loadOffers();
        } catch (e) {
            alert(e.message || "Failed to update banner visibility");
        }
    };

    const handleDelete = async (offer) => {
        if (!window.confirm(`Are you sure you want to delete session offer "${offer.title}"?`)) return;
        try {
            await adminApi(`/session-offers/${offer._id}`, { method: "DELETE" });
            setActionMsg("Offer deleted");
            setTimeout(() => setActionMsg(""), 3000);
            loadOffers();
        } catch (e) {
            alert(e.message || "Failed to delete offer");
        }
    };

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">🪔 Session & Festival Offers</h2>
                    <p className="text-slate-500">Manage Diwali promotional banners and scheduled session discounts.</p>
                </div>
                <Link
                    to="/admin/session-offers/add"
                    className="rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 font-semibold text-white shadow-sm transition"
                >
                    + Create Session Offer
                </Link>
            </div>

            {actionMsg && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    ✓ {actionMsg}
                </div>
            )}
            {error && <div className="mt-4"><ErrorBox error={error} /></div>}

            {loading ? (
                <div className="mt-6"><Loading /></div>
            ) : (
                <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-3">Title & Message</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Discount Details</th>
                                <th className="p-3">Validity</th>
                                <th className="p-3">Home Banner</th>
                                <th className="p-3">Active</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.length ? (
                                offers.map((o) => (
                                    <tr key={o._id} className="border-t hover:bg-slate-50">
                                        <td className="p-3 max-w-xs">
                                            <b>{o.title}</b>
                                            <p className="text-xs text-slate-500 mt-1 truncate">{o.message}</p>
                                        </td>
                                        <td className="p-3">
                                            {o.offerType === "coupon" ? (
                                                <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                                    Coupon: {o.couponCode || "None"}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                    Direct Session
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <b>
                                                {o.discountType === "percentage"
                                                    ? `${o.discountValue}% OFF`
                                                    : money(o.discountValue)}
                                            </b>
                                            {o.minSubtotal ? (
                                                <p className="text-xs text-slate-500">Min: {money(o.minSubtotal)}</p>
                                            ) : null}
                                            {o.maxDiscount ? (
                                                <p className="text-xs text-slate-500">Cap: {money(o.maxDiscount)}</p>
                                            ) : null}
                                        </td>
                                        <td className="p-3 text-xs text-slate-600">
                                            <span>{date(o.startDate)}</span>
                                            <br />
                                            <span className="text-slate-400">to</span> {date(o.endDate)}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleBanner(o)}
                                                className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                                    o.showBanner
                                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                            >
                                                {o.showBanner ? "Visible ✓" : "Hidden ✕"}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleStatus(o)}
                                                className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                                    o.isActive
                                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                        : "bg-red-100 text-red-800 hover:bg-red-200"
                                                }`}
                                            >
                                                {o.isActive ? "Active" : "Disabled"}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/session-offers/edit/${o._id}`}
                                                    className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(o)}
                                                    className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 font-medium hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No session offers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export function SessionOfferForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [availableCoupons, setAvailableCoupons] = useState([]);

    const [form, setForm] = useState({
        title: "",
        message: "",
        subtitle: "",
        offerType: "coupon",
        couponCode: "DIWALI20",
        discountType: "percentage",
        discountValue: 20,
        minSubtotal: 0,
        maxDiscount: "",
        startDate: toInputDate(new Date()),
        endDate: toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        showBanner: true,
        isActive: true
    });

    useEffect(() => {
        adminApi("/coupons")
            .then((d) => setAvailableCoupons(d.coupons || []))
            .catch(() => {});

        if (!isEdit) return;
        setLoading(true);
        adminApi(`/session-offers/${id}`)
            .then((data) => {
                const o = data.offer;
                if (!o) throw new Error("Session offer not found");
                setForm({
                    title: o.title || "",
                    message: o.message || "",
                    subtitle: o.subtitle || "",
                    offerType: o.offerType || "coupon",
                    couponCode: o.couponCode || "",
                    discountType: o.discountType || "percentage",
                    discountValue: o.discountValue ?? 0,
                    minSubtotal: o.minSubtotal ?? 0,
                    maxDiscount: o.maxDiscount ?? "",
                    startDate: toInputDate(o.startDate),
                    endDate: toInputDate(o.endDate),
                    showBanner: o.showBanner !== false,
                    isActive: o.isActive !== false
                });
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                subtitle: form.subtitle.trim(),
                offerType: form.offerType,
                couponCode: form.offerType === "coupon" ? form.couponCode.trim().toUpperCase() : "",
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minSubtotal: Number(form.minSubtotal) || 0,
                maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
                showBanner: Boolean(form.showBanner),
                isActive: Boolean(form.isActive)
            };

            if (isEdit) {
                await adminApi(`/session-offers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            } else {
                await adminApi("/session-offers", { method: "POST", body: JSON.stringify(payload) });
            }

            navigate("/admin/session-offers");
        } catch (err) {
            setError(err.message || "Failed to save session offer");
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <section>
            <Link to="/admin/session-offers" className="text-sm text-amber-700 hover:underline">
                ← Back to Session Offers
            </Link>
            <h2 className="mt-2 text-2xl font-bold">{isEdit ? "Edit Session Offer" : "Create Session Offer"}</h2>
            <p className="text-slate-500">Configure promotional festival offers and homepage banner settings.</p>

            <FormShell error={error}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        label="Offer Title (e.g. 🪔 Diwali Dhamaka – Special Festival Offer)"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />

                    <div>
                        <label className="text-sm font-medium">Message / Promotional Description</label>
                        <textarea
                            rows={2}
                            required
                            placeholder="Celebrate Diwali with delicious food and exciting festive savings!"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            className="mt-1 w-full rounded-lg border p-3 text-sm"
                        />
                    </div>

                    <Field
                        label="Subtitle / Highlight Text (e.g. Flat 20% OFF on orders above ₹499)"
                        placeholder="Flat 20% OFF on orders above ₹499 (Max ₹200)"
                        value={form.subtitle}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Offer Type</label>
                            <select
                                value={form.offerType}
                                onChange={(e) => setForm({ ...form, offerType: e.target.value })}
                                className="mt-1 w-full rounded-lg border p-3 text-sm bg-white"
                            >
                                <option value="coupon">Coupon-Based (Prompts user to use coupon code)</option>
                                <option value="direct">Direct Session Discount (Auto applied)</option>
                            </select>
                        </div>

                        {form.offerType === "coupon" ? (
                            <div>
                                <label className="text-sm font-medium">Coupon Code</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        placeholder="e.g. DIWALI20"
                                        value={form.couponCode}
                                        onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                                        className="w-full rounded-lg border p-3 text-sm"
                                    />
                                    {availableCoupons.length > 0 && (
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const c = availableCoupons.find((x) => x.code === e.target.value);
                                                    if (c) {
                                                        setForm({
                                                            ...form,
                                                            couponCode: c.code,
                                                            discountType: c.discountType,
                                                            discountValue: c.discountValue,
                                                            minSubtotal: c.minSubtotal,
                                                            maxDiscount: c.maxDiscount || ""
                                                        });
                                                    }
                                                }
                                            }}
                                            className="rounded-lg border p-2 text-xs bg-slate-50"
                                        >
                                            <option value="">Quick Pick</option>
                                            {availableCoupons.map((c) => (
                                                <option key={c._id} value={c.code}>
                                                    {c.code}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Discount Type</label>
                            <select
                                value={form.discountType}
                                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                className="mt-1 w-full rounded-lg border p-3 text-sm bg-white"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <Field
                            label={form.discountType === "percentage" ? "Discount Value (%)" : "Discount Value (₹)"}
                            type="number"
                            required
                            min="0"
                            max={form.discountType === "percentage" ? 100 : undefined}
                            step="any"
                            value={form.discountValue}
                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Minimum Subtotal (₹)"
                            type="number"
                            min="0"
                            value={form.minSubtotal}
                            onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                        />
                        <Field
                            label="Maximum Discount Cap (₹) (Optional)"
                            type="number"
                            min="0"
                            placeholder="e.g. 200"
                            value={form.maxDiscount}
                            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Start Date & Time"
                            type="datetime-local"
                            required
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                        <Field
                            label="End Date & Time"
                            type="datetime-local"
                            required
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                            <input
                                type="checkbox"
                                checked={form.showBanner}
                                onChange={(e) => setForm({ ...form, showBanner: e.target.checked })}
                                className="h-4 w-4 rounded text-orange-600"
                            />
                            Show Promotional Banner on Homepage
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="h-4 w-4 rounded text-orange-600"
                            />
                            Offer is Active
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEdit ? "Update Offer" : "Create Offer"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/session-offers")}
                            className="rounded-lg border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </FormShell>
        </section>
    );
}
