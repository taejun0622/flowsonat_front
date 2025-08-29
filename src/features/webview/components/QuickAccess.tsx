import React from 'react';
import { QuickAccessItem } from '../types';

interface QuickAccessProps {
  items: QuickAccessItem[];
  onItemSelect: (url: string) => void;
}

const QuickAccess = ({ items, onItemSelect }: QuickAccessProps) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px', color: '#333' }}>Quick Access</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '10px' 
      }}>
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onItemSelect(item.url)}
            style={{
              padding: '12px',
              border: '2px solid #007bff',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.color = '#007bff';
            }}
          >
            <span style={{ 
              fontWeight: 'bold', 
              color: 'inherit',
              fontSize: '14px'
            }}>
              {item.name}
            </span>
            {item.description && (
              <span style={{ 
                color: 'inherit', 
                fontSize: '12px',
                opacity: 0.8
              }}>
                {item.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickAccess;
