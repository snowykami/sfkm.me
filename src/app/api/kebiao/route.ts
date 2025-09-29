// 郑重声明，这个命名用kebiao不是因为本人没有好的命名习惯，而是为了尊重原API的命名

import { getKebiao as getKebiao, getTransactions, loginToMagipoke } from "@/api/magipoke.server";
import type { Course } from "@/api/magipoke.server";
import { NextResponse } from "next/server";

type CourseSchedule = {
    start: string,
    end: string,
}

export type SimplifyCourse = {
    name: string,
    begin: string,
    end: string,
    location: string,
}

function filterFieldsForCourse(course: Course): SimplifyCourse {
    return {
        name: course.course,
        begin: courseSchedules[course.begin_lesson - 1].start,
        end: courseSchedules[course.begin_lesson + course.period - 2].end,
        location: course.classroom,
    }
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
    const termBegin = new Date(2025, 9-1, 8); 
    const tokenData = await loginToMagipoke({ stuNum: process.env.MAGIPOKE_ID || "", password: process.env.MAGIPOKE_PASSWORD || "" });
    let kebiaoData: { data: Course[], nowWeek: number } = { data: [], nowWeek: Math.ceil((new Date().getTime() - termBegin.getTime()) / (1000 * 60 * 60 * 24 * 7)) };
    try {
        kebiaoData = await getKebiao({ token: tokenData.data.token, stuNum: process.env.MAGIPOKE_ID || "" });
    } catch {
        // 晚上会获取不到课表，那就跳过
    }
    const transactionData = await getTransactions({ token: tokenData.data.token });
    const now = new Date();
    const current = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const currentCourses: SimplifyCourse[] = [];
    const todayCourses: SimplifyCourse[] = [];
    const tomorrowCourses: SimplifyCourse[] = [];

    for (const course of kebiaoData.data) {
        if (excludedCourseNums.includes(course.course_num)) continue;
        // 周筛
        for (const w of course.week) {
            if (w === kebiaoData.nowWeek) {
                // 天筛选,返回数据0是星期一
                const dayNumber = (now.getDay() + 6) % 7;
                if (dayNumber === course.hash_day) {
                    // 节筛选
                    // 起止时间
                    todayCourses.push(filterFieldsForCourse(course));
                    const begin = courseSchedules[course.begin_lesson - 1].start;
                    const end = courseSchedules[course.begin_lesson + course.period - 2].end;
                    
                    if (current >= begin && current <= end) {
                        currentCourses.push(filterFieldsForCourse(course));
                    }
                }
                if (dayNumber + 1 === course.hash_day) {
                    tomorrowCourses.push(filterFieldsForCourse(course));
                }
            }
        }
    }

    for (const transaction of transactionData.data) { 
        // 周筛，用课表的nowWeek
        for (const date of transaction.date) {
            if (date.week.includes(kebiaoData.nowWeek)) {
                // 天筛选,返回数据0是星期一
                const dayNumber = (now.getDay() + 6) % 7;
                // 今天
                console.log("Date:", date);
                if (dayNumber === date.day) {
                    todayCourses.push({
                        name: transaction.title,
                        begin: courseSchedules[date.begin_lesson - 1].start,
                        end: courseSchedules[date.begin_lesson + date.period - 2].end,
                        location: transaction.content,
                    })
                    // 判断是否在上课时间内
                    const begin = courseSchedules[date.begin_lesson - 1].start;
                    const end = courseSchedules[date.begin_lesson + date.period - 2].end;
                    if (current >= begin && current <= end) {
                        currentCourses.push({
                            name: transaction.title,
                            begin: courseSchedules[date.begin_lesson - 1].start,
                            end: courseSchedules[date.begin_lesson + date.period - 2].end,
                            location: transaction.content,
                        })
                    }
                }
                // 明天
                if (dayNumber + 1 === date.day) {
                    tomorrowCourses.push({
                        name: transaction.title,
                        begin: courseSchedules[date.begin_lesson - 1].start,
                        end: courseSchedules[date.begin_lesson + date.period - 2].end,
                        location: transaction.content,
                    })
                }
            }
        }
    }


    return NextResponse.json({
        currentCourses: currentCourses,
        todayCourses: todayCourses,
        tomorrowCourses: tomorrowCourses,
        nowWeek: kebiaoData.nowWeek
    }, {
        status: 200
    });
}