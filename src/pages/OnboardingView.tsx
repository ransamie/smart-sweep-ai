import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, Lock, HardDrive, Cpu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { TitleBar } from '@/components/TitleBar';

export function OnboardingView() {
  const { setApiKey } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const key = inputValue.trim();
    if (key.length > 10) {
      setIsValidating(true);
      setErrorMsg('');
      try {
        const isValid = await (window as any).electronAPI.validateApiKey(key);
        if (isValid) {
          setApiKey(key);
        } else {
          setErrorMsg('Invalid API key. Please check and try again.');
        }
      } catch (e) {
        setErrorMsg('Network error. Please check your internet connection and try again.');
      } finally {
        setIsValidating(false);
      }
    } else {
      setErrorMsg('Please enter a valid API key.');
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      <TitleBar />
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      
      {/* Left Pane - Branding & Aesthetics */}
      <div className="relative hidden lg:flex flex-col justify-between w-[45%] bg-card border-r border-white/5 p-12 overflow-hidden">
        {/* Background glow for the left pane */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-background to-blue-900/10 z-0"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-float z-0"></div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-primary/20 to-blue-600/20 p-2.5 rounded-xl shadow-lg shadow-primary/10 ring-1 ring-white/5">
              <img src="./logo.png" alt="SmartSweep Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SmartSweep AI</h1>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl font-extrabold tracking-tight mt-12 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent leading-tight">
            Next-Generation <br /> PC Optimization.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-white/70 mt-6 max-w-md font-normal leading-relaxed drop-shadow-sm">
            Harness the power of artificial intelligence to safely identify junk, free up gigabytes of space, and keep your system running like new.
          </motion.p>
        </motion.div>

        {/* Feature list */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 space-y-6 mt-12"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-white/90">Deep System Scan</h4>
              <p className="text-sm text-white/50">Analyzes temporary and cache files.</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white/90">Performance Boost</h4>
              <p className="text-sm text-white/50">Removes orphaned registry entries.</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-white/90">AI-Powered Safety</h4>
              <p className="text-sm text-white/50">Ensures critical files are never touched.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Pane - Form & Interaction */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          <motion.div variants={itemVariants}>
            <h3 className="text-3xl font-bold tracking-tight mb-2">Let's get started</h3>
            <p className="text-white/60">Configure your AI engine to begin.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Shield className="w-5 h-5" />
              <span>Privacy First Approach</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-light">
              To perform its intelligent analysis, SmartSweep AI requires a Gemini API key.
              <strong className="text-white font-medium"> Your data is filtered.</strong> We only transmit generic metadata (file sizes, types). Personal files and names are strictly excluded.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <label className="text-sm font-medium flex items-center gap-2 text-white/90 ml-1">
              Gemini API Key
            </label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Input 
                type="password" 
                placeholder="AIza..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="relative font-mono bg-black/60 border-white/10 focus-visible:ring-primary h-14 text-md px-4 rounded-lg w-full"
              />
            </div>
              <div className="flex items-center gap-2 text-xs text-white/50 ml-1">
                <Lock className="w-3 h-3" />
                <span>Stored encrypted on your local machine.</span>
              </div>
              <div className="text-sm text-white/70 ml-1 mt-3">
                Don't have an API key?{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
                >
                  Get one for free from Google AI Studio.
                </a>
              </div>
              {errorMsg && (
                <div className="text-red-400 text-sm mt-2 ml-1 font-medium">
                  {errorMsg}
                </div>
              )}
            </motion.div>

          <motion.div variants={itemVariants}>
              <Button 
                className="w-full h-14 text-md font-semibold gap-2 bg-white text-black hover:bg-gray-200 shadow-lg transition-all duration-300 mt-4 rounded-xl group" 
                size="lg" 
                onClick={handleSave}
                disabled={inputValue.trim().length < 10 || isValidating}
              >
                {isValidating ? 'Validating...' : 'Launch SmartSweep'}
                {!isValidating && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
