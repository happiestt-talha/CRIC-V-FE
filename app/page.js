'use client'

import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/landing/HeroSection'), { ssr: false })
import NavBar from '@/components/landing/NavBar'
import SkeletonSection from '@/components/landing/SkeletonSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import StatsSection from '@/components/landing/StatsSection'
import PitchHeatmapSection from '@/components/landing/PitchHeatmapSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import SmoothScroll from '@/components/landing/SmoothScroll'

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="cricv-root">
        <NavBar />
        <HeroSection />
        <SkeletonSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <PitchHeatmapSection />
        <CTASection />
        <Footer />
      </main>
    </SmoothScroll>
  )
}