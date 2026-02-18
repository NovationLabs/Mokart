import React, { useState } from 'react';
import '../styles/MokartMain.css';
import { TabName } from '../types';

const MokartMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Graph');
  const [activeIcons, setActiveIcons] = useState<Set<string>>(new Set());

  const handleTabClick = (tabName: TabName) => {
    setActiveTab(tabName);
  };

  const toggleIcon = (btnName: string) => {
    setActiveIcons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(btnName)) {
        newSet.delete(btnName);
      } else {
        newSet.add(btnName);
      }
      return newSet;
    });
  };

  return (
    <div className="main-container">
      <nav className="top-navbar">

        <div className="nav-group left">
          <button
            className={`nav-tab ${activeTab === 'User' ? 'active' : ''}`}
            title="User"
            onClick={() => handleTabClick('User')}
          >
            <i className="ri-user-line"></i>
            <span>User</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Map' ? 'active' : ''}`}
            title="Map"
            onClick={() => handleTabClick('Map')}
          >
            <i className="ri-map-2-line"></i>
            <span>Map</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Graph' ? 'active' : ''}`}
            title="Graph"
            onClick={() => handleTabClick('Graph')}
          >
            <i className="ri-node-tree"></i>
            <span>Graph</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Documentation' ? 'active' : ''}`}
            title="Documentation"
            onClick={() => handleTabClick('Documentation')}
          >
            <i className="ri-book-open-line"></i>
            <span>Documentation</span>
          </button>
        </div>

        <div className="nav-center">
          <div className="search-bar"></div>
        </div>

        <div className="nav-group right">
          <button
            className={`icon-btn ${activeIcons.has('Search') ? 'active' : ''}`}
            title="Search"
            onClick={() => toggleIcon('Search')}
          >
            <i className="ri-search-line"></i>
          </button>


          <button
            className={`icon-btn ${activeIcons.has('Smartphone') ? 'active' : ''}`}
            title="Smartphone"
            onClick={() => toggleIcon('Smartphone')}
          >
            <i className="ri-smartphone-line"></i>
          </button>

          <div className="separator"></div>

          <button
            className={`icon-btn ${activeIcons.has('Sparkle') ? 'active' : ''}`}
            title="Sparkle"
            onClick={() => toggleIcon('Sparkle')}
          >
            <i className="ri-shining-2-line"></i>
          </button>

        </div>
      </nav>

      {/*
        Tab Content
      */}
      {/* <div className="content-area">
          <h3>{activeTab} View</h3>
          <p>Content for {activeTab} goes here.</p>
      </div> */}

    </div>
  );
};

export default MokartMain;
