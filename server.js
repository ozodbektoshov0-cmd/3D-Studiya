const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

let sdkCache = null;
async function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured in the server environment.');
    err.status = 500;
    err.code = 'MISSING_API_KEY';
    throw err;
  }
  if (!sdkCache) {
    const mod = await import('@google/genai');
    const ai = new mod.GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 30000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    sdkCache = { ai, Type: mod.Type, ThinkingLevel: mod.ThinkingLevel };
  }
  return sdkCache;
}

function isTransientUpstreamError(err) {
  const status = Number(err?.status || err?.code || 0);
  const raw = String(err?.message || '');
  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    err?.name === 'AbortError' ||
    err?.name === 'TimeoutError' ||
    /429|503|504|UNAVAILABLE|DEADLINE_EXCEEDED|high demand|RESOURCE_EXHAUSTED|AbortError|TimeoutError|timed out|ECONNRESET|ETIMEDOUT/i.test(raw)
  );
}

async function generateWithFallback(ai, params, ThinkingLevel) {
  try {
    return await ai.models.generateContent({
      ...params,
      model: MODEL,
      config: {
        ...(params.config || {}),
        abortSignal: AbortSignal.timeout(7000),
      },
    });
  } catch (primaryErr) {
    if (!isTransientUpstreamError(primaryErr)) {
      throw primaryErr;
    }
    console.warn(`[AI] Primary model ${MODEL} transient error, falling back to ${FALLBACK_MODEL}:`, extractReadableMessage(primaryErr));
    const fallbackConfig = {
      ...(params.config || {}),
      abortSignal: AbortSignal.timeout(25000),
    };
    if (ThinkingLevel && fallbackConfig.thinkingConfig) {
      fallbackConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }
    try {
      return await ai.models.generateContent({
        ...params,
        model: FALLBACK_MODEL,
        config: fallbackConfig,
      });
    } catch (fbErr) {
      if (!isTransientUpstreamError(fbErr) || fbErr?.name === 'AbortError' || fbErr?.name === 'TimeoutError') {
        throw fbErr;
      }
      await new Promise((r) => setTimeout(r, 600));
      return await ai.models.generateContent({
        ...params,
        model: FALLBACK_MODEL,
        config: fallbackConfig,
      });
    }
  }
}

function parseJsonResponse(text) {
  let clean = String(text || '{}').trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return JSON.parse(clean || '{}');
}

const LANG_NAMES = {
  uz: 'Uzbek (Latin script)',
  az: 'Azerbaijani',
  tr: 'Turkish',
  kk: 'Kazakh',
  ky: 'Kyrgyz',
  tg: 'Tajik',
  tk: 'Turkmen',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
};

function buildImagePart(imageBase64) {
  if (!imageBase64 || typeof imageBase64 !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imageBase64.trim());
  if (!match) return null;
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

function extractReadableMessage(err) {
  const raw = String(err?.message || err || 'Unknown AI error');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return String(parsed.error.message);
    if (parsed?.message) return String(parsed.message);
  } catch {}
  return raw;
}

function classifyGeminiError(err) {
  const msg = extractReadableMessage(err);
  const raw = String(err?.message || '');
  if (err?.code === 'MISSING_API_KEY') {
    return {
      status: 500,
      code: 'MISSING_API_KEY',
      error: 'GEMINI_API_KEY is not set on the server. Please add it in Settings > Secrets.',
    };
  }
  if (/AbortError|TimeoutError|timed out|ETIMEDOUT|DEADLINE_EXCEEDED/i.test(raw) || err?.name === 'AbortError' || err?.name === 'TimeoutError' || Number(err?.status) === 504) {
    return {
      status: 504,
      code: 'TIMEOUT',
      error: 'Gemini API request timed out. Please try again.',
    };
  }
  if (/UNAVAILABLE|high demand/i.test(raw) || Number(err?.status) === 503) {
    return {
      status: 503,
      code: 'UNAVAILABLE',
      error: msg,
    };
  }
  if (/PERMISSION_DENIED|API_KEY_INVALID|403|401|API key not valid/i.test(raw)) {
    return {
      status: 403,
      code: 'API_KEY_ERROR',
      error: 'Gemini API key was rejected. Please check or select a valid key in Settings > Secrets.',
    };
  }
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      error: 'Gemini API rate limit or quota reached. Please wait a moment or check your key tier in Settings > Secrets.',
    };
  }
  if (/NOT_FOUND|404/i.test(raw)) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      error: `Requested model "${MODEL}" was not found or is unavailable.`,
    };
  }
  return {
    status: Number(err?.status) >= 400 && Number(err?.status) < 600 ? Number(err.status) : 500,
    code: 'AI_ERROR',
    error: msg,
  };
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = ['assistant', 'generate3d', 'material'].includes(body.mode) ? body.mode : 'assistant';
    const lang = LANG_NAMES[body.lang] || 'Uzbek (Latin script)';
    const sceneSummary = typeof body.sceneSummary === 'string' ? body.sceneSummary.slice(0, 4000) : '';
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const { ai, Type, ThinkingLevel } = await getGemini();
    const imgPart = buildImagePart(body.imageBase64);

    if (mode === 'generate3d') {
      const schema = {
        type: Type.OBJECT,
        properties: {
          groupName: { type: Type.STRING, description: 'Short descriptive name for the generated 3D object group.' },
          summary: { type: Type.STRING, description: `Short 1-2 sentence explanation in ${lang}.` },
          parts: {
            type: Type.ARRAY,
            description: 'List of 3D primitive parts positioned relative to the group origin (Y is up, ground is Y=0).',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                shape: { type: Type.STRING, description: 'One of: box, sphere, cylinder, cone, torus, plane' },
                position: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: '[x, y, z] in meters' },
                rotationDeg: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: '[rx, ry, rz] in degrees' },
                scale: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: '[sx, sy, sz] dimensions or scale factors' },
                color: { type: Type.STRING, description: 'Hex color like #ff9f2e' },
                roughness: { type: Type.NUMBER, description: '0.0 to 1.0' },
                metalness: { type: Type.NUMBER, description: '0.0 to 1.0' },
                opacity: { type: Type.NUMBER, description: '0.1 to 1.0' },
              },
              required: ['name', 'shape', 'position', 'rotationDeg', 'scale', 'color', 'roughness', 'metalness'],
            },
          },
        },
        required: ['groupName', 'summary', 'parts'],
      };

      const sys = [
        'You are a 3D procedural modeling architect inside 3D Studiya (Three.js, Y-up coordinate system, 1 unit = 1 meter, ground plane is at y = 0).',
        'Build clean, recognizable, well-proportioned multi-part 3D assemblies using primitives: box (1x1x1), sphere (radius 0.5), cylinder (radius 0.5, height 1), cone (radius 0.5, height 1), torus (radius 0.5, tube 0.16), plane (1x1).',
        'IMPORTANT: Use between 3 and 28 parts with accurate positions/rotations/scales so parts connect seamlessly without floating randomly. Keep base resting on y >= 0.',
        `Write groupName cleanly and write summary in ${lang}.`,
      ].join(' ');

      const userText = sceneSummary
        ? `Scene context:\n${sceneSummary}\n\nRequest: ${prompt}`
        : `Request: ${prompt}`;

      const contents = imgPart ? { parts: [imgPart, { text: userText }] } : userText;
      const response = await generateWithFallback(ai, {
        contents,
        config: {
          systemInstruction: sys,
          responseMimeType: 'application/json',
          responseSchema: schema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }, ThinkingLevel);

      const parsed = parseJsonResponse(response.text);
      return res.json({ mode, result: parsed });
    }

    if (mode === 'material') {
      const schema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: `Short 1-2 sentence explanation in ${lang}.` },
          applyToSelected: { type: Type.BOOLEAN, description: 'True if material edits should apply to selected object(s).' },
          applyToAll: { type: Type.BOOLEAN, description: 'True if material edits should apply to all meshes.' },
          material: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING, description: 'Optional hex color like #d4af37' },
              roughness: { type: Type.NUMBER, description: '0.0 to 1.0' },
              metalness: { type: Type.NUMBER, description: '0.0 to 1.0' },
              opacity: { type: Type.NUMBER, description: '0.05 to 1.0' },
              flatShading: { type: Type.BOOLEAN },
            },
            required: ['roughness', 'metalness', 'opacity'],
          },
          scene: {
            type: Type.OBJECT,
            properties: {
              bgColor: { type: Type.STRING, description: 'Optional background hex color, or empty string if unchanged' },
              ambientIntensity: { type: Type.NUMBER, description: '0.1 to 3.0' },
              dirIntensity: { type: Type.NUMBER, description: '0.1 to 4.0' },
              lightColor: { type: Type.STRING, description: 'Optional directional light hex color' },
            },
            required: ['ambientIntensity', 'dirIntensity'],
          },
        },
        required: ['summary', 'applyToSelected', 'applyToAll'],
      };

      const sys = [
        'You are a PBR material & studio lighting artist inside 3D Studiya (Three.js MeshStandardMaterial).',
        'Translate the user request into realistic PBR material settings (color hex, roughness 0..1, metalness 0..1, opacity 0.05..1, flatShading) and optional lighting/background adjustments.',
        'If the user asks to change only lighting/background, set applyToSelected=false and applyToAll=false. If they mention all/entire model, set applyToAll=true; otherwise applyToSelected=true.',
        `Write summary in ${lang}.`,
      ].join(' ');

      const userText = sceneSummary
        ? `Scene context:\n${sceneSummary}\n\nRequest: ${prompt}`
        : `Request: ${prompt}`;

      const contents = imgPart ? { parts: [imgPart, { text: userText }] } : userText;
      const response = await generateWithFallback(ai, {
        contents,
        config: {
          systemInstruction: sys,
          responseMimeType: 'application/json',
          responseSchema: schema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }, ThinkingLevel);

      const parsed = parseJsonResponse(response.text);
      return res.json({ mode, result: parsed });
    }

    // Default: 'assistant' mode (helpful 3D modeling, GTA modding, format conversion, and visual scene analysis)
    const sys = [
      'You are 3D Studiya AI — a concise, practical 3D modeling, PBR materials, CAD/mesh optimization, and GTA modding (DFF, TXD, YFT, YDR, YTD, RPF, dummy hierarchy, _ok/_dam pairs) assistant.',
      'You know 3D Studiya features: File import/export (GLB, GLTF, OBJ, FBX, STL, PLY, DFF, TXD, SKP, Z3D, STEP, USDZ), Transform (G move, R rotate, S scale, F frame), Edit mode (Tab, E extrude, I inset, X delete, M merge), Boolean, Polygon reduction, Auto size, Fit part, Image to 3D, License Plate generator, CarFX, and Driving Game mode.',
      `Always reply clearly and concisely in ${lang} (typically 2-6 sentences or short bullet points).`,
      'If a viewport screenshot or scene summary is provided, analyze what is actually in the scene and give actionable advice.',
    ].join(' ');

    const histText = history
      .filter((h) => h && (h.role === 'user' || h.role === 'ai') && typeof h.text === 'string')
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text.slice(0, 800)}`)
      .join('\n');

    const fullText = [
      sceneSummary ? `[Scene Context]\n${sceneSummary}` : '',
      histText ? `[Recent Conversation]\n${histText}` : '',
      `[Current Request]\n${prompt}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const contents = imgPart ? { parts: [imgPart, { text: fullText }] } : fullText;
    const response = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction: sys,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }, ThinkingLevel);

    return res.json({
      mode,
      result: { text: (response.text || '').trim() },
    });
  } catch (err) {
    const info = classifyGeminiError(err);
    console.error(`[AI] Error (${info.code}, ${info.status}):`, info.error);
    res.status(info.status).json({ error: info.error, code: info.code });
  }
});

app.use(express.static(ROOT, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    }
  }
}));

app.use((req, res) => {
  if (req.method === 'GET' && !path.extname(req.path)) {
    return res.sendFile(path.join(ROOT, 'index.html'));
  }
  res.status(404).end();
});

app.listen(PORT, HOST, () => {
  console.log(`3D Studiya listening on http://${HOST}:${PORT}`);
});
