import React, { useState } from 'react';
import { FaCalendarAlt, FaPlus, FaPoll, FaFilter, FaSearch } from 'react-icons/fa';
import DoodleList from './DoodleList';
import CreateDoodleModal from './CreateDoodleModal';
import './CalendarPage.css';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const CalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all-doodles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdByMeFilter, setCreatedByMeFilter] = useState(false);

  const tabs: TabType[] = [
    {
      id: 'all-doodles',
      label: 'Todos los Doodles',
      icon: <FaPoll />
    },
    {
      id: 'my-doodles',
      label: 'Mis Doodles',
      icon: <FaCalendarAlt />
    },
    {
      id: 'participating',
      label: 'Participando',
      icon: <FaPlus />
    }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Update filters based on tab
    switch (tabId) {
      case 'my-doodles':
        setCreatedByMeFilter(true);
        break;
      case 'participating':
        setCreatedByMeFilter(false);
        // TODO: Add filter for doodles where user has participated
        break;
      default:
        setCreatedByMeFilter(false);
        break;
    }
  };

  return (
    <div className="calendar-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <FaCalendarAlt />
            📅 Calendario de la Comunidad
          </h1>
          <p className="header-subtitle">
            Organiza eventos y coordina fechas con la comunidad usando doodles
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary create-doodle-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus />
            Crear Doodle
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar doodles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="closed">Finalizados</option>
            <option value="expired">Expirados</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          <DoodleList
            searchTerm={searchTerm}
            statusFilter={statusFilter === 'all' ? undefined : statusFilter}
            createdByMe={createdByMeFilter}
            key={`${activeTab}-${statusFilter}-${createdByMeFilter}`} // Force re-render on filter change
          />
        </div>
      </div>

      {/* Create Doodle Modal */}
      {showCreateModal && (
        <CreateDoodleModal
          onClose={() => setShowCreateModal(false)}
          onDoodleCreated={() => {
            setShowCreateModal(false);
            // Refresh the list by switching tab
            handleTabChange(activeTab);
          }}
        />
      )}
    </div>
  );
};

export default CalendarPage;