import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Brain, FileText, Globe, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center lg:text-left animate-fade-in">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="relative">
                  <BookOpen className="h-16 w-16" />
                  <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold">NoteGenie</h1>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold">
                {t("transform_lectures")}
              </h2>
              <p className="text-xl text-white/90 max-w-2xl">
                {t("powered_by_ai")}
              </p>
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
                <Button size="lg" onClick={() => navigate("/auth")} className="bg-accent hover:bg-accent/90">
                  {t("get_started_free")}
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white text-white">
                  {t("learn_more")}
                </Button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 animate-scale-in">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
                <Brain className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">{t("ai_powered")}</h3>
                <p className="text-sm text-white/80">{t("ai_creates_notes")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
                <Globe className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">{t("multilingual")}</h3>
                <p className="text-sm text-white/80">{t("supports_transcription")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
                <FileText className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">{t("smart_summaries")}</h3>
                <p className="text-sm text-white/80">{t("get_key_points")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
                <Download className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">{t("pdf_export")}</h3>
                <p className="text-sm text-white/80">{t("download_notes")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">{t("everything_you_need")}</h2>
            <p className="text-xl text-muted-foreground">
              {t("from_transcription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📝",
                title: t("key_points_extraction"),
                description: t("key_points_desc")
              },
              {
                icon: "🧠",
                title: t("mind_map_generation"),
                description: t("mind_map_desc")
              },
              {
                icon: "❓",
                title: t("study_questions"),
                description: t("study_questions_desc")
              },
              {
                icon: "🎨",
                title: t("ai_illustrations"),
                description: t("ai_illustrations_desc")
              },
              {
                icon: "📚",
                title: t("resource_links"),
                description: t("resource_links_desc")
              },
              {
                icon: "🌍",
                title: t("multi_source_support"),
                description: t("multi_source_desc")
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-lg shadow-card hover:shadow-glow transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center animate-scale-in">
          <h2 className="text-4xl font-bold mb-4">{t("ready_to_transform")}</h2>
          <p className="text-xl mb-8 text-white/90">
            {t("join_thousands")}
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="bg-accent hover:bg-accent/90">
            {t("start_creating_notes")}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
