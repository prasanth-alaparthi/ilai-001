import React from 'react';
import { Outlet } from 'react-router-dom';

const LabsLayout = () => {
    return (
        <div className="w-full h-full min-h-screen">
            {/* 
               The Labs module uses a custom dark terminal aesthetic.
               We removed the legacy sidebar here to avoid checking conflicts 
               with the global ModernLayout sidebar.
               Navigation is handled via the main LabsDashboard or global sidebar.
             */}
            <Outlet />
        </div>
    );
};

export default LabsLayout;
