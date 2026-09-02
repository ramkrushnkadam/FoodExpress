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
                <div className="flex gap-2">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Customer or mobile" className="rounded-lg border px-3 py-2" />
                    <button onClick={load} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Search</button>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3">
                        <option value="">All statuses</option>
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
                    <div className="mt-4 flex justify-between text-lg font-bold">
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
            <div className="mt-4 flex gap-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="rounded-lg border px-3 py-2" placeholder="Search name, email or mobile" />
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
    const [error, setError] = useState("");
    const load = () => { setError(""); adminApi("/foods").then((x) => setFoods(x.items)).catch((e) => setError(e.message)); };
    useEffect(load, []);
    const remove = async (id) => { if (window.confirm("Delete this food item?")) { await adminApi(`/foods/${id}`, { method: "DELETE" }); load(); } };
    const toggle = async (f) => { await adminApi(`/foods/${f._id}/availability`, { method: "PUT", body: JSON.stringify({ availability: !f.availability }) }); load(); };
    if (error) return <ErrorBox error={error} />;
    if (!foods) return <Loading />;
    return (
        <section>
            <div className="flex items-center justify-between">
                <div><h2 className="text-2xl font-bold">Food Management</h2><p className="text-slate-500">Admin-managed menu records.</p></div>
                <Link to="/admin/food/add" className="rounded-lg bg-amber-400 px-4 py-2 font-semibold">+ Add Food</Link>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr><th className="p-3">Food</th><th className="p-3">Category</th><th className="p-3">Restaurant</th><th className="p-3">Price</th><th className="p-3">Availability</th><th className="p-3">Actions</th></tr>
                    </thead>
                    <tbody>
                        {foods.length ? foods.map((f) => (
                            <tr className="border-t" key={f._id}>
                                <td className="p-3"><b>{f.name}</b><br /><span className="text-slate-500">{f.description}</span></td>
                                <td className="p-3">{f.category}</td>
                                <td className="p-3">{f.restaurant?.name || "--"}</td>
                                <td className="p-3">{money(f.price)}</td>
                                <td className="p-3">
                                    <button onClick={() => toggle(f)}>
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${f.availability ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{f.availability ? "Available" : "Unavailable"}</span>
                                    </button>
                                </td>
                                <td className="space-x-3 p-3">
                                    <Link className="text-amber-700 hover:underline" to={`/admin/food/edit/${f._id}`}>Edit</Link>
                                    <button className="text-red-600 hover:underline" onClick={() => remove(f._id)}>Delete</button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="6" className="p-8 text-center text-slate-500">No food records yet. Add the first one.</td></tr>}
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
            <div className="flex justify-between">
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
