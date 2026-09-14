"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, UserCheck, Clock, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

interface ProfileChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  changes: Record<string, { old: string; new: string }>;
  newProfileImage?: string;
  status: string;
  submittedAt: string;
  collectionName?: string;
  docId?: string;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pending_approvals"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ProfileChangeRequest))
        .filter((r) => r.status === "pending");
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      setRequests(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleApprove = async (req: ProfileChangeRequest) => {
    setProcessingId(req.id);
    try {
      // Apply changes to the original document
      const updateData: Record<string, any> = {};
      if (req.changes) {
        Object.entries(req.changes).forEach(([key, val]) => {
          updateData[key] = val.new;
        });
      }
      if (req.newProfileImage) {
        updateData.profileImage = req.newProfileImage;
      }

      // Update user doc
      if (req.userId) {
        await updateDoc(doc(db, "users", req.userId), updateData).catch(() => {});
      }
      // Also update collection-specific doc if provided
      if (req.collectionName && req.docId) {
        await updateDoc(doc(db, req.collectionName, req.docId), updateData).catch(() => {});
      }

      // Mark as approved
      await updateDoc(doc(db, "pending_approvals", req.id), {
        status: "approved",
        processedAt: new Date().toISOString(),
      });

      toast.success(req.userName + " ki profile changes approve ho gayi!");
    } catch (e: any) {
      toast.error(e.message || "Approve karne me masla aya");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: ProfileChangeRequest) => {
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, "pending_approvals", req.id), {
        status: "rejected",
        processedAt: new Date().toISOString(),
      });
      toast.success(req.userName + " ki request reject ho gayi.");
    } catch (e: any) {
      toast.error(e.message || "Reject karne me masla aya");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <UserCheck className="w-6 h-6 text-amber-500" />
          Profile Change Approvals
        </h1>
        <p className="text-sm text-muted-foreground">
          Users/Partners ki profile change requests approve ya reject karein
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Koi pending request nahi hai</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Jab users apni profile edit karenge to requests yahan show hongi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-all duration-200 border-amber-500/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{req.userRole}</Badge>
                    <span className="text-sm font-semibold">{req.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString("en-PK") : "N/A"}
                  </div>
                </div>

                {/* Show Changes */}
                {req.changes && Object.entries(req.changes).length > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                    {Object.entries(req.changes).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="font-semibold capitalize text-muted-foreground w-20">{key}:</span>
                        <span className="line-through text-destructive/60">{val.old || "N/A"}</span>
                        <span className="text-foreground">&#8594;</span>
                        <span className="font-semibold text-emerald-600">{val.new}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Profile Image */}
                {req.newProfileImage && (
                  <div className="flex items-center gap-2 text-xs">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">New Profile Image uploaded</span>
                    <img src={req.newProfileImage} alt="New DP" className="w-10 h-10 rounded-full object-cover border" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    onClick={() => handleApprove(req)}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 flex-1"
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
