import React from 'react'

interface DividerProps {
  className?: string
  marginTop?: string
  paddingTop?: string
  borderClassName?: string
}

export const Divider: React.FC<DividerProps> = ({
  className = '',
  marginTop = 'mt-6',
  paddingTop = 'pt-6',
  borderClassName = 'border-t border-slate-300 dark:border-slate-700/50',
}) => {
  return (
    <div className={`${marginTop} ${paddingTop} ${borderClassName} ${className}`}>
      <div className="flex justify-center"></div>
    </div>
  )
}
