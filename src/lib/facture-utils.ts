import prisma from './prisma';

/**
 * Génère le prochain numéro de facture de manière atomique
 * Format: FA-2026-0001
 */
export async function getNextFactureNumber(): Promise<{
  numeroSequentiel: number;
  prefixe: string;
  numeroComplet: string;
}> {
  const anneeEnCours = new Date().getFullYear();
  const prefixe = `FA-${anneeEnCours}-`;

  // Utiliser une transaction pour garantir l'atomicité
  const result = await prisma.$transaction(async (tx) => {
    // Récupérer ou créer la séquence
    let sequence = await tx.sequence.findUnique({
      where: { id: 'FACTURE_SEQ' },
    });

    if (!sequence) {
      // Première facture de l'année
      sequence = await tx.sequence.create({
        data: {
          id: 'FACTURE_SEQ',
          dernierNumero: 0,
          annee: anneeEnCours,
        },
      });
    }

    // Vérifier si on doit réinitialiser pour une nouvelle année
    if (sequence.annee !== anneeEnCours) {
      sequence = await tx.sequence.update({
        where: { id: 'FACTURE_SEQ' },
        data: {
          dernierNumero: 0,
          annee: anneeEnCours,
        },
      });
    }

    // Incrémenter le numéro
    const nouveauNumero = sequence.dernierNumero + 1;

    // Mettre à jour la séquence
    await tx.sequence.update({
      where: { id: 'FACTURE_SEQ' },
      data: { dernierNumero: nouveauNumero },
    });

    return nouveauNumero;
  });

  const numeroComplet = `${prefixe}${result.toString().padStart(4, '0')}`;

  return {
    numeroSequentiel: result,
    prefixe,
    numeroComplet,
  };
}

/**
 * Calcule les montants de la facture
 */
export function calculerMontants(montantHT: number, tauxTVA: number = 20): {
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
} {
  const montantTVA = Math.round(montantHT * (tauxTVA / 100) * 100) / 100;
  const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;

  return {
    montantHT: Math.round(montantHT * 100) / 100,
    tauxTVA,
    montantTVA,
    montantTTC,
  };
}

/**
 * Formater un montant en euros
 */
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant);
}

/**
 * Formater une date en français
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
