import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ marginLeft: sidebarWidth, flex: 1, transition: 'margin-left 0.2s ease', minWidth: 0 }}>
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
