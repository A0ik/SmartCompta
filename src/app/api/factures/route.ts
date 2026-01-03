import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Liste des factures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (statut) {
      where.statut = statut;
    }

    const factures = await prisma.facture.findMany({
      where,
      include: {
        client: {
          select: {
            numDossier: true,
            raisonSociale: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await prisma.facture.count({ where });

    return NextResponse.json({
      success: true,
      factures,
      total,
    });
  } catch (error) {
    console.error('Erreur récupération factures:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une facture
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, statut } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de facture requis' },
        { status: 400 }
      );
    }

    const facture = await prisma.facture.update({
      where: { id },
      data: { statut },
      include: {
        client: true,
      },
    });

    return NextResponse.json({
      success: true,
      facture,
    });
  } catch (error) {
    console.error('Erreur mise à jour facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une facture
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de facture requis' },
        { status: 400 }
      );
    }

    // On ne supprime pas vraiment, on marque comme annulée
    const facture = await prisma.facture.update({
      where: { id },
      data: { statut: 'ANNULEE' },
    });

    return NextResponse.json({
      success: true,
      facture,
      message: 'Facture annulée',
    });
  } catch (error) {
    console.error('Erreur annulation facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
