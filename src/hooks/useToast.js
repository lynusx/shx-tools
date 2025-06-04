import { useCallback, useState } from 'react'

export const useToast = () => {
  const [toast, setToast] = useState({ open: false })

  const showToast = useCallback((title, description, type) => {
    setToast({ open: true, title, description, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast({ open: false })
  }, [])

  return { toast, showToast, hideToast }
}
