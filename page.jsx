import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ClockDisplay, CountdownDisplay, AlarmSetter, SoundSelector, VolumeControl, useAlarmSound } from "@/components/alarm/AlarmComponents";
import { BellRing, Volume2 } from "lucide-react";

function getThaiTime() {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  return new Date(utc.getTime() + 7 * 60 * 60000);
}

export default function AlarmClock() {
  const [currentTime, setCurrentTime] = useState(getThaiTime);
  const [alarmTime, setAlarmTime] = useState(null);
  const [alarmCreatedAt, setAlarmCreatedAt] = useState(null);
  const [selectedSound, setSelectedSound] = useState("classic");
  const [volume, setVolume] = useState(100);
  const [isAlarming, setIsAlarming] = useState(false);
  const [testingSound, setTestingSound] = useState(null);
  const { startAlarm, stopAlarm, updateVolume, playTest } = useAlarmSound(selectedSound, volume);
  const overdueTimerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getThaiTime()), 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!alarmTime) return;
    const checkAlarm = () => {
      const now = getThaiTime();
      if (!isAlarming && now.getHours() === alarmTime.getHours() && now.getMinutes() === alarmTime.getMinutes()) {
        setIsAlarming(true); startAlarm();
      }
    };
    const interval = setInterval(checkAlarm, 500);
    return () => clearInterval(interval);
  }, [alarmTime, isAlarming, startAlarm]);

  useEffect(() => {
    if (!isAlarming) return;
    overdueTimerRef.current = setTimeout(() => updateVolume(1.0), 30000);
    return () => clearTimeout(overdueTimerRef.current);
  }, [isAlarming, updateVolume]);

  useEffect(() => { updateVolume(volume); }, [volume, updateVolume]);

  const handleSetAlarm = (time) => { setAlarmTime(time); setAlarmCreatedAt(getThaiTime()); setIsAlarming(false); };
  const handleClearAlarm = () => { setAlarmTime(null); setAlarmCreatedAt(null); stopAlarm(); setIsAlarming(false); };
  const handleStopAlarm = () => { stopAlarm(); setIsAlarming(false); setAlarmTime(null); };
  const handleTestSound = (soundKey) => {
    if (testingSound === soundKey) return;
    setTestingSound(soundKey); playTest(soundKey, volume);
    setTimeout(() => setTestingSound(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {isAlarming && (
        <motion.div className="absolute inset-0 pointer-events-none"
          animate={{ background: [
            "radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)",
            "radial-gradient(circle at center, rgba(239,68,68,0.3) 0%, transparent 70%)",
            "radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)" ]}}
          transition={{ duration: 0.5, repeat: Infinity }} />
      )}
      <div className="w-full max-w-3xl z-10 space-y-8">
        {!alarmTime && (
          <div className="text-center">
            <h1 className="text-xs sm:text-sm uppercase tracking-[0.3em] text-muted-foreground font-bold mb-1">ALARM CLOCK</h1>
          </div>
        )}
        {!alarmTime && <ClockDisplay time={currentTime} isAlarming={isAlarming} />}
        {isAlarming && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <BellRing className="w-8 h-8 text-red-500 animate-bounce" />
              <span className="text-2xl font-bold text-red-500">ได้เวลาปลุกแล้ว!</span>
            </div>
            <button onClick={handleStopAlarm}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/30">
              ปิดนาฬิกาปลุก
            </button>
          </motion.div>
        )}
        {!isAlarming && !alarmTime && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BellRing className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground">ตั้งเวลาปลุก</span>
              </div>
              <AlarmSetter alarmTime={alarmTime} onSetAlarm={handleSetAlarm} onClearAlarm={handleClearAlarm} />
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-5 h-5 text-accent" />
                <span className="font-bold text-foreground">เลือกเสียงปลุก</span>
              </div>
              <SoundSelector selected={selectedSound} onSelect={setSelectedSound} onTestSound={handleTestSound} testingSound={testingSound} />
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <span className="font-bold text-foreground block mb-3">ระดับเสียง</span>
              <VolumeControl volume={volume} onChange={setVolume} />
            </div>
          </motion.div>
        )}
        {!isAlarming && alarmTime && (
          <CountdownDisplay alarmTime={alarmTime} alarmCreatedAt={alarmCreatedAt} currentTime={currentTime} onCancel={handleClearAlarm} />
        )}
        {!alarmTime && (
          <p className="text-center text-xs text-muted-foreground">
            เปิดหน้าเว็บทิ้งไว้ ห้ามปิด — เสียงปลุกจะดังไม่หยุดจนกว่าคุณจะกดปิด
          </p>
        )}
      </div>
    </div>
  );
}