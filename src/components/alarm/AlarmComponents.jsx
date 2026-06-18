import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// ===== เสียงปลุก 5 แบบ =====
const ALARM_SOUNDS = {
  classic: {
    name: "นาฬิกาปลุกคลาสสิก", emoji: "⏰",
    description: "เสียงกริ่งปลุกแบบดั้งเดิม ดังทะลุแก้วหู",
    generate: (ctx, time) => {
      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0.3; osc1.type = "square"; osc2.type = "square";
      const cycle = time % 1;
      osc1.frequency.value = cycle < 0.15 ? 1200 : 800;
      osc2.frequency.value = cycle < 0.15 ? 1400 : 1000;
      osc1.connect(gain); osc2.connect(gain); osc1.start(); osc2.start();
      return { oscillators: [osc1, osc2], gain };
    }
  },
  siren: {
    name: "ไซเรนฉุกเฉิน", emoji: "🚨",
    description: "เสียงไซเรนหวอแหลม สะเทือนถึงขั้วหัวใจ",
    generate: (ctx, time) => {
      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0.3; osc1.type = "sawtooth"; osc2.type = "sawtooth";
      const freq = 400 + Math.sin(time * 8) * 300;
      osc1.frequency.value = freq; osc2.frequency.value = freq * 1.5;
      osc1.connect(gain); osc2.connect(gain); osc1.start(); osc2.start();
      return { oscillators: [osc1, osc2], gain };
    }
  },
  nuclear: {
    name: "สัญญาณนิวเคลียร์", emoji: "☢️",
    description: "เสียงเตือนภัยนิวเคลียร์ ดังสนั่นจนบ้านสะเทือน",
    generate: (ctx, time) => {
      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0.3; osc1.type = "triangle"; osc2.type = "square";
      const phase = Math.floor(time * 2.5) % 2;
      osc1.frequency.value = phase === 0 ? 200 : 600;
      osc2.frequency.value = phase === 0 ? 250 : 750;
      osc1.connect(gain); osc2.connect(gain); osc1.start(); osc2.start();
      return { oscillators: [osc1, osc2], gain };
    }
  },
  fire: {
    name: "สัญญาณไฟไหม้", emoji: "🔥",
    description: "เสียงเตือนอัคคีภัย แหลมสูงปลุกทั้งหมู่บ้าน",
    generate: (ctx, time) => {
      const osc1 = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0.3; osc1.type = "square";
      const t = time % 3;
      if (t < 0.5) osc1.frequency.value = 1000;
      else if (t < 1.0) osc1.frequency.value = 1400;
      else if (t < 1.5) osc1.frequency.value = 1000;
      else if (t < 2.0) osc1.frequency.value = 0;
      else osc1.frequency.value = 1000;
      osc1.connect(gain); osc1.start();
      return { oscillators: [osc1], gain };
    }
  },
  emergency: {
    name: "ประกาศฉุกเฉิน", emoji: "📢",
    description: "เสียงหวอประกาศฉุกเฉิน ดังขนาดเพื่อนบ้านได้ยิน",
    generate: (ctx, time) => {
      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0.3; osc1.type = "sawtooth"; osc2.type = "sawtooth";
      const freq = 300 + (time % 0.8) * 500;
      osc1.frequency.value = freq; osc2.frequency.value = freq * 1.2 + 50;
      osc1.connect(gain); osc2.connect(gain); osc1.start(); osc2.start();
      return { oscillators: [osc1, osc2], gain };
    }
  }
};

const SOUND_LIST = Object.entries(ALARM_SOUNDS).map(([key, val]) => ({ key, ...val }));

// ===== วงแหวนนับถอยหลัง =====
export function CountdownDisplay({ alarmTime, alarmCreatedAt, currentTime, onCancel }) {
  const remainingMs = Math.max(0, alarmTime.getTime() - currentTime.getTime());
  const totalMs = alarmTime.getTime() - alarmCreatedAt.getTime();
  const progress = totalMs > 0 ? Math.min((totalMs - remainingMs) / totalMs, 1) : 0;
  const h = Math.floor(remainingMs / 3600000);
  const m = Math.floor((remainingMs % 3600000) / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.55, 420);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * Math.min(progress, 1);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8">
      <div className="relative flex-shrink-0" style={{ width: size, height: size, overflow: "visible" }}>
        <svg width={size} height={size} className="transform -rotate-90" style={{ overflow: "visible" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#3B82F6" strokeWidth={strokeWidth + 10}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} opacity={0.2}
            style={{ filter: "blur(8px)", transition: "stroke-dashoffset 0.6s linear" }} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#3B82F6" strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-[0.2em] mb-3">จะปลุกในอีก</p>
          <div className="font-display font-bold text-foreground tabular-nums leading-none" style={{ fontSize: size * 0.13 }}>
            {String(h).padStart(2,"0")}<span className="text-muted-foreground mx-0.5">:</span>
            {String(m).padStart(2,"0")}<span className="text-muted-foreground mx-0.5">:</span>
            {String(s).padStart(2,"0")}
          </div>
          <p className="text-xs text-muted-foreground mt-2" style={{ fontSize: size * 0.035 }}>ชั่วโมง : นาที : วินาที</p>
          <p className="text-base text-[#3B82F6] font-semibold mt-4">
            ปลุกเวลา {alarmTime.getHours().toString().padStart(2,"0")}:{alarmTime.getMinutes().toString().padStart(2,"0")}
          </p>
        </div>
      </div>
      <button onClick={onCancel}
        className="px-8 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold rounded-xl transition-all active:scale-95 border border-destructive/20 text-lg">
        ยกเลิกการปลุก
      </button>
    </motion.div>
  );
}

// ===== นาฬิกาหลัก =====
export function ClockDisplay({ time, isAlarming }) {
  const hours = String(time.getHours()).padStart(2,"0");
  const minutes = String(time.getMinutes()).padStart(2,"0");
  const seconds = String(time.getSeconds()).padStart(2,"0");
  const day = time.toLocaleDateString("th-TH", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  return (
    <motion.div className="text-center select-none"
      animate={isAlarming ? { scale:[1,1.02,1,1.02], rotate:[0,-0.5,0,0.5,0] } : {}}
      transition={isAlarming ? { duration:0.3, repeat:Infinity } : {}}>
      <p className="text-muted-foreground text-sm sm:text-base mb-2">{day}</p>
      <div className={`font-display text-7xl sm:text-8xl md:text-[10rem] leading-none tracking-tighter tabular-nums
        ${isAlarming ? "text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]" : "text-foreground"}`}>
        <span className="inline-block w-[1.1em] text-right">{hours}</span>
        <span className="mx-1 opacity-60">:</span>
        <span className="inline-block w-[1.1em] text-right">{minutes}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="inline-block w-[1.1em] text-right text-5xl sm:text-6xl md:text-8xl opacity-70">{seconds}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">เขตเวลา ประเทศไทย (UTC+7)</p>
    </motion.div>
  );
}

// ===== ตั้งเวลาปลุก =====
export function AlarmSetter({ alarmTime, onSetAlarm, onClearAlarm }) {
  const [hours, setHours] = useState(alarmTime ? String(alarmTime.getHours()).padStart(2,"0") : "06");
  const [minutes, setMinutes] = useState(alarmTime ? String(alarmTime.getMinutes()).padStart(2,"0") : "00");
  const handleSet = () => {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const thaiNow = new Date(utc.getTime() + 7 * 60 * 60000);
    const alarm = new Date(thaiNow);
    alarm.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (alarm <= thaiNow) alarm.setDate(alarm.getDate() + 1);
    onSetAlarm(alarm);
  };
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
        <select value={hours} onChange={(e) => setHours(e.target.value)}
          className="bg-transparent text-3xl font-bold font-display text-foreground focus:outline-none cursor-pointer appearance-none text-center w-16">
          {Array.from({length:24}, (_,i) => String(i).padStart(2,"0")).map((h) => (
            <option key={h} value={h} className="bg-card text-foreground">{h}</option>))}
        </select>
        <span className="text-3xl font-bold text-primary">:</span>
        <select value={minutes} onChange={(e) => setMinutes(e.target.value)}
          className="bg-transparent text-3xl font-bold font-display text-foreground focus:outline-none cursor-pointer appearance-none text-center w-16">
          {Array.from({length:60}, (_,i) => String(i).padStart(2,"0")).map((m) => (
            <option key={m} value={m} className="bg-card text-foreground">{m}</option>))}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSet} className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all active:scale-95">ตั้งปลุก</button>
        {alarmTime && (
          <button onClick={onClearAlarm} className="px-4 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold rounded-xl transition-all active:scale-95">ยกเลิก</button>)}
      </div>
    </div>
  );
}

// ===== เลือกเสียง =====
export function SoundSelector({ selected, onSelect, onTestSound, testingSound }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {SOUND_LIST.map((sound) => {
        const isTesting = testingSound === sound.key;
        return (
          <div key={sound.key} onClick={() => onSelect(sound.key)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all active:scale-95 cursor-pointer
              ${selected === sound.key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/30"}`}>
            <span className="text-2xl block mb-2">{sound.emoji}</span>
            <span className="text-sm font-bold text-foreground block">{sound.name}</span>
            <span className="text-xs text-muted-foreground mt-1 block">{sound.description}</span>
            <button onClick={(e) => { e.stopPropagation(); onTestSound(sound.key); }}
              className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1
                ${isTesting ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/70 text-secondary-foreground"}`}>
              {isTesting ? (<><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />กำลังเล่น...</>) : "🔊 ทดลองฟัง"}
            </button>
            {selected === sound.key && (
              <motion.div layoutId="soundCheck" className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary"
                initial={false} transition={{ type:"spring", stiffness:500, damping:30 }} />)}
          </div>
        );
      })}
    </div>
  );
}

// ===== ระดับเสียง =====
export function VolumeControl({ volume, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground w-10 text-right">
        {volume === 100 ? <span className="text-red-500 font-bold">MAX</span> : volume === 0 ? "🔇" : `${volume}%`}
      </span>
      <input type="range" min="0" max="100" value={volume} onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none bg-muted cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
  );
}

export { ALARM_SOUNDS };

// ===== Hook ควบคุมเสียง (Web Audio API) =====
export function useAlarmSound(selectedSound, volume) {
  const ctxRef = useRef(null), nodesRef = useRef(null), volumeNodeRef = useRef(null);
  const animFrameRef = useRef(null), testTimerRef = useRef(null);

  const startAlarm = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (nodesRef.current) { nodesRef.current.oscillators.forEach(o => { try { o.stop(); } catch(e){} }); nodesRef.current = null; }
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume / 100;
    masterGain.connect(ctx.destination);
    volumeNodeRef.current = masterGain;
    const startTime = ctx.currentTime;
    const soundDef = ALARM_SOUNDS[selectedSound];
    const tick = () => {
      if (!ctxRef.current) return;
      const elapsed = ctxRef.current.currentTime - startTime;
      if (nodesRef.current) nodesRef.current.oscillators.forEach(o => { try { o.stop(); } catch(e){} });
      nodesRef.current = soundDef.generate(ctxRef.current, elapsed);
      nodesRef.current.gain.disconnect();
      nodesRef.current.gain.connect(masterGain);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [selectedSound, volume]);

  const updateVolume = useCallback((newVolume) => {
    if (volumeNodeRef.current) volumeNodeRef.current.gain.value = newVolume / 100;
  }, []);

  const stopAlarm = useCallback(() => {
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (nodesRef.current) { nodesRef.current.oscillators.forEach(o => { try { o.stop(); } catch(e){} }); nodesRef.current = null; }
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
  }, []);

  const playTest = useCallback((soundKey, vol) => {
    stopAlarm();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.value = (vol || volume) / 100;
    masterGain.connect(ctx.destination);
    volumeNodeRef.current = masterGain;
    const startTime = ctx.currentTime;
    const soundDef = ALARM_SOUNDS[soundKey];
    const tick = () => {
      if (!ctxRef.current) return;
      const elapsed = ctxRef.current.currentTime - startTime;
      if (nodesRef.current) nodesRef.current.oscillators.forEach(o => { try { o.stop(); } catch(e){} });
      nodesRef.current = soundDef.generate(ctxRef.current, elapsed);
      nodesRef.current.gain.disconnect();
      nodesRef.current.gain.connect(masterGain);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
    testTimerRef.current = setTimeout(() => stopAlarm(), 3000);
  }, [volume, stopAlarm]);

  return { startAlarm, stopAlarm, updateVolume, playTest };
}
