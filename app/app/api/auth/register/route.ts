import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@chat/auth';
import { SecurityValidator } from '@chat/shared-types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    const { email, password, name } = body;

    // Validate email
    const emailValidation = SecurityValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = SecurityValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validate name if provided
    let sanitizedName = name;
    if (name) {
      const nameValidation = SecurityValidator.validateText(name, 100);
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        );
      }
      sanitizedName = nameValidation.sanitized;
    }

    // Create user with default 'user' role
    const user = await createUser(emailValidation.sanitized!, password, sanitizedName);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for duplicate email
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create account',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}