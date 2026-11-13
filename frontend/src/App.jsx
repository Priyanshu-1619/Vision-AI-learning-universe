import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ConceptDetail from './components/knowledge/ConceptDetail';
import DashboardPage from './pages/DashboardPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import ConceptUniversePage from './pages/ConceptUniversePage';
import LaboratoryPage from './pages/LaboratoryPage';
import MathematicsPage from './pages/MathematicsPage';
import InsideModelPage from './pages/InsideModelPage';
import BreakItPage from './pages/BreakItPage';
import WhatIfPage from './pages/WhatIfPage';
import ChallengesPage from './pages/ChallengesPage';
import DebuggingPage from './pages/DebuggingPage';
import EvolutionPage from './pages/EvolutionPage';
import MissionsPage from './pages/MissionsPage';
import DataSciencePage from './pages/DataSciencePage';
import MachineLearningPage from './pages/MachineLearningPage';
import DeepLearningPage from './pages/DeepLearningPage';
import DictionaryPage from './pages/DictionaryPage';
import RoadmapPage from './pages/RoadmapPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/data-science" element={<DataSciencePage />} />
          <Route path="/machine-learning" element={<MachineLearningPage />} />
          <Route path="/deep-learning" element={<DeepLearningPage />} />
          <Route path="/roadmap/:domain" element={<RoadmapPage />} />
          <Route path="/roadmaps/:domain" element={<RoadmapPage />} />
          <Route path="/roadmaps" element={<Navigate to="/roadmaps/data-science" replace />} />
          <Route path="/roadmap" element={<Navigate to="/roadmap/data-science" replace />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/concept-universe" element={<ConceptUniversePage />} />
          <Route path="/laboratory" element={<LaboratoryPage />} />
          <Route path="/mathematics" element={<MathematicsPage />} />
          <Route path="/inside-model" element={<InsideModelPage />} />
          <Route path="/break-it" element={<BreakItPage />} />
          <Route path="/what-if" element={<WhatIfPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/debugging" element={<DebuggingPage />} />
          <Route path="/evolution" element={<EvolutionPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/concept/:id" element={<ConceptDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
