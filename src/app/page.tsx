import { Ecosystem } from '@/components/marketing/Ecosystem';
import { UseCases } from '@/components/marketing/UseCases';
import { GlubbiRewards } from '@/components/marketing/GlubbiRewards';
import { WhatsAppComparison } from '@/components/marketing/WhatsAppComparison';
import { GrowthAgentAI } from '@/components/marketing/GrowthAgentAI';
import { FeaturesKDS } from '@/components/marketing/FeaturesKDS';
import { TechArchitecture } from '@/components/marketing/TechArchitecture';
import { FAQ } from '@/components/marketing/FAQ';
import { Footer } from '@/components/marketing/Footer';
import { Hero } from '@/components/marketing/Hero';
import { Navbar } from '@/components/marketing/Navbar';
import { Pricing } from '@/components/marketing/Pricing';
import { RegisterCTA } from '@/components/marketing/RegisterCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-orange-500/10">
      <Navbar />
      <Hero />
      <GlubbiRewards />
      <Ecosystem />
      <WhatsAppComparison />
      <UseCases />
      <GrowthAgentAI />
      <FeaturesKDS />
      <TechArchitecture />
      <Pricing />
      <FAQ />
      <RegisterCTA />
      <Footer />
    </div>
  );
}
