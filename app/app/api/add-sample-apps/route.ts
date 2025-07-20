import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Insert sample apps for testing
    await sql`
      INSERT INTO apps (name, slug, description, path, icon, category, tags, icon_url, is_featured, requires_auth, is_active)
      VALUES 
        ('Dashboard Analytics', 'dashboard-analytics', 'Comprehensive analytics dashboard with real-time data visualization', '/apps/dashboard', '📊', 'Analytics', ARRAY['analytics', 'dashboard', 'charts'], null, true, true, true),
        ('Notes & Documents', 'notes-app', 'Create, edit and organize your notes and documents', '/apps/notes', '📝', 'Productivity', ARRAY['notes', 'documents', 'editor'], null, false, true, true),
        ('File Manager', 'file-manager', 'Manage and organize your files with drag-and-drop interface', '/apps/files', '📁', 'Utilities', ARRAY['files', 'storage', 'manager'], null, false, true, true),
        ('Calendar Scheduler', 'calendar', 'Schedule appointments and manage your calendar', '/apps/calendar', '📅', 'Productivity', ARRAY['calendar', 'schedule', 'events'], null, true, true, true),
        ('Team Chat', 'team-chat', 'Real-time team communication and collaboration', '/apps/chat', '💬', 'Communication', ARRAY['chat', 'team', 'collaboration'], null, false, true, true),
        ('Project Manager', 'project-manager', 'Manage projects, tasks, and team collaboration', '/apps/projects', '🎯', 'Project Management', ARRAY['projects', 'tasks', 'management'], null, true, true, true),
        ('Code Editor', 'code-editor', 'Online code editor with syntax highlighting and Git integration', '/apps/code', '💻', 'Development', ARRAY['code', 'editor', 'programming'], null, false, true, true),
        ('API Testing Tool', 'api-tester', 'Test and debug REST APIs with comprehensive request builder', '/apps/api-test', '🔧', 'Development', ARRAY['api', 'testing', 'debugging'], null, false, true, true),
        ('Database Browser', 'db-browser', 'Browse and query your databases with visual interface', '/apps/database', '🗄️', 'Development', ARRAY['database', 'sql', 'browser'], null, false, false, true),
        ('Email Client', 'email-client', 'Modern email client with advanced filtering and organization', '/apps/email', '📧', 'Communication', ARRAY['email', 'client', 'inbox'], null, false, false, true),
        ('Image Editor', 'image-editor', 'Edit and enhance images with professional tools', '/apps/images', '🎨', 'Design', ARRAY['images', 'editor', 'design'], null, true, false, true),
        ('System Monitor', 'system-monitor', 'Monitor system performance and resource usage', '/apps/monitor', '📈', 'System', ARRAY['monitor', 'performance', 'system'], null, false, false, true)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        is_featured = EXCLUDED.is_featured
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Sample apps added successfully' 
    });
  } catch (error) {
    console.error('Error adding sample apps:', error);
    return NextResponse.json(
      { error: 'Failed to add sample apps' },
      { status: 500 }
    );
  }
}