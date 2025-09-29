// 郑重声明，这个命名用kebiao不是因为本人没有好的命名习惯，而是为了尊重原API的命名

import { getTimeTable as getKebiao, loginToMagipoke } from "@/api/magipoke.server";
import type { Course } from "@/api/magipoke.server";
import { NextResponse } from "next/server";

type CourseSchedule = {
    start: string,
    end: string,
}

const courseSchedules: CourseSchedule[] = [
    { start: "08:00", end: "08:45" },
    { start: "08:55", end: "09:40" },

    { start: "10:15", end: "11:00" },
    { start: "11:10", end: "11:55" },
    // 中午休息
    { start: "14:00", end: "14:45" },
    { start: "14:55", end: "15:40" },

    { start: "16:15", end: "17:00" },
    { start: "17:10", end: "17:55" },
    // 晚上休息
    { start: "19:00", end: "19:45" },
    { start: "19:55", end: "20:40" },
    { start: "20:50", end: "21:35" },
    { start: "21:45", end: "22:30" },
]

const excludedCourseNums = ["A2010561"]

export async function GET() {
    const tokenData = await loginToMagipoke({ stuNum: process.env.MAGIPOKE_ID || "", password: process.env.MAGIPOKE_PASSWORD || "" });
    const kebiaoData = await getKebiao({ token: tokenData.data.token, stuNum: process.env.MAGIPOKE_ID || "" });
    const now = new Date();

    const currentCourses: Course[] = [];

    for (const course of kebiaoData.data) {
        // 周筛
        for (const w of course.week) {
            if (w === kebiaoData.nowWeek) {
                // 天筛选,返回数据0是星期一
                const dayNumber = (now.getDay() + 6) % 7;
                if (dayNumber === course.hash_day) {
                    // 节筛选
                    // 起止时间
                    const begin = courseSchedules[course.begin_lesson - 1].start;
                    const end = courseSchedules[course.begin_lesson + course.period - 2].end;
                    const current = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
                    if (current >= begin && current <= end) {
                        if (!excludedCourseNums.includes(course.course_num)) {
                            currentCourses.push(course);
                        }
                    }
                }
            }
        }
    }
    return NextResponse.json({
        currentCourses: currentCourses.map(course => ({
            // 根据实际字段名调整
            name: course.course,
            begin: courseSchedules[course.begin_lesson - 1].start,
            end: courseSchedules[course.begin_lesson + course.period - 2].end,
            location: course.classroom,
        })),
        nowWeek: kebiaoData.nowWeek
    }, {
        status: 200
    });
}