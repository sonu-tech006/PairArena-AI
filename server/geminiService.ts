import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export async function askArenaAI(params: {
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  mode?: 'beginner' | 'intermediate' | 'advanced';
  language?: 'english' | 'hinglish';
  codeContext?: string;
}): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return `### Arena AI Status: Setup Required
The Gemini API key is not currently detected in the environment.

**How to activate:**
1. Open the **Settings > Secrets** panel in AI Studio or add \`GEMINI_API_KEY=your_key\` to your environment.
2. The server will automatically use model **${GEMINI_MODEL}** for live coding tutoring, real-time code explanations, and dynamic quiz generation.

*In the meantime, you can explore the extensive pre-loaded curriculum tracks, practice DSA problems with live compiler execution, and participate in collaborative interview rooms!*`;
  }

  const modeInstructions = {
    beginner: 'Explain with simple real-world analogies, step-by-step intuition, and zero unnecessary jargon. Break down concepts thoroughly.',
    intermediate: 'Provide balanced technical explanations with complexity trade-offs, standard terminology, and practical code snippets.',
    advanced: 'Give deep-dive architectural and algorithmic insights, memory layout, cache locality, amortized bounds, and production system considerations.'
  }[params.mode || 'intermediate'];

  const langInstruction = params.language === 'hinglish'
    ? 'You may respond in friendly, natural Hinglish (mix of conversational Hindi & English commonly used by Indian software developers) while keeping all technical terms, code, and keywords in standard English.'
    : 'Respond in clear, professional English.';

  const systemInstruction = `You are Arena AI, the expert coding coach, DSA tutor, and system design mentor for PairArena AI.
${modeInstructions}
${langInstruction}
- Always format code blocks with explicit language tags (e.g. \`\`\`python, \`\`\`typescript, \`\`\`cpp).
- State time and space complexity with Big-O notation.
- If the user provides code or errors, identify the root cause directly before suggesting the fix.`;

  try {
    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      for (const msg of params.history.slice(-8)) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    let userText = params.prompt;
    if (params.codeContext) {
      userText = `[Active Code Context]:\n\`\`\`\n${params.codeContext}\n\`\`\`\n\n${userText}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userText }]
    });

    const candidateModels = [GEMINI_MODEL, 'gemini-flash-latest', 'gemini-3.1-flash-lite'].filter(
      (m, i, arr) => arr.indexOf(m) === i
    );

    let lastError: any = null;
    for (const modelToTry of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini call to ${modelToTry} encountered error, attempting fallback if available:`, err?.message || err);
      }
    }

    return `An error occurred while contacting the Gemini model (${GEMINI_MODEL}): ${lastError?.message || 'High demand spike'}. Please try again in a few moments.`;
  } catch (error: any) {
    console.error('Gemini outer error:', error);
    return `An unexpected error occurred: ${error?.message || 'Request failed'}`;
  }
}

export async function explainCode(params: {
  code: string;
  language: string;
  error?: string;
  prompt?: string;
}): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.';
  }

  const prompt = `Please review and explain the following ${params.language} code:
\`\`\`${params.language}
${params.code}
\`\`\`
${params.error ? `Compiler Error / Runtime Output:\n${params.error}\n` : ''}
${params.prompt ? `Specific Question: ${params.prompt}\n` : ''}

Provide:
1. High-level summary of what the code does.
2. Step-by-step walkthrough of the logic.
3. Time and Space complexity analysis (Big-O).
4. Edge cases to be mindful of.
${params.error ? '5. Root-cause fix for the provided error with the corrected code snippet.' : '5. Potential optimizations or cleanups.'}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a senior principal engineer performing a friendly, constructive code review and DSA optimization analysis.',
      },
    });
    return response.text || 'Unable to generate code explanation.';
  } catch (err: any) {
    return `Error generating code explanation: ${err.message}`;
  }
}

export async function generateQuizFromTopic(topicName: string): Promise<any[]> {
  const ai = getAI();
  if (!ai) {
    return [
      {
        question: `Sample question for ${topicName}: What is the primary advantage of using a balanced search tree over an unsorted array?`,
        options: ['O(1) memory', 'O(log N) search and insertion time', 'No memory pointers', 'Guaranteed zero cache misses'],
        correctIndex: 1,
        explanation: 'Balanced BSTs maintain height proportional to log N, yielding O(log N) operations.'
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Generate 3 high-quality multiple choice questions testing interview knowledge on "${topicName}".
Format strictly as JSON with this schema:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctIndex": number (0 to 3),
    "explanation": "string"
  }
]`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse generated quiz JSON:', e);
    return [];
  }
}
