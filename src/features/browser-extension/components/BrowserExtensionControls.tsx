import React from 'react';
import { BrowserExtensionState } from '../types';

interface BrowserExtensionControlsProps {
  state: BrowserExtensionState;
  onToggle: () => void;
}

const BrowserExtensionControls: React.FC<BrowserExtensionControlsProps> = ({
  state,
  onToggle
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10001,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* 메인 토글 버튼 */}
      <button
        onClick={onToggle}
        style={{
          padding: '12px 16px',
          backgroundColor: state.isActive ? '#28a745' : '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: state.isActive ? '#fff' : '#ccc',
          animation: state.isActive ? 'pulse 2s infinite' : 'none'
        }} />
        {state.isActive ? 'Extension Active' : 'Extension Inactive'}
      </button>

      {/* 상태 표시 패널 */}
      {state.isActive && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '200px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Extension Status
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Cursor:</span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'bold',
                color: '#007bff'
              }}>
                {state.cursorStyle.type}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Position:</span>
              <span style={{ fontSize: '12px', color: '#333' }}>
                {state.mousePosition.x}, {state.mousePosition.y}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Dragging:</span>
              <span style={{ 
                fontSize: '12px', 
                color: state.isDragging ? '#dc3545' : '#28a745',
                fontWeight: 'bold'
              }}>
                {state.isDragging ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            <strong>Controls:</strong><br />
            • Left Click: Click<br />
            • Right Click: Context Menu<br />
            • Double Click: Select<br />
            • Scroll: Navigate
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserExtensionControls;
