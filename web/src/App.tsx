import React from 'react';
import Home from './pages/Home';
import Soon from './pages/Soon';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import './styles/App.css';

const App: React.FC = () => {
  // Simple routing based on URL path
  const path = window.location.pathname;

  switch (path) {
    case '/soon':
      return <Soon />;
    case '/privacy-policy':
      return <PrivacyPolicy />;
    case '/terms-of-service':
      return <TermsOfService />;
    default:
      return <Home />;
  }
};

export default App;
