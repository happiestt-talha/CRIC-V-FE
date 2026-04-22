'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import {
    Target,
    Activity,
    CircleDot,
    LayoutGrid,
    Scale,
    Lightbulb,
    Video,
    Bot,
    TrendingUp,
    Bone
} from 'lucide-react'

// ── Typewriter Hook ──────────────────────────────────────────────
function useTypewriter(words, speed = 80, pause = 2000) {
    const [text, setText] = useState('')
    const [wordIndex, setWordIndex] = useState(0)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const current = words[wordIndex % words.length]
        const timeout = setTimeout(() => {
            if (!deleting) {
                setText(current.slice(0, text.length + 1))
                if (text.length + 1 === current.length) {
                    setTimeout(() => setDeleting(true), pause)
                }
            } else {
                setText(current.slice(0, text.length - 1))
                if (text.length - 1 === 0) {
                    setDeleting(false)
                    setWordIndex((i) => i + 1)
                }
            }
        }, deleting ? speed / 2 : speed)
        return () => clearTimeout(timeout)
    }, [text, deleting, wordIndex, words, speed, pause])

    return text
}

// ── Animated Counter ─────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })

    useEffect(() => {
        if (!inView) return
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= target) {
                setCount(target)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)
        return () => clearInterval(timer)
    }, [inView, target, duration])

    return (
        <span ref={ref}>
            {count.toLocaleString()}{suffix}
        </span>
    )
}

// ── Particle Canvas ───────────────────────────────────────────────
function ParticleField() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId
        let W = canvas.width = window.innerWidth
        let H = canvas.height = window.innerHeight

        const resize = () => {
            W = canvas.width = window.innerWidth
            H = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', resize)

        // Particles
        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.5 + 0.1,
        }))

        const draw = () => {
            ctx.clearRect(0, 0, W, H)
            particles.forEach((p) => {
                p.x += p.dx
                p.y += p.dy
                if (p.x < 0 || p.x > W) p.dx *= -1
                if (p.y < 0 || p.y > H) p.dy *= -1

                // Draw cricket ball shape (circle with seam)
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(220, 38, 38, ${p.opacity})`
                ctx.fill()
            })

            // Draw connecting lines
            particles.forEach((a, i) => {
                particles.slice(i + 1).forEach((b) => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y)
                    if (dist < 120) {
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = `rgba(22, 163, 74, ${0.15 * (1 - dist / 120)})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                })
            })

            animId = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    )
}

// ── Tilt Card ─────────────────────────────────────────────────────
function TiltCard({ children, className = '' }) {
    const ref = useRef(null)

    const handleMouseMove = (e) => {
        const card = ref.current
        if (!card) return
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cx = rect.width / 2
        const cy = rect.height / 2
        const rotateX = ((y - cy) / cy) * -8
        const rotateY = ((x - cx) / cx) * 8
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    }

    const handleMouseLeave = () => {
        if (ref.current) {
            ref.current.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
        }
    }

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{ transition: 'transform 0.15s ease', transformStyle: 'preserve-3d' }}
        >
            {children}
        </div>
    )
}

// ── Section Wrapper ───────────────────────────────────────────────
function FadeInSection({ children, className = '', delay = 0 }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ── DATA ──────────────────────────────────────────────────────────
const FEATURES = [
    {
        icon: <Target className="w-8 h-8 text-green-400" />,
        title: 'Pose Estimation',
        description:
            'MediaPipe-powered skeletal tracking extracts 33 body keypoints per frame for biomechanical precision.',
        color: 'from-green-500/20 to-emerald-500/10',
        border: 'hover:border-green-500/50',
        glow: 'hover:shadow-green-500/20',
    },
    {
        icon: <Activity className="w-8 h-8 text-blue-400" />,
        title: 'Shot Classification',
        description:
            'LSTM temporal classifier identifies cover drives, pull shots, cuts and defensive plays with quality scores.',
        color: 'from-blue-500/20 to-cyan-500/10',
        border: 'hover:border-blue-500/50',
        glow: 'hover:shadow-blue-500/20',
    },
    {
        icon: <CircleDot className="w-8 h-8 text-red-400" />,
        title: 'Ball Tracking',
        description:
            'YOLOv8-powered detector tracks the cricket ball frame by frame, calculating speed and trajectory.',
        color: 'from-red-500/20 to-rose-500/10',
        border: 'hover:border-red-500/50',
        glow: 'hover:shadow-red-500/20',
    },
    {
        icon: <LayoutGrid className="w-8 h-8 text-amber-400" />,
        title: 'Pitch Heatmaps',
        description:
            'Visual delivery maps show line and length patterns helping bowlers identify consistency gaps.',
        color: 'from-amber-500/20 to-yellow-500/10',
        border: 'hover:border-amber-500/50',
        glow: 'hover:shadow-amber-500/20',
    },
    {
        icon: <Scale className="w-8 h-8 text-purple-400" />,
        title: 'ICC Compliance',
        description:
            'Automatic elbow angle analysis flags illegal bowling actions before they become habits.',
        color: 'from-purple-500/20 to-violet-500/10',
        border: 'hover:border-purple-500/50',
        glow: 'hover:shadow-purple-500/20',
    },
    {
        icon: <Lightbulb className="w-8 h-8 text-teal-400" />,
        title: 'AI Coaching Tips',
        description:
            'Rule-based recommendation engine delivers drill suggestions tailored to each player\'s weaknesses.',
        color: 'from-teal-500/20 to-cyan-500/10',
        border: 'hover:border-teal-500/50',
        glow: 'hover:shadow-teal-500/20',
    },
]

const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Record & Upload',
        desc: 'Coach records a training session with any standard HD camera and uploads the footage to CRIC-V.',
        icon: <Video className="w-10 h-10" />,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/30',
    },
    {
        step: '02',
        title: 'AI Analysis Pipeline',
        desc: 'MediaPipe extracts pose keypoints, YOLOv8 tracks the ball, and our LSTM classifies every shot and delivery.',
        icon: <Bot className="w-10 h-10" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
        step: '03',
        title: 'Get Insights',
        desc: 'Coaches receive annotated video, heatmaps, quality scores, and drill recommendations instantly.',
        icon: <TrendingUp className="w-10 h-10" />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
    },
]

const STATS = [
    { value: 33, suffix: '', label: 'Body Keypoints Tracked', icon: <Bone className="w-8 h-8 text-green-400" /> },
    { value: 95, suffix: '%', label: 'Ball Detection Accuracy', icon: <Target className="w-8 h-8 text-blue-400" /> },
    { value: 6, suffix: '', label: 'Shot Types Classified', icon: <Activity className="w-8 h-8 text-amber-400" /> },
    { value: 15, suffix: '°', label: 'ICC Elbow Limit Enforced', icon: <Scale className="w-8 h-8 text-purple-400" /> },
]

const TECH = [
    { name: 'MediaPipe', color: '#4285F4' },
    { name: 'YOLOv8', color: '#FF6B35' },
    { name: 'PyTorch', color: '#EE4C2C' },
    { name: 'FastAPI', color: '#009688' },
    { name: 'Next.js', color: '#ffffff' },
    { name: 'OpenCV', color: '#5C3EE8' },
    { name: 'PostgreSQL', color: '#336791' },
    { name: 'Tailwind', color: '#38BDF8' },
    { name: 'SQLAlchemy', color: '#D71F00' },
    { name: 'Recharts', color: '#22C55E' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────────
export default function HomePage() {
    const typeText = useTypewriter(
        ['Batting Technique', 'Bowling Action', 'Shot Classification', 'Ball Speed', 'ICC Compliance'],
        70,
        1800
    )

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    return (
        <div className="min-h-screen bg-[#050a0e] text-white overflow-x-hidden">

            {/* Custom cursor glow */}
            <div
                className="fixed w-64 h-64 rounded-full pointer-events-none z-0 transition-transform duration-75"
                style={{
                    background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)',
                    transform: `translate(${mousePos.x - 128}px, ${mousePos.y - 128}px)`,
                }}
            />

            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#050a0e]/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CRIC-V</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                    <a href="#stats" className="hover:text-white transition-colors">Stats</a>
                    <a href="#tech" className="hover:text-white transition-colors">Technology</a>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <button className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
                            Sign In
                        </button>
                    </Link>
                    <Link href="/register">
                        <button className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                            Get Started
                        </button>
                    </Link>
                </div>
            </nav>

            {/* ── SECTION 1: HERO ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                <ParticleField />

                {/* Background grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Radial glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[700px] h-[700px] rounded-full bg-green-600/5 blur-[120px]" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    {/* Badge */}
                    {/* <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        AI-Powered Cricket Coaching — Built for Pakistan
                    </motion.div> */}

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6"
                        style={{ fontFamily: '"Syne", sans-serif' }}
                    >
                        <span className="text-white">Analyze</span>
                        <br />
                        <span
                            className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent"
                        >
                            {typeText}
                            <span className="animate-pulse text-green-400">|</span>
                        </span>
                        <br />
                        <span className="text-slate-400">with AI Precision</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        CRIC-V brings professional-grade cricket analysis to grassroots academies.
                        Upload a video. Get instant pose analysis, shot classification, ball tracking, and coaching feedback.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                    >
                        <Link href="/register">
                            <button className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-base transition-all duration-200 shadow-lg shadow-green-600/30 hover:shadow-green-500/40 hover:scale-105">
                                <span className="relative z-10">Start Analyzing Free</span>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </Link>
                        <Link href="/login">
                            <button className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-xl text-base transition-all duration-200 hover:bg-white/5 backdrop-blur-sm">
                                Sign In to Dashboard →
                            </button>
                        </Link>
                    </motion.div>

                    {/* Floating stat badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="flex flex-wrap gap-3 justify-center"
                    >
                        {[
                            { label: 'Ball Detection', value: '95%+', color: 'border-red-500/30 text-red-400' },
                            { label: 'Shot Types', value: '6 Classes', color: 'border-blue-500/30 text-blue-400' },
                            { label: 'Pose Points', value: '33 Joints', color: 'border-green-500/30 text-green-400' },
                            { label: 'ICC Compliant', value: 'Auto-Check', color: 'border-amber-500/30 text-amber-400' },
                        ].map((b) => (
                            <div
                                key={b.label}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-white/5 backdrop-blur-sm text-sm ${b.color}`}
                            >
                                <span className="font-bold">{b.value}</span>
                                <span className="text-slate-500">{b.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-slate-600 text-xs tracking-widest uppercase">Scroll</span>
                    <div className="w-px h-12 bg-gradient-to-b from-slate-600 to-transparent animate-pulse" />
                </motion.div>
            </section>

            {/* ── SECTION 2: FEATURES ── */}
            <section id="features" className="py-28 px-6 md:px-12 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/10 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto">
                    <FadeInSection className="text-center mb-16">
                        <p className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-3">
                            What CRIC-V Does
                        </p>
                        <h2
                            className="text-4xl md:text-5xl font-black text-white mb-4"
                            style={{ fontFamily: '"Syne", sans-serif' }}
                        >
                            Every Tool a Coach Needs
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Six powerful AI modules working together to give unprecedented insight into player performance.
                        </p>
                    </FadeInSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <FadeInSection key={f.title} delay={i * 0.08}>
                                <TiltCard
                                    className={`
                    h-full p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${f.color}
                    ${f.border} ${f.glow}
                    cursor-default transition-all duration-300
                    hover:shadow-xl
                    backdrop-blur-sm
                  `}
                                >
                                    <div className="text-4xl mb-4">{f.icon}</div>
                                    <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                                </TiltCard>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: HOW IT WORKS ── */}
            <section id="how-it-works" className="py-28 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    <FadeInSection className="text-center mb-16">
                        <p className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-3">
                            Simple Process
                        </p>
                        <h2
                            className="text-4xl md:text-5xl font-black text-white mb-4"
                            style={{ fontFamily: '"Syne", sans-serif' }}
                        >
                            From Footage to Feedback
                            <br />
                            <span className="text-slate-500">in Minutes</span>
                        </h2>
                    </FadeInSection>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {HOW_IT_WORKS.map((item, i) => (
                                <FadeInSection key={item.step} delay={i * 0.15}>
                                    <div className="relative flex flex-col items-center text-center">
                                        {/* Step number bubble */}
                                        <div className={`
                      relative z-10 w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl mb-6
                      ${item.bg}
                    `}>
                                            {item.icon}
                                            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#050a0e] border border-current flex items-center justify-center text-xs font-black ${item.color}`}>
                                                {i + 1}
                                            </div>
                                        </div>
                                        <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </FadeInSection>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: STATS ── */}
            <section id="stats" className="py-28 px-6 md:px-12 relative overflow-hidden">
                {/* BG glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[800px] h-[400px] bg-green-500/5 blur-[100px] rounded-full" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <FadeInSection className="text-center mb-16">
                        <p className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-3">
                            By the Numbers
                        </p>
                        <h2
                            className="text-4xl md:text-5xl font-black text-white"
                            style={{ fontFamily: '"Syne", sans-serif' }}
                        >
                            Built on Precision
                        </h2>
                    </FadeInSection>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
                        {STATS.map((s, i) => (
                            <FadeInSection key={s.label} delay={i * 0.1}>
                                <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-green-500/20 transition-all duration-300 group">
                                    <div className="text-4xl mb-3">{s.icon}</div>
                                    <div className="text-4xl md:text-5xl font-black text-green-400 mb-2 tabular-nums">
                                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                                    </div>
                                    <p className="text-slate-400 text-sm">{s.label}</p>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: TECH STACK ── */}
            <section id="tech" className="py-20 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <FadeInSection className="text-center mb-12">
                        <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
                            Powered By
                        </p>
                    </FadeInSection>

                    {/* Marquee wrapper */}
                    <div className="relative">
                        {/* Fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050a0e] to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050a0e] to-transparent z-10 pointer-events-none" />

                        {/* Marquee track */}
                        <div className="overflow-hidden">
                            <div
                                className="flex gap-6 w-max"
                                style={{
                                    animation: 'marquee 25s linear infinite',
                                }}
                            >
                                {[...TECH, ...TECH].map((t, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-colors shrink-0 cursor-default"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: t.color }}
                                        />
                                        <span className="text-slate-300 text-sm font-medium whitespace-nowrap">
                                            {t.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
            </section>

            {/* ── SECTION 6: CTA ── */}
            <section className="py-28 px-6 md:px-12">
                <FadeInSection>
                    <div className="max-w-4xl mx-auto relative">
                        {/* Card */}
                        <div className="relative rounded-3xl overflow-hidden border border-green-500/20 p-12 md:p-20 text-center">
                            {/* Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-950/60 via-[#050a0e] to-emerald-950/40" />
                            <div className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                    backgroundSize: '32px 32px',
                                }}
                            />
                            {/* Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

                            <div className="relative z-10">
                                <div className="mb-6 flex justify-center">
                                    <Activity className="w-16 h-16 text-green-500" />
                                </div>
                                <h2
                                    className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                                    style={{ fontFamily: '"Syne", sans-serif' }}
                                >
                                    Ready to Level Up
                                    <br />
                                    <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                                        Your Players?
                                    </span>
                                </h2>
                                <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                                    Join CRIC-V and give your grassroots academy the same analytical power used by professional teams.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/register">
                                        <button className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-base transition-all duration-200 hover:scale-105 shadow-xl shadow-green-600/30">
                                            Create Free Account
                                        </button>
                                    </Link>
                                    <Link href="/login">
                                        <button className="px-10 py-4 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold rounded-xl text-base transition-all duration-200 hover:bg-white/5">
                                            Sign In
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-10 px-6 md:px-12 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white">CRIC-V</span>
                        <span className="text-slate-600 text-sm">— Cricket Vision</span>
                    </div>
                    <p className="text-slate-600 text-sm">
                        Final Year Project · Lahore Garrison University · BSIT 2026
                    </p>
                    <div className="flex gap-6 text-slate-500 text-sm">
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                        <Link href="/register" className="hover:text-white transition-colors">Register</Link>
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}