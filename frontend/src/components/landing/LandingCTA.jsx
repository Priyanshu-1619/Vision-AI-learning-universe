import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus, LogIn, Compass } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import Button from '../common/Button';
import './LandingCTA.css';

export default function LandingCTA() {
  const navigate = useNavigate();
  const { isGuest, openAuthModal } = useAuth();

  return (
    <section className="landing-cta" aria-label="Call to Action">
      {/* Horizon glow effects */}
      <div className="landing-cta__glow" />

      <div className="landing-cta__container">
        <span className="landing-cta__kicker">THE NEXT FRONTIER</span>
        <h2 className="landing-cta__headline">
          YOUR JOURNEY INTO AI STARTS HERE.
        </h2>
        <p className="landing-cta__desc">
          Explore the concepts. Experiment with algorithms. Understand the mathematics. Build the intelligence of tomorrow.
        </p>

        <div className="landing-cta__buttons">
          <Button
            variant="primary"
            icon={ArrowRight}
            onClick={() => navigate('/dashboard')}
            className="landing-cta__btn-guest"
          >
            EXPLORE AS GUEST
          </Button>

          {isGuest ? (
            <>
              <Button
                variant="secondary"
                icon={UserPlus}
                onClick={() => openAuthModal('register')}
                className="landing-cta__btn-register"
              >
                CREATE YOUR ACCOUNT
              </Button>
              <button
                type="button"
                className="landing-cta__signin-link"
                onClick={() => openAuthModal('login')}
              >
                <LogIn size={15} />
                <span>SIGN IN</span>
              </button>
            </>
          ) : (
            <Button
              variant="secondary"
              icon={Compass}
              onClick={() => navigate('/concept-universe')}
            >
              CONCEPT UNIVERSE
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
