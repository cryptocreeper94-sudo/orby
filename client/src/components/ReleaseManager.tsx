import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, Plus, Rocket, Shield, ExternalLink, 
  Trash2, Clock, CheckCircle2, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Release {
  id: string;
  version: string;
  title: string;
  description: string | null;
  changes: unknown;
  releasedById: string | null;
  releasedAt: string | null;
  solanaTransactionHash: string | null;
  solanaNetwork: string | null;
  isPublished: boolean;
  createdAt: string;
}

export function ReleaseManager() {
  const [showForm, setShowForm] = useState(false);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { version: string; title: string; description: string }) => {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      setShowForm(false);
      setVersion("");
      setTitle("");
      setDescription("");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/releases/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases/latest"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/releases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
    },
  });

  const handleCreate = () => {
    if (!version || !title) return;
    createMutation.mutate({ version, title, description });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full bg-cyan-600 hover:bg-cyan-500"
          data-testid="button-new-release"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Release
        </Button>
      ) : (
        <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <Input
            placeholder="Version (e.g., 1.0.13)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-slate-900/50 border-slate-600"
            data-testid="input-version"
          />
          <Input
            placeholder="Release Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-900/50 border-slate-600"
            data-testid="input-title"
          />
          <Textarea
            placeholder="Description / Changelog"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-900/50 border-slate-600 min-h-[80px]"
            data-testid="input-description"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!version || !title || createMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              data-testid="button-create-release"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-slate-600"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {releases.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No releases yet. Create your first release above.
        </div>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <div
              key={release.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                release.isPublished
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              )}
              data-testid={`release-${release.version}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Package className={cn(
                      "h-4 w-4",
                      release.isPublished ? "text-emerald-400" : "text-slate-400"
                    )} />
                    <span className="font-mono font-bold text-slate-200">
                      v{release.version}
                    </span>
                    {release.isPublished ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                    {release.solanaTransactionHash && !release.solanaTransactionHash.startsWith("HASH_") && (
                      <a
                        href={`https://solscan.io/tx/${release.solanaTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 flex items-center gap-1 hover:bg-cyan-500/30"
                        data-testid={`link-solscan-${release.version}`}
                      >
                        <Shield className="h-3 w-3" />
                        Verified
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{release.title}</div>
                  {release.description && (
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {release.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {!release.isPublished && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(release.id)}
                        disabled={publishMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 h-8 px-2"
                        data-testid={`button-publish-${release.version}`}
                      >
                        {publishMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Rocket className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(release.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                        data-testid={`button-delete-${release.version}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-2">
                {release.isPublished && release.releasedAt
                  ? `Published ${new Date(release.releasedAt).toLocaleDateString()}`
                  : `Created ${new Date(release.createdAt).toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
