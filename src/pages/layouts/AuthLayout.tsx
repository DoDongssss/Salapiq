import React from 'react';
import { Outlet } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';

const AuthLayout: React.FC = () => {
//   const user = useAuth(); 

//   if (user) return <Navigate to="/home" replace />;

  return (
    <div className='h-screen w-full flex items-center justify-center'>
        <Outlet />
    </div>
  );
};

export default AuthLayout;