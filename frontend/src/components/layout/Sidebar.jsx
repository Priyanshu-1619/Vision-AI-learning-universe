import { NavLink } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard,
  BookA,
  Database,
  Zap,
  Network,
  Globe2,
  FlaskConical,
  Calculator,
  Eye,
  Hammer,
  HelpCircle,
  Trophy,
  Bug,
  Dna,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './Sidebar.css';

const navSections = [
  {
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dictionary', label: 'Dictionary', icon: BookA },
    ],
  },
  {
    title: 'DOMAINS',
    items: [
      { path: '/data-science', label: 'Data Science', icon: Database, accentColor: 'var(--ds-accent)' },
      { path: '/machine-learning', label: 'Machine Learning', icon: Brain, accentColor: 'var(--ml-accent)' },
      { path: '/deep-learning', label: 'Deep Learning', icon: Zap, accentColor: 'var(--dl-accent)' },
    ],
  },
  {
    title: 'EXPLORE',
    items: [
      { path: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
      { path: '/concept-universe', label: 'Concept Universe', icon: Globe2 },
    ],
  },
  {
    title: 'LABS & TOOLS',
    items: [
      { path: '/laboratory', label: 'Laboratory', icon: FlaskConical },
      { path: '/mathematics', label: 'Mathematics', icon: Calculator },
      { path: '/inside-model', label: 'Inside the Model', icon: Eye },
      { path: '/break-it', label: 'Break It!', icon: Hammer },
      { path: '/what-if', label: 'What If?', icon: HelpCircle },
      { path: '/missions', label: 'Missions', icon: Target },
    ],
  },
  {
    title: 'PRACTICE',
    items: [
      { path: '/challenges', label: 'Challenges', icon: Trophy },
      { path: '/debugging', label: 'Debugging Lab', icon: Bug },
      { path: '/evolution', label: 'Evolution', icon: Dna },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__logo">
        <Brain className="sidebar__logo-icon" size={28} />
        {!collapsed && <span className="sidebar__logo-text">AI Learning Universe</span>}
      </div>

      <nav className="sidebar__nav">
        {navSections.map((section, sIdx) => (
          <div key={section.title || `section-${sIdx}`} className="sidebar__section">
            {section.title && !collapsed && (
              <span className="sidebar__section-title">{section.title}</span>
            )}
            {section.title && collapsed && (
              <div className="sidebar__section-divider" />
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                style={({ isActive }) =>
                  isActive && item.accentColor
                    ? {
                        borderLeftColor: item.accentColor,
                        color: item.accentColor,
                        background: `color-mix(in srgb, ${item.accentColor} 12%, transparent)`,
                      }
                    : {}
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  size={20}
                  className="sidebar__link-icon"
                  style={item.accentColor ? { '--custom-accent': item.accentColor } : {}}
                />
                {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button className="sidebar__toggle" onClick={onToggle}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
