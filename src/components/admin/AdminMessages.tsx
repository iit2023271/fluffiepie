import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MailOpen, Trash2, Search, RefreshCw, X, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null;
  profile_name?: string | null;
  profile_email?: string | null;
  profile_phone?: string | null;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // Fetch messages
    const { data: msgs } = await supabase
      .from("contact_messages" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any;

    if (!msgs) { setMessages([]); setLoading(false); return; }

    // Fetch profiles for user_ids
    const userIds = [...new Set((msgs as any[]).filter(m => m.user_id).map(m => m.user_id))];
    let profileMap: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.user_id] = { full_name: p.full_name, email: p.email, phone: p.phone };
        });
      }
    }

    const enriched = (msgs as any[]).map(m => ({
      ...m,
      profile_name: m.user_id ? profileMap[m.user_id]?.full_name : null,
      profile_email: m.user_id ? profileMap[m.user_id]?.email : null,
      profile_phone: m.user_id ? profileMap[m.user_id]?.phone : null,
    }));

    setMessages(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (msg: ContactMessage) => {
    await supabase
      .from("contact_messages" as any)
      .update({ is_read: !msg.is_read } as any)
      .eq("id", msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: !m.is_read } : m));
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("contact_messages" as any).delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected === id) setSelected(null);
    toast.success("Message deleted");
  };

  const filtered = messages.filter(m => {
    if (filter === "unread" && m.is_read) return false;
    if (filter === "read" && !m.is_read) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;
  const selectedMsg = messages.find(m => m.id === selected);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "No new messages"}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {(["all", "unread", "read"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Message List */}
        <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No messages found</p>
            </div>
          ) : (
            filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => {
                  if (selected === msg.id) {
                    setSelected(null);
                  } else {
                    setSelected(msg.id);
                    if (!msg.is_read) toggleRead(msg);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected === msg.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <span className={`text-sm truncate ${!msg.is_read ? "font-bold" : "font-medium"}`}>
                        {msg.name}
                      </span>
                      {msg.user_id && (
                        <span className="shrink-0" title="Registered user">
                          <User className="w-3 h-3 text-primary" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.email}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1 line-clamp-1">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(msg.created_at), "MMM d")}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6 min-h-[400px]">
          {selectedMsg ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-display font-bold">{selectedMsg.name}</h3>
                  <a href={`mailto:${selectedMsg.email}`} className="text-sm text-primary hover:underline">
                    {selectedMsg.email}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(selectedMsg.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleRead(selectedMsg)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title={selectedMsg.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {selectedMsg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteMsg(selectedMsg.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* User Info Card */}
              {selectedMsg.user_id && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {selectedMsg.profile_name || "Unnamed User"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {selectedMsg.profile_email && <span>{selectedMsg.profile_email}</span>}
                      {selectedMsg.profile_phone && <span>📞 {selectedMsg.profile_phone}</span>}
                      <span className="text-[10px] opacity-60">ID: {selectedMsg.user_id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedMsg.message}
              </div>
              <div className="mt-4">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: Your message to FluffiePie`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Mail className="w-4 h-4" /> Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Mail className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}