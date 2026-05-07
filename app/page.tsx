'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { 
  Brain, 
  Zap, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  BarChart3,
  Target,
  Menu,
  X,
  User,
  GraduationCap
} from 'lucide-react'

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,#8b5cf633,transparent_50%),radial-gradient(circle_at_80%_80%,#06b6d433,transparent_50%),radial-gradient(circle_at_40%_20%,#f9731633,transparent_50%)]" />
      <div className="fixed inset-0 bg-black/40" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600" />
          <span className="text-xl font-bold">QuizMind AI</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex items-center gap-3"
        >
          <Link 
            href="/login/student" 
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 backdrop-blur-sm transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50"
          >
            Student Portal
          </Link>
          <Link 
            href="/login/professor" 
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur-sm transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50"
          >
            Professor Portal
          </Link>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden rounded-lg border border-white/20 bg-white/5 p-2 backdrop-blur-sm transition-all hover:bg-white/10"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-x-0 top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10"
          >
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600" />
                  <span className="text-xl font-bold">QuizMind AI</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg border border-white/20 bg-white/5 p-2 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <Link
                  href="/login/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-sm transition-all hover:bg-emerald-500/20"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Student Portal</h3>
                    <p className="text-sm text-gray-400">Take quizzes and track progress</p>
                  </div>
                </Link>
                
                <Link
                  href="/login/professor"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 backdrop-blur-sm transition-all hover:bg-cyan-500/20"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Professor Portal</h3>
                    <p className="text-sm text-gray-400">Create quizzes and manage students</p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
            >
              <Zap className="h-4 w-4" />
              <span>AI-Powered Quiz Generation</span>
            </motion.div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-7xl">
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                Transform Education
              </span>
              <br />
              <span className="text-white">with Intelligent Quizzes</span>
            </h1>
            
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-300 lg:text-xl">
              Generate adaptive, engaging quizzes in seconds using advanced AI. 
              Create personalized learning experiences that adapt to every student's needs.
            </p>
            
            {/* Role Selection Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-200">Choose Your Portal</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
                {/* Student Portal Card */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40"
                >
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">Student Portal</h3>
                    <p className="mb-4 text-sm text-gray-300">
                      Take quizzes, track your progress, and improve your learning with AI-powered assessments.
                    </p>
                    <Link
                      href="/login/student"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>

                {/* Professor Portal Card */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40"
                >
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">Professor Portal</h3>
                    <p className="mb-4 text-sm text-gray-300">
                      Create quizzes, manage students, and track performance with advanced AI analytics.
                    </p>
                    <Link
                      href="/login/professor"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/40"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>
              </div>
            </motion.div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all hover:bg-white/10"
              >
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            {[
              { label: 'Quizzes Generated', value: '10K+', icon: BarChart3 },
              { label: 'Active Students', value: '50K+', icon: Users },
              { label: 'Accuracy Rate', value: '94%', icon: Target }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg text-gray-300">
              Everything you need to create engaging, adaptive learning experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Generation',
                description: 'Generate high-quality quizzes from syllabus text, PDFs, or learning objectives using advanced AI models.',
                gradient: 'from-cyan-500 to-blue-600'
              },
              {
                icon: Target,
                title: 'Adaptive Difficulty',
                description: 'Questions automatically adjust difficulty based on student performance and learning objectives.',
                gradient: 'from-violet-500 to-purple-600'
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Track student progress, identify knowledge gaps, and optimize teaching strategies with detailed insights.',
                gradient: 'from-fuchsia-500 to-pink-600'
              },
              {
                icon: Users,
                title: 'Collaborative Learning',
                description: 'Enable student groups, peer reviews, and collaborative quiz sessions for enhanced engagement.',
                gradient: 'from-emerald-500 to-teal-600'
              },
              {
                icon: Shield,
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with encrypted data storage and reliable uptime guarantees.',
                gradient: 'from-orange-500 to-red-600'
              },
              {
                icon: Clock,
                title: 'Time-Saving Tools',
                description: 'Reduce quiz creation time by 90% with automated grading and instant feedback systems.',
                gradient: 'from-indigo-500 to-blue-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-white/10"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Trusted by Educators
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: 'Dr. Sarah Chen',
                role: 'Computer Science Professor',
                content: 'QuizMind AI has revolutionized how I create assessments. What used to take hours now takes minutes, and the quality is exceptional.',
                rating: 5
              },
              {
                name: 'Prof. Michael Rodriguez',
                role: 'Mathematics Department',
                content: 'The adaptive difficulty feature is game-changing. My students are more engaged and their performance has improved significantly.',
                rating: 5
              },
              {
                name: 'Dr. Emily Thompson',
                role: 'Biology Instructor',
                content: 'The analytics dashboard gives me insights I never had before. I can now tailor my teaching based on real student data.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-gray-300">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-12 text-center backdrop-blur-sm"
          >
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Join thousands of educators using AI to create engaging, adaptive learning experiences.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/login/professor"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 text-lg font-semibold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600" />
              <span className="text-lg font-bold">QuizMind AI</span>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition">Privacy</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition">Terms</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition">Support</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            © 2024 QuizMind AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}