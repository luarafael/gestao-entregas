import { useAuthStore } from '../stores/auth.store'
import { isAdmin } from '../utils/permissions'

export function useIsAdmin() {
  const role = useAuthStore((state) => state.user?.role)
  return role ? isAdmin(role) : false
}
