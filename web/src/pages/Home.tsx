import React from 'react';
import '../styles/Main.css';
import '../styles/Refined.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { ArrowUpRight, Activity, MapPin, Timer, Wifi } from 'lucide-react';

const capabilities = [
    { icon: Timer, title: 'Lap and sector timing', text: 'See the time behind each lap and where it changed.' },
    { icon: MapPin, title: 'RTK positioning', text: 'Follow the line you drove around the circuit.' },
    { icon: Activity, title: 'Motion data', text: 'Connect movement on the kart with moments on the track.' },
    { icon: Wifi, title: 'Session analysis', text: 'Bring the run back to the dashboard for a closer look.' },
];

const Home: React.FC = () => (
    <div className="mk-site">
        <Nav />
        <main>
            <header className="mk-hero" id="top">
                <div className="mk-shell mk-hero-inner">
                    <h1>Race data.<br /><span>Clearer laps.</span></h1>
                    <p className="mk-hero-lead">Mokart brings lap timing, trajectory and movement into one place. A unit on the steering wheel captures the run; the dashboard helps you understand it afterwards.</p>
                    <div className="mk-actions">
                        <a className="mk-button mk-button-primary" href="#system">Explore the system <ArrowUpRight size={17} /></a>
                        <a className="mk-button mk-button-secondary" href="https://app.novationlabs.fr">Open the dashboard <ArrowUpRight size={17} /></a>
                    </div>
                </div>
                <div className="mk-shell mk-hero-image-wrap">
                    <img src="/prototype/mokart_prototype.png" alt="Mokart prototype mounted on a kart steering wheel" className="mk-hero-image" />
                    <span className="mk-image-caption">Mokart prototype / mounted on a kart</span>
                </div>
            </header>

            <section className="mk-proof mk-shell" aria-label="System at a glance">
                <div><strong>RTK</strong><span>Positioning</span></div>
                <div><strong>IMU</strong><span>Motion sensing</span></div>
                <div><strong>50 Hz</strong><span>Target sampling rate</span></div>
                <p>Hardware and software developed together, from the wheel to the session view.</p>
            </section>

            <section id="system" className="mk-section mk-shell mk-system">
                <div className="mk-section-heading">
                    <span className="mk-label">01 / The system</span>
                    <div><h2>The details behind<br />the lap time.</h2><p>A time on a board is only the beginning. Mokart combines several signals so the session can be understood corner by corner.</p></div>
                </div>
                <div className="mk-capabilities">
                    {capabilities.map(({ icon: Icon, title, text }, index) => (
                        <article key={title}>
                            <span className="mk-cap-index">0{index + 1}</span>
                            <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="hardware" className="mk-hardware">
                <div className="mk-shell mk-hardware-grid">
                    <div className="mk-hardware-photo">
                        <img src="/prototype/mokart_prototype.jpg" alt="Working Mokart hardware prototype on a workbench" loading="lazy" />
                        <span className="mk-image-caption">Working prototype / workshop</span>
                    </div>
                    <div className="mk-hardware-copy">
                        <span className="mk-label">02 / Hardware</span>
                        <h2>Built for the<br />steering wheel.</h2>
                        <p>The prototype brings positioning, motion sensing and local processing into a compact unit mounted where the driver can see it.</p>
                        <dl>
                            <div><dt>Compute</dt><dd>Raspberry Pi Zero 2 W</dd></div>
                            <div><dt>Sensors</dt><dd>RTK GNSS + IMU</dd></div>
                            <div><dt>Interface</dt><dd>Wheel-mounted display</dd></div>
                        </dl>
                        <small>Prototype shown. Specifications may evolve during development.</small>
                    </div>
                </div>
            </section>

            <section id="dashboard" className="mk-section mk-shell mk-dashboard">
                <div className="mk-section-heading">
                    <span className="mk-label">03 / Dashboard</span>
                    <div><h2>See where<br />the time went.</h2><p>Lap and sector times are more useful when you can connect them to the path around the track.</p></div>
                </div>
                <div className="mk-dashboard-grid">
                    <div className="mk-analysis-demo" role="img" aria-label="Illustrative session analysis showing a track trace and sector times">
                        <div className="mk-demo-head"><span>MOKART / SESSION ANALYSIS</span><span>ILLUSTRATIVE DATA</span></div>
                        <div className="mk-demo-body">
                            <div><span className="mk-demo-label">LAP 14</span><strong>51.847 <small>s</small></strong><p>Example lap time</p></div>
                            <svg viewBox="0 0 330 220" fill="none" aria-hidden="true"><path d="M55 174 C15 130 24 56 93 44 C130 38 139 87 186 78 C241 67 235 18 285 41 C326 60 312 122 266 137 C224 151 206 124 176 155 C142 190 92 208 55 174Z" stroke="currentColor" strokeWidth="2"/><path d="M55 174 C15 130 24 56 93 44 C130 38 139 87 186 78" stroke="#a3e635" strokeWidth="4" strokeLinecap="round"/><circle cx="55" cy="174" r="5" fill="#a3e635"/></svg>
                        </div>
                        <div className="mk-demo-sectors"><span>S1 <b>17.204</b></span><span>S2 <b>16.892</b></span><span>S3 <b>17.751</b></span></div>
                    </div>
                    <div className="mk-dashboard-copy">
                        <h3>One session.<br />A better next run.</h3>
                        <p>Look back at timing and trajectory together. The example view shows how Mokart is designed to turn a run into something you can learn from.</p>
                        <a href="https://app.novationlabs.fr" className="mk-inline-link">Go to the dashboard <ArrowUpRight size={16} /></a>
                    </div>
                </div>
            </section>

            <section id="team" className="mk-team-strip">
                <div className="mk-shell mk-team-strip-inner">
                    <div><span className="mk-label">04 / The people</span><h2>Made in Marseille.<br />Tested on track.</h2></div>
                    <div><p>Mokart is an Epitech engineering project built by four people who care about what happens between two lap times.</p><a href="/about" className="mk-inline-link">Meet the team <ArrowUpRight size={16} /></a></div>
                </div>
            </section>
        </main>
        <Footer />
    </div>
);

export default Home;
