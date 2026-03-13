import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { CardStatus } from '@prisma/client';

interface Params {
  params: Promise<{ cardId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cardId } = await params;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true, image: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json(card);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cardId } = await params;
  const body = await req.json();

  const allowedFields = ['status', 'repoUrl', 'deployUrl', 'title', 'description'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if ('status' in updates && !Object.values(CardStatus).includes(updates.status as CardStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const card = await db.card.update({
    where: { id: cardId },
    data: updates,
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cardId } = await params;

  await db.card.delete({ where: { id: cardId } });

  return NextResponse.json({ ok: true });
}
