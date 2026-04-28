import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoleRedirect } from './use-role-redirect';
import { useAuth } from '@/application/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Mocks
vi.mock('@/application/contexts/AuthContext');
vi.mock('react-router-dom');

describe('useRoleRedirect Hook', () => {
  const navigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigate);
  });

  it('should redirect admin to admin dashboard if on auth page', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1' },
      profile: { role: 'admin' },
      loading: false,
    } as any);

    vi.mocked(useLocation).mockReturnValue({ pathname: '/auth' } as any);

    renderHook(() => useRoleRedirect());

    expect(navigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
  });

  it('should redirect client to client dashboard if on auth page', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '2' },
      profile: { role: 'client' },
      loading: false,
    } as any);

    vi.mocked(useLocation).mockReturnValue({ pathname: '/auth' } as any);

    renderHook(() => useRoleRedirect());

    expect(navigate).toHaveBeenCalledWith('/client/dashboard', { replace: true });
  });

  it('should not redirect if still loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
    } as any);

    vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as any);

    renderHook(() => useRoleRedirect());

    expect(navigate).not.toHaveBeenCalled();
  });

  it('should not redirect admin if already on admin route', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1' },
      profile: { role: 'admin' },
      loading: false,
    } as any);

    vi.mocked(useLocation).mockReturnValue({ pathname: '/admin/stock' } as any);

    renderHook(() => useRoleRedirect());

    expect(navigate).not.toHaveBeenCalled();
  });
});
