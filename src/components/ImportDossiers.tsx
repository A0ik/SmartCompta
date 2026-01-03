'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, X } from 'lucide-react';

interface ImportStats {
  lignesTraitees: number;
  totalDossiers: number;
  erreurs: number;
}

interface ImportDossiersProps {
  onImportComplete?: () => void;
}

export default function ImportDossiers({ onImportComplete }: ImportDossiersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: ImportStats;
    errors?: string[];
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }, []);

  const handleUpload = async (file: File) => {
    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setResult({
        success: false,
        message: 'Format non supporté. Utilisez un fichier Excel (.xlsx, .xls) ou CSV.',
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-dossiers', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
          errors: data.errors,
        });
        onImportComplete?.();
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de l\'import',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur réseau lors de l\'upload',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="
          flex items-center gap-2 px-4 py-2 
          bg-white/10 hover:bg-white/20 
          rounded-lg text-sm text-white
          transition-all duration-200
        "
      >
        <Upload className="w-4 h-4" />
        Importer dossiers
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={() => {
            setIsOpen(false);
            setResult(null);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-black mb-2">Importer des dossiers</h2>
        <p className="text-sm text-gray-600 mb-6">
          Importez votre fichier Excel exporté depuis Quadra Paie.
          Les dossiers existants seront mis à jour automatiquement.
        </p>

        {/* Zone de drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8
            flex flex-col items-center justify-center
            transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-black bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer text-center">
            {isUploading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent mx-auto mb-3" />
            ) : (
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            )}
            <p className="font-medium text-gray-700">
              {isUploading ? 'Import en cours...' : 'Glissez un fichier ici'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Formats: .xlsx, .xls, .csv
            </p>
          </label>
        </div>

        {/* Résultat */}
        {result && (
          <div className={`
            mt-4 p-4 rounded-xl
            ${result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
            }
          `}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
                {result.stats && (
                  <p className="text-sm text-green-600 mt-1">
                    {result.stats.lignesTraitees} lignes traitées • 
                    {result.stats.totalDossiers} dossiers en base
                    {result.stats.erreurs > 0 && ` • ${result.stats.erreurs} erreurs`}
                  </p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <ul className="text-xs text-red-600 mt-2 space-y-1">
                    {result.errors.slice(0, 3).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 3 && (
                      <li>... et {result.errors.length - 3} autres erreurs</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Colonnes attendues */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Colonnes attendues :</p>
          <div className="flex flex-wrap gap-1">
            {['Numéro', 'Raison sociale', 'Adresse', 'Siret', 'CodeNaf'].map((col) => (
              <span key={col} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
