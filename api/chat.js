export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, image, language } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ reply: '⚠️ ত্রুটি: Vercel-এ GEMINI_API_KEY যুক্ত করা নেই।' });
  }

  try {
    const langPrompt = language === 'bn' 
      ? 'Always reply in fluent, natural Bengali (বাংলা).' 
      : (language === 'ar' ? 'Reply in Arabic.' : (language === 'hi' ? 'Reply in Hindi.' : 'Reply in English.'));

    const systemInstruction = `You are Nexora AI, an intelligent, modern, and engaging personal AI. ${langPrompt} Use emojis naturally (✨, 💡, 🚀). Use clean Markdown with bolding and bullet points. Always end with an engaging curiosity hook.`;

    const contents = [];

    // চ্যাট হিস্ট্রি যোগ
    if (Array.isArray(history) && history.length > 0) {
      let lastRole = null;
      for (const turn of history) {
        const role = turn.role === 'user' ? 'user' : 'model';
        if (turn.text && turn.text.trim() && role !== lastRole) {
          contents.push({ role: role, parts: [{ text: turn.text }] });
          lastRole = role;
        }
      }
    }

    // ছবি ও টেক্সট যুক্ত করা
    const currentParts = [];
    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      });
    }

    currentParts.push({ text: message || "এই ছবিটি বিশ্লেষণ করে বিস্তারিত বুঝিয়ে বলো।" });
    contents.push({ role: 'user', parts: currentParts });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else if (data.error) {
      return res.status(200).json({ reply: `⚠️ AI সার্ভার এরর: ${data.error.message}` });
    } else {
      return res.status(200).json({ reply: 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।' });
    }
  } catch (err) {
    return res.status(200).json({ reply: `⚠️ সংযোগ সমস্যা: ${err.message}` });
  }
        }
