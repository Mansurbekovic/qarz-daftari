import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { PAGE_TITLES } from '../../utils/constants';

export default function Topbar({ onOpenAddClient }) {
  const { currentPage, searchQuery, setSearchQuery, toggleTheme, navigate } = useApp();

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q && currentPage !== 'clients' && currentPage !== 'transactions') {
      navigate('clients');
    }
  };

  return (
    <header className="topbar">
      <h1>{PAGE_TITLES[currentPage] || ''}</h1>

      <div className="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Mijoz ismi yoki telefon raqami..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="spacer" />

      <button className="icon-btn" title="Tema" onClick={toggleTheme}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>

      <button className="btn btn-gold" onClick={onOpenAddClient}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Mijoz qo'shish
      </button>
    </header>
  );
}
