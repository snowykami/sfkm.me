// 郑重声明，这个命名用kebiao不是因为本人没有好的命名习惯，而是为了尊重原API的命名

import { getKebiao as getKebiao, getTransactions, loginToMagipoke } from "@/api/magipoke.server";
import type { Course } from "@/api/magipoke.server";
import { NextResponse } from "next/server";

type CourseSchedule = {
    begin: string,
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
        begin: courseSchedules[course.begin_lesson - 1].begin,
        end: courseSchedules[course.begin_lesson + course.period - 2].end,
        location: course.classroom,
    }
}

const courseSchedules: CourseSchedule[] = [
    // 早上
    { begin: "08:00", end: "08:45" },
    { begin: "08:55", end: "09:40" },
    { begin: "10:15", end: "11:00" },
    { begin: "11:10", end: "11:55" },
    // 中午
    { begin: "11:55", end: "14:00" },   // -1
    // 下午
    { begin: "14:00", end: "14:45" },
    { begin: "14:55", end: "15:40" },
    { begin: "16:15", end: "17:00" },
    { begin: "17:10", end: "17:55" },
    // 晚休
    { begin: "17:55", end: "19:00" },   // -2
    // 晚课
    { begin: "19:00", end: "19:45" },
    { begin: "19:55", end: "20:40" },
    { begin: "20:50", end: "21:35" },
    { begin: "21:45", end: "22:30" },
]

function getScheduleStartAndEnd(beginLesson: number, period: number): { begin: string, end: string } {
    let begin = "00:00";
    let end = "00:00";
    if (beginLesson === -1) {
        begin = courseSchedules[4].begin;
    } else if (beginLesson === -2) {
        begin = courseSchedules[9].begin;
    } else if (beginLesson >= 9) {
        beginLesson += 1;
        begin = courseSchedules[beginLesson].begin;
    } else if (beginLesson >= 5) {
        begin = courseSchedules[beginLesson].begin;
    } else {
        begin = courseSchedules[beginLesson - 1].begin;
    }

    end = courseSchedules[beginLesson + period - 2].end;
    return { begin, end };
}

const excludedCourseNums = ["A2010561"]

export async function GET() {
    const termBegin = new Date(2025, 9 - 1, 8);
    const tokenData = await loginToMagipoke({ stuNum: process.env.MAGIPOKE_ID || "", password: process.env.MAGIPOKE_PASSWORD || "" });
    let kebiaoData: { data: Course[], nowWeek: number } = { data: [], nowWeek: Math.ceil((new Date().getTime() - termBegin.getTime()) / (1000 * 60 * 60 * 24 * 7)) };
    try {
        kebiaoData = await getKebiao({ token: tokenData.data.token, stuNum: process.env.MAGIPOKE_ID || "" });
    } catch {
        // 晚上会获取不到课表，那就跳过
    }
    const transactionData = await getTransactions({ token: tokenData.data.token });
    // 计算当前时间
    const now = new Date();
    // const current = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const current = "08:55";
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
                try {
                    if (dayNumber === course.hash_day) {
                        // 节筛选
                        // 起止时间
                        todayCourses.push(filterFieldsForCourse(course));
                        const { begin, end } = getScheduleStartAndEnd(course.begin_lesson, course.period);
                        if (current >= begin && current <= end) {
                            currentCourses.push(filterFieldsForCourse(course));
                        }
                    }
                    if (dayNumber + 1 === course.hash_day) {
                        tomorrowCourses.push(filterFieldsForCourse(course));
                    }
                } catch (e) {
                    console.error("Error processing course:", course, e);
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
                if (dayNumber === date.day) {
                    todayCourses.push({
                        name: transaction.title,
                        location: transaction.content,
                        ...getScheduleStartAndEnd(date.begin_lesson, date.period),
                    })
                    // 判断是否在上课时间内
                    const { begin, end } = getScheduleStartAndEnd(date.begin_lesson, date.period);
                    if (current >= begin && current <= end) {
                        currentCourses.push({
                            name: transaction.title,
                            location: transaction.content,
                            begin,
                            end,
                        })
                    }
                }
                // 明天
                if (dayNumber + 1 === date.day) {
                    tomorrowCourses.push({
                        name: transaction.title,
                        location: transaction.content,
                        ...getScheduleStartAndEnd(date.begin_lesson, date.period),
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