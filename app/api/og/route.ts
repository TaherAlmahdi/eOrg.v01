import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // আপনার মূল ডেটা সোর্স বা ফাইল থেকে বইয়ের ডাটা এখানে আনবেন।
    // আপাতত ফিক্সড বা খালি অ্যারে দিয়ে এপিআই সচল রাখা হলো:
    const allBooksData: any[] = []; 

    return NextResponse.json({
      books: allBooksData.slice((page - 1) * limit, page * limit),
      availableAlphabets: ['সব'],
      total: allBooksData.length,
      page,
      limit,
      hasMore: false,
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', books: [], total: 0, hasMore: false, availableAlphabets: ['সব'] },
      { status: 500 }
    );
  }
}