import { useApi } from './useApi';
export interface AdminUser { id:string; firstName:string; lastName?:string; email?:string; role:'admin'|'manager'|'editor' }

export const useAdmin = () => {
  const api = useApi()
  const user = useState<AdminUser | null>('trove-admin-user',()=>null)
  const loading = useState('trove-admin-loading',()=>false)
  const load = async () => {
    if (user.value) return user.value
    loading.value=true
    try { const r=await api<{user:AdminUser}>('/api/admin/me'); user.value=r.user; return r.user }
    catch { user.value=null; throw new Error('ADMIN_UNAUTHORIZED') }
    finally { loading.value=false }
  }
  const login = async (identifier:string,password:string) => {
    await api('/api/auth/login',{method:'POST',body:{identifier,password}})
    const r=await api<{user:AdminUser}>('/api/admin/me')
    user.value=r.user
    return r.user
  }
  const logout = async () => { await api('/api/auth/logout',{method:'POST'}).catch(()=>undefined); user.value=null; await navigateTo('/admin/login') }
  return {user,loading,load,login,logout}
}
