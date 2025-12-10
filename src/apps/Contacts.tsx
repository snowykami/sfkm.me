'use client'
import type React from 'react'
import { t } from 'i18next'
import { ExternalLink, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { CardContent } from '@/components/ui/Card'
import config from '@/config'

export default function ContactsContent() {
  return (
    <CardContent className="p-6 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {t('contacts.title')}
          </h2>
        </div>

        {config.contacts.map((contact, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700/50 transition-colors"
          >
            <contact.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-3" />
            <div className="flex-1">
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {t(contact.label)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {contact.value}
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <a href={contact.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        ))}

      </div>
    </CardContent>
  )
}
