import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    let clients;

    if (search) {
      // Recherche par numéro de dossier ou raison sociale
      clients = await prisma.client.findMany({
        where: {
          OR: [
            { numDossier: { contains: search } },
            { raisonSociale: { contains: search } },
          ],
        },
        orderBy: { raisonSociale: 'asc' },
        take: limit,
      });
    } else {
      clients = await prisma.client.findMany({
        orderBy: { raisonSociale: 'asc' },
        take: limit,
      });
    }

    return NextResponse.json({
      success: true,
      clients,
      total: await prisma.client.count(),
    });
  } catch (error) {
    console.error('Erreur récupération dossiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dossiers' },
      { status: 500 }
    );
  }
}

// Récupérer un dossier spécifique par numéro
export async function POST(request: NextRequest) {
  try {
    const { numDossier } = await request.json();

    if (!numDossier) {
      return NextResponse.json(
        { error: 'Numéro de dossier requis' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { numDossier: numDossier.toUpperCase().trim() },
      include: {
        factures: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Dossier non trouvé', numDossier },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du dossier' },
      { status: 500 }
    );
  }
}
