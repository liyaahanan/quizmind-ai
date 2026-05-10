import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { quizId } = await request.json()
    
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 })
    }

    // Get student's assigned set using the database function
    const { data: assignedSet, error: assignmentError } = await supabase
      .rpc('get_student_quiz_set', {
        p_student_id: user.id,
        p_quiz_id: quizId
      })

    if (assignmentError) {
      console.error('Assignment error:', assignmentError)
      return NextResponse.json({ error: 'Failed to assign quiz set' }, { status: 500 })
    }

    if (!assignedSet) {
      return NextResponse.json({ error: 'No quiz set assigned' }, { status: 404 })
    }

    return NextResponse.json({ 
      assignedSet,
      studentId: user.id,
      quizId 
    })

  } catch (error) {
    console.error('Assign quiz set error:', error)
    const message = error instanceof Error ? error.message : 'Failed to assign quiz set'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 })
    }

    // Get student's assigned set
    const { data: assignedSet, error: assignmentError } = await supabase
      .rpc('get_student_quiz_set', {
        p_student_id: user.id,
        p_quiz_id: quizId
      })

    if (assignmentError) {
      console.error('Assignment error:', assignmentError)
      return NextResponse.json({ error: 'Failed to get quiz set assignment' }, { status: 500 })
    }

    if (!assignedSet) {
      return NextResponse.json({ error: 'No quiz set assigned' }, { status: 404 })
    }

    return NextResponse.json({ 
      assignedSet,
      studentId: user.id,
      quizId 
    })

  } catch (error) {
    console.error('Get quiz set error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get quiz set assignment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
