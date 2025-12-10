'use client'
import Desktop from '@/components/desktop/Desktop'
import MobileDesktop from '@/components/desktop/MobileDesktop'
import { useDevice } from '@/contexts/DeviceContext'
import '@/utils/i18n' // i18n initialization

export default function Home() {
  const { isMobile } = useDevice()

  return (
    <div className="h-full overflow-hidden">
      {isMobile ? <MobileDesktop /> : <Desktop />}
    </div>
  )
}
