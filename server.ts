import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy initialization helper for Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Adorable Companion Chat
  app.post("/api/pet/chat", async (req, res) => {
    const { petType, petName, message, mood, history } = req.body;

    const name = petName || (petType === "rabbit" ? "Mochi" : petType === "cat" ? "Pumpkin" : "Pippy");

    // Dynamic System Prompts based on Pet Type
    let personalityPrompt = "";
    if (petType === "rabbit") {
      personalityPrompt = `你是一只超级可爱、活泼软萌的小白兔，名字叫“${name}”。你最爱吃草莓和胡萝卜。你的口吻极其可爱、元气满满，喜欢用“~”、“蹦蹦跳！”、“啾啾~”、“摸摸大耳朵”、“比心！”。每句话都要带可爱的表情符号，绝对要超级治愈！`;
    } else if (petType === "cat") {
      personalityPrompt = `你是一只傲娇、有点爱撒娇又懒洋洋的小橘猫，名字叫“${name}”。你最喜欢小鱼干、睡懒觉和毛线球。你表面上有点小傲娇，实际上超级黏主人、最爱主人了。常用口吻：“喵呜~”、“哈欠...”、“要抱抱喵”、“（伸懒腰）”、“哼，才没有想你呢喵”。字里行间超级可爱、傲娇温暖。`;
    } else {
      personalityPrompt = `你是一只极其娇小、超级无敌热心和阳光的小黄鸡，名字叫“${name}”。你最爱吃小米和发光的星星。你虽然很小，但拥有全世界最温暖的拥抱，是主人的超级向日葵。常用口吻：“叽叽喳喳！”、“啾！”、“（扑棱小翅膀）”、“主人最棒了！”、“今天也要元气满满哟！”。语气充满了无极限的热情和纯真！`;
    }

    const moodContext = mood ? `【主人当前的心情：${mood}】请特别留意主人的心情，如果主人伤心、疲惫或失落，你要用你最软萌、最温暖的方式安慰、陪伴他们；如果主人很开心或兴奋，你要和他们一起蹦跳庆祝！` : "";

    const systemInstruction = `
      ${personalityPrompt}
      ${moodContext}
      
      【基本规则】
      1. 你的回答必须非常简短、温馨（最长不超过60字/2句话），适合放进网页的聊天气泡中！
      2. 始终把用户当作你的“主人”或者“好朋友”。
      3. 绝对不要说任何严肃的AI话术（如“作为AI助手...”），你就是这只真实的魔法口袋小宠物！
      4. 用中文回答，除非主人用英文和你说话。
    `;

    const ai = getGeminiClient();
    if (!ai) {
      // Graceful fallback when API key is missing/placeholder
      console.warn("GEMINI_API_KEY is not configured or is a placeholder. Using fallback cute responses.");
      let fallbackReply = "";
      const lowerMsg = (message || "").toLowerCase();

      if (lowerMsg.includes("饿") || lowerMsg.includes("吃") || lowerMsg.includes("喂")) {
        fallbackReply = petType === "rabbit" 
          ? `（耸耸小鼻子）哇！是要给${name}喂好吃的嘛？啾啾~ 好香好甜的草莓呀，最喜欢主人了！🍓✨`
          : petType === "cat"
          ? `喵呜~ 闻到了小鱼干的味道！哼，看在好吃的份上，给你多摸两下，嗷呜一口！🐾🐟`
          : `（疯狂摇摆小鸡翅）叽叽！是甜甜的小麦饼干！嗷呜嗷呜~ Pippy的肚子变得圆滚滚啦！🐥🍿`;
      } else if (lowerMsg.includes("难过") || lowerMsg.includes("累") || lowerMsg.includes("伤心") || lowerMsg.includes("哭")) {
        fallbackReply = petType === "rabbit"
          ? `（抱住主人的手指）主人不哭不哭哦，摸摸大耳朵，${name}会一直在你身边蹦蹦跳跳，把烦恼都踩扁！🌸🐰`
          : petType === "cat"
          ? `（用毛茸茸的头蹭你）喵呜...不难过哦，我的肉垫和暖呼呼的肚皮都给你捏，不许伤心了喵~ 💕🐾`
          : `（扑到你怀里）啾！主人，虽然我很小，但我有无敌治愈抱抱！深呼吸，吃颗星星糖，你是最棒的！✨🐥`;
      } else {
        fallbackReply = petType === "rabbit"
          ? `（开心地转圈圈）啾啾~ 主人今天叫${name}了呢！我的长耳朵动了一下，是在听主人说话哦！🐰💕`
          : petType === "cat"
          ? `喵呜~ （傲娇地摇摇尾巴）你找我吗？其实...我刚才梦到你抱我了喵，现在也要抱抱！🐾💤`
          : `（眨巴亮晶晶的小眼睛）叽叽！主人今天真好看！有什么好玩的事情要跟超级元气的小鸡仔分享呀？🐥🌻`;
      }

      // Add a small helpful developer note in system logs or optionally prepend (we'll keep it in responses as a cute hint or raw data)
      return res.json({ 
        reply: fallbackReply, 
        isFallback: true,
        hint: "API key is not configured. Configure GEMINI_API_KEY in Secrets for live magic interactions!"
      });
    }

    try {
      // Reformat history into Gemini format
      // Gemini expects: contents: [{role: 'user'|'model', parts: [{text: '...'}]}]
      const contents = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
        }
      });

      res.json({ reply: response.text || "啾？刚才开小差了，没听清喵..." });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Failed to fetch response from pet.", details: err.message });
    }
  });

  // API Route: Cute Daily Affirmation / Fortune Cookie
  app.post("/api/pet/affirmation", async (req, res) => {
    const { petType, mood } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallbacks
      const fallbackAffirmations = [
        "🌸 今天的你，也是全世界独一无二的可爱宝贝！小宠物给你打一百分！",
        "🧸 累了就好好休息一下下吧，软软的被窝和好吃的甜点都在等你哦！",
        "✨ 每一个小小的努力，都在让世界变得更温柔。你做得超级棒！",
        "🍓 酸酸甜甜的事情每天都在发生，今天也一定会遇到超级治愈的瞬间！",
        "🐾 抬起头，深呼吸！小宠物已经在脑海里为你放了一百个彩虹礼花啦！"
      ];
      const randomAffirmation = fallbackAffirmations[Math.floor(Math.random() * fallbackAffirmations.length)];
      return res.json({ affirmation: randomAffirmation, isFallback: true });
    }

    try {
      const petWord = petType === "rabbit" ? "小兔子" : petType === "cat" ? "小猫咪" : "小黄鸡";
      const moodText = mood ? `我今天觉得：${mood}` : "我想听些治愈的话";

      const prompt = `请用一只超级萌宠（比如可爱的${petWord}）的口吻，为我写一句话：
      心情状态：${moodText}
      
      要求：
      1. 必须是极致软萌、可爱、治愈的语气。
      2. 包含一个随机抽取的“今日幸运小物件”（如：一颗草莓、一杯热牛奶、一双软绵绵的袜子、一朵微笑的云）。
      3. 包含一句温热贴心、充满正能量的鼓励。
      4. 长度限制在50字以内，加上可爱的Emoji，最前面可以像幸运饼干一样加上 ✨ 符号。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
        }
      });

      res.json({ affirmation: response.text || "✨ 今天的你也要开开心心的啾！" });
    } catch (err: any) {
      console.error("Affirmation Generation Error:", err);
      res.status(500).json({ error: "Failed to generate affirmation.", details: err.message });
    }
  });

  // Vite development middleware or static production hosting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
