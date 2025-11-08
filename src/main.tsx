import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import router from './router/index'
import { useAuthStore } from './stores/authStore'
import { queryClient } from './config/queryClient'
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export function AppWrapper() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await checkAuth();
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
        <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin" />
        <p className="text-center text-gray-600">Đang xác thực...</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWrapper/>
    </QueryClientProvider>
  </StrictMode>,
)