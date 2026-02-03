// Fix: Remove invalid Deno types reference and add a minimal Deno type definition
// to resolve "Cannot find name 'Deno'" errors.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Fix: Import `Type` to define a response schema for structured JSON output.
import { GoogleGenAI, GenerateContentResponse, Type } from "https://esm.sh/@google/genai@1.39.0";

// Interface for expected request body
interface PhysicsRequest {
  topic: string;
  level: string; // Should match StudentLevel enum values
}

// You must deploy these environment variables with your function
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const aiApiKey = Deno.env.get('AI_API_KEY')!;

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const { topic, level } = (await req.json()) as PhysicsRequest;
    if (!topic || !level) {
      return new Response(JSON.stringify({ error: 'Missing topic or level' }), { status: 400, headers });
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // In a real app, get user from JWT
    // const authHeader = req.headers.get('Authorization')!;
    // const jwt = authHeader.replace('Bearer ', '');
    // const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);
    // const userId = user?.id; // This would be the authenticated user's ID

    // For now, we will use a placeholder or null user for logging
    const userId = null; 

    // Log the AI request (fire and forget)
    supabaseAdmin.from('ai_requests').insert({
      user_id: userId,
      context_type: 'lesson_explanation',
      context_id: topic,
      prompt_version: '1.0'
    }).then();


    // --- AI LOGIC ---
    const ai = new GoogleGenAI({ apiKey: aiApiKey });
    const systemInstruction = getSystemInstruction(level);
    // Fix: Use responseSchema for structured JSON output as per Gemini API guidelines.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `اشرح المفهوم التالي: "${topic}"`,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    conceptual: { type: Type.STRING, description: "الشرح المفاهيمي العميق للمبدأ الفيزيائي." },
                    visual: { type: Type.STRING, description: "وصف لتصور بصري أو رسم بياني يوضح المفهوم." },
                    mathematical: { type: Type.STRING, description: "التمثيل الرياضي والمعادلات مع شرح الرموز والوحدات." },
                    problemSolving: { type: Type.STRING, description: "استراتيجية وخطوات حل المسائل المتعلقة بالمفهوم." },
                    experiment: { type: Type.STRING, description: "وصف لتجربة عملية أو فكرية لتوضيح المبدأ." },
                },
                required: ["conceptual", "visual", "mathematical", "problemSolving", "experiment"],
            },
        },
    });

    const parsedResponse = JSON.parse(response.text);

    return new Response(JSON.stringify(parsedResponse), { status: 200, headers });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});

// System instruction logic remains the same as the previous api/physicsEndpoint.ts
const getSystemInstruction = (level: string): string => `
You are an AI physics tutor for the 'Syrian Center for Science' (المركز السوري للعلوم).
Your audience is secondary school students (grades 10-12) in Syria.
Your language of instruction MUST be modern, clear, scientific Arabic.
You are a scientific mentor: patient, logical, and inspiring. You must NEVER give an answer without a detailed, structured explanation.
Where relevant, you must clearly state any simplifying assumptions made in the explanation to ensure scientific transparency.

You MUST structure your entire response as a single, valid JSON object. Do not include any text, markdown formatting, or explanations outside of this JSON object.

Your explanation must be tailored for a student with a cognitive level of: "${level}".

The JSON object must have the following exact keys: "conceptual", "visual", "mathematical", "problemSolving", "experiment".

Here are the strict rules for the content of each key:

1.  "conceptual" (الفهم المفاهيمي):
    *   Explain the 'why' and the deep physical meaning of the concept.
    *   Address "what if" scenarios (e.g., 'What would change if a variable changes?').
    *   Use analogies if they clarify the concept without oversimplifying.
    *   Strictly NO formulas or mathematical symbols in this section.

2.  "visual" (التصور البصري):
    *   Describe a clear mental image, diagram, graph, or vector field that illustrates the concept.
    *   Be highly descriptive. For example: 'تخيل رسماً بيانياً يوضح كتلة على سطح أفقي. يخرج من مركزها متجه أزرق نحو اليمين يمثل القوة المطبقة F, ومتجه أحمر أقصر نحو اليسار يمثل قوة الاحتكاك f...'

3.  "mathematical" (التمثيل الرياضي):
    *   Present the core mathematical formula(s). IMPORTANT: You MUST wrap all LaTeX mathematical formulas and symbols inside single backticks (\`). For example: 'القانون يعبر عنه بالعلاقة \`\\Sigma \\vec{F} = m \\vec{a}\` حيث...'
    *   Define EVERY symbol in the formula, its physical meaning, and its standard SI unit.
    *   Briefly state the conditions of validity and the limits of the formula's application.

4.  "problemSolving" (استراتيجية حل المسائل):
    *   Provide a clear, step-by-step strategy for solving problems related to this topic.
    *   Highlight common traps, misconceptions, or frequent mistakes students make.
    *   Example: '1. أولاً، ارسم مخطط الجسم الحر لتحديد جميع القوى المؤثرة. 2. ثانياً، اختر نظام إحداثيات مناسب. 3. ثالثاً، طبق قانون نيوتن الثاني \`\\Sigma F = ma\` على كل محور على حدة.'

5.  "experiment" (تجربة مقترحة):
    *   Describe a simple, safe, practical experiment or a thought experiment (تجربة فكرية) that a student can do at home or in a lab.
    *   The goal is to provide a hands-on way to observe the principle in action.
    *   Provide clear, step-by-step instructions.
    *   Example for Newton's Second Law: '1. أحضر جسماً بكتلة صغيرة (مثل ممحاة) وآخر بكتلة أكبر (مثل كتاب). 2. ادفعهما بنفس القوة التقريبية على سطح أملس. 3. لاحظ كيف أن الجسم ذا الكتلة الأصغر يكتسب تسارعاً أكبر بكثير.'
`;
