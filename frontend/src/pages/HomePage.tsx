import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedMaterials from '../components/FeaturedMaterials';
import Features from '../components/Features';
import CircularitySteps from '../components/CircularitySteps';
import Stats from '../components/Stats';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import MaterialDetailsModal from '../components/MaterialDetailsModal';

import type { User, Material } from '../types';

interface HomePageProps {
  user: User | null;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<Material | null>(null);

  const handleExploreMarketplace = () => {
    const marketplace =
      document.getElementById('marketplace');

    if (marketplace) {
      marketplace.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  const handleSelectMaterial = (
    material: Material
  ) => {
    setSelectedMaterial(material);
    setDetailsOpen(true);
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Navbar
        user={user}
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onLogout={onLogout}
      />

      <main className="flex-grow">
        <Hero
          onExploreClick={handleExploreMarketplace}
          onJoinClick={() => navigate('/register')}
        />

        <FeaturedMaterials
          user={user}
          onLoginPrompt={() => navigate('/login')}
          onMaterialSelect={handleSelectMaterial}
        />

        <Features />
        <CircularitySteps />
        <Stats />
        <Testimonials />
      </main>

      <Footer />

      <MaterialDetailsModal
        isOpen={detailsOpen}
        material={selectedMaterial}
        user={user}
        onClose={() => setDetailsOpen(false)}
        onLoginPrompt={() => {
          setDetailsOpen(false);
          navigate('/login');
        }}
      />
    </div>
  );
};

export default HomePage;