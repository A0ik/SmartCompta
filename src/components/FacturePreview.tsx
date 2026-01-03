'use client';

interface FactureData {
  numeroComplet: string;
  date: Date;
  prestation: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  stripePaymentLink?: string | null;
  client: {
    numDossier: string;
    raisonSociale: string;
    adresse?: string | null;
    siret?: string | null;
  };
}

interface CabinetInfo {
  nom: string;
  adresse: string;
  siret: string;
  email: string;
  telephone: string;
}

interface FacturePreviewProps {
  facture: FactureData | null;
  cabinet?: CabinetInfo;
}

const defaultCabinet: CabinetInfo = {
  nom: 'Cabinet Comptable',
  adresse: '123 Rue de la Comptabilité, 75001 Paris',
  siret: '123 456 789 00001',
  email: 'contact@cabinet.fr',
  telephone: '01 23 45 67 89',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatMontant(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export default function FacturePreview({ facture, cabinet = defaultCabinet }: FacturePreviewProps) {
  // Placeholder quand pas de facture
  if (!facture) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-center">
          La prévisualisation de la facture<br />apparaîtra ici
        </p>
      </div>
    );
  }

  // Prévisualisation HTML stylisée (format A4)
  return (
    <div className="h-full overflow-auto bg-gray-100 p-4">
      <div 
        className="mx-auto bg-white shadow-xl relative"
        style={{ 
          width: '100%',
          maxWidth: '595px',
          minHeight: '842px',
        }}
      >
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-black mb-8">
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-black mb-2">{cabinet.nom}</h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                {cabinet.adresse}
                <br />SIRET: {cabinet.siret}
                <br />{cabinet.email} | {cabinet.telephone}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-black">FACTURE</h2>
              <p className="text-sm text-gray-600 mt-2 font-mono">{facture.numeroComplet}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(facture.date)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-gray-100 rounded p-4 md:p-5 mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Facturer à</p>
            <p className="font-bold text-black mb-1">{facture.client.raisonSociale}</p>
            <p className="text-sm text-gray-700">
              Dossier: <span className="font-mono">{facture.client.numDossier}</span>
              {facture.client.adresse && <><br />{facture.client.adresse}</>}
              {facture.client.siret && <><br />SIRET: {facture.client.siret}</>}
            </p>
          </div>

          {/* Table */}
          <div className="mb-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="flex bg-black text-white text-xs font-bold uppercase tracking-wider">
                <div className="flex-[3] p-3">Description</div>
                <div className="flex-1 p-3 text-right">Montant HT</div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="flex-[3] p-3 text-sm text-gray-700">{facture.prestation}</div>
                <div className="flex-1 p-3 text-sm text-gray-700 text-right whitespace-nowrap">
                  {formatMontant(facture.montantHT)}
                </div>
              </div>
            </div>
          </div>

          {/* Totaux */}
          <div className="ml-auto w-full sm:w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Sous-total HT</span>
              <span className="text-sm font-medium">{formatMontant(facture.montantHT)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">TVA ({facture.tauxTVA}%)</span>
              <span className="text-sm font-medium">{formatMontant(facture.montantTVA)}</span>
            </div>
            <div className="flex justify-between bg-black text-white p-3 mt-1">
              <span className="font-bold">Total TTC</span>
              <span className="font-bold text-lg">{formatMontant(facture.montantTTC)}</span>
            </div>
          </div>

          {/* Paiement */}
          <div className="mt-8 md:mt-10 border-2 border-black rounded p-4 md:p-5">
            <h3 className="font-bold uppercase tracking-wider mb-3 text-sm">Modalités de paiement</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Paiement à réception de facture.
              <br />
              En cas de retard de paiement, des pénalités de retard seront appliquées.
            </p>
            {facture.stripePaymentLink && (
              <a 
                href={facture.stripePaymentLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payer en ligne
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-8 right-8 text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            {cabinet.nom} • SIRET: {cabinet.siret}
          </p>
        </div>
      </div>
    </div>
  );
}
