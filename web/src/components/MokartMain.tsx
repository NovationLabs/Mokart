import React from 'react';
import '../styles/MokartMain.css';
import { Check, X } from 'lucide-react';

// Icons (Inline SVG for custom ones, avoiding heavy font libraries)
const Icons = {
  Speed: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Chart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Chip: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
};

const Section: React.FC<{ title?: string; children: React.ReactNode; id?: string; className?: string }> = ({ title, children, id, className = "" }) => (
  <section id={id} className={`py-20 px-6 md:px-12 ${className}`}>
    <div className="max-w-7xl mx-auto">
      {title && (
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-white uppercase tracking-wider leading-[3.25rem] md:leading-tight">
          <span className="border-b-4 border-mokart-accent pb-2">{title}</span>
        </h2>
      )}
      {children}
    </div>
  </section>
);

const MokartMain: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-mokart-dark text-gray-200 font-display selection:bg-mokart-accent selection:text-black">

      {/* HERO SECTION */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/mokart_prototype.png)' }}
        />
        <div className="absolute inset-0 z-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-mokart-dark pointer-events-none z-0" />

        <div className="z-10 text-center max-w-5xl px-4 relative">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-white drop-shadow-lg">
            MOKART
          </h1>
          <p className="text-2xl md:text-4xl font-light text-gray-300 mb-8">
            Data at the heart of racing, <span className="text-gradient font-bold">for everyone</span>.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-10">
            <button
              onClick={() => scrollToSection('solution')}
              className="px-8 py-4 bg-mokart-accent text-black font-bold text-lg rounded hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,240,255,0.5)]"
            >
               Discover the Solution
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="px-8 py-4 border border-white/20 glass-panel text-white font-bold text-lg rounded hover:bg-white/10 transition-all"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </header>

      {/* THE PROBLEM */}
      <Section id="problem" className="bg-mokart-surface">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-4xl font-bold text-white mb-6">Driving Blind</h3>
            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              Today, rental karting offers a minimalist experience: 2 pedals, 1 steering wheel.
              On track, the driver is isolated. Impossible to read giant screens at 70 km/h to know your lap time.
            </p>
            <ul className="space-y-4">
              {['No real-time data', 'Hard to improve', 'Static customer experience'].map((item, i) => (
                <li key={i} className="flex items-center text-red-500 font-medium">
                  <X className="w-5 h-5 mr-3" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-panel p-8 rounded-2xl border-l-4 border-red-500">
            <h4 className="text-2xl font-bold text-white mb-4">Current Frustration</h4>
            <p className="italic text-gray-400">"What was my time on the last lap?"</p>
            <p className="italic text-gray-400 mt-2">"Where am I losing time?"</p>
            <div className="mt-6 text-sm text-gray-500 uppercase tracking-widest">The need is real.</div>
          </div>
        </div>
      </Section>

      {/* THE SOLUTION & FEATURES */}
      <Section id="solution" title="The Mokart Solution" className="relative">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Card 1: Hardware */}
          <div className="glass-panel p-8 rounded-xl">
            <div className="w-12 h-12 bg-mokart-accent/20 rounded-full flex items-center justify-center mb-6 text-mokart-accent">
              <Icons.Chip />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Smart Box</h3>
            <p className="text-gray-400">Compact, robust (IP65) and autonomous (8h). Attaches directly to the steering wheel to never leave the driver's sight.</p>
          </div>

          {/* Card 2: Live Feedback */}
          <div className="glass-panel p-8 rounded-xl">
            <div className="w-12 h-12 bg-mokart-success/20 rounded-full flex items-center justify-center mb-6 text-mokart-success">
              <Icons.Speed />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Live Telemetry</h3>
            <p className="text-gray-400">Instant onboard display: Lap Time, Speed, Position. The driver finally knows if they are improving their sector.</p>
          </div>

          {/* Card 3: Analysis */}
          <div className="glass-panel p-8 rounded-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 text-purple-400">
              <Icons.Chart />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Precision Analysis</h3>
            <p className="text-gray-400">After the race, scan a QR Code to access your trajectory with 10cm precision thanks to RTK technology.</p>
          </div>
        </div>
      </Section>

      {/* DEMO SECTION */}
      <Section id="demo" title="Live Demo" className="bg-mokart-dark">
        <div className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl border border-white/10 glass-panel p-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">3D Prototype Model</h3>
          <div className="overflow-hidden rounded-xl">
            <video
              className="w-full h-auto"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/mokart_protoype.mov" type="video/mp4" />
              <source src="/mokart_protoype.mov" type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </Section>

      {/* HARDWARE SPECS (TECH) */}
      <Section id="tech" className="bg-mokart-surface border-y border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="w-full md:w-1/2">
             <h2 className="text-4xl font-bold text-white mb-8">Under the Hood</h2>
             <div className="space-y-6">
               <div className="flex items-start">
                 <div className="w-2 h-2 mt-2 rounded-full bg-mokart-accent mr-4"></div>
                 <div>
                   <h4 className="text-xl font-bold text-white">Computing Core</h4>
                   <p className="text-gray-400">Raspberry Pi Zero 2W for embedded processing power.</p>
                 </div>
               </div>
               <div className="flex items-start">
                 <div className="w-2 h-2 mt-2 rounded-full bg-mokart-accent mr-4"></div>
                 <div>
                   <h4 className="text-xl font-bold text-white">Connectivity & Sensors</h4>
                   <p className="text-gray-400">ESP32 for real-time management and high-frequency accelerometers.</p>
                 </div>
               </div>
               <div className="flex items-start">
                 <div className="w-2 h-2 mt-2 rounded-full bg-mokart-accent mr-4"></div>
                 <div>
                   <h4 className="text-xl font-bold text-white">High-Precision Tracking</h4>
                   <p className="text-gray-400">Implementing RTK (Real-Time Kinematic) technology to achieve sub-decimeter positioning, enabling professional-grade trajectory mapping and analysis.</p>
                 </div>
               </div>
             </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="/mokart_prototype.jpg"
              alt="Mokart Prototype"
              className="rounded-xl shadow-2xl border border-white/10 hover: transition-transform duration-500 max-h-[400px] object-cover"
            />
          </div>
        </div>
      </Section>

      {/* COMPETITION TABLE */}
      <Section id="competition" title="The Competition" className="bg-mokart-dark">
         <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 overflow-x-auto">
               <table className="w-full text-left border-collapse text-[10px] md:text-base">
                 <thead>
                   <tr>
                     <th className="p-1 md:p-4 border-b border-gray-700 text-gray-400 font-medium text-[10px] md:text-sm">Features</th>
                     <th className="p-1 md:p-4 border-b border-gray-700 text-white font-bold text-center">Apex Timing</th>
                     <th className="p-1 md:p-4 border-b border-gray-700 text-white font-bold text-center">Sodikart</th>
                     <th className="p-1 md:p-4 border-b border-gray-700 text-white font-bold text-center">De-haardt</th>
                     <th className="p-1 md:p-4 border-b border-gray-700 text-white font-bold text-center">RaceFacer</th>
                     <th className="p-1 md:p-4 border-b border-mokart-accent text-mokart-accent font-black text-center text-xs md:text-lg bg-mokart-accent/5">MoKart</th>
                   </tr>
                 </thead>
                 <tbody>
                   {[
                     { feature: "Official Race Timing", apex: true, sodi: true, dehaardt: true, racefacer: true, mokart: true },
                     { feature: "Precise Race Location", apex: false, sodi: false, dehaardt: true, racefacer: false, mokart: true },
                     { feature: "Steering Wheel Screen", apex: false, sodi: true, dehaardt: false, racefacer: true, mokart: true },
                     { feature: "Real-time Advice", apex: false, sodi: false, dehaardt: false, racefacer: false, mokart: true },
                     { feature: "Web/Mobile Analysis", apex: false, sodi: false, dehaardt: false, racefacer: false, mokart: true },
                   ].map((row, index) => (
                     <tr key={index} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                       <td className="p-1 md:p-4 text-gray-300 font-medium">{row.feature}</td>
                       {[row.apex, row.sodi, row.dehaardt, row.racefacer].map((val, i) => (
                         <td key={i} className="p-1 md:p-4 text-center">
                           {val ? <Check className="inline w-3 h-3 md:w-5 md:h-5 text-green-500" /> : <X className="inline w-3 h-3 md:w-5 md:h-5 text-red-500 opacity-50" />}
                         </td>
                       ))}
                       <td className="p-1 md:p-4 text-center bg-mokart-accent/5 border-l border-r border-mokart-accent/20">
                         {row.mokart ? <Check className="inline w-4 h-4 md:w-6 md:h-6 text-mokart-accent drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" /> : <X className="inline w-3 h-3 md:w-5 md:h-5 text-red-500" />}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            <div className="lg:col-span-1 glass-panel p-8 rounded-xl border-l-4 border-mokart-success">
               <h4 className="text-2xl font-bold text-white mb-4">Market Leader</h4>
               <p className="text-gray-300 leading-relaxed">
                 "Compared to other competitors in the rental karting sector, our concept is the only one to fully satisfy an enriched amateur pilot experience."
               </p>
               <div className="mt-6 flex items-center gap-2 text-mokart-success font-bold uppercase tracking-wider text-sm">
                  <Check className="w-5 h-5" /> All-in-one Solution
               </div>
            </div>
         </div>
      </Section>

      {/* BUSINESS CASE */}
      <Section id="business">
        <div className="bg-gradient-to-r from-gray-900 to-black p-10 md:p-16 rounded-3xl border border-white/10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Value for Circuits</h2>
          <div className="grid md:grid-cols-3 gap-8 mx-auto">
             <div className="md:p-6">
                <div className="text-2xl font-bold text-mokart-success mb-4 uppercase tracking-widest">Enriched Experience</div>
                <p className="text-gray-400">Significant improvement of user experience with precise data.</p>
             </div>
             <div className="md:p-6 lg:border-x border-white/10">
                <div className="text-2xl font-bold text-mokart-accent mb-4 uppercase tracking-widest">Increased Loyalty</div>
                <p className="text-gray-400">Attract pilots passionate about performance analysis without investing in a personal kart.</p>
             </div>
             <div className="md:p-6">
                <div className="text-2xl font-bold text-purple-400 mb-4 uppercase tracking-widest">Differentiation</div>
                <p className="text-gray-400">Notable added value to stand out from competing clubs and attract demanding clientele.</p>
             </div>
          </div>
        </div>
      </Section>

      {/* TEAM */}
      <Section title="The Team" className="bg-mokart-surface pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Léo GREGORI", img: "/leo.png", link: "https://www.linkedin.com/in/leogregori/" },
            { name: "Clément DORGE", img: "/clement.png", link: "https://www.linkedin.com/in/clement-dorge/" },
            { name: "Anthony COLOMBANI-GAILLEUR", img: "/anthony.png", link: "https://www.linkedin.com/in/anthony-colombani-gailleur-8317032b6/" },
            { name: "Selim BOUASKER", img: "/selim.png", link: "https://www.linkedin.com/in/selim-bouasker/" },
          ].map((person, index) => (
            <a
              key={index}
              href={person.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 rounded-xl hover:bg-white/10 transition duration-300 transform hover: cursor-pointer group text-center"
            >
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-2 border-transparent group-hover:border-mokart-accent transition-all">
                <img src={person.img} alt={person.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-white text-lg group-hover:text-mokart-accent transition-colors">{person.name}</h4>
              <div className="mt-2 text-gray-500 text-sm flex justify-center items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span> LinkedIn
              </div>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default MokartMain;
