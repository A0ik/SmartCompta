'use client';

import { useState, useEffect } from 'react';
import { Check, X, AlertCircle, CreditCard } from 'lucide-react';

interface Client {
  id: string;
  numDossier: string;
  raisonSociale: string;
  adresse?: string | null;
  siret?: string | null;
}

interface FactureFormData {
  numDossier: string;
  montantHT: number;
  prestation: string;
}

interface FactureFormProps {
  initialData?: Partial<FactureFormData>;
  selectedClient?: Client | null;
  onSubmit: (data: FactureFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FactureForm({
  initialData,
  selectedClient,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FactureFormProps) {
  const [formData, setFormData] = useState<FactureFormData>({
    numDossier: initialData?.numDossier || '',
    montantHT: initialData?.montantHT || 0,
    prestation: initialData?.prestation || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientValide, setClientValide] = useState<Client | null>(selectedClient || null);

  // Mettre à jour quand les données initiales changent (depuis la transcription)
  useEffect(() => {
    if (initialData) {
      setFormData({
        numDossier: initialData.numDossier || formData.numDossier,
        montantHT: initialData.montantHT || formData.montantHT,
        prestation: initialData.prestation || formData.prestation,
      });
    }
  }, [initialData]);

  // Mettre à jour quand un client est sélectionné dans la liste
  useEffect(() => {
    if (selectedClient) {
      setFormData(prev => ({ ...prev, numDossier: selectedClient.numDossier }));
      setClientValide(selectedClient);
      setErrors(prev => ({ ...prev, numDossier: '' }));
    }
  }, [selectedClient]);

  // Vérifier le dossier quand le numéro change
  useEffect(() => {
    const verifierDossier = async () => {
      if (!formData.numDossier || formData.numDossier.length < 2) {
        setClientValide(null);
        return;
      }

      try {
        const response = await fetch('/api/dossiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numDossier: formData.numDossier }),
        });
        
        const data = await response.json();
        
        if (data.success && data.client) {
          setClientValide(data.client);
          setErrors(prev => ({ ...prev, numDossier: '' }));
        } else {
          setClientValide(null);
          setErrors(prev => ({ ...prev, numDossier: 'Dossier non trouvé' }));
        }
      } catch {
        setClientValide(null);
      }
    };

    const debounce = setTimeout(verifierDossier, 500);
    return () => clearTimeout(debounce);
  }, [formData.numDossier]);

  // Calculs TVA
  const montantTVA = formData.montantHT * 0.20;
  const montantTTC = formData.montantHT + montantTVA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.numDossier) {
      newErrors.numDossier = 'Numéro de dossier requis';
    } else if (!clientValide) {
      newErrors.numDossier = 'Dossier non trouvé dans la base';
    }
    
    if (!formData.montantHT || formData.montantHT <= 0) {
      newErrors.montantHT = 'Montant invalide';
    }
    
    if (!formData.prestation.trim()) {
      newErrors.prestation = 'Description requise';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  const formatMontant = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Numéro de dossier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numéro de dossier
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.numDossier}
            onChange={(e) => setFormData({ ...formData, numDossier: e.target.value.toUpperCase() })}
            className={`
              w-full px-4 py-3 rounded-xl border-2 
              focus:outline-none transition-all
              ${errors.numDossier 
                ? 'border-red-300 focus:border-red-500' 
                : clientValide 
                  ? 'border-green-300 focus:border-green-500' 
                  : 'border-gray-200 focus:border-black'
              }
            `}
            placeholder="Ex: AM0028"
          />
          {clientValide && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
          {errors.numDossier && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>
        {clientValide && (
          <p className="mt-2 text-sm text-green-600">
            ✓ {clientValide.raisonSociale}
          </p>
        )}
        {errors.numDossier && (
          <p className="mt-2 text-sm text-red-500">{errors.numDossier}</p>
        )}
      </div>

      {/* Prestation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description de la prestation
        </label>
        <textarea
          value={formData.prestation}
          onChange={(e) => setFormData({ ...formData, prestation: e.target.value })}
          rows={3}
          className={`
            w-full px-4 py-3 rounded-xl border-2 resize-none
            focus:outline-none transition-all
            ${errors.prestation 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-200 focus:border-black'
            }
          `}
          placeholder="Ex: Établissement des bulletins de paie - Novembre 2025"
        />
        {errors.prestation && (
          <p className="mt-2 text-sm text-red-500">{errors.prestation}</p>
        )}
      </div>

      {/* Montant HT */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Montant HT (€)
        </label>
        <input
          type="number"
          value={formData.montantHT || ''}
          onChange={(e) => setFormData({ ...formData, montantHT: parseFloat(e.target.value) || 0 })}
          step="0.01"
          min="0"
          className={`
            w-full px-4 py-3 rounded-xl border-2 
            focus:outline-none transition-all
            ${errors.montantHT 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-200 focus:border-black'
            }
          `}
          placeholder="0.00"
        />
        {errors.montantHT && (
          <p className="mt-2 text-sm text-red-500">{errors.montantHT}</p>
        )}
      </div>

      {/* Récapitulatif des montants */}
      {formData.montantHT > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant HT</span>
            <span className="font-medium">{formatMontant(formData.montantHT)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TVA (20%)</span>
            <span className="font-medium">{formatMontant(montantTVA)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold">Total TTC</span>
            <span className="font-bold text-lg">{formatMontant(montantTTC)}</span>
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 rounded-xl
            border-2 border-gray-200 text-gray-600
            hover:bg-gray-50 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          <X className="w-5 h-5" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !clientValide}
          className="
            flex-1 px-4 py-3 rounded-xl
            bg-black text-white font-medium
            hover:bg-gray-800 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Création...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Créer la facture
            </>
          )}
        </button>
      </div>
    </form>
  );
}
