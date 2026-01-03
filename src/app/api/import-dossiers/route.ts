import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'Le fichier est vide' },
        { status: 400 }
      );
    }

    // Mapper les colonnes du fichier vers notre schéma
    // Colonnes attendues: Numéro, Raison sociale, Adresse, Siret, CodeNaf, Centre, Periode, Domaine d'activité
    const dossiers = jsonData.map((row) => ({
      numDossier: String(row['Numéro'] || row['Numero'] || row['numDossier'] || '').trim(),
      raisonSociale: String(row['Raison sociale'] || row['RaisonSociale'] || row['Nom'] || '').trim(),
      adresse: String(row['Adresse'] || '').trim() || null,
      siret: String(row['Siret'] || row['SIRET'] || '').trim() || null,
      codeNaf: String(row['CodeNaf'] || row['Code NAF'] || row['NAF'] || '').trim() || null,
      centre: String(row['Centre'] || '').trim() || null,
      periode: String(row['Periode'] || row['Période'] || '').trim() || null,
      domaineActivite: String(row["Domaine d'activité"] || row['DomaineActivite'] || row['Activite'] || '').trim() || null,
    })).filter(d => d.numDossier && d.raisonSociale); // Filtrer les lignes vides

    // Statistiques d'import
    let created = 0;
    let updated = 0;
    let errors: string[] = [];

    // Upsert chaque dossier
    for (const dossier of dossiers) {
      try {
        await prisma.client.upsert({
          where: { numDossier: dossier.numDossier },
          update: {
            raisonSociale: dossier.raisonSociale,
            adresse: dossier.adresse,
            siret: dossier.siret,
            codeNaf: dossier.codeNaf,
            centre: dossier.centre,
            periode: dossier.periode,
            domaineActivite: dossier.domaineActivite,
          },
          create: dossier,
        });

        // Vérifier si c'était une création ou une mise à jour
        const existing = await prisma.client.findUnique({
          where: { numDossier: dossier.numDossier },
        });
        
        if (existing) {
          // C'est forcément existant maintenant, on compte comme update si pas nouveau
          updated++;
        }
      } catch (error) {
        errors.push(`Erreur dossier ${dossier.numDossier}: ${error instanceof Error ? error.message : 'Inconnue'}`);
      }
    }

    // Recompter pour avoir les vraies stats
    const totalClients = await prisma.client.count();

    return NextResponse.json({
      success: true,
      message: `Import terminé`,
      stats: {
        lignesTraitees: dossiers.length,
        totalDossiers: totalClients,
        erreurs: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Max 10 erreurs affichées
    });
  } catch (error) {
    console.error('Erreur import:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'import' },
      { status: 500 }
    );
  }
}
