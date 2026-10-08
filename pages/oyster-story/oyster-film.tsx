"use client";
import { useRef, useState } from "react";
import { FaPlay, FaChevronRight } from "react-icons/fa";
export default function OysterFilmPage() {
 const videoRef = useRef<HTMLVideoElement>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const handlePlay = () => {
  if (!videoRef.current) return;
  videoRef.current.play();
  setIsPlaying(true);
 };
 return (
  <main className="bg-white text-[#111]">
   {" "}
   {/* ========================================================= HERO / VIDEO ========================================================= */}{" "}
   <section className="relative h-[75vh] min-h-[550px] overflow-hidden bg-black md:h-screen">
    {" "}
    <video
     ref={videoRef}
     muted
     playsInline
     autoPlay
     loop
     preload="metadata"
     className="absolute inset-0 h-full w-full object-cover"
     poster="https://media.rolex.com/video/upload/c_limit,w_1920/f_auto:video/q_auto:eco/v1/rolexcom/about-rolex/oyster-story/oyster-film/cover/oyster-story-the-anniversary-film-cover-video-autoplay">
     {" "}
     <source
      src="https://media.rolex.com/video/upload/c_limit,w_1920/f_auto:video/q_auto:eco/v1/rolexcom/about-rolex/oyster-story/oyster-film/cover/oyster-story-the-anniversary-film-cover-video-autoplay"
      type="video/mp4"
     />{" "}
    </video>{" "}
    {/* Overlay */} <div className="absolute inset-0 bg-black/20" /> {/* CONTENT */}{" "}
    <div className="container relative flex h-full items-end pb-16 md:items-center md:pb-0">
     {" "}
     <div className="max-w-[800px] text-white">
      {" "}
      <p className="text-sm font-semibold uppercase tracking-[0.2em] md:text-base"> Oyster Story </p>{" "}
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] md:text-8xl"> The film </h1>{" "}
      {!isPlaying && (
       <button
        onClick={handlePlay}
        className="mt-8 flex items-center gap-4 rounded-full bg-white px-6 py-4 font-bold text-black transition hover:bg-[#127749] hover:text-white">
        {" "}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs text-white">
         {" "}
         <FaPlay />{" "}
        </span>{" "}
        Watch the film{" "}
       </button>
      )}{" "}
     </div>{" "}
    </div>{" "}
   </section>{" "}
   {/* ========================================================= INTRO ========================================================= */}{" "}
   <section className="bg-white py-20 md:py-32">
    {" "}
    <div className="container">
     {" "}
     <div className="grid gap-12 md:grid-cols-2 md:gap-24">
      {" "}
      {/* LEFT */}{" "}
      <div>
       {" "}
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Oyster Story </p>{" "}
       <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl"> The story of the Oyster </h2>{" "}
      </div>{" "}
      {/* RIGHT */}{" "}
      <div className="text-lg leading-relaxed text-[#525354] md:text-2xl">
       {" "}
       <p>
        {" "}
        Driven by rare archival material, this film delves into the heart of the Oyster legend. It reveals how this revolutionary watch accompanied some of the
        greatest human achievements of the 20th century and helped shape the history of modern watchmaking.{" "}
       </p>{" "}
       <p className="mt-8">
        {" "}
        From exploring the farthest reaches of the world to commitment to the planet, from remarkable sporting feats to outstanding artistic performances, this
        documentary presents a century of innovation and pushing beyond limits.{" "}
       </p>{" "}
      </div>{" "}
     </div>{" "}
    </div>{" "}
   </section>{" "}
   {/* ========================================================= LARGE IMAGE / FILM ========================================================= */}{" "}
   <section className="relative h-[500px] overflow-hidden md:h-[800px]">
    {" "}
    <img
     src="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_1920/v1777466116/rolexcom/about-rolex/oyster-story/oyster-film/oyster-story-the-anniversary-film-next-chapter-card-first_oyster_octagonal_1926_2602_0004_eciRGB"
     alt="Oyster Story"
     className="h-full w-full object-cover"
    />{" "}
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />{" "}
    <div className="container absolute inset-x-0 bottom-10 text-white md:bottom-16">
     {" "}
     <p className="text-sm font-semibold uppercase tracking-[0.2em]"> Oyster Story </p>{" "}
     <h2 className="mt-3 text-3xl font-bold md:text-6xl"> A century of innovation </h2>{" "}
    </div>{" "}
   </section>{" "}
   {/* ========================================================= DOCUMENTARY TEXT ========================================================= */}{" "}
   <section className="bg-[#f4f4f4] py-20 md:py-32">
    {" "}
    <div className="container">
     {" "}
     <div className="mx-auto max-w-[1000px] text-center">
      {" "}
      <p className="text-2xl font-bold leading-tight md:text-5xl">
       {" "}
       A revolutionary watch that accompanied some of the greatest achievements of the 20th century.{" "}
      </p>{" "}
      <p className="mx-auto mt-8 max-w-[800px] text-lg leading-relaxed text-[#525354] md:text-xl">
       {" "}
       The story of the Oyster is a story of innovation, exploration and human achievement. From the depths of the oceans to the highest peaks, the watch has
       accompanied pioneers who pushed beyond the limits of what was thought possible.{" "}
      </p>{" "}
     </div>{" "}
    </div>{" "}
   </section>{" "}
   {/* ========================================================= NEXT CHAPTER ========================================================= */}{" "}
   <section className="bg-white py-20 md:py-32">
    {" "}
    <div className="container">
     {" "}
     <div className="mb-12">
      {" "}
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Oyster Story </p>{" "}
      <h2 className="mt-4 text-4xl font-bold md:text-6xl"> Next chapter </h2>{" "}
     </div>{" "}
     {/* CHAPTER I */}{" "}
     <article className="group relative overflow-hidden bg-[#e5e5e5]">
      {" "}
      <div className="aspect-[16/9] overflow-hidden">
       {" "}
       <img
        src="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_1920/v1777466116/rolexcom/about-rolex/oyster-story/oyster-film/oyster-story-the-anniversary-film-next-chapter-card-first_oyster_octagonal_1926_2602_0004_eciRGB"
        alt="The Oyster"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
       />{" "}
      </div>{" "}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-24 text-white md:p-12 md:pt-40">
       {" "}
       <p className="text-sm font-semibold uppercase tracking-[0.2em]"> Chapter I </p> <h3 className="mt-3 text-3xl font-bold md:text-6xl"> The Oyster </h3>{" "}
       <p className="mt-2 text-lg md:text-2xl"> A revolutionary watch </p>{" "}
       <button className="mt-6 flex items-center gap-3 font-bold hover:text-[#127749]">
        {" "}
        Read the chapter <FaChevronRight />{" "}
       </button>{" "}
      </div>{" "}
     </article>{" "}
    </div>{" "}
   </section>{" "}
  </main>
 );
}
OysterFilmPage.Layout = "Default";
