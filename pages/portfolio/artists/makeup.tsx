import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowRight, FaFacebookF, FaInstagram, FaPlay, FaQuoteLeft, FaTiktok } from "react-icons/fa";
import { SiThreads } from "react-icons/si";
const journeyImages = [
 {
  image:
   "https://scontent.fhan5-9.fna.fbcdn.net/v/t39.30808-6/779160489_2122663625130394_6681197705381605862_n.jpg?stp=dst-jpg_tt6&cstp=mx1536x2048&ctp=s1536x2048&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeG0QrR-ptL24CrsSIK5cJceE0n8hLdJEPMTSfyEt0kQ8_VvH_f3VRcAKXz2HZM8lx62XlQYb54gPpHlCSpjEwyD&_nc_ohc=VECuXwUyu3sQ7kNvwFVsAYo&_nc_oc=AdqqlMzU8U2JQv4dDjMkvG4H4M15-E5xUtBhoz5v2zMm7UyAswP_7OgREs0YKr7d4z8&_nc_zt=23&_nc_ht=scontent.fhan5-9.fna&_nc_gid=8IypbJ-d9BzhotfdTpbb3w&_nc_ss=7b2a8&oh=00_AQNbR7WQET43y9mpVgYefiNdNsxCIWnOfZzNYna7K2CzTw&oe=6ACD00A9",
  title: "Learning",
  description: "Những ngày đầu học và rèn luyện kỹ thuật makeup.",
 },
 {
  image:
   "https://scontent.fhan5-6.fna.fbcdn.net/v/t39.30808-6/773492166_122114915025336836_1575338838213301244_n.jpg?stp=dst-jpg_tt6&cstp=mx1152x2048&ctp=s1152x2048&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGkEK1Nf10xQ2CHWuKAlTuDvR6tIYSRSzm9Hq0hhJFLOde5K4dKyJjFfyxpvgh8AcRPt0IFFNWV3IVu-RYFHhWf&_nc_ohc=GK14da4jm9sQ7kNvwE19fAu&_nc_oc=AdrpNWHKhdzpCFqJ8KB-vtJJngpJPGaS8VJgwRTEpRs3wrREfmfMpt5Flli5ygIqGdE&_nc_zt=23&_nc_ht=scontent.fhan5-6.fna&_nc_gid=4xBZTxtwEgtPFUH3e3sD0g&_nc_ss=7b2a8&oh=00_AQMmSG6aKDPpmeq8oK_3xuNCZfQzM-m2ck5NRZmWPF8aJA&oe=6ACCFA78",
  title: "Practice",
  description: "Thực hành kỹ thuật makeup trên mẫu.",
 },
 {
  image:
   "https://scontent.fhan5-2.fna.fbcdn.net/v/t39.30808-6/751578420_2095622084501215_5153496467375476924_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1524&ctp=s2048x1524&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGxtlJ1AVHL-Od_suQdgZFfmocM8y6dWNeahwzzLp1Y1xqOk-i1k_gSh5LcZUj2bxfRmmZc6Zk0VNYrul5m_yNr&_nc_ohc=XSVdVJz_LX8Q7kNvwGGqJ2t&_nc_oc=Adq3KkWK8vfEdntHO5UeMP68208bGEjxzG2D3wMT6ofQx-nyb8-kqhnqmlIBGmlFPUU&_nc_zt=23&_nc_ht=scontent.fhan5-2.fna&_nc_gid=jJjyHUSnGqoq6nzsilQ0dg&_nc_ss=7b2a8&oh=00_AQPrs45f5FNIomp5678ipFI1J3hmQvKOWms-5zekptHBEA&oe=6ACD221C",
  title: "Tốt nghiệp rùi nè",
  description: "Hoàn thiện các layout makeup trong quá trình học.",
 },
 {
  image:
   "https://scontent.fhan5-6.fna.fbcdn.net/v/t39.30808-6/779865395_122115405321336836_982964852197811244_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1844&ctp=s2048x1844&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFNmiHhkRqYrHrYEYpfcRZpxxQagJStuU_HFBqAlK25T1dNf1J1EjwBt85KOdZq7V8KqfHfV0tODaMvzUcac33g&_nc_ohc=CsTJPIsk1YQQ7kNvwErXAkU&_nc_oc=AdqvGiIzpNMknkzBYZvm_fhYX5HJ17SsifaaSVnKvO-mnxENQVFU97VCWUg2hJwn3DM&_nc_zt=23&_nc_ht=scontent.fhan5-6.fna&_nc_gid=04vucbblWslQG3WRL7S0Sw&_nc_ss=7b2a8&oh=00_AQOhBSbfLYtyyS7NFX8PgMH29dWC70ggE6bfRARdW_I-rQ&oe=6ACD2A19",
  title: "Working",
  description: "Thực hành và làm việc với khách hàng thực tế.",
 },
 {
  image:
   "https://scontent.fhan5-2.fna.fbcdn.net/v/t39.30808-6/776222800_122115405723336836_8152463541362225919_n.jpg?stp=dst-jpg_tt6&cstp=mx1152x2048&ctp=s1152x2048&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeF6MH1xhP4YMw5D5mwyfF0924CTmxxBEWbbgJObHEERZh1xpT_IWhSwmV_RJW4nNNO5PIlxN2naNe1puKTN94vQ&_nc_ohc=Gzr4ZLlKyAsQ7kNvwFetWrM&_nc_oc=AdqJYyIv2pQa5AS0T4S8Iv4NQECt678Nabv-KBtcR6Fj4d1odIVvPwS82Fhm6fCHW5Q&_nc_zt=23&_nc_ht=scontent.fhan5-2.fna&_nc_gid=uzBRl3ZjbaVLTW62ACIShA&_nc_ss=7b2a8&oh=00_AQNJO8to_JEXjSjFPQOqyv-_NGIrpEO-dFV_NRMdhRmEwg&oe=6ACD07B2",
  title: "Behind The Scenes",
  description: "Những khoảnh khắc phía sau mỗi layout makeup.",
 },
 {
  image:
   "https://scontent.fhan5-1.fna.fbcdn.net/v/t39.30808-6/810351370_122119100889336836_3596301216664261683_n.jpg?stp=dst-jpg_tt6&cstp=mx1366x2048&ctp=s1366x2048&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEkQ_TnmZNXCjyIztWb3gsW__oMb_TujMD_-gxv9O6MwK4NhqnsCzmcdEArBoqBFQgReEJoPvzqYVU7hS7yrcAs&_nc_ohc=oXh_jiBxS8AQ7kNvwGVrNhB&_nc_oc=AdokaRwgGarZQvHJN0X5Lug8HmZjXfD6BcQOB7uucgWwLQ4CG95x8ycY_omPQkVsE-c&_nc_zt=23&_nc_ht=scontent.fhan5-1.fna&_nc_gid=g4JL2KSf_faUsK6s2klEIQ&_nc_ss=7b2a8&oh=00_AQNWjENbz1mU-agSxxJvG4oEzTOdqwJhAqhCLht1AcDYpA&oe=6ACD2CCB",
  title: "Học viên Makeup cá nhân",
  description: "Học viên xinh nèeeee.",
 },
 {
  image:
   "https://scontent.fhan5-9.fna.fbcdn.net/v/t39.30808-6/828712244_2158910808172342_4864914615953544154_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeERkoLwqYu8LljaIL5nIQx-_wVXN36hOwX_BVc3fqE7BVSkaq8t-It6pv56Y1WelYUKpoSERyTz-MwfxTeGbAp4&_nc_ohc=mUzIaLQ7RpwQ7kNvwFc3ew7&_nc_oc=AdqVT87OLZ-ZRmnLQE41M0p3dr64a2O8-OSFPU2DHJRhRBU3rSb_M7I4-trgyjeoFMk&_nc_zt=23&_nc_ht=scontent.fhan5-9.fna&_nc_gid=AkUaPcOYahYVeMQnvS7m6A&_nc_ss=7b2a8&oh=00_AQNnwmMa5yB_zx5JF5j4JP1ChGJerLC7qXHhsIx3qnAIcg&oe=6ACD0DEE",
  title: "Graduation",
  description: "Vẫn là khách xinh xỉu.",
 },
];
const socialLinks = [
 {
  name: "Instagram",
  href: "#",
  icon: FaInstagram,
 },
 {
  name: "TikTok",
  href: "https://www.tiktok.com/@tduong.makeup",
  icon: FaTiktok,
 },
 {
  name: "Threads",
  href: "#",
  icon: SiThreads,
 },
 {
  name: "Facebook",
  href: "https://www.facebook.com/cessy99",
  icon: FaFacebookF,
 },
];

const services = [
 {
  number: "01",
  title: "Makeup cá nhân",
  description: "Phong cách makeup được thiết kế theo đường nét khuôn mặt, outfit và cá tính riêng của bạn.",
 },
 {
  number: "02",
  title: "Makeup sự kiện",
  description: "Makeup chỉn chu cho tiệc cưới, sinh nhật, sự kiện, party và những buổi gặp gỡ đặc biệt.",
 },
 {
  number: "03",
  title: "Makeup photoshoot",
  description: "Makeup chuyên nghiệp cho beauty shoot, fashion shoot, profile cá nhân và content creator.",
 },
 {
  number: "04",
  title: "Makeup cô dâu",
  description: "Phong cách thanh lịch, trong trẻo nhưng vẫn nổi bật để bạn tự tin trong ngày quan trọng.",
 },
 {
  number: "05",
  title: "Dạy Makeup cá nhân",
  description: "Hướng dẫn makeup 1:1 theo đặc điểm gương mặt, phong cách và nhu cầu cá nhân. Giúp bạn nắm vững kỹ thuật và tự tin tự makeup đẹp mỗi ngày.",
 },
];

const gallery = [
 {
  image:
   "https://scontent.fhan5-11.fna.fbcdn.net/v/t39.30808-6/831543245_2158910738172349_9001215785693105996_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGCNPXDjmWxRM2nDUWexbm_-3xBmIqxFR37fEGYirEVHYfxZTr0Do0OeeMdITxg8b5Ni0v6moHiK8qU7gr9o58C&_nc_ohc=1rwxNNGQCpIQ7kNvwH6xRVR&_nc_oc=AdqOAhq9vDNsr-w_M5uNq29axIZcjTj_LQWJDtAYYNctenAwvdugIhqt0ePGyb-s6NA&_nc_zt=23&_nc_ht=scontent.fhan5-11.fna&_nc_gid=ozW2j-oVXO70j74BBNpvRQ&_nc_ss=7b2a8&oh=00_AQMW8UVIDGyu6uL5BHp36lFPw5ZHgogj21sD7vOvaj1ePw&oe=6ACCFE1B",
  title: "Soft Glam",
  category: "Beauty",
 },
 {
  image:
   "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/831475053_2158910881505668_6701768345319895634_n.jpg?stp=dst-jpg_tt6&cstp=mx1284x1284&ctp=s1284x1284&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEMfZQxN-joYVtUA9UrubJ41U0pdJWteqfVTSl0la16p5NttShGPwrI2aWXGQZIEYy8GPfdVXXv-nnoTGLlRCoS&_nc_ohc=Lt4jBl9OFN0Q7kNvwFNMFFl&_nc_oc=Adq-bn7okZQd7GAG_sjTV6VAccQSwQ6BdCWKLXC-jFyex5-e9odAs0CFN7gA05AIB1E&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=rhuVdvUeCGw3FF_LriTleA&_nc_ss=7b2a8&oh=00_AQPbHYyX8-bj8NiLPrLSzeQJcuuEj0Qsjw53R9wiySIDrg&oe=6ACD214A",
  title: "Clean Girl",
  category: "Personal",
 },
 {
  image:
   "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/830633022_2158910891505667_6506401870306170335_n.jpg?stp=dst-jpg_tt6&cstp=mx1284x1712&ctp=s1284x1712&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEzMz_3f-UZhM3luHdTyq0ov5fa09-DLO6_l9rT34Ms7ulvk9PoEyWz4OZIMdjcfZGViSheGJhnhSYdDNXBnvsP&_nc_ohc=VCntAVt_XMcQ7kNvwHLnAbp&_nc_oc=AdqolUnBtV7NoakhkwjjvIFv2JPqiwCMeuMDPx2qeur9LNrLyyqO49qNPqxqV665vKE&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=fEL8Yjt7Y6C89k13OTuA8A&_nc_ss=7b2a8&oh=00_AQPRvxJgndIxuqGKq_xPMt5nowA-yENLY-P53sczzCcy_A&oe=6ACD0C3E",
  title: "Elegant",
  category: "Event",
 },
 {
  image:
   "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/841012977_2163769404353149_3406571903366220366_n.jpg?stp=dst-jpg_tt6&cstp=mx1556x1556&ctp=s1556x1556&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEYV4g5YZ4S-IW28xp9gdsBAZkHJc3Vl-gBmQclzdWX6KQ_9ZV1LQnCJWfxDto-NnaE5V7GNafbqDszRQUCnWwg&_nc_ohc=En5HZJw4sHwQ7kNvwGE4yrc&_nc_oc=AdqdD3NyNvjEvM35Vb-dOeYzXSHXoYApnk8GnFySA9lwCBVlWvpWfLtQFO56K5nXhZY&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=8CYxgpnkWPIcKk9AyR8OEA&_nc_ss=7b2a8&oh=00_AQNO-DCNAIn6eODehXKzYf2P6JAusTo26GeAgHKk9EW_jA&oe=6ACD08EF",
  title: "Bridal Glow",
  category: "Bridal",
 },
 {
  image:
   "https://scontent.fhan5-9.fna.fbcdn.net/v/t39.30808-6/834437567_2163772697686153_5767530738434406332_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFCZQ-fmAdXjgSjX-d0m2aYN9zsrAh-HhU33OysCH4eFb1JgWvjwa-1pfkEkryWO7-9Wep_OO2aRKYhK_kM91Xk&_nc_ohc=W4si0un5vV4Q7kNvwFMQwIE&_nc_oc=AdqMOCeppulIaGfh6kd2UJHipW6jiIfIFhRSpTYHDThAulVyBVkug8ww9SHmIi0JO2I&_nc_zt=23&_nc_ht=scontent.fhan5-9.fna&_nc_gid=TprTKi1ltq1K0A5_WwWpuQ&_nc_ss=7b2a8&oh=00_AQNi8m7uwv_8icI8mXCrGa-x07J0hD6zUY4avELOwMpgXQ&oe=6ACD1DFB",
  title: "Khóa học Makeup cá nhân offline",
  category: "Photoshoot",
 },
 {
  image:
   "https://scontent.fhan5-9.fna.fbcdn.net/v/t39.30808-6/837039998_2163773781019378_6867758523935909055_n.jpg?stp=dst-jpg_tt6&cstp=mx1536x2048&ctp=s1536x2048&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFUu0MVPRj71oXw3Pj15DLtNEeBs0Bi8dg0R4GzQGLx2A6KZ3VSitcXzGKCR-cIUFkIjeqNgJn2VkE3e4M1mJk5&_nc_ohc=5iPYCRFnT1IQ7kNvwGg5nM7&_nc_oc=Adp1wHrpyNADDgUQuqdnzmQtUUik5hVx1qw6jsE99dYG2FBW4V_vsBCjwn6oni9UUKs&_nc_zt=23&_nc_ht=scontent.fhan5-9.fna&_nc_gid=XsTbMa5M1v-69tBozUk4fg&_nc_ss=7b2a8&oh=00_AQPdhbvW9xsSsxdV4YapomO_MWNrSssOKRkr2tx1L-cUJg&oe=6ACCF7B3",
  title: "Khóa học Makeup cá nhân online",
  category: "Beauty",
 },
];

const testimonials = [
 {
  quote: "Makeup rất đẹp nhưng vẫn giữ được nét riêng của mình. Mình thích nhất là cảm giác tự nhiên và không bị quá nặng mặt.",
  name: "Minh Anh",
  role: "Personal Makeup",
 },
 {
  quote: "Phong cách làm việc rất nhẹ nhàng, chuyên nghiệp. Makeup lên hình cực kỳ đẹp và ngoài đời cũng rất tự nhiên.",
  name: "Khánh Linh",
  role: "Photoshoot",
 },
 {
  quote: "Mình chỉ đưa một vài hình reference nhưng makeup artist đã biến nó thành phiên bản phù hợp với khuôn mặt của mình.",
  name: "Ngọc Mai",
  role: "Event Makeup",
 },
];

export default function MakeupArtistPage() {
 return (
  <main className="min-h-screen overflow-hidden bg-[#f8f5f2] text-[#292522]">
   {/* Header */}
   <header className="fixed left-0 top-0 z-50 w-full">
    <div className="mx-auto mt-4 flex max-w-[1400px] items-center justify-between rounded-full border border-black/5 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-xl md:px-7">
     <Link href="/portfolio/artists/makeup" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292522] text-xs font-bold tracking-widest text-white">MA</span>

      <div>
       <p className="text-sm font-semibold tracking-[0.12em]">DƯƠNG JI MAKEUP</p>
       <p className="text-[9px] uppercase tracking-[0.22em] text-black/40">Beauty · Makeup · Art</p>
      </div>
     </Link>

     <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.16em] md:flex">
      <a href="#about" className="transition hover:text-[#a87868]">
       Về chúng tôi
      </a>

      <a href="#services" className="transition hover:text-[#a87868]">
       Dịch vụ
      </a>

      <a href="#work" className="transition hover:text-[#a87868]">
       Khách hàng của tôi
      </a>

      <a href="#contact" className="transition hover:text-[#a87868]">
       Booking
      </a>
     </nav>

     <a
      href="https://zalo.me/0778888723"
      className="rounded-full bg-[#292522] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a87868]">
      Book me
     </a>
    </div>
   </header>

   {/* Hero */}
   <section className="relative min-h-screen pt-28">
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1400px] items-center gap-10 px-5 pb-12 md:grid-cols-2 md:px-8 lg:px-12">
     {/* Text */}
     <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 py-10 md:py-20">
      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#a87868]">Makeup Artist · Hanoi</p>

      <h1 className="max-w-[700px] text-[clamp(4rem,8vw,8.5rem)] font-light leading-[0.82] tracking-[-0.07em]">
       Your
       <br />
       <span className="font-serif italic">beauty,</span>
       <br />
       your story.
      </h1>

      <p className="mt-8 max-w-md text-sm leading-7 text-black/55 md:text-base">
       Makeup không phải để biến bạn thành một người khác. Đó là cách làm nổi bật phiên bản đẹp nhất và tự tin nhất của chính bạn.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-4">
       <a
        href="#contact"
        className="group flex items-center gap-4 rounded-full bg-[#292522] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#a87868]">
        Book an appointment
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
       </a>

       <a href="#work" className="flex items-center gap-2 px-3 py-4 text-[11px] font-semibold uppercase tracking-[0.15em]">
        View portfolio
       </a>
      </div>

      {/* Social */}
      <div className="mt-12 flex items-center gap-3">
       <span className="mr-2 text-[9px] uppercase tracking-[0.25em] text-black/35">Follow</span>

       {socialLinks.map((social) => {
        const Icon = social.icon;

        return (
         <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={social.name}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm transition hover:-translate-y-1 hover:border-[#a87868] hover:bg-[#a87868] hover:text-white">
          <Icon />
         </a>
        );
       })}
      </div>
     </motion.div>

     {/* Hero image */}
     <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -right-3 -top-3 h-28 w-28 rounded-full border border-[#a87868]/30 md:-right-8 md:-top-8 md:h-40 md:w-40" />

      <div className="relative aspect-[4/5] overflow-hidden rounded-[45%_45%_10%_10%] bg-[#ded4ce]">
       <div
        className="h-full w-full overflow-hidden rounded-t-[999px] bg-cover bg-center bg-no-repeat"
        style={{
         backgroundImage:
          "url('https://scontent.fhan5-9.fna.fbcdn.net/v/t39.30808-6/754553636_122111883045336836_5373211622102126768_n.jpg?stp=cp6_dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeE0CoamZO_nu1avTjl55Z_IFXxaAJdbpIEVfFoAl1ukgfWQarlxo2-e6huo_3UnVouZa7QJdWyMp97szC2D3xiu&_nc_ohc=jc2ncX_Mn_0Q7kNvwF2XZcJ&_nc_oc=AdpWta3FAxHVE4F8QncTy7szdEcn111gFrSAQ6L7q0OQ633s9c7iN_w4bH6d_ztTpuE&_nc_zt=23&_nc_ht=scontent.fhan5-9.fna&_nc_gid=6UNcOb_ZO8nlYHucP2T7Pw&_nc_ss=7b2a8&oh=00_AQNSPSCWc0UDE5eItrsoHzavk1DHnk8Cjfs_spMNIXXm8w&oe=6ACD1655')",
        }}
       />
      </div>

      <div className="absolute -bottom-5 -left-3 rounded-full border border-black/5 bg-white px-5 py-4 shadow-xl md:-left-8">
       <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Creating beauty</p>

       <p className="mt-1 font-serif text-lg italic">one face at a time.</p>
      </div>
     </motion.div>
    </div>

    <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
     <span className="text-[8px] uppercase tracking-[0.3em] text-black/35">Scroll</span>

     <FaArrowDown className="animate-bounce text-xs text-[#a87868]" />
    </div>
   </section>

   {/* About */}
   <section id="about" className="bg-[#292522] py-24 text-white md:py-32">
    <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-8 lg:px-12">
     <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7aaa0]">01 · About</p>

      <h2 className="mt-5 max-w-md text-5xl font-light leading-[0.95] tracking-[-0.05em] md:text-7xl">
       Beauty
       <br />
       <span className="font-serif italic">with intention.</span>
      </h2>
     </div>

     <div className="max-w-2xl">
      <p className="text-xl font-light leading-9 text-white/85 md:text-2xl">
       Mỗi khuôn mặt đều có một câu chuyện riêng. Công việc của tôi là lắng nghe câu chuyện đó và tạo nên một layout makeup phù hợp với bạn nhất.
      </p>

      <p className="mt-7 text-sm leading-7 text-white/50">
       Từ makeup trong trẻo hàng ngày đến những layout nổi bật cho sự kiện, beauty shoot và cô dâu — mọi look đều được xây dựng dựa trên đường nét khuôn mặt,
       làn da, outfit và cảm giác mà bạn muốn mang đến.
      </p>

      <div className="mt-10 grid grid-cols-3 border-t border-white/10 pt-7">
       <div>
        <p className="text-3xl font-light">1+</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Years</p>
       </div>

       <div>
        <p className="text-3xl font-light">100+</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Clients</p>
       </div>

       <div>
        <p className="text-3xl font-light">∞</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Looks</p>
       </div>
      </div>
     </div>
    </div>
   </section>
   {/* Education */}
   <section className="bg-[#eee7e2] py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="grid gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-center">
      {/* Left */}
      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">02 · Education</p>

       <h2 className="mt-5 max-w-md text-5xl font-light leading-[0.95] tracking-[-0.05em] md:text-7xl">
        Trained
        <br />
        <span className="font-serif italic">with purpose.</span>
       </h2>
      </div>

      {/* Right */}
      <div className="max-w-3xl">
       <div className="border-t border-black/10 pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
         <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a87868]">Professional Training</p>

          <h3 className="mt-3 text-3xl font-light tracking-[-0.03em] md:text-4xl">Hạnh Lâm Makeup Academy</h3>

          <p className="mt-4 max-w-xl text-sm leading-7 text-black/50">
           Tốt nghiệp chương trình đào tạo Makeup Artist tại Hạnh Lâm Makeup Academy, nơi tôi được đào tạo bài bản về kỹ thuật makeup, xử lý nền, định hình
           gương mặt và xây dựng layout phù hợp với từng khách hàng.
          </p>
         </div>

         <div className="shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#a87868]/30 bg-white text-[#a87868]">
           <span className="font-serif text-xl italic">HL</span>
          </div>
         </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 border-t border-black/10 pt-6 sm:grid-cols-3">
         <div>
          <p className="text-xs font-medium text-black/70">Makeup</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/35">Professional Skills</p>
         </div>

         <div>
          <p className="text-xs font-medium text-black/70">Beauty</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/35">Face & Skin</p>
         </div>

         <div>
          <p className="text-xs font-medium text-black/70">Styling</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/35">Personal Look</p>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
    <div className="container">
     {/* Main gallery */}
     <div className="mt-16 grid gap-5 md:grid-cols-12">
      {/* Large image */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-7">
       <div className="group relative aspect-[4/5] overflow-hidden bg-[#d9cec7]">
        <img src={journeyImages[0].image} alt={journeyImages[0].title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />

        <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 backdrop-blur">
         <p className="text-[9px] font-semibold uppercase tracking-[0.2em]">{journeyImages[0].title}</p>
        </div>
       </div>
      </motion.div>

      {/* Right images */}
      <div className="grid gap-5 md:col-span-5">
       {journeyImages.slice(1, 3).map((item, index) => (
        <motion.div
         key={item.image}
         initial={{ opacity: 0, y: 30 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ delay: index * 0.1 }}
         className="group relative aspect-[4/3] overflow-hidden bg-[#d9cec7]">
         <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />

         <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] backdrop-blur">{item.title}</span>
         </div>
        </motion.div>
       ))}
      </div>
     </div>
     {/* More images */}
     <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {journeyImages.slice(3).map((item, index) => (
       <motion.div
        key={item.image}
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 }}
        className="group">
        <div className="aspect-[4/5] overflow-hidden bg-[#d9cec7]">
         <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        </div>

        <div className="pt-4">
         <p className="text-sm font-medium">{item.title}</p>

         <p className="mt-1 text-xs leading-5 text-black/40">{item.description}</p>
        </div>
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* Services */}
   <section id="services" className="py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">03 · Dịch vụ</p>

       <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
        What I<span className="font-serif italic"> do.</span>
       </h2>
      </div>

      <p className="max-w-sm text-sm leading-7 text-black/45">Một trải nghiệm makeup được cá nhân hóa, từ tư vấn đến hoàn thiện look cuối cùng.</p>
     </div>

     <div className="border-t border-black/10">
      {services.map((service) => (
       <motion.div
        key={service.number}
        whileHover={{ x: 8 }}
        className="group grid gap-5 border-b border-black/10 py-8 md:grid-cols-[100px_0.8fr_1fr_40px] md:items-center">
        <span className="text-xs text-black/30">{service.number}</span>

        <h3 className="text-2xl font-light tracking-tight md:text-3xl">{service.title}</h3>

        <p className="max-w-lg text-sm leading-7 text-black/45">{service.description}</p>

        <FaArrowRight className="hidden text-[#a87868] transition-transform group-hover:translate-x-2 md:block" />
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* Portfolio */}
   <section id="work" className="bg-[#eee7e2] py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">04 · Phản hồi của khách hàng</p>

       <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
        Gần
        <span className="font-serif italic"> nhất.</span>
       </h2>
      </div>

      <p className="max-w-sm text-sm leading-7 text-black/45">Một vài phong cách makeup tiêu biểu từ những project gần đây.</p>
     </div>

     <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {gallery.map((item, index) => (
       <motion.a
        href={item.image}
        target="_blank"
        rel="noreferrer"
        key={item.image}
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        className="group relative overflow-hidden">
        <div className={`overflow-hidden bg-[#ddd2cb] ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[4/5]"}`}>
         <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        </div>

        <div className="flex items-center justify-between py-4">
         <div>
          <p className="text-sm font-medium">{item.title}</p>

          <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-black/40">{item.category}</p>
         </div>

         <FaArrowRight className="text-xs text-black/30 transition-transform group-hover:translate-x-1" />
        </div>
       </motion.a>
      ))}
     </div>
    </div>
   </section>

   {/* Video / Social */}
   <section className="bg-[#f8f5f2] py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="grid gap-12 md:grid-cols-[1fr_0.8fr] md:items-center">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#d9d0cb]">
       <img src="/images/makeup-artist/reels.jpg" alt="Makeup Artist Reels" className="h-full w-full object-cover" />

       <a
        href="#"
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm shadow-xl transition hover:scale-110">
        <FaPlay className="ml-1" />
       </a>

       <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
        Watch reels
       </div>
      </div>

      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">Hành trình</p>

       <h2 className="mt-5 text-5xl font-light leading-[0.95] tracking-[-0.05em] md:text-6xl">
        Beauty,
        <br />
        <span className="font-serif italic">behind the scenes.</span>
       </h2>

       <p className="mt-7 max-w-md text-sm leading-7 text-black/50">
        Theo dõi các video makeup, tips làm đẹp, before & after và những khoảnh khắc hậu trường trên các nền tảng social.
       </p>

       <div className="mt-8 flex flex-wrap gap-2">
        {socialLinks.map((social) => {
         const Icon = social.icon;

         return (
          <a
           key={social.name}
           href={social.href}
           target="_blank"
           rel="noreferrer"
           className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:border-[#a87868] hover:text-[#a87868]">
           <Icon />
           {social.name}
          </a>
         );
        })}
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Testimonials */}
   <section className="bg-[#292522] py-24 text-white md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-14">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7aaa0]">05 · Nhận xét</p>

      <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
       Từ
       <span className="font-serif italic"> khách hàng của tôi.</span>
      </h2>
     </div>

     <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-3">
      {testimonials.map((testimonial) => (
       <div key={testimonial.name} className="bg-[#292522] p-8 md:p-10">
        <FaQuoteLeft className="text-[#d7aaa0]" />

        <p className="mt-7 text-base font-light leading-8 text-white/75">“{testimonial.quote}”</p>

        <div className="mt-9 border-t border-white/10 pt-5">
         <p className="text-sm">{testimonial.name}</p>

         <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35">{testimonial.role}</p>
        </div>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Booking */}
   <section id="contact" className="relative overflow-hidden py-24 md:py-36">
    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#e7cfc7]/50 blur-3xl" />

    <div className="relative mx-auto max-w-[1000px] px-5 text-center md:px-8">
     <p className="text-[10px] uppercase tracking-[0.35em] text-[#a87868]">06 · Booking</p>

     <h2 className="mt-6 text-6xl font-light leading-[0.9] tracking-[-0.06em] md:text-8xl">
      Let's create
      <br />
      <span className="font-serif italic">your look.</span>
     </h2>

     <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-black/50">
      Bạn đang có một sự kiện, photoshoot hoặc đơn giản là muốn một ngày mình thật xinh? Hãy gửi thông tin để bắt đầu.
     </p>

     <a
      href="mailto:hello@example.com"
      className="group mx-auto mt-9 inline-flex items-center gap-5 rounded-full bg-[#292522] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a87868]">
      Book an appointment
      <FaArrowRight className="transition-transform group-hover:translate-x-1" />
     </a>

     <div className="mt-12 flex justify-center gap-3">
      {socialLinks.map((social) => {
       const Icon = social.icon;

       return (
        <a
         key={social.name}
         href={social.href}
         target="_blank"
         rel="noreferrer"
         aria-label={social.name}
         className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition hover:-translate-y-1 hover:bg-[#292522] hover:text-white">
         <Icon />
        </a>
       );
      })}
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="border-t border-black/10 px-5 py-8 md:px-8">
    <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 md:flex-row md:items-center">
     <div>
      <p className="text-sm font-semibold tracking-[0.12em]">DƯƠNG JI MAKEUP</p>

      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-black/35">Beauty · Makeup · Dạy học</p>
     </div>

     <p className="text-[9px] uppercase tracking-[0.2em] text-black/30">© {new Date().getFullYear()} All rights reserved.</p>
    </div>
   </footer>
  </main>
 );
}
