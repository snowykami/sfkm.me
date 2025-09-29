import type { SimplifyCourse } from "@/app/api/kebiao/route";

export async function fetchCurrentCourse(): Promise<{
    currentCourses: SimplifyCourse[], nowWeek: number
    todayCourses: SimplifyCourse[]
}> {
    const res = await fetch('/api/kebiao', { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to fetch kebiao');
    }
    return res.json();
}