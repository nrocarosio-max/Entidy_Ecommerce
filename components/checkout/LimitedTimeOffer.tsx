import { useEffect, useState } from "react";
import { FaRegClock } from "react-icons/fa";

const getRemainingTime = () => {
 const now = new Date();

 const end = new Date(now);
 end.setHours(24, 0, 0, 0);

 return Math.max(0, end.getTime() - now.getTime());
};

const formatTime = (ms: number) => {
 const totalSeconds = Math.floor(ms / 1000);

 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const seconds = totalSeconds % 60;

 return {
  hours: String(hours).padStart(2, "0"),
  minutes: String(minutes).padStart(2, "0"),
  seconds: String(seconds).padStart(2, "0"),
 };
};

export default function DailyOfferCountdown() {
 const [remaining, setRemaining] = useState(getRemainingTime());

 useEffect(() => {
  const timer = setInterval(() => {
   setRemaining(getRemainingTime());
  }, 1000);

  return () => clearInterval(timer);
 }, []);

 const time = formatTime(remaining);

 return (
  <section className="border-y border-[#dededb] bg-white">
   <div className="container py-5">
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
     <div className="flex items-center gap-2">
      <FaRegClock className="text-[15px] text-[#127749]" />

      <div>
       <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#303234]">Limited Time Offer</p>

       <p className="mt-0.5 text-[12px] text-[#777]">Offer ends at midnight</p>
      </div>
     </div>

     <div className="flex items-center gap-2">
      <div className="min-w-[52px] border border-[#dededb] bg-[#f8f8f6] px-3 py-2 text-center">
       <div className="text-[20px] font-medium leading-none tracking-[0.05em] text-[#303234]">{time.hours}</div>
       <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#777]">Hours</div>
      </div>

      <span className="text-[18px] text-[#777]">:</span>

      <div className="min-w-[52px] border border-[#dededb] bg-[#f8f8f6] px-3 py-2 text-center">
       <div className="text-[20px] font-medium leading-none tracking-[0.05em] text-[#303234]">{time.minutes}</div>
       <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#777]">Minutes</div>
      </div>

      <span className="text-[18px] text-[#777]">:</span>

      <div className="min-w-[52px] border border-[#dededb] bg-[#f8f8f6] px-3 py-2 text-center">
       <div className="text-[20px] font-medium leading-none tracking-[0.05em] text-[#303234]">{time.seconds}</div>
       <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#777]">Seconds</div>
      </div>
     </div>
    </div>
   </div>
  </section>
 );
}
