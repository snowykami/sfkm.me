"use client";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { CardContent } from "@/components/ui/Card";

import { t } from "i18next";
import config from "@/config";
import { Calendar, ExternalLink, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCurrentCourses } from "@/api/kebiao";
import type { SimplifyCourse } from "@/app/api/kebiao/route";
import { useDevice } from "@/contexts/DeviceContext";

export default function ContactsContent() {
  // 统一判断在线状态
  const startHour = 9; // 在线开始时间
  const endHour = 24; // 在线结束时间
  const hour = new Date().getHours();
  const isOnline = hour >= startHour && hour < endHour;
  const [currentCourses, setCurrentCourses] = useState<SimplifyCourse[]>([]);
  const [todayCourses, setTodayCourses] = useState<SimplifyCourse[]>([]);
  const [tomorrowCourses, setTomorrowCourses] = useState<SimplifyCourse[]>([]);

  useEffect(() => {
    fetchCurrentCourses().then(data => {
      setCurrentCourses(data.currentCourses);
      setTodayCourses(data.todayCourses);
      setTomorrowCourses(data.tomorrowCourses);
    }).catch(() => { });
  }, []);

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

        {/* 在线状态 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-100/40 to-purple-100/40 dark:from-blue-500/10 dark:to-purple-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-blue-600 dark:text-blue-300 font-medium">
              {t("contacts.onlinestatus")}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <div
              className={`w-2 h-2 ${isOnline ? "bg-green-500 dark:bg-green-400" : "bg-gray-400"} rounded-full mr-2`}
            ></div>
            <span
              className={`text-sm ${isOnline ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
            >
              {t("contacts.current")}: {currentCourses.length > 0 ? currentCourses.map(course => `${course.name} (${course.begin}-${course.end})`).join("; ") : t("contacts.nocourse")}
            </span>

          </div>
          {/* 今天的课程 */}
          <div className="mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">{t("contacts.todaycourses")}</span>
            <ul className="mt-1">
              {todayCourses.length > 0 ? todayCourses.sort((a, b) => a.begin.localeCompare(b.begin)).map(course => (
                <CourseItem key={`${course.name}-${course.begin}`} course={course} />
              )) : (
                <li className="text-sm text-slate-500 dark:text-slate-400">{t("contacts.nocourse")}</li>
              )}
            </ul>
          </div>
          {/* 明天的课程 */}
          <div className="mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">{t("contacts.tomorrowcourses")} {}</span>
            <ul className="mt-1">
              {tomorrowCourses.length > 0 ? tomorrowCourses.sort((a, b) => a.begin.localeCompare(b.begin)).map(course => (
                <CourseItem key={`${course.name}-${course.begin}`} course={course} today={false} />
              )) : (
                <li className="text-sm text-slate-500 dark:text-slate-400">{t("contacts.nocourse")}</li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </CardContent>
  );
}

// 计算"HH:MM"格式时间的分钟数差
function calculateDuration(begin: string, end: string): number {
  const [beginHour, beginMinute] = begin.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return (endHour - beginHour) * 60 + (endMinute - beginMinute);
}

function calculateProgress(begin: string, end: string, current: string): number {
  const totalMinutes = calculateDuration(begin, end);
  const elapsedMinutes = calculateDuration(begin, current);
  return Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);
}

function CourseItem({ course, today=true }: { course: SimplifyCourse, today?: boolean }) {
  const { mode } = useDevice();
  const now = new Date();
  const current = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
  const isCurrent = current >= course.begin && current <= course.end;
  const isPassed = today ? current > course.end : false;
  const progressPercent = calculateProgress(course.begin, course.end, current);
  const progressColorPassed = mode === "dark" ? "oklch(50.8% 0.118 165.612)" : "oklch(84.5% 0.143 164.978)";
  const progressColorRemaining = "oklch(90.5% 0.093 164.15)";
  const remainDuration = calculateDuration(current, course.end);
  return (
    <div
      className={`flex rounded-xl items-center justify-between mt-3 py-2 border-1
        ${isCurrent ? "border-emerald-300" :
          isPassed ? "bg-slate-300/80 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600" :
            " bg-slate-100/80 dark:bg-slate-600/50 border-slate-100 dark:border-slate-500"} 
      `}
      style={isCurrent ? { background: `linear-gradient(90deg, ${progressColorPassed} ${progressPercent}%, ${progressColorRemaining} ${progressPercent}%)` } : {
      }}
    >
      <div className="flex items-center">
        <span
          className={`w-2 h-2 rounded-full mr-2 ${isCurrent ? "bg-green-500 dark:bg-green-400" : "bg-transparent"
            }`}
        />
        <div>
          <h3
            className={`text-sm font-medium ${isCurrent ? "text-green-700 dark:text-green-300" : "text-slate-800 dark:text-slate-200"
              }`}
          >
            {course.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {course.begin} - {course.end} ({isCurrent ? t("contacts.durationEndClass", { duration: remainDuration + "min" }) : isPassed ? t("contacts.ended") : t("contacts.notStarted")})
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {course.location}
          </p>

        </div>
      </div>
    </div>
  );
}
