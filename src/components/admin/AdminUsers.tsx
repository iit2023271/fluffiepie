import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, ShoppingBag, User, Search, Tag, X, Download, Clock, Truck, CheckCircle2, Shield, ShieldOff, MessageCircle, Send, Mail, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStoreInfo } from "@/hooks/useStoreInfo";

const ITEMS_PER_PAGE = 10;

interface UserDetail {
  profile: any;
  addresses: any[];
  orders: any[];
  tags: string[];
  isAdmin: boolean;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [newTag, setNewTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [removeTagConfirm, setRemoveTagConfirm] = useState<{ open: boolean; userId: string; tag: string }>({ open: false, userId: "", tag: "" });
  const [adminConfirm, setAdminConfirm] = useState<{ open: boolean; userId: string; isAdmin: boolean; name: string }>({ open: false, userId: "", isAdmin: false, name: "" });
  const [waDialog, setWaDialog] = useState<{ open: boolean; phone: string; name: string }>({ open: false, phone: "", name: "" });
  const [waMessage, setWaMessage] = useState("");
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; email: string; name: string }>({ open: false, email: "", name: "" });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const { storeInfo } = useStoreInfo();

  const waTemplates = [
    { label: "🎁 Coupon Offer", text: `Hi {name}! 🎉 Here's an exclusive coupon just for you! Use code *SPECIAL10* to get 10% off on your next order at ${storeInfo.storeName}. Order now! 🍰` },
    { label: "🆕 New Arrival", text: `Hey {name}! 👋 We've added some delicious new cakes to our menu at ${storeInfo.storeName}! Check them out and treat yourself 🎂` },
    { label: "💝 Thank You", text: `Hi {name}! Thank you so much for your order from ${storeInfo.storeName}! We hope you loved it. Come back soon for more treats! ❤️🍰` },
    { label: "🎂 Festival Offer", text: `Hi {name}! 🎊 Celebrate this festive season with ${storeInfo.storeName}! Get *20% off* on all cakes. Limited time offer! 🎉` },
    { label: "⭐ Feedback", text: `Hi {name}! We'd love to hear your feedback on your recent order from ${storeInfo.storeName}. Your opinion matters to us! 🙏` },
  ];

  const emailTemplates = [
    { label: "🎁 Coupon", subject: `Exclusive offer from ${storeInfo.storeName}!`, body: `Hi {name},\n\nWe have a special coupon just for you! Use code SPECIAL10 to get 10% off on your next order.\n\nVisit us today!\n\nBest regards,\n${storeInfo.storeName}` },
    { label: "🆕 New Arrival", subject: `New cakes at ${storeInfo.storeName}!`, body: `Hi {name},\n\nWe've added some delicious new cakes to our menu! Check them out and treat yourself.\n\nBest regards,\n${storeInfo.storeName}` },
    { label: "💝 Thank You", subject: `Thank you from ${storeInfo.storeName}!`, body: `Hi {name},\n\nThank you so much for your recent order! We hope you loved it.\n\nCome back soon for more treats!\n\nBest regards,\n${storeInfo.storeName}` },
    { label: "🎂 Festival", subject: `Festive offers at ${storeInfo.storeName}!`, body: `Hi {name},\n\nCelebrate this festive season with us! Get 20% off on all cakes. Limited time offer!\n\nBest regards,\n${storeInfo.storeName}` },
    { label: "⭐ Feedback", subject: `We'd love your feedback - ${storeInfo.storeName}`, body: `Hi {name},\n\nWe'd love to hear your feedback on your recent order. Your opinion helps us improve!\n\nBest regards,\n${storeInfo.storeName}` },
  ];

  const openWhatsApp = (phone: string, name: string) => {
    setWaDialog({ open: true, phone, name });
    setWaMessage(waTemplates[0].text.replace(/{name}/g, name || "there"));
  };

  const sendWhatsApp = () => {
    const phone = waDialog.phone.replace(/\D/g, "");
    if (!phone) { toast.error("No phone number available for this customer"); return; }
    const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank");
    setWaDialog({ open: false, phone: "", name: "" });
    toast.success("WhatsApp opened!");
  };

  const openEmail = (email: string, name: string) => {
    if (!email) { toast.error("No email available for this customer"); return; }
    setEmailDialog({ open: true, email, name });
    const t = emailTemplates[0];
    setEmailSubject(t.subject);
    setEmailBody(t.body.replace(/{name}/g, name || "there"));
  };

  const sendEmail = () => {
    if (!emailDialog.email) { toast.error("No email available"); return; }
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emailDialog.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const a = document.createElement("a"); a.href = gmailUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setEmailDialog({ open: false, email: "", name: "" });
    toast.success("Gmail opened!");
  };

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const [profilesRes, addressesRes, ordersRes, tagsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("addresses").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_tags").select("*"),
      supabase.from("user_roles").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const addresses = addressesRes.data || [];
    const orders = ordersRes.data || [];
    const tags = tagsRes.data || [];
    const roles = rolesRes.data || [];

    const uniqueTags = [...new Set(tags.map((t: any) => t.tag))];
    setAllTags(uniqueTags);

    const combined: UserDetail[] = profiles.map((p) => ({
      profile: p,
      addresses: addresses.filter((a) => a.user_id === p.user_id),
      orders: orders.filter((o) => o.user_id === p.user_id),
      tags: tags.filter((t: any) => t.user_id === p.user_id).map((t: any) => t.tag),
      isAdmin: roles.some((r: any) => r.user_id === p.user_id && r.role === "admin"),
    }));

    setUsers(combined);
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot remove your own admin access");
      return;
    }
    if (currentlyAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) toast.error("Failed to remove admin role");
      else { toast.success("Admin role removed"); loadUsers(); }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) {
        if (error.code === "23505") toast.error("User is already an admin");
        else toast.error("Failed to assign admin role");
      } else { toast.success("Admin role assigned"); loadUsers(); }
    }
  };

  const addTag = async (userId: string, tag: string) => {
    if (!tag.trim()) return;
    const { error } = await supabase.from("customer_tags").insert({ user_id: userId, tag: tag.trim() });
    if (error) {
      if (error.code === "23505") toast.error("Tag already exists");
      else toast.error("Failed to add tag");
    } else {
      toast.success("Tag added");
      setNewTag("");
      loadUsers();
    }
  };

  const removeTag = async (userId: string, tag: string) => {
    const { error } = await supabase.from("customer_tags").delete().eq("user_id", userId).eq("tag", tag);
    if (error) toast.error("Failed to remove tag");
    else { toast.success("Tag removed"); loadUsers(); }
  };

  const exportCSV = () => {
    const rows = [["Name", "Phone", "Joined", "Total Orders", "Total Spent", "Tags"]];
    filtered.forEach(u => {
      const totalSpent = u.orders.reduce((s, o) => s + (o.total || 0), 0);
      rows.push([
        u.profile.full_name || "", u.profile.phone || "",
        format(new Date(u.profile.created_at), "yyyy-MM-dd"),
        String(u.orders.length), String(totalSpent),
        u.tags.join(", "),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const filtered = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter((u) =>
        (u.profile.full_name || "").toLowerCase().includes(q) ||
        (u.profile.phone || "").includes(q) ||
        (u.profile.email || "").toLowerCase().includes(q) ||
        u.orders.some((o) => o.id.toLowerCase().includes(q))
      );
    }
    
    if (tagFilter) {
      result = result.filter(u => u.tags.includes(tagFilter));
    }
    switch (sortBy) {
      case "oldest": result.sort((a, b) => new Date(a.profile.created_at).getTime() - new Date(b.profile.created_at).getTime()); break;
      case "most_orders": result.sort((a, b) => b.orders.length - a.orders.length); break;
      case "highest_spent": result.sort((a, b) => b.orders.reduce((s, o) => s + (o.total || 0), 0) - a.orders.reduce((s, o) => s + (o.total || 0), 0)); break;
      default: result.sort((a, b) => new Date(b.profile.created_at).getTime() - new Date(a.profile.created_at).getTime());
    }
    return result;
  }, [users, search, tagFilter, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [search, tagFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary";
      case "placed": return "bg-accent/10 text-accent";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const segmentStats = useMemo(() => {
    const highValue = users.filter(u => u.orders.reduce((s, o) => s + (o.total || 0), 0) > 5000);
    const newCustomers = users.filter(u => u.orders.length <= 1);
    const repeatBuyers = users.filter(u => u.orders.length > 1);
    return { highValue: highValue.length, newCustomers: newCustomers.length, repeatBuyers: repeatBuyers.length };
  }, [users]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-display font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Segments */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "High Value (₹5k+)", value: segmentStats.highValue, color: "text-primary" },
          { label: "Repeat Buyers", value: segmentStats.repeatBuyers, color: "text-accent" },
          { label: "New Customers", value: segmentStats.newCustomers, color: "text-muted-foreground" },
        ].map(seg => (
          <div key={seg.label} className="bg-card rounded-xl p-3 shadow-soft text-center">
            <p className={`text-xl font-bold ${seg.color}`}>{seg.value}</p>
            <p className="text-[10px] text-muted-foreground">{seg.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} of {users.length} customers</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name, phone, or order ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
        </div>
        
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_orders">Most Orders</option>
          <option value="highest_spent">Highest Spent</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {paginated.map((u) => {
            const isExpanded = expandedUser === u.profile.user_id;
            const totalSpent = u.orders.reduce((sum, o) => sum + (o.total || 0), 0);
            const deliveredOrders = u.orders.filter(o => o.status === "delivered");
            const avgOrder = deliveredOrders.length > 0 ? Math.round(deliveredOrders.reduce((s, o) => s + (o.total || 0), 0) / deliveredOrders.length) : 0;

            return (
              <div key={u.profile.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
                <button onClick={() => setExpandedUser(isExpanded ? null : u.profile.user_id)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                      {(u.profile.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{u.profile.full_name || "—"}</p>
                        {u.isAdmin && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-0 gap-1"><Shield className="w-2.5 h-2.5" />Admin</Badge>
                        )}
                        {u.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Joined {format(new Date(u.profile.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{u.orders.length}</span>
                      <span className="font-semibold text-foreground">₹{totalSpent.toLocaleString()}</span>
                      
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-5 bg-muted/30">
                    {/* Profile info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Profile</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1.5"
                            onClick={() => openWhatsApp(u.profile.phone || "", u.profile.full_name || "")}
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1.5"
                            onClick={() => openEmail(u.profile.email || "", u.profile.full_name || "")}
                          >
                            <Mail className="w-3 h-3" /> Email
                          </Button>
                          <Button
                            size="sm"
                            variant={u.isAdmin ? "destructive" : "outline"}
                            className="text-xs h-7 gap-1.5"
                            onClick={() => setAdminConfirm({ open: true, userId: u.profile.user_id, isAdmin: u.isAdmin, name: u.profile.full_name || "this user" })}
                          >
                            {u.isAdmin ? <><ShieldOff className="w-3 h-3" /> Remove Admin</> : <><Shield className="w-3 h-3" /> Make Admin</>}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{u.profile.phone || "—"}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate">{u.profile.email || "—"}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                          <p className="text-sm font-medium">₹{totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Avg Order</p>
                          <p className="text-sm font-medium">₹{avgOrder.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {u.tags.map(t => (
                          <span key={t} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/10 text-accent font-medium">
                            {t}
                            <button onClick={() => setRemoveTagConfirm({ open: true, userId: u.profile.user_id, tag: t })} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Add tag (e.g. VIP, wholesale)" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag(u.profile.user_id, newTag)}
                          className="max-w-[200px] px-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:border-primary bg-background" />
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => addTag(u.profile.user_id, newTag)}>Add</Button>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Addresses ({u.addresses.length})</h3>
                      {u.addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No addresses</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {u.addresses.map((addr) => (
                            <div key={addr.id} className="bg-card rounded-lg border border-border p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{addr.full_name}</span>
                                <Badge variant="outline" className="text-[10px]">{addr.label}</Badge>
                                {addr.is_default && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Default</Badge>}
                              </div>
                              <p className="text-muted-foreground">{addr.address_line}, {addr.city} - {addr.pincode}</p>
                              <p className="text-muted-foreground">{addr.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Orders */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Orders ({u.orders.length})</h3>
                      {u.orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No orders</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {u.orders.map((order) => {
                            const items = Array.isArray(order.items) ? order.items : [];
                            const addr = order.delivery_address as any;
                            return (
                              <div key={order.id} className="bg-card rounded-lg border border-border p-3 text-sm space-y-2">
                                {/* Header: ID, Status, Total */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                                    {order.payment_status && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">{order.payment_status}</span>
                                    )}
                                  </div>
                                  <span className="font-semibold">₹{order.total?.toLocaleString()}</span>
                                </div>

                                {/* Timestamps */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <div>
                                      <span className="font-medium text-foreground">Ordered: </span>
                                      {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                                    </div>
                                  </div>
                                  {order.status === "delivered" && order.updated_at && (
                                    <div className="flex items-center gap-1.5 text-primary">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                                      <div>
                                        <span className="font-medium">Delivered: </span>
                                        {format(new Date(order.updated_at), "dd MMM yyyy, hh:mm a")}
                                      </div>
                                    </div>
                                  )}
                                  {order.status === "cancelled" && order.updated_at && (
                                    <div className="flex items-center gap-1.5 text-destructive">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <div>
                                        <span className="font-medium">Cancelled: </span>
                                        {format(new Date(order.updated_at), "dd MMM yyyy, hh:mm a")}
                                      </div>
                                    </div>
                                  )}
                                  {!["delivered", "cancelled", "placed"].includes(order.status) && order.updated_at && order.updated_at !== order.created_at && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <div>
                                        <span className="font-medium text-foreground">
                                          {order.status === "confirmed" ? "Confirmed: " :
                                           order.status === "baking" ? "Baking since: " :
                                           order.status === "out_for_delivery" ? "Dispatched: " : "Updated: "}
                                        </span>
                                        {format(new Date(order.updated_at), "dd MMM yyyy, hh:mm a")}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Delivery Slot */}
                                {order.delivery_slot && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Truck className="w-3 h-3 shrink-0" />
                                    <span className="font-medium text-foreground">Delivery: </span>
                                    {order.delivery_slot}
                                  </div>
                                )}

                                {/* Delivery Address */}
                                {addr && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {addr.name && `${addr.name}, `}{addr.address || addr.address_line || ""}{addr.city ? `, ${addr.city}` : ""}{addr.pincode ? ` - ${addr.pincode}` : ""}
                                    </span>
                                  </div>
                                )}

                                {/* Price Breakdown */}
                                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                  <span>Subtotal: ₹{order.subtotal?.toLocaleString()}</span>
                                  {order.discount > 0 && <span className="text-primary">Discount: -₹{order.discount?.toLocaleString()}</span>}
                                  <span>Delivery: {order.delivery_fee === 0 ? "Free" : `₹${order.delivery_fee}`}</span>
                                  {order.coupon_code && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">🏷 {order.coupon_code}</span>}
                                </div>

                                {/* Items */}
                                {items.length > 0 && (
                                  <div className="space-y-0.5 pt-1 border-t border-border">
                                    {items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                        <span>{item.name} ({item.weight}) × {item.quantity}</span>
                                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No customers found</p>}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}

      <ConfirmDialog
        open={removeTagConfirm.open}
        onOpenChange={(open) => setRemoveTagConfirm(prev => ({ ...prev, open }))}
        title="Remove Tag"
        description={`Remove the tag "${removeTagConfirm.tag}" from this customer?`}
        confirmLabel="Remove"
        onConfirm={() => { removeTag(removeTagConfirm.userId, removeTagConfirm.tag); setRemoveTagConfirm({ open: false, userId: "", tag: "" }); }}
      />

      <ConfirmDialog
        open={adminConfirm.open}
        onOpenChange={(open) => setAdminConfirm(prev => ({ ...prev, open }))}
        title={adminConfirm.isAdmin ? "Remove Admin Access" : "Grant Admin Access"}
        description={adminConfirm.isAdmin
          ? `Remove admin privileges from ${adminConfirm.name}? They will no longer be able to access the admin panel.`
          : `Make ${adminConfirm.name} an admin? They will have full access to the admin panel including orders, products, and settings.`
        }
        confirmLabel={adminConfirm.isAdmin ? "Remove Admin" : "Make Admin"}
        variant={adminConfirm.isAdmin ? "destructive" : "default"}
        onConfirm={() => { toggleAdmin(adminConfirm.userId, adminConfirm.isAdmin); setAdminConfirm({ open: false, userId: "", isAdmin: false, name: "" }); }}
      />

      {/* WhatsApp Message Dialog */}
      <Dialog open={waDialog.open} onOpenChange={(open) => setWaDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-green-600" /> Send WhatsApp to {waDialog.name || "Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-1.5">
                {waTemplates.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setWaMessage(t.text.replace(/{name}/g, waDialog.name || "there"))}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-border hover:bg-accent/50 hover:border-primary/30 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Message</p>
              <Textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                rows={5}
                placeholder="Type your message..."
                className="text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">📱 {waDialog.phone || "No phone"}</p>
              <Button onClick={sendWhatsApp} className="gap-1.5" disabled={!waMessage.trim()}>
                <Send className="w-4 h-4" /> Send on WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Message Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Send Email to {emailDialog.name || "Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-1.5">
                {emailTemplates.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => {
                      setEmailSubject(t.subject);
                      setEmailBody(t.body.replace(/{name}/g, emailDialog.name || "there"));
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-border hover:bg-accent/50 hover:border-primary/30 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Subject</p>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary bg-background"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Body</p>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                placeholder="Type your email..."
                className="text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">✉️ {emailDialog.email || "No email"}</p>
              <Button onClick={sendEmail} className="gap-1.5" disabled={!emailSubject.trim() || !emailBody.trim()}>
                <Send className="w-4 h-4" /> Open in Gmail
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
