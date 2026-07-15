import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PetState } from "../types";
import { playPetAffection } from "../sound";

interface PetDisplayProps {
  pet: PetState;
  onTap: (e: React.MouseEvent<HTMLDivElement>) => void;
  statusText: string;
}

export default function PetDisplay({ pet, onTap, statusText }: PetDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine the primary expression/style based on current state
  const getPetFace = () => {
    if (pet.isSleeping) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1 mt-6">
          <div className="flex space-x-6">
            <span className="text-xl font-bold text-slate-500 select-none">💤</span>
            <span className="text-xl font-bold text-slate-500 select-none">💤</span>
          </div>
          <div className="text-sm font-semibold text-slate-400">w</div>
        </div>
      );
    }

    if (statusText.includes("吃")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1 mt-4">
          <div className="flex space-x-6 text-lg">
            <span>&gt;</span>
            <span>&lt;</span>
          </div>
          <div className="text-lg font-bold text-pink-400 animate-pulse">O</div>
        </div>
      );
    }

    if (statusText.includes("玩") || statusText.includes("开心")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1 mt-4">
          <div className="flex space-x-6 text-xl">
            <span>^</span>
            <span>^</span>
          </div>
          <div className="text-lg font-bold text-red-400">▽</div>
        </div>
      );
    }

    if (pet.happiness < 30) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1 mt-5">
          <div className="flex space-x-6 text-lg font-medium text-slate-600">
            <span>T</span>
            <span>T</span>
          </div>
          <div className="text-sm font-semibold text-slate-500">n</div>
        </div>
      );
    }

    // Default cute awake face
    return (
      <div className="flex flex-col items-center justify-center space-y-1 mt-4">
        <div className="flex space-x-6">
          <div className="w-3 h-3 bg-slate-800 rounded-full relative">
            <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
          </div>
          <div className="w-3 h-3 bg-slate-800 rounded-full relative">
            <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
          </div>
        </div>
        <div className="text-xs font-bold text-slate-700">v</div>
      </div>
    );
  };

  // Base bounce speed depending on state
  const getAnimationDuration = () => {
    if (pet.isSleeping) return 3.0;
    if (statusText.includes("吃")) return 0.6;
    if (statusText.includes("玩")) return 0.5;
    return 1.8;
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Background radial soft light glow */}
      <div 
        className={`absolute inset-0 m-auto w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-1000 ${
          pet.isSleeping ? "bg-indigo-300" : pet.happiness > 70 ? "bg-rose-300" : "bg-peach-100"
        }`} 
      />

      {/* Main interactive pet container */}
      <motion.div
        id="interactive-pet-container"
        className="relative z-10 cursor-pointer flex flex-col items-center"
        onClick={onTap}
        onMouseEnter={() => {
          setIsHovered(true);
          playPetAffection();
        }}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: pet.isSleeping ? [0, 4, 0] : [0, -12, 0],
          scaleY: pet.isSleeping ? [1, 0.97, 1] : [1, 1.04, 1],
          scaleX: pet.isSleeping ? [1, 1.02, 1] : [1, 0.98, 1],
          rotate: statusText.includes("玩") ? [-2, 2, -2] : 0
        }}
        transition={{
          repeat: Infinity,
          duration: getAnimationDuration(),
          ease: "easeInOut"
        }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Render different pets dynamically */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          
          {/* PET TYPE: RABBIT */}
          {pet.type === "rabbit" && (
            <div className="relative w-36 h-36 bg-gradient-to-b from-white to-pink-50 rounded-[45%] border-4 border-pink-200 shadow-md">
              {/* Ears */}
              <motion.div 
                className="absolute -top-12 left-3 w-8 h-18 bg-white border-4 border-pink-200 rounded-full origin-bottom"
                animate={{ rotate: isHovered ? [-5, 5, -5] : [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <div className="w-3 h-10 bg-pink-100 rounded-full mx-auto mt-2" />
              </motion.div>
              <motion.div 
                className="absolute -top-12 right-3 w-8 h-18 bg-white border-4 border-pink-200 rounded-full origin-bottom"
                animate={{ rotate: isHovered ? [5, -5, 5] : [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
              >
                <div className="w-3 h-10 bg-pink-100 rounded-full mx-auto mt-2" />
              </motion.div>

              {/* Blush cheeks */}
              <div className="absolute top-20 left-4 w-5 h-2.5 bg-pink-200 rounded-full opacity-75 blur-[1px]" />
              <div className="absolute top-20 right-4 w-5 h-2.5 bg-pink-200 rounded-full opacity-75 blur-[1px]" />

              {/* Face Details */}
              {getPetFace()}

              {/* Cute little paws */}
              <div className="absolute bottom-0 left-6 w-5 h-4 bg-white border-t-2 border-pink-100 rounded-t-full shadow-inner" />
              <div className="absolute bottom-0 right-6 w-5 h-4 bg-white border-t-2 border-pink-100 rounded-t-full shadow-inner" />
            </div>
          )}

          {/* PET TYPE: CAT */}
          {pet.type === "cat" && (
            <div className="relative w-36 h-36 bg-gradient-to-b from-amber-100 to-orange-200 rounded-[44%] border-4 border-orange-300 shadow-md">
              {/* Ears */}
              <div className="absolute -top-3.5 left-1 w-9 h-9 bg-amber-100 border-4 border-orange-300 rounded-tl-2xl rounded-br-2xl transform -rotate-12 overflow-hidden">
                <div className="w-4 h-4 bg-rose-200 absolute bottom-0 right-0 rounded-tl-lg" />
              </div>
              <div className="absolute -top-3.5 right-1 w-9 h-9 bg-amber-100 border-4 border-orange-300 rounded-tr-2xl rounded-bl-2xl transform rotate-12 overflow-hidden">
                <div className="w-4 h-4 bg-rose-200 absolute bottom-0 left-0 rounded-tr-lg" />
              </div>

              {/* Tail */}
              <motion.div 
                className="absolute -bottom-2 -right-8 w-10 h-6 bg-orange-300 rounded-full border-2 border-orange-400 origin-left"
                animate={{ rotate: [10, -10, 10], y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />

              {/* Blush cheeks */}
              <div className="absolute top-20 left-4 w-5 h-2.5 bg-rose-300 rounded-full opacity-60 blur-[1px]" />
              <div className="absolute top-20 right-4 w-5 h-2.5 bg-rose-300 rounded-full opacity-60 blur-[1px]" />

              {/* Whiskers */}
              <div className="absolute top-18 left-1 w-4 h-0.5 bg-orange-400 opacity-60" />
              <div className="absolute top-20 left-0 w-4 h-0.5 bg-orange-400 opacity-60 transform rotate-6" />
              <div className="absolute top-18 right-1 w-4 h-0.5 bg-orange-400 opacity-60" />
              <div className="absolute top-20 right-0 w-4 h-0.5 bg-orange-400 opacity-60 transform -rotate-6" />

              {/* Face Details */}
              {getPetFace()}

              {/* Cute little paws */}
              <div className="absolute bottom-0 left-6 w-5 h-4 bg-amber-100 border-t-2 border-orange-200 rounded-t-full shadow-inner" />
              <div className="absolute bottom-0 right-6 w-5 h-4 bg-amber-100 border-t-2 border-orange-200 rounded-t-full shadow-inner" />
            </div>
          )}

          {/* PET TYPE: CHICK */}
          {pet.type === "chick" && (
            <div className="relative w-36 h-36 bg-gradient-to-b from-yellow-100 to-amber-200 rounded-[48%] border-4 border-yellow-300 shadow-md">
              {/* Sprout on head */}
              <div className="absolute -top-5 left-[45%] flex flex-col items-center">
                <div className="w-1 h-3 bg-green-400" />
                <div className="flex -mt-3.5 space-x-1.5">
                  <div className="w-3.5 h-2 bg-green-400 rounded-full transform -rotate-45" />
                  <div className="w-3.5 h-2 bg-green-400 rounded-full transform rotate-45" />
                </div>
              </div>

              {/* Tiny Wings */}
              <motion.div 
                className="absolute top-16 -left-3.5 w-5 h-8 bg-yellow-200 border-2 border-yellow-300 rounded-full origin-right"
                animate={{ rotate: statusText.includes("玩") ? [20, -40, 20] : [5, -10, 5] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
              <motion.div 
                className="absolute top-16 -right-3.5 w-5 h-8 bg-yellow-200 border-2 border-yellow-300 rounded-full origin-left"
                animate={{ rotate: statusText.includes("玩") ? [-20, 40, -20] : [-5, 10, -5] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />

              {/* Blush cheeks */}
              <div className="absolute top-20 left-4 w-4 h-2 bg-orange-300 rounded-full opacity-70 blur-[1px]" />
              <div className="absolute top-20 right-4 w-4 h-2 bg-orange-300 rounded-full opacity-70 blur-[1px]" />

              {/* Face Details */}
              {getPetFace()}

              {/* Beak override if awake/not eating */}
              {!pet.isSleeping && !statusText.includes("吃") && (
                <div className="absolute top-20 left-[43%] w-5 h-4 bg-orange-400 rounded-full border border-orange-500 flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-orange-600" />
                </div>
              )}

              {/* Little orange feet */}
              <div className="absolute -bottom-1 left-9 w-4 h-3 bg-orange-400 rounded-full border border-orange-500" />
              <div className="absolute -bottom-1 right-9 w-4 h-3 bg-orange-400 rounded-full border border-orange-500" />
            </div>
          )}

          {/* ACCESSORIES OVERLAY */}
          <AnimatePresence>
            {pet.accessory !== "none" && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.2, opacity: 0, y: -20 }}
                className="absolute z-20 pointer-events-none select-none text-4xl"
                style={{
                  top: pet.type === "rabbit" ? "-18px" : pet.type === "cat" ? "-6px" : "-10px",
                  left: pet.accessory === "ribbon" && pet.type === "rabbit" ? "75px" : "auto"
                }}
              >
                {pet.accessory === "ribbon" && (
                  <span className="drop-shadow-sm select-none">🎀</span>
                )}
                {pet.accessory === "crown" && (
                  <span className="drop-shadow-sm select-none">👑</span>
                )}
                {pet.accessory === "glasses" && (
                  <span className="drop-shadow-sm select-none scale-125 block mt-12 mr-1">👓</span>
                )}
                {pet.accessory === "hat" && (
                  <span className="drop-shadow-sm select-none scale-110 block -mt-2">👒</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sleeping snores */}
      {pet.isSleeping && (
        <div className="absolute top-0 right-10 flex flex-col space-y-1 select-none pointer-events-none">
          <motion.span 
            className="text-lg font-bold text-indigo-400"
            animate={{ opacity: [0, 1, 0], y: [10, -20], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2.0, delay: 0 }}
          >
            Zzz
          </motion.span>
          <motion.span 
            className="text-sm font-bold text-indigo-300"
            animate={{ opacity: [0, 1, 0], y: [10, -20], x: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.0, delay: 0.6 }}
          >
            Zzz
          </motion.span>
        </div>
      )}
    </div>
  );
}
