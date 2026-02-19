import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Play, Film, Star, Lock, Loader2, Share2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import LoginModal from "@/components/LoginModal";
import MovieCard from "@/components/MovieCard";
import { useContentById, useContent } from "@/hooks/useContent";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getDriveEmbedUrl } from "@/lib/driveUtils";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { content, loading } = useContentById(id || "");
  const { user, hasActiveSubscription, hasAgentSubscription, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { content: allContent } = useContent(content?.type);
  const relatedContent = allContent.filter(c => c.id !== id).slice(0, 12);

  const isAgentContent = content?.status === "agent";
  const hasSubscription = isAdmin() || (isAgentContent ? hasAgentSubscription() : hasActiveSubscription());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Content not found</p>
      </div>
    );
  }

  const handleWatch = () => {
    if (!user) { setLoginOpen(true); return; }
    if (!hasSubscription && !isAdmin()) {
      navigate("/subscription");
      return;
    }
    navigate(`/watch/${content.id}`);
  };

  const trailerUrl = (content as any).trailerUrl;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Hero poster area */}
      <div className="relative mt-14">
        {/* Poster background blur */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={content.poster} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 pt-6 pb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-[200px] md:w-[250px] rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-border/30">
                <img src={content.poster} alt={content.title} className="w-full aspect-[2/3] object-cover" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {content.isVip && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-badge-vip text-primary-foreground">VIP</span>
                )}
                {content.isNew && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-badge-hot text-primary-foreground">NEW</span>
                )}
                {content.type === "series" && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground">
                    {content.episodes?.length || 0} Episodes
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{content.title}</h1>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 flex-wrap">
                <span className="flex items-center gap-1 text-badge-vip font-semibold">
                  <Star className="w-4 h-4 fill-current" /> {content.rating}
                </span>
                <span>{content.year}</span>
                <span className="capitalize">{content.type}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {content.genres.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground">{g}</span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">{content.description}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleWatch}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                >
                  {hasSubscription || isAdmin() ? (
                    <><Play className="w-4 h-4 fill-current" /> Watch Now</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Subscribe to Watch</>
                  )}
                </button>

                {trailerUrl && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <Film className="w-4 h-4" /> Play Trailer
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast({ title: "Link copied!" });
                  }}
                  className="p-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer modal */}
      {trailerOpen && trailerUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setTrailerOpen(false)}>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={getDriveEmbedUrl(trailerUrl)}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
            <button onClick={() => setTrailerOpen(false)} className="mt-3 mx-auto block text-sm text-muted-foreground hover:text-foreground">
              Close Trailer
            </button>
          </div>
        </div>
      )}

      {/* Related */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Related {content.type === 'series' ? 'Series' : 'Movies'}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {relatedContent.map(item => (
            <MovieCard key={item.id} movie={item} />
          ))}
        </div>
      </div>

      <MobileBottomNav />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default MovieDetail;
