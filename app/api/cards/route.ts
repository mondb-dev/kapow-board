import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cards = await db.card.findMany({
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description } = body as { title?: string; description?: string };

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
  }

  const card = await db.card.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      creatorId: session.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { events: true } },
    },
  });

  return NextResponse.json(card, { status: 201 });
}
