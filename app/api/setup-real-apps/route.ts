import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // First, clear any dummy/sample apps to avoid confusion
    await sql`
      DELETE FROM apps 
      WHERE slug IN (
        'dashboard-analytics', 'notes-app', 'file-manager', 'calendar', 
        'team-chat', 'project-manager', 'code-editor', 'api-tester', 
        'db-browser', 'email-client', 'image-editor', 'system-monitor'
      )
    `;

    // Insert the REAL apps based on actual app.config.json files
    await sql`
      INSERT INTO apps (name, slug, description, path, icon, category, tags, is_featured, requires_auth, is_active)
      VALUES 
        -- Base Template - The main chat app (SACRED - your core app)
        ('Chat Base Template', 'base-template', 'Advanced chat application with LangChain integration, memory management, and authentication', '/chat', '💬', 'Communication', ARRAY['chat', 'langchain', 'ai'], true, true, true),
        
        -- Dashboard App - Your real analytics dashboard
        ('Analytics Dashboard', 'dashboard', 'Real-time analytics and reporting dashboard with interactive charts and data visualization', '/dashboard', '📊', 'Analytics', ARRAY['analytics', 'dashboard', 'charts', 'reporting'], true, true, true),
        
        -- Notes App - Your real notes application  
        ('Notes App', 'notes', 'Simple note-taking application with rich text support and cloud sync', '/notes', '📝', 'Productivity', ARRAY['notes', 'editor', 'sync'], false, true, true)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        path = EXCLUDED.path,
        icon = EXCLUDED.icon,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        is_featured = EXCLUDED.is_featured,
        requires_auth = EXCLUDED.requires_auth,
        is_active = EXCLUDED.is_active
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Real apps setup successfully - removed dummy apps and added your actual applications',
      apps: [
        'Chat Base Template (base-template) - Your main chat app',
        'Analytics Dashboard (dashboard) - Your dashboard app', 
        'Notes App (notes) - Your notes app'
      ]
    });
  } catch (error) {
    console.error('Error setting up real apps:', error);
    return NextResponse.json(
      { error: 'Failed to setup real apps' },
      { status: 500 }
    );
  }
}