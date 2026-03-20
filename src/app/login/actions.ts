'use server'

import { cookies } from 'next/headers'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password' }
  }

  if (email === 'info@sushiacademy.it' && password === 'SushiVault2026!') {
    const cookieStore = await cookies()
    cookieStore.set('tv_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    return { success: true }
  }

  return { error: 'Invalid email or password' }
}
