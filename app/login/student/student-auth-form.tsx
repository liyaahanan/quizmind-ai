'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, GraduationCap } from 'lucide-react'

const toReadableAuthError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const lower = message.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Cannot reach Supabase. Verify NEXT_PUBLIC_SUPABASE_URL, internet access, and that your Supabase project is active.'
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Email is not confirmed. Confirm the account email before logging in.'
  }

  if (lower.includes('signup is disabled') || lower.includes('auth provider')) {
    return 'Email/password authentication appears disabled in Supabase Auth settings.'
  }

  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.'
  }

  if (lower.includes('password should be at least')) {
    return 'Password is too short. Please use at least 6 characters.'
  }

  return message
}

export default function StudentAuthForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const supabase = createClient()

      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error('Email and password are required.')
      }

      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        })

        if (error) throw error

        if (!data.session) {
          throw new Error('Login succeeded but no session was returned.')
        }

        setSuccessMessage('Login successful! Redirecting...')
        setTimeout(() => {
          router.replace('/student/dashboard')
          router.refresh()
        }, 1000)
      } else {
        // Signup flow
        if (!formData.fullName.trim()) {
          throw new Error('Full name is required.')
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
            },
          },
        })

        if (error) throw error

        if (!data.user) {
          throw new Error('Signup failed. Please try again.')
        }

        // Create student record in public.students table
        const { error: studentError } = await supabase.from('students').insert({
          id: data.user.id,
          email: formData.email.trim(),
          full_name: formData.fullName.trim(),
        })

        if (studentError) {
          // Clean up auth user if student record creation fails
          await supabase.auth.signOut()
          throw new Error(`Account created but profile setup failed: ${studentError.message}`)
        }

        setSuccessMessage('Account created successfully! You can now log in.')
        setIsLogin(true)
        setFormData({ ...formData, password: '' })
      }
    } catch (error) {
      setErrorMessage(toReadableAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600"
        >
          <GraduationCap className="h-6 w-6 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-white">
          {isLogin ? 'Welcome Back' : 'Join QuizMind'}
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          {isLogin 
            ? 'Sign in to access your quizzes and track your progress'
            : 'Create an account to start taking quizzes and learning'
          }
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex rounded-lg border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            isLogin
              ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            !isLogin
              ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name (only for signup) */}
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label>
                <span className="mb-1 block text-sm text-gray-300">Full Name</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 pl-10 pr-4 py-3 text-white outline-none ring-cyan-500 transition focus:ring-2"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <label>
          <span className="mb-1 block text-sm text-gray-300">Email</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 pl-10 pr-4 py-3 text-white outline-none ring-cyan-500 transition focus:ring-2"
              placeholder="student@example.com"
              required
            />
          </div>
        </label>

        {/* Password */}
        <label>
          <span className="mb-1 block text-sm text-gray-300">Password</span>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 pl-10 pr-12 py-3 text-white outline-none ring-cyan-500 transition focus:ring-2"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {errorMessage}
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 transition hover:text-cyan-300"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </motion.div>
  )
}
