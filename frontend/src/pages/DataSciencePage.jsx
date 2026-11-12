import { Database, Calculator, FlaskConical } from 'lucide-react';
import DomainLanding from '../components/domain/DomainLanding';

export default function DataSciencePage() {
  return (
    <DomainLanding
      domainId="data-science"
      domainTitle="Data Science"
      domainDescription="Learn to collect, analyze, visualize, and prepare data. Master descriptive and inferential statistics, probability theory, linear algebra, and feature engineering to turn raw numbers into actionable insight."
      accentColor="var(--ds-accent, #06b6d4)"
      glowColor="var(--ds-glow, rgba(6, 182, 212, 0.15))"
      icon={Database}
      toolLinks={[
        { label: 'Mathematics Lab', path: '/mathematics', icon: Calculator },
        { label: 'PCA Projection Lab', path: '/laboratory?lab=pca', icon: FlaskConical },
      ]}
    />
  );
}
