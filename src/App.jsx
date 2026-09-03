import React, { Component, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route
} from "react-router-dom";

// Home loads normally
import Home from "./pages/Home";

// Other pages load only when their route is opened
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Restaurant = lazy(() => import("./pages/Restaurant"));
const FoodDetails = lazy(() => import("./pages/FoodDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminDashboard })));
const AdminOrders = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminOrders })));
const AdminOrderDetails = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminOrderDetails })));
const AdminCustomers = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminCustomers })));
const AdminCustomerDetails = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminCustomerDetails })));
const AdminFood = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminFood })));
const AddFood = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.FoodForm })));
const EditFood = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.FoodForm })));
const AdminRestaurants = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminRestaurants })));
const AdminReports = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminReports })));
const AdminSettings = lazy(() => import("./admin/AdminPages").then((module) => ({ default: module.AdminSettings })));

function Loading() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: "600"
      }}
    >
      Loading...
    </div>
  );
}

class RouteErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(previousProps) {
    if (previousProps.locationKey !== this.props.locationKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) return <div className="min-h-screen bg-slate-50 p-8 text-slate-800"><h1 className="text-xl font-bold text-red-700">This page could not be displayed</h1><p className="mt-3 rounded bg-red-50 p-4 font-mono text-sm text-red-800">{this.state.error.message}</p></div>;
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary locationKey={window.location.pathname}>
      <Suspense fallback={<Loading />}>
        <Routes>

          {/* Home */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Login / Register */}
          <Route
            path="/login"
            element={<Auth />}
          />
          <Route
            path="/register"
            element={<Auth />}
          />

          {/* Reset Password */}
          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Restaurants */}
          <Route
            path="/restaurants"
            element={<Restaurant />}
          />

          {/* Individual Restaurant */}
          <Route
            path="/restaurant/:id"
            element={<Restaurant />}
          />

          {/* Food Details */}
          <Route
            path="/food/:id"
            element={<FoodDetails />}
          />

          {/* Cart */}
          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={<Orders />}
          />

          {/* Admin (server-verified role protection) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetails />} />
            <Route path="food" element={<AdminFood />} />
            <Route path="food/add" element={<AddFood />} />
            <Route path="food/edit/:id" element={<EditFood edit />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
