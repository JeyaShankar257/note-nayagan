import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload as UploadIcon, Link2, Mic, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Upload = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleFileUpload = async (type: string) => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (type === "file" && !file) {
      toast.error("Please select a file");
      return;
    }

    if (type === "youtube" && !youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let sourceUrl = "";

      if (type === "file" && file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("lecture-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("lecture-files")
          .getPublicUrl(filePath);
        
        sourceUrl = publicUrl;
      } else if (type === "youtube") {
        sourceUrl = youtubeUrl;
      }

      // Call the edge function to process the content
      const { data, error } = await supabase.functions.invoke("process-lecture", {
        body: {
          title,
          sourceType: type === "youtube" ? "youtube" : file?.name.endsWith(".mp4") ? "video" : "audio",
          sourceUrl,
        },
      });

      if (error) throw error;

      toast.success("Processing started! Check your dashboard in a moment.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to process file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <LanguageSwitcher />
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3">Upload Your Lecture</h1>
          <p className="text-muted-foreground text-lg">
            Transform any lecture into structured notes with AI
          </p>
        </div>

        <Card className="shadow-glow animate-scale-in">
          <CardHeader>
            <CardTitle>Choose Your Source</CardTitle>
            <CardDescription>Upload a video/audio file or paste a YouTube link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="title">Note Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Physics Lecture - Chapter 5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  File
                </TabsTrigger>
                <TabsTrigger value="youtube">
                  <Link2 className="h-4 w-4 mr-2" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="live" disabled>
                  <Mic className="h-4 w-4 mr-2" />
                  Live (Soon)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Input
                    type="file"
                    accept=".mp4,.mp3,.wav,.m4a"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-1">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MP4, MP3, WAV, M4A (Max 100MB)
                    </p>
                  </Label>
                </div>
                <Button
                  onClick={() => handleFileUpload("file")}
                  disabled={loading || !file}
                  className="w-full"
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Process File
                </Button>
              </TabsContent>

              <TabsContent value="youtube" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => handleFileUpload("youtube")}
                  disabled={loading || !youtubeUrl}
                  className="w-full"
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Process YouTube Video
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">📝</div>
              <h3 className="font-semibold mb-1">Smart Summaries</h3>
              <p className="text-sm text-muted-foreground">AI-generated key points and notes</p>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">🧠</div>
              <h3 className="font-semibold mb-1">Mind Maps</h3>
              <p className="text-sm text-muted-foreground">Visual topic relationships</p>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">❓</div>
              <h3 className="font-semibold mb-1">Study Questions</h3>
              <p className="text-sm text-muted-foreground">Auto-generated practice questions</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Upload;
