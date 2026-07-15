import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Heart, 
  Moon, 
  Sun, 
  Send, 
  Compass, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Smile, 
  Check, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Candy
} from "lucide-react";
import { PetState, ChatMessage, StickyNote, PetType } from "./types";
import { FOOD_ITEMS, TOY_ITEMS, ACCESSORY_ITEMS, INITIAL_STICKY_NOTES } from "./data";
import { 
  playBubblePop, 
  playEatCrunch, 
  playPlaySound, 
  playLevelUp, 
  playSnore, 
  playPetAffection 
} from "./sound";
import PetDisplay from "./components/PetDisplay";

export default function App() {
  // --- Persistent States ---
  const [pet, setPet] = useState<PetState>(() => {
    const saved = localStorage.getItem("oasis_pet_state");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      name: "Mochi",
      type: "rabbit",
      happiness: 80,
      fullness: 75,
      energy: 85,
      level: 1,
      xp: 20,
      accessory: "none",
      isSleeping: false
    };
  });

  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    const saved = localStorage.getItem("oasis_sticky_notes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_STICKY_NOTES;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("oasis_chat_history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    const defaultName = pet?.name || "Mochi";
    return [
      {
        id: "welcome-1",
        role: "model",
        text: `啾啾~ 主人你好呀！我是你的口袋萌宠 ${defaultName} 🐰✨！今天感觉怎么样？快来喂我吃草莓，或者陪我玩吧！`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [currentMood, setCurrentMood] = useState<string>(() => {
    return localStorage.getItem("oasis_user_mood") || "";
  });

  // --- UI Interactive States ---
  const [activeMenu, setActiveMenu] = useState<"feed" | "play" | "accessory" | "none">("none");
  const [inputMessage, setInputMessage] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [statusText, setStatusText] = useState("正在和你眨眼睛...");
  const [heartParticles, setHeartParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  // Adoption form state
  const [adoptType, setAdoptType] = useState<PetType>("rabbit");
  const [adoptName, setAdoptName] = useState("");

  // Daily Affirmation popup state
  const [dailyAffirmation, setDailyAffirmation] = useState("");
  const [showAffirmationModal, setShowAffirmationModal] = useState(false);
  const [isAffirmationLoading, setIsAffirmationLoading] = useState(false);

  // Chat scroll container reference
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Sync storage ---
  useEffect(() => {
    localStorage.setItem("oasis_pet_state", JSON.stringify(pet));
  }, [pet]);

  useEffect(() => {
    localStorage.setItem("oasis_sticky_notes", JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  useEffect(() => {
    localStorage.setItem("oasis_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (currentMood) {
      localStorage.setItem("oasis_user_mood", currentMood);
    }
  }, [currentMood]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Slow passive decay of pet's fullness and energy to simulate virtual pet lifecycles
  useEffect(() => {
    const timer = setInterval(() => {
      setPet(prev => {
        if (prev.isSleeping) {
          // Sleeping restores energy, drains fullness very slowly
          return {
            ...prev,
            energy: Math.min(100, prev.energy + 2),
            fullness: Math.max(10, prev.fullness - 0.5),
            happiness: Math.max(20, prev.happiness - 0.2)
          };
        } else {
          // Awake drains fullness and energy slowly, drains happiness if fullness is low
          const newFullness = Math.max(0, prev.fullness - 1);
          const newEnergy = Math.max(0, prev.energy - 0.8);
          let happinessPenalty = 0;
          if (newFullness < 30 || newEnergy < 30) {
            happinessPenalty = 1.5;
          }
          return {
            ...prev,
            fullness: newFullness,
            energy: newEnergy,
            happiness: Math.max(0, prev.happiness - (0.5 + happinessPenalty))
          };
        }
      });
    }, 12000); // Trigger every 12 seconds
    return () => clearInterval(timer);
  }, []);

  // Sleep visual trigger sound loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pet.isSleeping && isSoundEnabled) {
      timer = setInterval(() => {
        playSnore();
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [pet.isSleeping, isSoundEnabled]);

  // --- Core Actions & Helpers ---
  const triggerXpGain = (amount: number, currentPet: PetState) => {
    let newXp = currentPet.xp + amount;
    let newLevel = currentPet.level;
    let leveledUp = false;

    const xpNeeded = currentPet.level * 100;
    if (newXp >= xpNeeded) {
      newXp = newXp - xpNeeded;
      newLevel += 1;
      leveledUp = true;
      if (isSoundEnabled) playLevelUp();
    }

    setPet(prev => ({
      ...prev,
      xp: newXp,
      level: newLevel
    }));

    if (leveledUp) {
      const levelUpMsg = `✨🎉 哇呜！太棒啦！在主人的悉心照料下，我升级到了 Lv.${newLevel}！感觉自己变得更强大、更可爱了喵！✨💖`;
      setMessages(prev => [
        ...prev,
        {
          id: `lvl-${Date.now()}`,
          role: "model",
          text: levelUpMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setStatusText("太开心啦！升级啦！✨");
      triggerInteractionCelebration();
    }
  };

  const triggerInteractionCelebration = () => {
    // Generate dozens of floating hearts for celebration
    const tempHearts = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 120,
      y: 40 + Math.random() * 80
    }));
    setHeartParticles(prev => [...prev, ...tempHearts]);
    setTimeout(() => {
      setHeartParticles(prev => prev.filter(h => !tempHearts.includes(h)));
    }, 1200);
  };

  // Click on Pet Action (Patting)
  const handlePetTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pet.isSleeping) {
      setStatusText("嘘...宝贝睡得正香呢，不要吵醒它哦。💤");
      if (isSoundEnabled) playBubblePop(0.7);
      return;
    }

    if (isSoundEnabled) playPetAffection();
    
    // Get mouse position relative to pet container for placing particles
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHeart = { id: Date.now(), x, y };
    setHeartParticles(prev => [...prev, newHeart]);

    // Increase happiness
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5)
    }));

    // Trigger pet speaking occasionally on tapping
    const tapPhrases = [
      `摸一摸，心暖暖~ 主人的手好温柔呀！💕`,
      `（蹭手掌）舒服得要融化啦~ 喵呜！🐾`,
      `叽叽！最喜欢主人的抱抱摸摸了！🐥`,
      `哼哼，主人多摸摸我，我就原谅你今天这么晚来找我！`,
      `（耳朵抖了抖）呀，主人的手冰冰的，我来用肚子给你捂热！🐰`
    ];
    const phrase = tapPhrases[Math.floor(Math.random() * tapPhrases.length)];
    setStatusText("感到无比幸福... 🌸");

    // Clear particle after animation
    setTimeout(() => {
      setHeartParticles(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);

    // Give a little XP for affection
    triggerXpGain(8, pet);
  };

  // Feed treat action
  const handleFeed = (foodId: string) => {
    if (pet.isSleeping) {
      setStatusText("小萌宠正在睡觉呢，醒来再吃吧~ 💤");
      return;
    }

    const food = FOOD_ITEMS.find(f => f.id === foodId);
    if (!food) return;

    if (isSoundEnabled) playEatCrunch();

    setPet(prev => ({
      ...prev,
      fullness: Math.min(100, prev.fullness + food.fullnessRestore),
      energy: Math.min(100, prev.energy + food.energyRestore),
      happiness: Math.min(100, prev.happiness + food.happinessRestore)
    }));

    setStatusText(`开心地吃下了 [${food.name}]！${food.icon}`);
    triggerXpGain(15, pet);

    // Send visual heart pop
    const feedHearts = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 60 + Math.random() * 80,
      y: 50 + Math.random() * 40
    }));
    setHeartParticles(prev => [...prev, ...feedHearts]);
    setTimeout(() => {
      setHeartParticles(prev => prev.filter(h => !feedHearts.includes(h)));
    }, 1000);

    // Generate cute companion speech
    const petTalks = [
      `嗷呜！多谢主人款待，这个${food.name}超级无敌好吃！整个小肚子都圆滚滚啦！🍓`,
      `嚼嚼嚼... 呜哇！这是${food.name}吗？味道好甜啊，比彩虹糖还要甜，主人也尝一口嘛？🍭`,
      `（抹抹嘴巴上的碎屑）真好吃喵！主人真懂我的口味，明天还要吃这个！✨`
    ];
    const randomReply = petTalks[Math.floor(Math.random() * petTalks.length)];
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `feed-${Date.now()}`,
          role: "model",
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 400);
  };

  // Play toy action
  const handlePlay = (toyId: string) => {
    if (pet.isSleeping) {
      setStatusText("小萌宠正沉浸在美梦中，醒来再陪你玩耍吧~ 💤");
      return;
    }

    const toy = TOY_ITEMS.find(t => t.id === toyId);
    if (!toy) return;

    if (pet.energy < toy.energyCost) {
      setStatusText("呜呜...小萌宠现在太累了，没有力气玩了，让它休息一下吧~ 🔋");
      if (isSoundEnabled) playBubblePop(0.6);
      return;
    }

    if (isSoundEnabled) playPlaySound();

    setPet(prev => ({
      ...prev,
      energy: Math.max(0, prev.energy - toy.energyCost),
      happiness: Math.min(100, prev.happiness + toy.happinessRestore)
    }));

    setStatusText(`尽情地玩耍了 [${toy.name}]！${toy.icon}`);
    triggerXpGain(25, pet);

    // Happy animation hearts
    triggerInteractionCelebration();

    // Custom play companion speech
    const playReplies = [
      `哇塞！和主人一起玩${toy.name}最开心了！我感觉整只球都飞起来了！蹦蹦跳跳！⚽✨`,
      `（疯狂摇小尾巴/扑腾翅膀）哈哈哈，看我的无敌旋风抓！这个${toy.name}太好玩啦，主人你真棒！🎉`,
      `呼呼，虽然有点累，但能和主人一起流汗，真的超级超级开心哟！我们要一直这么好！💖`
    ];
    const randomReply = playReplies[Math.floor(Math.random() * playReplies.length)];

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `play-${Date.now()}`,
          role: "model",
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 400);
  };

  // Toggle Sleeping state
  const handleToggleSleep = () => {
    if (isSoundEnabled) playBubblePop();
    setPet(prev => {
      const nextSleep = !prev.isSleeping;
      setStatusText(nextSleep ? "躺下盖好小被子，呼呼大睡中... 💤" : "揉揉眼睛，元气满满地起床啦！✨");
      
      const welcomeBackMsg = nextSleep
        ? `（闭上眼睛，软乎乎地趴着）呼...呼... 主人晚安哦，我会梦到我们的草莓城堡的... 💤🌙`
        : `（揉揉眼睛，伸个大懒腰）唔... 睡得饱饱的！看到主人的第一眼就觉得今天会超级超级幸运！早安，我的主人！🌸☀`;

      setMessages(p => [
        ...p,
        {
          id: `sleep-${Date.now()}`,
          role: "model",
          text: welcomeBackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      return {
        ...prev,
        isSleeping: nextSleep
      };
    });
  };

  // Set accessory action
  const handleSetAccessory = (accId: any) => {
    if (isSoundEnabled) playBubblePop(1.1);
    setPet(prev => ({
      ...prev,
      accessory: accId
    }));
    setStatusText(`戴上了精美饰品：${ACCESSORY_ITEMS.find(a => a.id === accId)?.name} 🎀`);
  };

  // Add a new sticky note
  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    if (isSoundEnabled) playBubblePop(1.1);

    const colors: Array<'pink' | 'yellow' | 'green' | 'purple' | 'blue'> = ['pink', 'yellow', 'green', 'purple', 'blue'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      color: randomColor,
      createdAt: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };

    setStickyNotes(prev => [newNote, ...prev]);
    setNewNoteText("");
    setStatusText("成功贴上一张温馨的小确幸便利贴！🌸✨");
  };

  // Delete a sticky note
  const handleDeleteNote = (noteId: string) => {
    if (isSoundEnabled) playBubblePop(0.8);
    setStickyNotes(prev => prev.filter(note => note.id !== noteId));
    setStatusText("悄悄撕下了一张便利贴~ 🌿");
  };

  // Adopting a new pet (Reset & Select)
  const handleAdoptPet = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSoundEnabled) playLevelUp();

    const finalName = adoptName.trim() || (adoptType === "rabbit" ? "Mochi" : adoptType === "cat" ? "Pumpkin" : "Pippy");

    setPet({
      name: finalName,
      type: adoptType,
      happiness: 100,
      fullness: 100,
      energy: 100,
      level: 1,
      xp: 0,
      accessory: "none",
      isSleeping: false
    });

    const newAdoptionMessage = `✨🏡 叮咚！宠物领养证书已送达！主人成功抱回了最软萌的 [${finalName}]（一只超级可爱的${adoptType === "rabbit" ? "小白兔" : adoptType === "cat" ? "小猫咪" : "小黄鸡"}）！从今天开始，让我们一起度过最治愈、最甜蜜的时光吧！🌸💖`;
    
    setMessages([
      {
        id: `adopt-${Date.now()}`,
        role: "model",
        text: newAdoptionMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setStatusText(`成功领养了 ${finalName}！🏡✨`);
    setShowAdoptionModal(false);
    setAdoptName("");
  };

  // Ask AI Companion Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userText = inputMessage;
    setInputMessage("");

    // Play bubble sound
    if (isSoundEnabled) playBubblePop(1.0);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // Create request payload
      // Select the last 6 messages to keep the conversation compact and lightweight
      const recentHistory = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/pet/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petType: pet.type,
          petName: pet.name,
          message: userText,
          mood: currentMood,
          history: recentHistory
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            role: "model",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setStatusText("开心地和主人说悄悄话喵~ 💕");
        if (isSoundEnabled) playPetAffection();
        triggerInteractionCelebration();
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `reply-err-${Date.now()}`,
          role: "model",
          text: `呜呜，刚才网络好像迷路了... 不过我还是最喜欢你了！啾咪！💖`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Get Daily Affirmation from Gemini
  const handleGetAffirmation = async () => {
    if (isAffirmationLoading) return;
    if (isSoundEnabled) playPlaySound();

    setIsAffirmationLoading(true);
    setDailyAffirmation("");
    setShowAffirmationModal(true);

    try {
      const res = await fetch("/api/pet/affirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petType: pet.type,
          mood: currentMood
        })
      });

      const data = await res.json();
      if (data.affirmation) {
        setDailyAffirmation(data.affirmation);
      } else {
        setDailyAffirmation("✨ 无论发生什么，都要记得你超级棒，你是世界上最独特最闪亮的那颗星星！🌸");
      }
    } catch (err) {
      console.error(err);
      setDailyAffirmation("✨ 暖融融的小怀抱给你！今天也要打起精神，小可爱一直在你口袋里守护你哦！🎀");
    } finally {
      setIsAffirmationLoading(false);
    }
  };

  // Select User Mood today
  const handleMoodSelect = async (moodType: 'happy' | 'cozy' | 'sleepy' | 'sad' | 'excited') => {
    if (isSoundEnabled) playBubblePop(1.3);
    setCurrentMood(moodType);

    // Dynamic responses depending on mood selector
    const moodLabels = {
      happy: "超开心 🌸",
      cozy: "好舒适 ☕",
      sleepy: "瞌睡虫 💤",
      sad: "有点委屈 💧",
      excited: "超级兴奋 🎉"
    };

    setStatusText(`正在感受主人的心情：[${moodLabels[moodType]}]`);

    // Let the pet reply immediately via the chat logs to comfort or congratulate the user!
    let immediateComfort = "";
    if (moodType === "happy") {
      immediateComfort = "（拉着你转圈圈）哇！听到你今天开心，我也跟着超级超级开心！我们要一直快乐下去哦！✨";
    } else if (moodType === "cozy") {
      immediateComfort = "（在你膝盖上拱了拱）暖洋洋的舒适时光最棒了～喝杯暖茶，和我一起发个呆吧～☕";
    } else if (moodType === "sleepy") {
      immediateComfort = "（揉揉眼睛给你盖被子）唔……困了吗？那靠着我软乎乎的肚子睡个午觉吧，我会一直守着你哒～💤";
    } else if (moodType === "sad") {
      immediateComfort = "（焦急地凑过来蹭蹭你，拍拍你的手）呜呜，怎么了嘛？谁欺负我的宝贝了！给你超级无敌温暖大拥抱，有我陪着你呢，不要难过了哦～💖";
    } else if (moodType === "excited") {
      immediateComfort = "（兴奋地蹦得老高，撒花！）好耶！好耶！这么高兴的事情必须庆祝一下！快和我说说，是什么好事呀？🎉";
    }

    setMessages(prev => [
      ...prev,
      {
        id: `user-mood-${Date.now()}`,
        role: "user",
        text: `我今天感觉：${moodLabels[moodType]}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      },
      {
        id: `reply-mood-${Date.now()}`,
        role: "model",
        text: immediateComfort,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  return (
    <div 
      id="main-kawaii-app"
      className="min-h-screen w-full bg-[#FFF8FA] text-[#4A4A4A] flex font-sans select-none overflow-x-hidden"
    >
      {/* Sidebar Navigation - Vibrant Palette Aside */}
      <aside className="w-64 bg-white border-r-[3px] border-[#FFE4E9] hidden lg:flex flex-col items-center py-10 shrink-0 sticky top-0 h-screen justify-between relative">
        <div className="w-full flex flex-col items-center">
          {/* Logo element with custom animation */}
          <div className="w-16 h-16 bg-[#FFCAD4] rounded-[24px] flex items-center justify-center mb-10 shadow-sm animate-bounce">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#FF8FA3] rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Navigation link elements with Vibrant Palette styling */}
          <nav className="flex flex-col gap-4 w-full px-4">
            <div 
              onClick={() => {
                if (isSoundEnabled) playBubblePop();
                document.getElementById("app-header")?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 bg-[#FFF0F3] text-[#FF758F] px-4 py-3.5 rounded-[20px] font-black cursor-pointer transition-all hover:scale-105"
            >
              <div className="w-5 h-5 border-2 border-[#FF758F] rounded-md flex items-center justify-center text-[10px] font-bold">✓</div>
              <span>绿洲看板</span>
            </div>

            <div 
              onClick={() => {
                if (isSoundEnabled) playBubblePop();
                document.getElementById("mood-and-notes-section")?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 text-[#A39391] px-4 py-3.5 rounded-[20px] font-bold hover:bg-[#FFF5F7] hover:text-[#FF758F] cursor-pointer transition-all hover:scale-105"
            >
              <div className="w-5 h-5 border-2 border-[#C1C1C1] rounded-full flex items-center justify-center text-[10px]">📖</div>
              <span>心情日记</span>
            </div>

            <div 
              onClick={() => {
                if (isSoundEnabled) playBubblePop();
                setShowAdoptionModal(true);
              }}
              className="flex items-center gap-3 text-[#A39391] px-4 py-3.5 rounded-[20px] font-bold hover:bg-[#FFF5F7] hover:text-[#FF758F] cursor-pointer transition-all hover:scale-105"
            >
              <div className="w-5 h-5 border-2 border-[#C1C1C1] rounded-md rotate-45 flex items-center justify-center text-[10px]"><span className="rotate-[-45deg] inline-block">🐾</span></div>
              <span>领养中心</span>
            </div>

            <div 
              onClick={handleGetAffirmation}
              className="flex items-center gap-3 text-[#A39391] px-4 py-3.5 rounded-[20px] font-bold hover:bg-[#FFF5F7] hover:text-[#FF758F] cursor-pointer transition-all hover:scale-105"
            >
              <div className="w-5 h-5 border-2 border-[#C1C1C1] rounded-full flex items-center justify-center text-[10px]">✨</div>
              <span>每日避风港</span>
            </div>
          </nav>
        </div>

        {/* Dynamic avatar sound switch */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
              isSoundEnabled ? "bg-[#BEE1E6] text-slate-700" : "bg-slate-200 text-slate-400"
            }`}
            title={isSoundEnabled ? "静音音效" : "开启音效"}
          >
            {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <span className="text-[10px] font-black tracking-widest text-[#FF9EAE] uppercase">Pocket Oasis</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-10 max-w-7xl mx-auto w-full min-h-screen">
        
        {/* Header - Vibrant Palette Header */}
        <header id="app-header" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#594E52] tracking-tight mb-2 flex flex-wrap items-center gap-2">
              你好，{pet.name}！👋 
              <span className="text-xl font-bold text-[#FF758F] bg-[#FFF0F3] px-3.5 py-1 rounded-[16px] border border-[#FFE4E9]">
                Pocket Pet Oasis 🌸
              </span>
            </h1>
            <p className="text-[#A39391] font-medium text-sm md:text-base">
              今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — 充满温暖的一天！
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-5 py-3 rounded-[30px] border-[3px] border-[#FFE4E9] flex items-center gap-3 shadow-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-bold text-xs md:text-sm text-[#594E52]">状态: {statusText}</span>
            </div>

            {/* Mobile Sound Toggle & Adopt buttons */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSoundEnabled 
                    ? "bg-[#FFF0F3] border-[#FFE4E9] text-[#FF758F]" 
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  if (isSoundEnabled) playBubblePop();
                  setShowAdoptionModal(true);
                }}
                className="p-2.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-2xl font-bold shadow-sm border-2 border-white text-xs flex items-center gap-1"
              >
                <Compass className="w-4 h-4" />
                换宠
              </button>
            </div>
          </div>
        </header>

        {/* Top Widgets - Vibrant Palette Top Row Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Happiness (Pink style) */}
          <div className="bg-[#FDE2E4] p-6 rounded-[35px] border-b-[6px] border-[#FFCAD4] flex flex-col justify-between h-40 shadow-sm transition-all hover:translate-y-[-2px]">
            <div className="flex justify-between items-center">
              <span className="text-[#FF758F] font-black uppercase text-xs tracking-widest">💖 心情指数 Happiness</span>
              <span className="text-xl">💝</span>
            </div>
            <div>
              <span className="text-4xl font-black text-[#594E52]">{Math.round(pet.happiness)}%</span>
              <span className="text-[#FF9EAE] font-bold ml-1">/ 100%</span>
            </div>
            <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#FF8FA3] rounded-full"
                animate={{ width: `${pet.happiness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Card 2: Fullness (Sage style) */}
          <div className="bg-[#E2ECE9] p-6 rounded-[35px] border-b-[6px] border-[#BEE1E6] flex flex-col justify-between h-40 shadow-sm transition-all hover:translate-y-[-2px]">
            <div className="flex justify-between items-center">
              <span className="text-[#7DBAAB] font-black uppercase text-xs tracking-widest">🍪 饱腹指数 Fullness</span>
              <span className="text-xl">🍎</span>
            </div>
            <div>
              <span className="text-4xl font-black text-[#594E52]">{Math.round(pet.fullness)}%</span>
              <span className="text-[#97CABF] font-bold ml-1.5 text-sm">
                {pet.fullness > 75 ? "肚子饱饱 🍰" : pet.fullness > 40 ? "胃口大开 🍌" : "有点饿了 🍟"}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => {
                const isActive = pet.fullness >= i * 25;
                return (
                  <div 
                    key={i} 
                    className={`w-8 h-2 rounded-full transition-all duration-300 ${
                      isActive ? "bg-[#7DBAAB]" : "bg-white/50"
                    }`} 
                  />
                );
              })}
            </div>
          </div>

          {/* Card 3: Energy (Peach style) */}
          <div className="bg-[#FFF1E6] p-6 rounded-[35px] border-b-[6px] border-[#FAD2E1] flex flex-col justify-between h-40 shadow-sm transition-all hover:translate-y-[-2px]">
            <div className="flex justify-between items-center">
              <span className="text-[#E0A890] font-black uppercase text-xs tracking-widest">⚡ 精力指数 Energy</span>
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <span className="text-4xl font-black text-[#594E52]">{Math.round(pet.energy)}%</span>
              <p className="text-[#D4A373] text-xs font-black mt-1">
                {pet.isSleeping ? "Zzz... 正在呼呼大睡中 💤" : "元气满满，准备玩耍！🎪"}
              </p>
            </div>
            <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#E0A890] rounded-full"
                animate={{ width: `${pet.energy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </section>

        {/* Bottom Grid - Bento Grid of Playroom & Companion Chat */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-start">
          {/* Playroom and control center (Col-span 7) */}
          <div className="lg:col-span-7 bg-white rounded-[40px] border-[3px] border-[#FFE4E9] p-6 md:p-8 flex flex-col shadow-sm relative overflow-hidden min-h-[550px] justify-between">
            {/* Playroom Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-[#594E52] flex items-center gap-1.5">
                <span className="text-2xl">🎪</span>
                {pet.name} 的魔法游乐园
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3.5 py-1.5 bg-[#FFF5F7] text-[#FF8FA3] rounded-full border-2 border-[#FFCAD4]">
                  Lv.{pet.level} • {pet.xp}/{pet.level * 100} XP
                </span>
                <button 
                  onClick={() => {
                    if (isSoundEnabled) playBubblePop();
                    setShowAdoptionModal(true);
                  }}
                  className="w-10 h-10 bg-[#FFCAD4] hover:bg-[#FF8FA3] text-white rounded-full flex items-center justify-center text-2xl font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  title="领养其他萌宠"
                >
                  +
                </button>
              </div>
            </div>

            {/* Main Interactive Playroom Stage */}
            <div className="relative flex-grow flex items-center justify-center py-8 min-h-[240px] bg-[#FFF8FA]/80 rounded-[30px] border-2 border-dashed border-[#FFE4E9] mb-6">
              {/* Corner decor details */}
              <div className="absolute top-4 left-6 text-2xl opacity-20 select-none">🎈</div>
              <div className="absolute bottom-4 right-6 text-2xl opacity-20 select-none">🌟</div>
              
              <PetDisplay pet={pet} onTap={handlePetTap} statusText={statusText} />

              {/* Heart Burst Particle Effect Layer */}
              <AnimatePresence>
                {heartParticles.map(particle => (
                  <motion.div
                    key={particle.id}
                    initial={{ scale: 0.4, opacity: 0, y: 10 }}
                    animate={{ scale: [1, 1.4, 1.2], opacity: [0, 1, 0], y: -60 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute pointer-events-none text-3xl drop-shadow-sm select-none"
                    style={{ left: particle.x, top: particle.y - 40 }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Command controls deck */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-[#FF758F] uppercase text-xs tracking-wider flex items-center gap-1">
                <span>🧁</span> 魔法互动指令
              </h3>

              {/* Action buttons with Vibrant Palette design classes */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  id="menu-feed-btn"
                  onClick={() => {
                    if (isSoundEnabled) playBubblePop();
                    setActiveMenu(activeMenu === "feed" ? "none" : "feed");
                  }}
                  className={`py-3.5 px-2 rounded-[20px] font-bold text-xs cursor-pointer border-[3px] transition-all flex flex-col items-center justify-center gap-1.5 ${
                    activeMenu === "feed"
                      ? "bg-[#FFF0F3] border-[#FFCAD4] text-[#FF758F] scale-102"
                      : "bg-[#FFF8FA] border-transparent text-[#A39391] hover:border-[#FFE4E9] hover:text-[#FF758F]"
                  }`}
                >
                  <span className="text-xl">🍓</span>
                  喂食零嘴
                </button>

                <button
                  id="menu-play-btn"
                  onClick={() => {
                    if (isSoundEnabled) playBubblePop();
                    setActiveMenu(activeMenu === "play" ? "none" : "play");
                  }}
                  className={`py-3.5 px-2 rounded-[20px] font-bold text-xs cursor-pointer border-[3px] transition-all flex flex-col items-center justify-center gap-1.5 ${
                    activeMenu === "play"
                      ? "bg-[#E2ECE9] border-[#BEE1E6] text-[#7DBAAB] scale-102"
                      : "bg-[#F4F9F8] border-transparent text-[#A39391] hover:border-[#BEE1E6] hover:text-[#7DBAAB]"
                  }`}
                >
                  <span className="text-xl">⚽</span>
                  玩耍娱乐
                </button>

                <button
                  id="menu-accessory-btn"
                  onClick={() => {
                    if (isSoundEnabled) playBubblePop();
                    setActiveMenu(activeMenu === "accessory" ? "none" : "accessory");
                  }}
                  className={`py-3.5 px-2 rounded-[20px] font-bold text-xs cursor-pointer border-[3px] transition-all flex flex-col items-center justify-center gap-1.5 ${
                    activeMenu === "accessory"
                      ? "bg-[#F1F3FF] border-[#D7E3FC] text-[#8E9AAF] scale-102"
                      : "bg-[#F7F9FF] border-transparent text-[#A39391] hover:border-[#D7E3FC] hover:text-[#8E9AAF]"
                  }`}
                >
                  <span className="text-xl">🎀</span>
                  穿搭扮靓
                </button>

                <button
                  id="action-sleep-btn"
                  onClick={handleToggleSleep}
                  className={`py-3.5 px-2 rounded-[20px] font-bold text-xs cursor-pointer border-[3px] transition-all flex flex-col items-center justify-center gap-1.5 ${
                    pet.isSleeping
                      ? "bg-[#FFF1E6] border-[#FAD2E1] text-[#E0A890] scale-102"
                      : "bg-[#FFFBF8] border-transparent text-[#A39391] hover:border-[#FAD2E1] hover:text-[#E0A890]"
                  }`}
                >
                  <span className="text-xl">{pet.isSleeping ? "☀️" : "💤"}</span>
                  {pet.isSleeping ? "唤醒萌宠" : "安心睡觉"}
                </button>
              </div>

              {/* Collapsible item sliders */}
              <AnimatePresence mode="wait">
                {activeMenu === "feed" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#FFF5F7] rounded-[24px] border-2 border-[#FFCAD4] p-3.5"
                  >
                    <p className="text-xs text-[#FF758F] font-bold mb-2">给 {pet.name} 喂零食补充体力和好感度：</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FOOD_ITEMS.map(food => (
                        <button
                          key={food.id}
                          onClick={() => handleFeed(food.id)}
                          className="p-2.5 bg-white rounded-[16px] border border-[#FFE4E9] hover:border-[#FF8FA3] transition-colors cursor-pointer flex items-center justify-between text-left"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{food.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-[#594E52]">{food.name}</div>
                              <div className="text-[10px] text-[#A39391] line-clamp-1">{food.flavorText}</div>
                            </div>
                          </div>
                          <div className="text-[10px] bg-[#FFF5F7] text-[#FF8FA3] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            +{food.fullnessRestore} 饱腹
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeMenu === "play" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#E2ECE9]/60 rounded-[24px] border-2 border-[#BEE1E6] p-3.5"
                  >
                    <p className="text-xs text-[#7DBAAB] font-bold mb-2">和 {pet.name} 一起快乐玩耍吧：</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TOY_ITEMS.map(toy => (
                        <button
                          key={toy.id}
                          onClick={() => handlePlay(toy.id)}
                          className="p-2.5 bg-white rounded-[16px] border border-[#BEE1E6] hover:border-[#7DBAAB] transition-colors cursor-pointer flex items-center justify-between text-left"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{toy.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-[#594E52]">{toy.name}</div>
                              <div className="text-[10px] text-[#A39391] line-clamp-1">{toy.flavorText}</div>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <div className="text-[10px] text-red-400 font-bold">-{toy.energyCost} 精力</div>
                            <div className="text-[10px] text-[#7DBAAB] font-bold">+{toy.happinessRestore} 心情</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeMenu === "accessory" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#F1F3FF]/80 rounded-[24px] border-2 border-[#D7E3FC] p-3.5"
                  >
                    <p className="text-xs text-[#8E9AAF] font-bold mb-2">选择一件超级可爱的小装扮：</p>
                    <div className="flex flex-wrap gap-2">
                      {ACCESSORY_ITEMS.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => handleSetAccessory(acc.id)}
                          className={`px-3 py-2 rounded-[16px] border cursor-pointer transition-all flex items-center space-x-1.5 text-xs font-bold ${
                            pet.accessory === acc.id
                              ? "bg-[#D7E3FC] border-[#8E9AAF] text-[#594E52]"
                              : "bg-white border-[#FFE4E9] text-slate-600 hover:border-[#D7E3FC]"
                          }`}
                        >
                          <span>{acc.icon}</span>
                          <span>{acc.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Chat Companion (Col-span 5) - Sweet Sky Blue Card Style */}
          <div className="lg:col-span-5 bg-[#F1F3FF] rounded-[40px] border-[3px] border-[#D7E3FC] p-6 md:p-8 flex flex-col h-[550px] shadow-sm relative">
            {/* Header Companion profile */}
            <div className="border-b border-[#D7E3FC] pb-4 flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-[20px] flex items-center justify-center border-2 border-[#D7E3FC] shadow-sm animate-pulse">
                  <span className="text-2xl">{pet.type === "rabbit" ? "🐰" : pet.type === "cat" ? "🐱" : "🐥"}</span>
                </div>
                <div>
                  <h3 className="font-black text-[#594E52] text-sm flex items-center gap-1.5">
                    {pet.name}
                    <span className="text-[10px] text-[#8E9AAF] bg-white border border-[#D7E3FC] px-2 py-0.5 rounded-full font-black">AI 伴侣</span>
                  </h3>
                  <p className="text-[10px] text-[#8E9AAF] font-semibold">
                    {pet.isSleeping ? "Zzz... 正在熟睡中" : "正在认真听你倾诉呢"}
                  </p>
                </div>
              </div>

              {/* Affirmation Sign */}
              <button
                id="get-affirmation-cookie"
                onClick={handleGetAffirmation}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-500 border-2 border-[#FFE4E9] text-[10px] font-black rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                今日避风港
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-4 mb-4 select-text">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[9px] text-[#A39391] font-bold">{msg.timestamp}</span>
                    <span className="text-[10px] font-black text-[#594E52]">
                      {msg.role === "user" ? "我" : pet.name}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-[24px] px-4 py-3 text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-[#FF758F] to-[#FFCAD4] text-white rounded-tr-none"
                        : "bg-white border-2 border-[#D7E3FC] text-[#594E52] rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex flex-col items-start">
                  <div className="text-[10px] font-black text-[#8E9AAF] mb-1">{pet.name} 正在认真思考...</div>
                  <div className="bg-white border-2 border-[#D7E3FC] rounded-[24px] rounded-tl-none px-4 py-3 flex space-x-1.5 items-center shadow-sm">
                    <span className="w-2 h-2 bg-[#FF758F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#FF758F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#FF758F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input form */}
            <form 
              id="pet-chat-form"
              onSubmit={handleSendChat} 
              className="bg-white rounded-[24px] border-2 border-[#D7E3FC] p-1.5 flex items-center shadow-sm shrink-0"
            >
              <input
                id="chat-message-input"
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder={pet.isSleeping ? `${pet.name} 正在睡觉，留个床头留言吧...` : `向 ${pet.name} 倾诉今天的快乐或委屈吧...`}
                className="flex-grow text-xs font-semibold bg-transparent outline-none px-4 py-2 text-[#594E52] placeholder-[#A39391]/60"
              />
              <button
                id="send-chat-btn"
                type="submit"
                disabled={!inputMessage.trim() || isChatLoading}
                className="p-3 bg-[#FFCAD4] hover:bg-[#FF8FA3] disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[20px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Lower Section - Mood Weather and Sticky Notes Bulletin */}
        <section 
          id="mood-and-notes-section" 
          className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 relative z-10"
        >
          {/* Mood tracker block (4 cols) - Vibrant Sage Green style */}
          <div className="md:col-span-4 bg-[#D0F4DE] rounded-[40px] border-[3px] border-[#A9D6E5] p-6 md:p-8 flex flex-col justify-between shadow-sm min-h-[380px]">
            <div>
              <h3 className="font-black text-[#2D5A47] text-xl flex items-center gap-1.5 mb-2">
                <span>🔋</span> 心情天气预报
              </h3>
              <p className="text-[11px] text-[#4C8E75] font-semibold leading-relaxed">
                记录你此时此刻的真实心理状况，口袋萌宠会用心给你暖意十足的拥抱和答复。
              </p>
            </div>

            {/* Mood selector list with customized hover/active selectors */}
            <div className="flex flex-col space-y-2.5 my-4">
              {[
                { type: 'happy', icon: '🌸', label: '心情超甜', desc: '今天遇到了发光的惊喜！' },
                { type: 'cozy', icon: '☕', label: '惬意舒适', desc: '享受温暖惬意的慢生活。' },
                { type: 'sleepy', icon: '💤', label: '迷糊困倦', desc: '浑身软绵绵，很想抱抱睡。' },
                { type: 'sad', icon: '💧', label: '有点委屈', desc: '天空有点阴，需要你摸摸头。' },
                { type: 'excited', icon: '🎉', label: '能量满格', desc: '充满了向日葵般的热情！' }
              ].map(moodItem => (
                <button
                  key={moodItem.type}
                  onClick={() => handleMoodSelect(moodItem.type as any)}
                  className={`w-full p-2.5 rounded-[20px] border-2 cursor-pointer text-left transition-all flex items-center justify-between ${
                    currentMood === moodItem.type 
                      ? "bg-white border-[#4C8E75] ring-2 ring-[#4C8E75]/20 scale-[1.02] text-[#2D5A47]" 
                      : "bg-white/60 border-transparent text-[#2D5A47]/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{moodItem.icon}</span>
                    <div>
                      <div className="text-xs font-black">{moodItem.label}</div>
                      <div className="text-[10px] opacity-75 font-semibold leading-none mt-0.5">{moodItem.desc}</div>
                    </div>
                  </div>
                  {currentMood === moodItem.type && (
                    <Check className="w-4 h-4 text-[#4C8E75] animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Notes bulletin (8 cols) - Daily Blossoms style white container */}
          <div className="md:col-span-8 bg-white rounded-[40px] border-[3px] border-[#FFE4E9] p-6 md:p-8 flex flex-col shadow-sm min-h-[380px] justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-black text-[#594E52] text-xl flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-[#FF758F]" />
                  治愈心情贴纸墙
                </h3>
                <p className="text-[11px] text-[#A39391] font-semibold mt-0.5">
                  随手贴上你的温柔小期许，写下今天遇到的任意小确幸！
                </p>
              </div>

              {/* Notes form */}
              <form 
                id="sticky-note-form"
                onSubmit={handlePostNote} 
                className="bg-[#FFF5F7] rounded-[24px] border-2 border-[#FFE4E9] p-1 flex items-center"
              >
                <input
                  id="sticky-note-input"
                  type="text"
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  maxLength={80}
                  placeholder="写下你脑海里的小确幸..."
                  className="text-xs font-semibold bg-transparent outline-none px-3.5 py-2 text-[#594E52] min-w-[150px] placeholder-[#A39391]/60"
                />
                <button
                  id="add-sticky-note-btn"
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="p-2.5 bg-[#FFCAD4] hover:bg-[#FF8FA3] disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[18px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center justify-center"
                  title="贴上便利贴"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Note items display box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[250px] pr-1 flex-grow my-2">
              <AnimatePresence>
                {stickyNotes.map(note => {
                  const colorStyles = {
                    pink: "bg-[#FFF0F3] border-[#FFCAD4] text-[#FF758F] shadow-[#FFF0F3]/30",
                    yellow: "bg-[#FFF1E6] border-[#FAD2E1] text-[#E0A890] shadow-[#FFF1E6]/30",
                    green: "bg-[#E2ECE9] border-[#BEE1E6] text-[#7DBAAB] shadow-[#E2ECE9]/30",
                    purple: "bg-[#F1F3FF] border-[#D7E3FC] text-[#8E9AAF] shadow-[#F1F3FF]/30",
                    blue: "bg-[#D0F4DE] border-[#A9D6E5] text-[#4C8E75] shadow-[#D0F4DE]/30"
                  };

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ scale: 0.8, opacity: 0, rotate: -3 }}
                      animate={{ scale: 1, opacity: 1, rotate: Math.sin(parseInt(note.id.split("-")[1] || "1")) * 2 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 12 }}
                      className={`p-4 rounded-[24px] border-2 shadow-sm relative flex flex-col justify-between group min-h-[105px] overflow-hidden ${
                        colorStyles[note.color]
                      }`}
                    >
                      {/* Paper-fold decor */}
                      <div className="absolute top-0 right-0 w-4 h-4 bg-black/5 rounded-bl-[12px] pointer-events-none" />

                      <p className="text-xs font-black leading-relaxed break-all pb-4 pr-1">
                        {note.text}
                      </p>

                      <div className="flex items-center justify-between text-[9px] opacity-75 font-black pt-2 border-t border-black/5">
                        <span>📅 {note.createdAt}</span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-0.5 cursor-pointer"
                          title="撕下便利贴"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {stickyNotes.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#A39391] font-black text-xs border-2 border-dashed border-[#FFE4E9] rounded-[24px] bg-[#FFF8FA]">
                  🧁 心情墙上空空如也，写一张精美贴纸装点绿洲吧！
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer 
          id="app-footer" 
          className="w-full text-center py-8 mt-12 border-t border-[#FFE4E9] text-[#FF9EAE] text-[11px] font-black tracking-widest uppercase"
        >
          萌宠口袋绿洲 © 2026 • 极致温暖 & 治愈心灵的口袋绿洲 🌸 • 搭载 Google Gemini 3.5 智能芯片 ⚡
        </footer>
      </main>

      {/* MODAL 1: ADOPT / CHANGE COMPANION */}
      <AnimatePresence>
        {showAdoptionModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] border-[3px] border-[#FFE4E9] p-6 md:p-8 w-full max-w-md shadow-lg space-y-6 overflow-hidden relative"
            >
              {/* Star backdrop decorator */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF5F7] rounded-full blur-xl pointer-events-none" />
              
              <div className="text-center">
                <div className="inline-block bg-[#FFF0F3] p-3.5 rounded-[24px] border border-[#FFE4E9] mb-3">
                  <Compass className="w-6 h-6 text-[#FF758F]" />
                </div>
                <h3 className="font-black text-[#594E52] text-xl">领养你的口袋魔法萌宠 🏡</h3>
                <p className="text-[11px] text-[#A39391] font-bold mt-1">
                  选择一种神奇魔法萌物，签下爱心契约并赐予它可爱的名字吧！
                </p>
              </div>

              <form onSubmit={handleAdoptPet} className="space-y-5">
                {/* Pet select grid */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#594E52]">萌宠魔法血统：</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'rabbit', icon: '🐰', label: '软萌粉兔', desc: '小粉兔 Mochi', color: 'hover:bg-rose-50 border-rose-100' },
                      { type: 'cat', icon: '🐱', label: '傲娇橘猫', desc: '橘猫 Pumpkin', color: 'hover:bg-amber-50 border-amber-100' },
                      { type: 'chick', icon: '🐥', label: '元气蛋黄', desc: '小黄鸡 Pippy', color: 'hover:bg-yellow-50 border-yellow-100' }
                    ].map(typeItem => (
                      <button
                        key={typeItem.type}
                        type="button"
                        onClick={() => {
                          if (isSoundEnabled) playBubblePop(1.1);
                          setAdoptType(typeItem.type as PetType);
                        }}
                        className={`p-3 rounded-[24px] border-2 cursor-pointer flex flex-col items-center text-center gap-2 transition-all ${typeItem.color} ${
                          adoptType === typeItem.type 
                            ? "bg-[#FFF0F3] border-[#FFCAD4] ring-4 ring-[#FFCAD4]/30" 
                            : "bg-white border-slate-100"
                        }`}
                      >
                        <span className="text-3xl select-none">{typeItem.icon}</span>
                        <div>
                          <div className="text-xs font-black text-[#594E52]">{typeItem.label}</div>
                          <div className="text-[9px] opacity-75 font-semibold mt-0.5 text-[#A39391]">{typeItem.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#594E52]">赐予可爱的名字：</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={adoptName}
                    onChange={e => setAdoptName(e.target.value)}
                    placeholder={adoptType === "rabbit" ? "默认：Mochi" : adoptType === "cat" ? "默认：Pumpkin" : "默认：Pippy"}
                    className="w-full text-xs font-black bg-[#FFF8FA] border-2 border-[#FFE4E9] focus:border-[#FFCAD4] outline-none rounded-[16px] px-4 py-3 transition-all text-[#594E52] placeholder-[#A39391]/60"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSoundEnabled) playBubblePop();
                      setShowAdoptionModal(false);
                    }}
                    className="flex-1 py-3 bg-[#FFF5F7] hover:bg-[#FFE4E9] text-[#FF758F] border border-[#FFE4E9] font-black text-xs rounded-[16px] cursor-pointer transition-all"
                  >
                    再想想
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-black text-xs rounded-[16px] shadow-sm border border-white hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    契约建立！✨
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DAILY AFFIRMATION */}
      <AnimatePresence>
        {showAffirmationModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] border-[3px] border-[#FFE4E9] p-6 md:p-8 w-full max-w-md shadow-lg space-y-6 overflow-hidden relative"
            >
              {/* Sparkles background décor */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#FFF1E6] rounded-full blur-xl opacity-50 pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#F1F3FF] rounded-full blur-xl opacity-50 pointer-events-none" />

              <div className="text-center relative z-10">
                <span className="text-4xl animate-bounce inline-block mb-2">🎁</span>
                <h3 className="font-black text-[#594E52] text-xl">今日心灵避风港 治愈签</h3>
                <p className="text-[11px] text-[#A39391] font-semibold mt-1">
                  这是 {pet.name} 翻阅群星日记，专门为你抽取的一段疗愈：
                </p>
              </div>

              {/* Card display */}
              <div className="bg-[#FFF8FA] rounded-[24px] p-6 border-2 border-dashed border-[#FFE4E9] text-center relative overflow-hidden">
                {isAffirmationLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#FF8FA3] animate-spin" />
                    <span className="text-xs font-black text-[#A39391] animate-pulse">正在聆听群星之声，请稍候...</span>
                  </div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs md:text-sm font-black text-[#594E52] leading-relaxed italic"
                  >
                    “ {dailyAffirmation} ”
                  </motion.p>
                )}
              </div>

              {/* Button controllers */}
              <div className="flex space-x-2 pt-2 relative z-10">
                {!isAffirmationLoading && (
                  <button
                    onClick={handleGetAffirmation}
                    className="flex-1 py-3 bg-[#FFF5F7] hover:bg-[#FFE4E9] text-[#FF758F] font-black text-xs rounded-[16px] cursor-pointer transition-all border border-[#FFE4E9] flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    换一签
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isSoundEnabled) playBubblePop();
                    setShowAffirmationModal(false);
                  }}
                  className="flex-grow py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-black text-xs rounded-[16px] shadow-sm border border-white hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  今天也要开心呀！🧁
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
