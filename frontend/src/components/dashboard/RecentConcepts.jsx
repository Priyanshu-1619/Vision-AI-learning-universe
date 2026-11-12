import ConceptCard from '../common/ConceptCard';
import './RecentConcepts.css';

export default function RecentConcepts({ concepts }) {
  const featured = concepts.slice(0, 6);

  return (
    <section className="recent-concepts">
      <h2 className="section-title">Featured Concepts</h2>
      <div className="recent-concepts__grid">
        {featured.map((c) => (
          <ConceptCard key={c.id} concept={c} />
        ))}
      </div>
    </section>
  );
}
