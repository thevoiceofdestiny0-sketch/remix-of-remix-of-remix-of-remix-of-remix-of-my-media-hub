import { useState } from "react";
import { useAllContent, addEpisode, type Episode } from "@/hooks/useContent";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminEpisodes = () => {
  const { toast } = useToast();
  const { content, loading, refetch } = useAllContent();
  const allSeries = content.filter(c => c.type === "series");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [epTitle, setEpTitle] = useState("");
  const [season, setSeason] = useState("1");
  const [epVideoUrl, setEpVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const currentSeries = allSeries.find(s => s.id === selectedSeries);
  const episodes = currentSeries?.episodes || [];

  const handleAdd = async () => {
    if (!selectedSeries || !epTitle.trim()) return;
    setSaving(true);
    try {
      const ep: Omit<Episode, "id"> = {
        seriesId: selectedSeries,
        season: parseInt(season) || 1,
        number: episodes.length + 1,
        title: epTitle,
        videoUrl: epVideoUrl.trim(),
        duration: "~45min",
      };
      await addEpisode(selectedSeries, ep);
      toast({ title: "Episode added" });
      setEpTitle(""); setEpVideoUrl("");
      refetch();
    } catch {
      toast({ title: "Error adding episode", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Manage Episodes</h1>

      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
        <label className="text-sm text-muted-foreground">Select Series</label>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading series...</div>
        ) : (
          <select
            value={selectedSeries}
            onChange={e => setSelectedSeries(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border"
          >
            <option value="">-- Select a series --</option>
            {allSeries.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.episodes?.length || 0} eps)</option>
            ))}
          </select>
        )}

        {selectedSeries && (
          <>
            <div className="flex gap-2">
              <input value={season} onChange={e => setSeason(e.target.value)} placeholder="Season" className="px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border w-24" />
              <input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Episode title *" className="flex-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
            </div>
            <input value={epVideoUrl} onChange={e => setEpVideoUrl(e.target.value)} placeholder="Video URL (direct MP4 or streaming URL)" className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
            <button onClick={handleAdd} disabled={saving || !epTitle.trim()} className="flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Episode
            </button>
          </>
        )}
      </div>

      {currentSeries && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">{currentSeries.title} — Episodes ({episodes.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3">S</th>
                <th className="text-left p-3">Ep#</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Duration</th>
                <th className="text-left p-3">Video</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map(ep => (
                <tr key={ep.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground">S{ep.season}</td>
                  <td className="p-3 text-foreground font-medium">{ep.number}</td>
                  <td className="p-3 text-foreground">{ep.title}</td>
                  <td className="p-3 text-muted-foreground">{ep.duration}</td>
                  <td className="p-3 text-muted-foreground text-xs truncate max-w-[150px]">{ep.videoUrl || "—"}</td>
                </tr>
              ))}
              {episodes.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No episodes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEpisodes;
