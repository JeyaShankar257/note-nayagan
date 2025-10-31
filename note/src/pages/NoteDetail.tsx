import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Download, BookOpen, Lightbulb, HelpCircle, Network, Image as ImageIcon, MessageCircle, X } from "lucide-react";
// Gemini Chatbot UI for note-specific chat
import { useRef } from "react";
// Gemini Chatbot Component with floating button
const GeminiChat = ({ note }) => {
  const [open, setOpen] = useState(false);
  const systemMsg = { role: "system", content: `You are an AI assistant helping with the following note: ${note.title}. Summary: ${note.summary}` };
  const [messages, setMessages] = useState([systemMsg]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    // Always send system message as first message
    const userMsg = { role: "user", content: input };
    const newMessages = [systemMsg, ...messages.filter(m => m.role !== "system"), userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, noteId: note.id }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't process your request." }]);
      toast.error("Gemini chatbot is unavailable or request failed.");
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full shadow-lg p-4 hover:bg-primary/90 focus:outline-none"
          onClick={() => setOpen(true)}
          aria-label="Open Gemini Chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-full max-w-md z-50">
          <div className="bg-white rounded-lg shadow-lg border p-4 flex flex-col h-96">
            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                <span className="font-semibold">Gemini Note Chat</span>
              </div>
              <button onClick={() => setOpen(false)} className="ml-2 p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 bg-muted p-2 rounded">
              {messages.filter(m => m.role !== "system").map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={m.role === "user" ? "bg-primary text-white px-3 py-1 rounded-lg inline-block" : "bg-gray-200 px-3 py-1 rounded-lg inline-block"}>
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 border rounded px-2 py-1"
                placeholder="Ask about this note..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
// import { translateWithGemini } from "@/lib/translateWithGemini";

interface Note {
  id: string;
  title: string;
  source_type: string;
  transcription: string | null;
  summary: string | null;
  key_points: any;
  keywords: any;
  questions: any;
  mind_map: any;
  ai_images: any;
  resources: any;
  created_at: string;
}

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const [translated, setTranslated] = useState<{
    summary?: string;
    key_points?: string[];
    questions?: { question: string; context?: string }[];
  }>({});
  const [translating, setTranslating] = useState(false);
  const GEMINI_API_KEY = "AIzaSyDObh8JdHfsxFsBC5NN8KWj25576_c9xOc";

  useEffect(() => {
    fetchNote();
  }, [id]);

  // Translate content when language changes and not English
  useEffect(() => {
    if (!note) return;
    const lang = i18n.language;
    if (lang === "en") {
      setTranslated({});
      return;
    }
    setTranslating(true);
    const translateViaApi = async (text, targetLang) => {
      const res = await fetch("http://localhost:3001/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang })
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      return data.translatedText || "";
    };
    (async () => {
      try {
        // Translate summary
        const summary = note.summary
          ? await translateViaApi(note.summary, lang)
          : "";
        // Translate key points
        let key_points = [];
        if (note.key_points && Array.isArray(note.key_points)) {
          key_points = await Promise.all(
            note.key_points.map((point) => translateViaApi(point, lang))
          );
        }
        // Translate questions
        let questions = [];
        if (note.questions && Array.isArray(note.questions)) {
          questions = await Promise.all(
            note.questions.map(async (q) => ({
              question: await translateViaApi(q.question, lang),
              context: q.context ? await translateViaApi(q.context, lang) : undefined,
            }))
          );
        }
        setTranslated({ summary, key_points, questions });
      } catch (err) {
        toast.error("Translation failed");
      } finally {
        setTranslating(false);
      }
    })();
  }, [i18n.language, note]);

  const fetchNote = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (error: any) {
      toast.error("Failed to load note");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!note) return;
    
    toast.info("PDF export coming soon!");
    // TODO: Implement PDF generation with jsPDF or similar
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!note) {
    return <div>{t("note_not_found")}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <LanguageSwitcher />
      {translating && (
        <div className="fixed top-0 left-0 w-full bg-yellow-100 text-yellow-800 text-center py-2 z-50">
          {t("processing")}
        </div>
      )}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}> 
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            {t("download_pdf")}
          </Button>
        </div>
      </header>

  <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">{note.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge>{note.source_type}</Badge>
            <span>•</span>
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <Tabs defaultValue="summary" className="animate-scale-in">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">
              <BookOpen className="h-4 w-4 mr-2" />
              {t("summary")}
            </TabsTrigger>
            <TabsTrigger value="keypoints">
              <Lightbulb className="h-4 w-4 mr-2" />
              {t("key_points")}
            </TabsTrigger>
            <TabsTrigger value="questions">
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("questions")}
            </TabsTrigger>
            <TabsTrigger value="mindmap">
              <Network className="h-4 w-4 mr-2" />
              {t("mind_map")}
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-2" />
              {t("images")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {i18n.language === "en"
                    ? note.summary || t("processing")
                    : translated.summary || t("processing")}
                </p>
              </CardContent>
            </Card>

            {note.keywords && note.keywords.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>{t("keywords")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {note.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="keypoints">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t("key_points")}</CardTitle>
              </CardHeader>
              <CardContent>
                {note.key_points && note.key_points.length > 0 ? (
                  <ul className="space-y-3">
                    {(i18n.language === "en" ? note.key_points : translated.key_points || []).map((point, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{t("no_key_points")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t("study_questions")}</CardTitle>
              </CardHeader>
              <CardContent>
                {note.questions && note.questions.length > 0 ? (
                  <div className="space-y-4">
                    {(i18n.language === "en" ? note.questions : translated.questions || []).map((q, i) => (
                      <div key={i} className="border-l-4 border-primary pl-4 py-2">
                        <p className="font-medium mb-1">{q.question}</p>
                        {q.context && (
                          <p className="text-sm text-muted-foreground">{q.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("no_questions")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mindmap">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t("mind_map")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {t("mind_map_coming_soon")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t("ai_generated_illustrations")}</CardTitle>
              </CardHeader>
              <CardContent>
                {note.ai_images && note.ai_images.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {note.ai_images.map((img, i) => (
                      <img key={i} src={img} alt={`${t("illustration")} ${i + 1}`} className="rounded-lg shadow" />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("no_images")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {/* Gemini Chatbot for this note */}
      {note && <GeminiChat note={note} />}
    </div>
  );
};

export default NoteDetail;
