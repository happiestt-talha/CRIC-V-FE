'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Stars, Text3D, Environment } from '@react-three/drei'
import * as THREE from 'three'
import Link from 'next/link'

// 3D Cricket Ball
function CricketBall({ scrollY }) {
    const mesh = useRef()
    const seam1 = useRef()
    const seam2 = useRef()

    useFrame((state) => {
        if (!mesh.current) return
        const t = state.clock.getElapsedTime()
        mesh.current.rotation.y = t * 0.3
        mesh.current.rotation.x = t * 0.15
        mesh.current.position.y = Math.sin(t * 0.5) * 0.08

        // Fly toward camera on scroll
        const s = Math.min(scrollY / 600, 1)
        mesh.current.scale.setScalar(1 + s * 8)
        mesh.current.position.z = s * 5
        mesh.current.material.opacity = 1 - s * 1.2
    })

    return (
        <group>
            {/* Main ball */}
            <mesh ref={mesh}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    color="#8b1a1a"
                    roughness={0.35}
                    metalness={0.1}
                    transparent
                    opacity={1}
                />
            </mesh>

            {/* Seam ring 1 */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[1.005, 0.018, 8, 80]} />
                <meshStandardMaterial color="#f5c5a3" roughness={0.8} />
            </mesh>

            {/* Seam ring 2 */}
            <mesh rotation={[Math.PI / 4, 0, Math.PI / 2]}>
                <torusGeometry args={[1.005, 0.012, 8, 80]} />
                <meshStandardMaterial color="#f5c5a3" roughness={0.8} />
            </mesh>

            {/* Glow */}
            <mesh>
                <sphereGeometry args={[1.15, 32, 32]} />
                <meshStandardMaterial
                    color="#a8e063"
                    transparent
                    opacity={0.04}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    )
}

// Data particles floating around ball
function DataParticles() {
    const points = useRef()
    const count = 300

    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const r = 1.6 + Math.random() * 2.5
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
    }

    useFrame((state) => {
        if (!points.current) return
        points.current.rotation.y = state.clock.getElapsedTime() * 0.05
    })

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.015} color="#a8e063" transparent opacity={0.5} sizeAttenuation />
        </points>
    )
}

// Typewriter
function useTypewriter(words, speed = 75, pause = 2200) {
    const [text, setText] = useState('')
    const [wi, setWi] = useState(0)
    const [del, setDel] = useState(false)

    useEffect(() => {
        const cur = words[wi % words.length]
        const t = setTimeout(() => {
            if (!del) {
                setText(cur.slice(0, text.length + 1))
                if (text.length + 1 === cur.length) setTimeout(() => setDel(true), pause)
            } else {
                setText(cur.slice(0, text.length - 1))
                if (text.length - 1 === 0) { setDel(false); setWi(i => i + 1) }
            }
        }, del ? speed / 2 : speed)
        return () => clearTimeout(t)
    }, [text, del, wi, words, speed, pause])

    return text
}

export default function HeroSection() {
    const [scrollY, setScrollY] = useState(0)
    const sectionRef = useRef(null)

    useEffect(() => {
        const s = () => setScrollY(window.scrollY)
        window.addEventListener('scroll', s)
        return () => window.removeEventListener('scroll', s)
    }, [])

    const typed = useTypewriter(['Batting Technique', 'Bowling Action', 'Ball Trajectory', 'ICC Compliance', 'Shot Quality'])

    return (
        <section ref={sectionRef} style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
        }}>
            {/* Stadium photo background */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1800&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
                transform: `translateY(${scrollY * 0.4}px)`, // parallax
                filter: 'brightness(0.18) saturate(0.5)',
            }} />

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(6,12,16,0.3) 0%, rgba(6,12,16,0) 40%, rgba(6,12,16,0.8) 80%, #060c10 100%)',
            }} />

            {/* Green tint overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 60% 50% at 65% 50%, rgba(26,74,46,0.25) 0%, transparent 70%)',
            }} />

            {/* Three.js Canvas */}
            <div style={{
                position: 'absolute',
                right: '5%', top: '50%',
                transform: `translateY(calc(-50% + ${scrollY * 0.2}px))`,
                width: 'min(50vw, 600px)',
                height: 'min(50vw, 600px)',
                opacity: Math.max(0, 1 - scrollY / 400),
            }}>
                <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
                    <directionalLight position={[-3, -2, -2]} intensity={0.4} color="#a8e063" />
                    <pointLight position={[0, 0, 3]} intensity={0.6} color="#c9a84c" />
                    <CricketBall scrollY={scrollY} />
                    <DataParticles />
                    <Stars radius={20} depth={10} count={800} factor={0.4} saturation={0} fade />
                </Canvas>
            </div>

            {/* Hero Text */}
            <div style={{
                position: 'relative', zIndex: 10,
                padding: '0 max(2rem, 8vw)',
                maxWidth: '760px',
                transform: `translateY(${scrollY * 0.15}px)`,
                opacity: Math.max(0, 1 - scrollY / 500),
            }}>
                <div className="eyebrow fade-up" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="hr-accent" />
                    AI-Powered Cricket Intelligence
                </div>

                <h1 className="display-xl fade-up" style={{ fontSize: 'clamp(52px, 7vw, 96px)', color: '#f5f0e8', marginBottom: '16px' }}>
                    See Cricket
                </h1>
                <h1 className="display-xl fade-up" style={{ fontSize: 'clamp(52px, 7vw, 96px)', color: '#a8e063', marginBottom: '16px', minHeight: '1.1em' }}>
                    {typed}<span style={{ borderRight: '3px solid #a8e063', animation: 'blink 1s step-end infinite', marginLeft: '4px' }} />
                </h1>
                <h1 className="display-xl fade-up" style={{ fontSize: 'clamp(52px, 7vw, 96px)', color: 'rgba(245,240,232,0.35)', marginBottom: '40px' }}>
                    Like Never Before.
                </h1>

                <p className="body-text fade-up" style={{ fontSize: '17px', maxWidth: '480px', marginBottom: '48px' }}>
                    CRIC-V brings professional-grade biomechanical analysis to grassroots cricket academies. Upload footage. Get instant AI coaching.
                </p>

                <div className="fade-up" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link href="/register" style={{
                        display: 'inline-block',
                        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '13px',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: '#060c10', background: '#a8e063',
                        padding: '16px 40px',
                        textDecoration: 'none',
                        border: '1px solid #a8e063',
                        transition: 'all 0.3s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a8e063' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#a8e063'; e.currentTarget.style.color = '#060c10' }}
                    >Start Analyzing →</Link>

                    <Link href="/login" style={{
                        display: 'inline-block',
                        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '13px',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'rgba(245,240,232,0.6)',
                        padding: '16px 40px',
                        textDecoration: 'none',
                        border: '1px solid rgba(245,240,232,0.15)',
                        transition: 'all 0.3s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.4)'; e.currentTarget.style.color = '#f5f0e8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.15)'; e.currentTarget.style.color = 'rgba(245,240,232,0.6)' }}
                    >Sign In</Link>
                </div>

                {/* Floating stat pills */}
                <div className="fade-up" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '64px' }}>
                    {[
                        { n: '95%', l: 'Ball Accuracy' },
                        { n: '33', l: 'Pose Joints' },
                        { n: '6', l: 'Shot Classes' },
                        { n: '15°', l: 'ICC Limit' },
                    ].map(s => (
                        <div key={s.l} style={{
                            padding: '8px 18px',
                            border: '1px solid rgba(168,224,99,0.2)',
                            background: 'rgba(168,224,99,0.05)',
                            backdropFilter: 'blur(8px)',
                        }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: '#a8e063' }}>{s.n} </span>
                            <span style={{ fontSize: '12px', color: 'rgba(245,240,232,0.45)', fontFamily: 'DM Sans, sans-serif' }}>{s.l}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div style={{
                position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                opacity: Math.max(0, 1 - scrollY / 200),
            }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(245,240,232,0.3)' }}>SCROLL</span>
                <div style={{
                    width: '1px', height: '60px',
                    background: 'linear-gradient(to bottom, rgba(168,224,99,0.6), transparent)',
                    animation: 'scrollPulse 2s ease-in-out infinite',
                }} />
            </div>

            <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scrollPulse { 0%, 100% { opacity: 0.3; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(1.1); } }
      `}</style>
        </section>
    )
}