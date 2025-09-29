export async function fetchCurrentCourse(): Promise<{
    currentCourses: { name: string, begin: string, end: string, location: string }[], nowWeek: number
}> {
    const res = await fetch('/api/kebiao', { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to fetch kebiao');
    }
    return res.json();
}