
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('📨 Notification endpoint called. Method:', req.method);
  console.log('Full request URL:', req.url);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request (CORS preflight)');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Creating Supabase client with URL:', Deno.env.get('SUPABASE_URL') ? 'URL exists' : 'URL missing');
    console.log('Service role key exists:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Yes' : 'No');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const payload = await req.json()
    console.log('Raw request payload:', JSON.stringify(payload));
    console.log('Request payload type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload));

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    console.log('Using Resend API key:', Deno.env.get('RESEND_API_KEY') ? 'API key exists' : 'API key missing');

    if (payload.type === 'assignment_submitted') {
      console.log('Processing assignment_submitted notification. Assignment title:', payload.assignment.title);
      
      // Get all writers
      const { data: writers, error: writersError } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('role', 'writer')

      if (writersError) {
        console.error('Error fetching writers:', writersError)
        throw new Error('Failed to fetch writers')
      }

      console.log('Found', writers?.length || 0, 'writers to notify about new assignment');

      let successCount = 0
      let failureCount = 0

      // Send emails to all writers
      if (writers && writers.length > 0) {
        for (const writer of writers) {
          try {
            console.log('Sending email to writer', writer.email, 'about new assignment');
            
            const { data, error } = await resend.emails.send({
              from: 'AssignmentHub <noreply@assignmenthub.org>',
              to: [writer.email],
              subject: `New Assignment Available: ${payload.assignment.title}`,
              html: `
                <h2>New Assignment Available</h2>
                <p>Dear ${writer.full_name || 'Writer'},</p>
                <p>A new assignment has been submitted and is available for you to take:</p>
                <ul>
                  <li><strong>Title:</strong> ${payload.assignment.title}</li>
                  <li><strong>Subject:</strong> ${payload.assignment.subject}</li>
                  ${payload.assignment.description ? `<li><strong>Description:</strong> ${payload.assignment.description}</li>` : ''}
                  ${payload.assignment.due_date ? `<li><strong>Due Date:</strong> ${new Date(payload.assignment.due_date).toLocaleDateString()}</li>` : ''}
                </ul>
                <p>Log in to your dashboard to view and take this assignment.</p>
                <p>Best regards,<br>AssignmentHub Team</p>
              `
            })

            if (error) {
              console.error(`Failed to send email to writer ${writer.email}:`, error)
              failureCount++
            } else {
              console.log(`Email sent successfully to writer ${writer.email}:`, { id: data?.id })
              successCount++
            }
          } catch (emailError) {
            console.error(`Error sending email to writer ${writer.email}:`, emailError)
            failureCount++
          }
        }
      }

      // Send confirmation email to student if they have an account
      if (payload.assignment.is_verified_account && payload.assignment.user_id) {
        try {
          const { data: student, error: studentError } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', payload.assignment.user_id)
            .single()

          if (!studentError && student) {
            console.log('Found student in profiles for confirmation email:', student.email);
            console.log('Sending confirmation email to student:', student.email);
            
            const { data, error } = await resend.emails.send({
              from: 'AssignmentHub <noreply@assignmenthub.org>',
              to: [student.email],
              subject: `Assignment Submitted Successfully: ${payload.assignment.title}`,
              html: `
                <h2>Assignment Submitted Successfully</h2>
                <p>Dear ${student.full_name || 'Student'},</p>
                <p>Your assignment has been submitted successfully and is now available for writers to take:</p>
                <ul>
                  <li><strong>Title:</strong> ${payload.assignment.title}</li>
                  <li><strong>Subject:</strong> ${payload.assignment.subject}</li>
                  ${payload.assignment.description ? `<li><strong>Description:</strong> ${payload.assignment.description}</li>` : ''}
                  ${payload.assignment.due_date ? `<li><strong>Due Date:</strong> ${new Date(payload.assignment.due_date).toLocaleDateString()}</li>` : ''}
                </ul>
                <p>You will receive an email notification when a writer takes your assignment.</p>
                <p>Best regards,<br>AssignmentHub Team</p>
              `
            })

            if (error) {
              console.error('Failed to send confirmation email to student:', error)
            } else {
              console.log('Confirmation email sent successfully to student:', { id: data?.id })
            }
          }
        } catch (studentEmailError) {
          console.error('Error sending confirmation email to student:', studentEmailError)
        }
      }

      console.log('Email sending summary:', successCount, 'successful,', failureCount, 'failed');

    } else if (payload.type === 'assignment_taken') {
      // When a writer takes an assignment, notify the student
      console.log('Processing assignment_taken notification');
      
      // First get the assignment details
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('assignments')
        .select('*')
        .eq('id', payload.assignment_id)
        .single()

      if (assignmentError) {
        console.error('Error fetching assignment for taken notification:', assignmentError)
        throw new Error('Failed to fetch assignment details')
      }

      // Get writer details
      const { data: writer, error: writerError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', assignment.writer_id)
        .single()
      
      // Get student email
      let studentEmail = assignment.student_email;
      let studentName = assignment.student_name;
      
      if (assignment.is_verified_account && assignment.user_id) {
        const { data: student, error: studentError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.user_id)
          .single()
          
        if (!studentError && student) {
          studentEmail = student.email;
          studentName = student.full_name;
        }
      }
      
      if (!studentEmail) {
        throw new Error(`No student email available for assignment ${assignment.id}`);
      }
      
      console.log('Sending assignment taken notification to student:', studentEmail);
      
      const { data, error } = await resend.emails.send({
        from: 'AssignmentHub <noreply@assignmenthub.org>',
        to: [studentEmail],
        subject: `Writer Assigned to Your Assignment: ${assignment.title}`,
        html: `
          <h2>Writer Assigned to Your Assignment</h2>
          <p>Dear ${studentName || 'Student'},</p>
          <p>Great news! A writer has been assigned to your assignment:</p>
          <ul>
            <li><strong>Assignment:</strong> ${assignment.title}</li>
            <li><strong>Subject:</strong> ${assignment.subject}</li>
            <li><strong>Writer:</strong> ${writer?.full_name || writer?.email || 'Professional Writer'}</li>
          </ul>
          <p>The writer will now begin working on your assignment. You can track the progress in your dashboard.</p>
          <p>Best regards,<br>AssignmentHub Team</p>
        `
      })
      
      if (error) {
        console.error('Error sending assignment taken notification:', error)
        throw error
      }
      
      console.log('Assignment taken notification sent successfully:', { id: data?.id })
      
    } else if (payload.type === 'assignment_status_update') {
      // When a writer updates assignment status, notify the student
      console.log('Processing assignment_status_update notification');
      
      const assignment = payload.assignment;
      const writer = payload.writer;
      const status = payload.status;
      
      // Get student email
      let studentEmail = assignment.student_email;
      let studentName = assignment.student_name;
      
      if (assignment.is_verified_account && assignment.user_id) {
        const { data: student, error: studentError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.user_id)
          .single()
          
        if (!studentError && student) {
          studentEmail = student.email;
          studentName = student.full_name;
        }
      }
      
      if (!studentEmail) {
        console.log('No student email available for status update notification');
        return new Response(JSON.stringify({ success: true, message: 'No email to send to' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      const statusDisplay = status.replace('_', ' ');
      
      console.log('Sending status update notification to student:', studentEmail);
      
      const { data, error } = await resend.emails.send({
        from: 'AssignmentHub <noreply@assignmenthub.org>',
        to: [studentEmail],
        subject: `Assignment Status Update: ${assignment.title}`,
        html: `
          <h2>Assignment Status Update</h2>
          <p>Dear ${studentName || 'Student'},</p>
          <p>Your assignment status has been updated:</p>
          <ul>
            <li><strong>Assignment:</strong> ${assignment.title}</li>
            <li><strong>Subject:</strong> ${assignment.subject}</li>
            <li><strong>New Status:</strong> ${statusDisplay}</li>
            <li><strong>Writer:</strong> ${writer?.full_name || writer?.email || 'Professional Writer'}</li>
          </ul>
          <p>You can view the updated status in your dashboard.</p>
          <p>Best regards,<br>AssignmentHub Team</p>
        `
      })
      
      if (error) {
        console.error('Error sending status update notification:', error)
        throw error
      }
      
      console.log('Status update notification sent successfully:', { id: data?.id })
      
    } else if (payload.type === 'assignment_progress_update') {
      // When a writer updates assignment progress, notify the student
      console.log('Processing assignment_progress_update notification');
      
      const assignment = payload.assignment;
      const writer = payload.writer;
      const progress = payload.progress;
      
      // Get student email
      let studentEmail = assignment.student_email;
      let studentName = assignment.student_name;
      
      if (assignment.is_verified_account && assignment.user_id) {
        const { data: student, error: studentError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.user_id)
          .single()
          
        if (!studentError && student) {
          studentEmail = student.email;
          studentName = student.full_name;
        }
      }
      
      if (!studentEmail) {
        console.log('No student email available for progress update notification');
        return new Response(JSON.stringify({ success: true, message: 'No email to send to' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      console.log('Sending progress update notification to student:', studentEmail);
      
      const { data, error } = await resend.emails.send({
        from: 'AssignmentHub <noreply@assignmenthub.org>',
        to: [studentEmail],
        subject: `Assignment Progress Update: ${assignment.title}`,
        html: `
          <h2>Assignment Progress Update</h2>
          <p>Dear ${studentName || 'Student'},</p>
          <p>Your assignment progress has been updated:</p>
          <ul>
            <li><strong>Assignment:</strong> ${assignment.title}</li>
            <li><strong>Subject:</strong> ${assignment.subject}</li>
            <li><strong>Progress:</strong> ${progress}%</li>
            <li><strong>Writer:</strong> ${writer?.full_name || writer?.email || 'Professional Writer'}</li>
          </ul>
          <p>You can view the updated progress in your dashboard.</p>
          <p>Best regards,<br>AssignmentHub Team</p>
        `
      })
      
      if (error) {
        console.error('Error sending progress update notification:', error)
        throw error
      }
      
      console.log('Progress update notification sent successfully:', { id: data?.id })
      
    } else if (payload.type === 'writer_direct_email') {
      // When a writer sends a direct email to a student
      console.log('Processing writer_direct_email notification');
      
      const recipient = payload.recipient;
      const sender = payload.sender;
      const assignment = payload.assignment;
      const message = payload.message;
      
      if (!recipient.email) {
        console.log('No recipient email available for direct email');
        return new Response(JSON.stringify({ success: false, error: 'No recipient email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      
      console.log('Sending direct email to student:', recipient.email);
      
      const { data, error } = await resend.emails.send({
        from: 'AssignmentHub <noreply@assignmenthub.org>',
        to: [recipient.email],
        subject: message.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${message.body.replace(/\n/g, '<br>')}
          </div>
        `
      })
      
      if (error) {
        console.error('Error sending direct email:', error)
        throw error
      }
      
      console.log('Direct email sent successfully:', { id: data?.id })
      
    } else if (payload.type === 'price_update') {
      // When a writer sets/updates price, notify the student
      console.log('Processing price_update notification');
      
      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('assignments')
        .select('*')
        .eq('id', payload.assignment_id)
        .single()

      if (assignmentError) {
        console.error('Error fetching assignment for price update:', assignmentError)
        throw new Error('Failed to fetch assignment details')
      }

      // Get student email
      let studentEmail = assignment.student_email;
      let studentName = assignment.student_name;
      
      if (assignment.is_verified_account && assignment.user_id) {
        const { data: student, error: studentError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.user_id)
          .single()
          
        if (!studentError && student) {
          studentEmail = student.email;
          studentName = student.full_name;
        }
      }
      
      if (!studentEmail) {
        console.log('No student email available for price update notification');
        return new Response(JSON.stringify({ success: true, message: 'No email to send to' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Get writer details
      const { data: writer, error: writerError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', assignment.writer_id)
        .single()
      
      console.log('Sending price update notification to student:', studentEmail);
      
      const { data, error } = await resend.emails.send({
        from: 'AssignmentHub <noreply@assignmenthub.org>',
        to: [studentEmail],
        subject: `Price Set for Your Assignment: ${assignment.title}`,
        html: `
          <h2>Price Set for Your Assignment</h2>
          <p>Dear ${studentName || 'Student'},</p>
          <p>The writer has set a price for your assignment:</p>
          <ul>
            <li><strong>Assignment:</strong> ${assignment.title}</li>
            <li><strong>Subject:</strong> ${assignment.subject}</li>
            <li><strong>Price:</strong> $${payload.price.toFixed(2)}</li>
            <li><strong>Writer:</strong> ${writer?.full_name || writer?.email || 'Professional Writer'}</li>
          </ul>
          <p>You can now proceed to payment by clicking the "Pay Now" button in your dashboard.</p>
          <p>Best regards,<br>AssignmentHub Team</p>
        `
      })
      
      if (error) {
        console.error('Error sending price update notification:', error)
        throw error
      }
      
      console.log('Price update notification sent successfully:', { id: data?.id })
      
    } else {
      console.log('Unknown notification type:', payload.type);
      throw new Error(`Unknown notification type: ${payload.type}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in notify-message function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
