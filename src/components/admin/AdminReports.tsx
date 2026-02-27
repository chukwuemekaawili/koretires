import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, TrendingUp, Calendar, DollarSign, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, startOfYear, isSameDay, isSameMonth, isSameYear } from "date-fns";

interface ReportData {
    daily: { date: string; total: number; count: number }[];
    monthly: { month: string; total: number; count: number }[];
    yearly: { year: string; total: number; count: number }[];
    gst: { period: string; collected: number }[];
    tireChanges: { date: string; count: number; revenue: number }[];
}

export function AdminReports() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [timeRange, setTimeRange] = useState("30"); // days

    useEffect(() => {
        fetchReportData();
    }, [timeRange]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            // Fetch invoices for sales & GST
            // Note: In a production app with huge data, this would be an RPC call or paginated. 
            // For this scale, fetching recent invoices is sufficient.
            const { data: invoices, error: invoiceError } = await supabase
                .from("invoices")
                .select("*")
                .in("status", ["paid", "sent"]) // Count paid or sent as "sales"
                .order("created_at", { ascending: false });

            if (invoiceError) throw invoiceError;

            // Fetch bookings for tire changes
            const { data: bookings, error: bookingsError } = await supabase
                .from("bookings")
                .select("*")
                .eq("status", "confirmed")
                .order("created_at", { ascending: false });

            if (bookingsError) throw bookingsError;

            const reportData: ReportData = {
                daily: [],
                monthly: [],
                yearly: [],
                gst: [],
                tireChanges: [],
            };

            if (!invoices) return;

            // Process Invoices for Sales & GST
            const dailyMap = new Map<string, { total: number; count: number }>();
            const monthlyMap = new Map<string, { total: number; count: number }>();
            const yearlyMap = new Map<string, { total: number; count: number }>();
            const gstMap = new Map<string, number>();

            invoices.forEach(inv => {
                const date = new Date(inv.created_at);
                const dayKey = format(date, "MMM dd, yyyy");
                const monthKey = format(date, "MMMM yyyy");
                const yearKey = format(date, "yyyy");

                // Daily
                const currentDaily = dailyMap.get(dayKey) || { total: 0, count: 0 };
                dailyMap.set(dayKey, { total: currentDaily.total + inv.total, count: currentDaily.count + 1 });

                // Monthly
                const currentMonthly = monthlyMap.get(monthKey) || { total: 0, count: 0 };
                monthlyMap.set(monthKey, { total: currentMonthly.total + inv.total, count: currentMonthly.count + 1 });

                // Yearly
                const currentYearly = yearlyMap.get(yearKey) || { total: 0, count: 0 };
                yearlyMap.set(yearKey, { total: currentYearly.total + inv.total, count: currentYearly.count + 1 });

                // GST
                const currentGst = gstMap.get(monthKey) || 0;
                gstMap.set(monthKey, currentGst + (inv.gst || 0));
            });

            reportData.daily = Array.from(dailyMap, ([date, { total, count }]) => ({ date, total, count })).slice(0, parseInt(timeRange));
            reportData.monthly = Array.from(monthlyMap, ([month, { total, count }]) => ({ month, total, count }));
            reportData.yearly = Array.from(yearlyMap, ([year, { total, count }]) => ({ year, total, count }));
            reportData.gst = Array.from(gstMap, ([period, collected]) => ({ period, collected }));

            // Process Bookings for Tire Changes (assuming service_type contains 'tire')
            const tireChangeMap = new Map<string, { count: number; revenue: number }>();
            if (bookings) {
                bookings.forEach(b => {
                    if (b.service_type && b.service_type.toLowerCase().includes("change") || b.service_type?.toLowerCase().includes("swap")) {
                        const dayKey = format(new Date(b.created_at), "MMM yyyy");
                        const current = tireChangeMap.get(dayKey) || { count: 0, revenue: 0 };
                        // Use 0 as revenue if not tracked directly on booking
                        tireChangeMap.set(dayKey, { count: current.count + 1, revenue: current.revenue + 0 });
                    }
                });
                reportData.tireChanges = Array.from(tireChangeMap, ([date, { count, revenue }]) => ({ date, count, revenue }));
            }

            setData(reportData);
        } catch (err) {
            console.error("Failed to load reports:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const exportCSV = (filename: string, rows: any[], headers: string[]) => {
        if (!rows || !rows.length) return;

        // Convert to CSV
        const csvContent = [
            headers.join(","),
            ...rows.map(row => {
                return headers.map(header => {
                    const val = row[header.toLowerCase()] || row[Object.keys(row).find(k => k.toLowerCase() === header.toLowerCase()) || ""];
                    return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                }).join(",");
            })
        ].join("\\n");

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || !data) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-muted-foreground">View and export your business performance metrics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bento-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${data.daily.length > 0 ? (data.daily.reduce((sum, d) => sum + d.total, 0) / data.daily.length).toFixed(2) : "0.00"}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bento-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total GST (YTD)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${data.gst.reduce((sum, g) => sum + g.collected, 0).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="daily" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="daily">Daily Sales</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly Sales</TabsTrigger>
                    <TabsTrigger value="gst">GST Report</TabsTrigger>
                    <TabsTrigger value="services">Tire Changes</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="space-y-4">
                    <Card className="bento-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Daily Sales Report</CardTitle>
                                <CardDescription>Sales figures broken down by day.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => exportCSV('daily_sales', data.daily, ['Date', 'Total', 'Count'])}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Invoices</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.daily.map((row) => (
                                        <TableRow key={row.date}>
                                            <TableCell className="font-medium">{row.date}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                            <TableCell className="text-right">${row.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.daily.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data available for this period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4">
                    <Card className="bento-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Monthly Sales Report</CardTitle>
                                <CardDescription>Sales figures aggregated by month.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => exportCSV('monthly_sales', data.monthly, ['Month', 'Total', 'Count'])}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Invoices</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.monthly.map((row) => (
                                        <TableRow key={row.month}>
                                            <TableCell className="font-medium">{row.month}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                            <TableCell className="text-right">${row.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.monthly.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data available.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="yearly" className="space-y-4">
                    <Card className="bento-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Yearly Sales Report</CardTitle>
                                <CardDescription>Sales figures aggregated by year.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => exportCSV('yearly_sales', data.yearly, ['Year', 'Total', 'Count'])}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Invoices</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.yearly.map((row) => (
                                        <TableRow key={row.year}>
                                            <TableCell className="font-medium">{row.year}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                            <TableCell className="text-right">${row.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.yearly.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data available.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gst" className="space-y-4">
                    <Card className="bento-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>GST Canada Revenue Report</CardTitle>
                                <CardDescription>Total GST collected per month for tax remitting.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => exportCSV('gst_report', data.gst, ['Period', 'Collected'])}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">GST Collected</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.gst.map((row) => (
                                        <TableRow key={row.period}>
                                            <TableCell className="font-medium">{row.period}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">${row.collected.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.gst.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No GST data available.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                    <Card className="bento-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Tire Change Report</CardTitle>
                                <CardDescription>Track volume of tire changes/swaps performed.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => exportCSV('tire_changes', data.tireChanges, ['Date', 'Count'])}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead className="text-right">Total Changes Performed</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.tireChanges.map((row) => (
                                        <TableRow key={row.date}>
                                            <TableCell className="font-medium">{row.date}</TableCell>
                                            <TableCell className="text-right">{row.count}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.tireChanges.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No tire change records found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
