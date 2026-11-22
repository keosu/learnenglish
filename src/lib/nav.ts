import { useNavigate } from 'react-router-dom'

export function useBack() {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))
}
