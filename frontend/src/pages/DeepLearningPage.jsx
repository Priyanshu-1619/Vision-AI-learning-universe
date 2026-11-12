import { Zap, Eye, Dna } from 'lucide-react';
import DomainLanding from '../components/domain/DomainLanding';

export default function DeepLearningPage() {
  return (
    <DomainLanding
      domainId="deep-learning"
      domainTitle="Deep Learning"
      domainDescription="Explore artificial neural networks and modern deep architectures. Dissect forward signal propagation, nonlinear activation functions, 6-stage backpropagation, convolution, attention mechanisms, and transformers."
      accentColor="var(--dl-accent, #8b5cf6)"
      glowColor="var(--dl-glow, rgba(139, 92, 246, 0.15))"
      icon={Zap}
      toolLinks={[
        { label: 'Inside the Model', path: '/inside-model', icon: Eye },
        { label: 'Algorithm Evolution', path: '/evolution', icon: Dna },
      ]}
    />
  );
}
