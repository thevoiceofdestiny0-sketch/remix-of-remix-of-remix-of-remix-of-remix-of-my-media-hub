import { useState } from "react";
import { useAllContent, addContent, deleteContent, type Content } from "@/hooks/useContent";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminMovies = () => {
  const { toast } = useToast();
  const { content, loading, refetch } = useAllContent();
  const movies = content.filter(c => c.type === "movie");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("2026");
  const [genres, setGenres] = useState("Drama");
  const [posterUrl, setPosterUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const newMovie: Omit<Content, "id"> = {
        title,
        poster: posterUrl.trim() || "https://placehold.co/300x450/111/22c55e?text=" + encodeURIComponent(title),
        videoUrl: videoUrl.trim() || undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        type: "movie",
        status: isAgent ? "agent" : "published",
        rating: 8.0,
        year: parseInt(year),
        genres: genres.split(",").map(g => g.trim()),
        description: description.trim() || "A captivating movie.",
        isVip,
        isNew,
        createdAt: new Date().toISOString(),
      };
      await addContent(newMovie);
      toast({ title: "Movie added", description: isAgent ? "Sent to agent review." : "Published." });
      setTitle(""); setPosterUrl(""); setVideoUrl(""); setDescription(""); setTrailerUrl("");
      setShowForm(false);
      refetch();
    } catch {
      toast({ title: "Error adding movie", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteContent(id);
      toast({ title: "Deleted" });
      refetch();
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Movies ({movies.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> Upload Movie
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Movie title *" className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
          <div className="flex gap-3">
            <input value={year} onChange={e => setYear(e.target.value)} placeholder="Year" className="px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border w-32" />
            <input value={genres} onChange={e => setGenres(e.target.value)} placeholder="Genres (comma separated)" className="flex-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border resize-none" />
          <input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="Poster URL" className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video URL (direct MP4 or streaming URL)" className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
          <input value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} placeholder="Trailer URL (optional)" className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isVip} onChange={e => setIsVip(e.target.checked)} className="rounded" /> VIP Only
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} className="rounded" /> Mark as New
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isAgent} onChange={e => setIsAgent(e.target.checked)} className="rounded" /> Send to Agent Review
            </label>
          </div>
          <button onClick={handleAdd} disabled={saving} className="flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Add Movie
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3">Poster</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">VIP</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="p-3"><img src={m.poster} alt="" className="w-10 h-14 object-cover rounded" /></td>
                  <td className="p-3 text-foreground font-medium max-w-[200px] truncate">{m.title}</td>
                  <td className="p-3 text-muted-foreground">{m.year}</td>
                  <td className="p-3 text-muted-foreground">{m.isVip ? "✓" : "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === "published" ? "bg-primary/20 text-primary" :
                      m.status === "agent" ? "bg-badge-vip/20 text-badge-vip" :
                      "bg-secondary text-muted-foreground"
                    }`}>{m.status.replace("_", " ")}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors disabled:opacity-50">
                      {deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {movies.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No movies yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;
