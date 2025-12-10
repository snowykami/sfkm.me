if (typeof window !== 'undefined') {
  throw new TypeError('This module is server-only and must not be imported from client code.')
}

export async function loginToMagipoke({ stuNum, password }: { stuNum: string, password: string }): Promise<{ data: { token: string, refreshToken: string } }> {
  const res = await fetch('https://be-prod.redrock.cqupt.edu.cn/magipoke/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stuNum, idNum: password }),
  })

  return await res.json()
}

export interface Course {
  hash_day: number
  hash_lesson: number
  course: string
  teacher: string
  course_num: string
  type: string
  classroom: string
  day: string
  lesson: string
  rawWeek: string
  weekModel: string
  period: number
  week: number[]
  begin_lesson: number
  week_begin: number
  week_end: number
}

export async function getKebiao({ token, stuNum }: { token: string, stuNum: string }): Promise<{ data: Course[], nowWeek: number }> {
  const res = await fetch('https://be-prod.redrock.cqupt.edu.cn/magipoke-jwzx/kebiao', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stuNum }),
  })

  return await res.json()
}

export interface Transaction {
  id: number
  time: number
  title: string
  content: string
  date: [{
    begin_lesson: number
    period: number
    day: number
    week: number[]
  }]
}

export async function getTransactions({ token }: { token: string }): Promise<{ data: Transaction[] }> {
  const res = await fetch('https://be-prod.redrock.cqupt.edu.cn/magipoke-reminder/Person/getTransaction', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'App-Version': '74',
      'Content-Type': 'application/json',
    },
  })
  return await res.json()
}
