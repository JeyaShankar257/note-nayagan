import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, sourceType, sourceUrl } = await req.json();
    console.log("Processing lecture:", { title, sourceType, sourceUrl });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Step 1: Create initial note entry
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        source_type: sourceType,
        source_url: sourceUrl,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Step 2: Generate transcription (simplified - in production, use Whisper or YouTube API)
    let transcription = "Sample transcription of the lecture content. In production, this would be generated using Whisper API for audio/video files or YouTube API for YouTube videos.";
    
    // For demo purposes, create realistic content based on source type
    if (sourceType === "youtube") {
      transcription = "This is a transcription from a YouTube video lecture. The content covers various educational topics with detailed explanations and examples.";
    }

    // Step 3: Use Gemini to generate study materials
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert educational assistant. Your task is to analyze lecture transcriptions and create comprehensive study materials.

Generate the following in a structured JSON format:
1. summary: A concise 2-3 paragraph summary of the main concepts
2. key_points: Array of 5-8 key points (strings)
3. keywords: Array of 10-15 important keywords (strings)
4. questions: Array of 5-7 study questions with context (objects with 'question' and 'context' fields)
5. mind_map_topics: Array of main topics for mind mapping (strings)
6. image_prompts: Array of 2-3 prompts for AI-generated illustrations (strings)

Return ONLY valid JSON without any markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: `Analyze this lecture transcription and generate study materials:\n\nTitle: ${title}\n\nTranscription: ${transcription}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No AI response generated");
    }

    // Parse AI response
    let studyMaterials;
    try {
      // Remove markdown code blocks if present
      const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      studyMaterials = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse AI response");
    }

    // Step 4: Update note with generated content
    const { error: updateError } = await supabase
      .from("notes")
      .update({
        transcription,
        summary: studyMaterials.summary,
        key_points: studyMaterials.key_points,
        keywords: studyMaterials.keywords,
        questions: studyMaterials.questions,
        mind_map: { topics: studyMaterials.mind_map_topics },
        ai_images: [], // Image generation can be added later
        resources: [], // Resource recommendations can be added later
      })
      .eq("id", note.id);

    if (updateError) throw updateError;

    console.log("Successfully processed lecture:", note.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        note_id: note.id,
        message: "Lecture processed successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing lecture:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
