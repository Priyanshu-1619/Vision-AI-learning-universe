import { Brain, FlaskConical, Hammer, HelpCircle } from 'lucide-react';
import DomainLanding from '../components/domain/DomainLanding';

export default function MachineLearningPage() {
  return (
    <DomainLanding
      domainId="machine-learning"
      domainTitle="Machine Learning"
      domainDescription="Understand how machines discover underlying patterns in data. Explore supervised regression and classification, unsupervised clustering, loss functions, and optimization algorithms with real-time interactive models."
      accentColor="var(--ml-accent, #164BFF)"
      glowColor="var(--ml-glow, rgba(22, 75, 255, 0.15))"
      icon={Brain}
      toolLinks={[
        { label: 'AI Laboratory', path: '/laboratory', icon: FlaskConical },
        { label: 'Break-It Lab', path: '/break-it', icon: Hammer },
        { label: 'What-If Studio', path: '/what-if', icon: HelpCircle },
      ]}
    />
  );
}
