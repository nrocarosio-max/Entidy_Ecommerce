"use client";
import { useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
type PopperType = "success" | "maximum";
interface PopperState {
 type: PopperType;
 message: string;
}
export default function CartPopper() {
 const [popper, setPopper] = useState<PopperState | null>(null);
 useEffect(() => {
  const handleCartAdded = () => {};
  const handleCartMaxReached = () => {
   setPopper({ type: "maximum", message: "Maximum 2 products allowed" });
  };
  window.addEventListener("cartAdded", handleCartAdded);
  window.addEventListener("cartMaxReached", handleCartMaxReached);
  return () => {
   window.removeEventListener("cartAdded", handleCartAdded);
   window.removeEventListener("cartMaxReached", handleCartMaxReached);
  };
 }, []);
 useEffect(() => {
  if (!popper) return;
  const timer = setTimeout(() => {
   setPopper(null);
  }, 3000);
  return () => clearTimeout(timer);
 }, [popper]);
 if (!popper) return null;
 const isSuccess = popper.type === "success";
 return (
  <div className="fixed right-4 top-5 z-[9999] w-[calc(100%-2rem)] max-w-[380px] animate-[slideIn_0.3s_ease-out] md:right-6 md:top-6">
   <div className="flex items-center gap-3 rounded-[8px] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
    {/* ICON */}
    <div
     className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSuccess ? "bg-[#e8f5ee] text-[#127749]" : "bg-[#f5f5f5] text-[#555]"}`}>
     {isSuccess ? <FaCheck size={16} /> : <FaTimes size={15} />}
    </div>
    {/* MESSAGE */}
    <div className="flex-1">
     <p className="text-sm font-semibold text-[#222]"> {isSuccess ? "Success" : "Maximum limit"} </p>
     <p className="mt-1 text-xs text-[#666]"> {popper.message} </p>
    </div>
    {/* CLOSE */}
    <button
     type="button"
     onClick={() => setPopper(null)}
     className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#777] transition hover:bg-[#f4f4f4] hover:text-[#222]"
     aria-label="Close notification">
     <FaTimes size={11} />
    </button>
   </div>
   {/* PROGRESS */} <div className={`h-[3px] origin-left ${isSuccess ? "bg-[#127749]" : "bg-[#777]"} animate-[progress_3s_linear]`} />
   <style jsx>{`
    @keyframes slideIn {
     from {
      opacity: 0;
      transform: translateX(30px);
     }
     to {
      opacity: 1;
      transform: translateX(0);
     }
    }
    @keyframes progress {
     from {
      transform: scaleX(1);
     }
     to {
      transform: scaleX(0);
     }
    }
   `}</style>
  </div>
 );
}
