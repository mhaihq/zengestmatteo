import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

export function SettingsIndexPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        navigate('/settings/profile', { replace: true });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  if (!isMobile) {
    return null;
  }

  return (
    <SettingsLayout title="Settings">
      <div />
    </SettingsLayout>
  );
}
