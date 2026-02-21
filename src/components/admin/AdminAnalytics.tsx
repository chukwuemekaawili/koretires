import { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

const CHART_COLORS = [
    "hsl(var(--primary))",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
];

const STATUS_COLORS: Record<string, string> = {
    pending: "#eab308",
    confirmed: "#3b82f6",
    processing: "#8b5cf6",
    shipped: "#06b6d4",
    delivered: "#22c55e",
    completed: "#22c55e",
    cancelled: "#ef4444",
};

export function AdminAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [revenueThisMonth, setRevenueThisMonth] = useState(0);
    const [revenueLastMonth, setRevenueLastMonth] = useState(0);
    const [ordersThisMonth, setOrdersThisMonth] = useState(0);
    const [ordersLastMonth, setOrdersLastMonth] = useState(0);
    const [topSizes, setTopSizes] = useState<{ name: string; count: number }[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([]);
    const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            const thisMonthStart = startOfMonth(now).toISOString();
            const thisMonthEnd = endOfMonth(now).toISOString();
            const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
            const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();
            const thirtyDaysAgo = subDays(now, 30).toISOString();

            // Fetch all orders for computations
            const { data: allOrders } = await supabase
                .from("orders")
                .select("id, total, status, created_at")
                .order("created_at", { ascending: true });

            const orders = allOrders || [];

            // Revenue & order counts
            const thisMonth = orders.filter(o => o.created_at >= thisMonthStart && o.created_at <= thisMonthEnd && o.status !== 'cancelled');
            const lastMonth = orders.filter(o => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd && o.status !== 'cancelled');

            setRevenueThisMonth(thisMonth.reduce((sum, o) => sum + Number(o.total || 0), 0));
            setRevenueLastMonth(lastMonth.reduce((sum, o) => sum + Number(o.total || 0), 0));
            setOrdersThisMonth(thisMonth.length);
            setOrdersLastMonth(lastMonth.length);

            // Status breakdown
            const statusCounts: Record<string, number> = {};
            orders.forEach(o => {
                statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
            });
            setStatusBreakdown(
                Object.entries(statusCounts).map(([name, value]) => ({
                    name,
                    value,
                    color: STATUS_COLORS[name] || "#6b7280",
                }))
            );

            // Daily revenue (last 30 days)
            const recentOrders = orders.filter(o => o.created_at >= thirtyDaysAgo && o.status !== 'cancelled');
            const dailyMap: Record<string, { revenue: number; orders: number }> = {};
            for (let i = 0; i < 30; i++) {
                const day = format(subDays(now, 29 - i), "yyyy-MM-dd");
                dailyMap[day] = { revenue: 0, orders: 0 };
            }
            recentOrders.forEach(o => {
                const day = o.created_at.slice(0, 10);
                if (dailyMap[day]) {
                    dailyMap[day].revenue += Number(o.total || 0);
                    dailyMap[day].orders += 1;
                }
            });
            setDailyRevenue(
                Object.entries(dailyMap).map(([date, data]) => ({
                    date: format(new Date(date), "MMM d"),
                    revenue: Math.round(data.revenue * 100) / 100,
                    orders: data.orders,
                }))
            );

            // Top selling sizes
            const { data: items } = await supabase
                .from("order_items")
                .select("size, quantity");

            const sizeCounts: Record<string, number> = {};
            (items || []).forEach(item => {
                sizeCounts[item.size] = (sizeCounts[item.size] || 0) + item.quantity;
            });
            const sorted = Object.entries(sizeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 7)
                .map(([name, count]) => ({ name, count }));
            setTopSizes(sorted);

        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const revenueChange = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : revenueThisMonth > 0 ? 100 : 0;

    const ordersChange = ordersLastMonth > 0
        ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
        : ordersThisMonth > 0 ? 100 : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Analytics</h2>
                <p className="text-sm text-muted-foreground">Business performance overview</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bento-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            {revenueChange !== 0 && (
                                <Badge className={revenueChange > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                                    {revenueChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(revenueChange)}%
                                </Badge>
                            )}
                        </div>
                        <p className="text-2xl font-bold">${revenueThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">Revenue this month</p>
                    </CardContent>
                </Card>

                <Card className="bento-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            {ordersChange !== 0 && (
                                <Badge className={ordersChange > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                                    {ordersChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(ordersChange)}%
                                </Badge>
                            )}
                        </div>
                        <p className="text-2xl font-bold">{ordersThisMonth}</p>
                        <p className="text-xs text-muted-foreground">Orders this month</p>
                    </CardContent>
                </Card>

                <Card className="bento-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">${revenueLastMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">Revenue last month</p>
                    </CardContent>
                </Card>

                <Card className="bento-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">
                            {ordersThisMonth > 0 ? `$${Math.round(revenueThisMonth / ordersThisMonth)}` : "$0"}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg. order value</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card className="bento-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Revenue Trend (30 days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="auto" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            fontSize: 13,
                                        }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Selling Sizes */}
                <Card className="bento-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Top Selling Sizes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {topSizes.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topSizes} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                fontSize: 13,
                                            }}
                                            formatter={(value: number) => [`${value} units`, "Sold"]}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                            {topSizes.map((_, index) => (
                                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    No sales data yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Distribution */}
                <Card className="bento-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Order Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center">
                            {statusBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {statusBreakdown.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                fontSize: 13,
                                            }}
                                        />
                                        <Legend
                                            formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                                    No orders yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Orders Chart */}
                <Card className="bento-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Daily Orders (30 days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="auto" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            fontSize: 13,
                                        }}
                                    />
                                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
