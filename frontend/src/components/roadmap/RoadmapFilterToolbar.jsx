import { Search, X, Filter } from 'lucide-react';

export default function RoadmapFilterToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories = [],
  statusFilter,
  onStatusFilterChange,
  totalCount,
  filteredCount,
}) {
  const isFiltered = Boolean(searchQuery || (selectedCategory && selectedCategory !== 'all') || statusFilter !== 'all');

  const handleClearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onStatusFilterChange('all');
  };

  return (
    <div className="roadmap-toolbar">
      <div className="roadmap-toolbar__search-row">
        {/* Search Input */}
        <div className="roadmap-toolbar__search-box">
          <Search size={16} className="roadmap-toolbar__search-icon" />
          <input
            type="text"
            className="roadmap-toolbar__search-input"
            placeholder="Search topics by title, keyword, or tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="roadmap-toolbar__clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="roadmap-toolbar__select-box">
          <Filter size={14} className="roadmap-toolbar__select-icon" />
          <select
            className="roadmap-toolbar__select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Chips & Results Count */}
      <div className="roadmap-toolbar__chips-row">
        <div className="roadmap-toolbar__status-chips" role="group" aria-label="Status Filter">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'not-started', label: 'Not Started' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`roadmap-status-chip ${statusFilter === st.id ? 'roadmap-status-chip--active' : ''}`}
              onClick={() => onStatusFilterChange(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="roadmap-toolbar__meta">
          <span className="roadmap-toolbar__counter">
            Showing <strong>{filteredCount}</strong> of {totalCount} topics
          </span>
          {isFiltered && (
            <button
              type="button"
              className="roadmap-toolbar__reset-link"
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

