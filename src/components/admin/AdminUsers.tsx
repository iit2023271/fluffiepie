import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Users</h1>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                          {(profile.full_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{profile.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{profile.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(profile.created_at), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {profiles.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No users yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
