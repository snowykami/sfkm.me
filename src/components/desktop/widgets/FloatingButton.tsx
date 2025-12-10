import React, { useState } from 'react'

export default function FloatingButton({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState({ x: 20, y: 100 })
  const [dragging, setDragging] = useState(false)

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging)
      return
    const touch = e.touches[0]
    setPos({ x: touch.clientX - 30, y: touch.clientY - 30 })
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: '#2563eb',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onTouchStart={() => setDragging(true)}
      onTouchEnd={() => setDragging(false)}
      onTouchMove={handleTouchMove}
      onClick={onClick}
    >
      <span style={{ fontSize: 28 }}>⌂</span>
    </div>
  )
}
