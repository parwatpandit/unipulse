export const getToken = () => localStorage.getItem('token')

export const setToken = (token: string) => localStorage.setItem('token', token)

export const removeToken = () => localStorage.removeItem('token')

export const isLoggedIn = () => !!localStorage.getItem('token')

export const getCurrentUserId = (): string | null => {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub
  } catch {
    return null
  }
}