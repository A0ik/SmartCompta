import Stripe from 'stripe';

// Initialiser Stripe (sera undefined si la clé n'est pas configurée)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

interface PaymentLinkResult {
  success: boolean;
  url?: string;
  paymentLinkId?: string;
  error?: string;
}

interface PaymentLinkParams {
  montantTTC: number; // en euros
  numeroFacture: string;
  raisonSociale: string;
  prestation: string;
  expiresInDays?: number; // expiration du lien (défaut: 30 jours)
}

/**
 * Crée un lien de paiement Stripe pour une facture
 */
export async function creerLienPaiement(params: PaymentLinkParams): Promise<PaymentLinkResult> {
  if (!stripe) {
    return { 
      success: false, 
      error: 'Stripe non configuré. Veuillez ajouter STRIPE_SECRET_KEY dans .env' 
    };
  }

  const { montantTTC, numeroFacture, raisonSociale, prestation, expiresInDays = 30 } = params;

  try {
    // Créer un produit temporaire pour cette facture
    const product = await stripe.products.create({
      name: `Facture ${numeroFacture}`,
      description: `${prestation} - ${raisonSociale}`,
      metadata: {
        numeroFacture,
        raisonSociale,
      },
    });

    // Créer un prix pour ce produit
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(montantTTC * 100), // Stripe utilise les centimes
      currency: 'eur',
    });

    // Calculer la date d'expiration
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);

    // Créer le lien de paiement
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        numeroFacture,
        raisonSociale,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement-confirme?facture=${numeroFacture}`,
        },
      },
      // Note: expires_at n'est pas disponible sur payment_links dans toutes les versions
      // On utilisera le suivi manuel si nécessaire
    });

    return {
      success: true,
      url: paymentLink.url,
      paymentLinkId: paymentLink.id,
    };
  } catch (error) {
    console.error('Erreur Stripe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue Stripe',
    };
  }
}

/**
 * Vérifie le statut d'un paiement
 */
export async function verifierPaiement(paymentLinkId: string): Promise<{
  paid: boolean;
  error?: string;
}> {
  if (!stripe) {
    return { paid: false, error: 'Stripe non configuré' };
  }

  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_link: paymentLinkId,
      limit: 1,
    });

    const session = sessions.data[0];
    return { paid: session?.payment_status === 'paid' };
  } catch (error) {
    return { 
      paid: false, 
      error: error instanceof Error ? error.message : 'Erreur vérification' 
    };
  }
}

export { stripe };
