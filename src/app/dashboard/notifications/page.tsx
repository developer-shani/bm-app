"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  Wallet,
  ArrowUpFromLine,
  AlertTriangle,
  CreditCard,
  Users,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { Notification as NotifType } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  investment: Wallet,
  withdrawal: ArrowUpFromLine,
  loss: AlertTriangle,
  recovery: CreditCard,
  referral: Users,
};

const colorMap: Record<string, string> = {
  investment: "bg-green-500/10 text-green-500",
  withdrawal: "bg-yellow-500/10 text-yellow-500",
  loss: "bg-red-500/10 text-red-500",
  recovery: "bg-blue-500/10 text-blue-500",
  referral: "bg-purple-500/10 text-purple-500",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const snap = await getDocs(query(collection(db, "notifications"), where("userId", "==", "admin"), orderBy("createdAt", "desc")));
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifType)));
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success("Saari notifications read mark ho gayin");
    } catch (err) {
      toast.error("Error marking all read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Notifications</h3>
            <p className="text-sm text-muted-foreground">Jab koi event hoga to yahan dikhega</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            const color = colorMap[n.type] || "bg-muted text-muted-foreground";
            return (
              <Card
                key={n.id}
                className={`transition-all duration-200 cursor-pointer ${!n.read ? "border-primary/20 bg-primary/[0.02]" : ""}`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

