import type React from "react";
import { Button } from "@/components/ui/Button";
import { CardContent } from "@/components/ui/Card";

import { t } from "i18next";
import config from "@/config";
import { Calendar, ExternalLink, MessageCircle } from "lucide-react";

export default function ContactsContent() {
  // 统一判断在线状态
  const startHour = 9; // 在线开始时间
  const endHour = 24; // 在线结束时间
  const hour = new Date().getHours();
  const isOnline = hour >= startHour && hour < endHour;
  return (
    <CardContent className="p-6 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {t("contacts.title")}
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

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-100/40 to-purple-100/40 dark:from-blue-500/10 dark:to-purple-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-blue-600 dark:text-blue-300 font-medium">
              {t("contacts.onlinestatus")}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            {t("contacts.onlinetime", {
              duration: `${startHour}:00-${endHour}:00`,
            })}
          </p>
          <div className="flex items-center mt-2">
            <div
              className={`w-2 h-2 ${isOnline ? "bg-green-500 dark:bg-green-400" : "bg-gray-400"} rounded-full mr-2`}
            ></div>
            <span
              className={`text-sm ${isOnline ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
            >
              {isOnline ? t("contacts.online") : t("contacts.offline")}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  );
}
