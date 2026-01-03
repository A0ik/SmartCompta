'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Building2, Folder, ChevronRight } from 'lucide-react';
import Fuse from 'fuse.js';

interface Client {
  id: string;
  numDossier: string;
  raisonSociale: string;
  adresse?: string | null;
  siret?: string | null;
  domaineActivite?: string | null;
}

interface DossierSearchProps {
  onSelectClient: (client: Client) => void;
  selectedClientId?: string;
}

export default function DossierSearch({ onSelectClient, selectedClientId }: DossierSearchProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Charger les clients au montage
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/dossiers?limit=300');
        const data = await response.json();
        
        if (data.success) {
          setClients(data.clients);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Erreur chargement dossiers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Configuration Fuse.js pour la recherche fuzzy
  const fuse = useMemo(() => {
    return new Fuse(clients, {
      keys: [
        { name: 'numDossier', weight: 2 },
        { name: 'raisonSociale', weight: 1.5 },
        { name: 'siret', weight: 0.5 },
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
    });
  }, [clients]);

  // Résultats filtrés
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients.slice(0, 20); // Afficher les 20 premiers par défaut
    }
    
    const results = fuse.search(searchQuery);
    return results.map(result => result.item).slice(0, 20);
  }, [searchQuery, clients, fuse]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec stats */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
          <Folder className="w-4 h-4" />
          <span>{total} dossiers</span>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Rechercher par nom ou numéro..."
            className="
              w-full pl-10 pr-4 py-3 
              bg-white/5 border border-white/10 
              rounded-xl text-white placeholder-gray-500
              focus:outline-none focus:border-white/30 focus:bg-white/10
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Liste des dossiers */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Aucun dossier trouvé' : 'Aucun dossier importé'}
          </div>
        ) : (
          filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => onSelectClient(client)}
              className={`
                w-full p-4 rounded-xl text-left
                transition-all duration-200
                ${selectedClientId === client.id 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 hover:bg-white/10 text-white'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 flex-shrink-0 ${
                      selectedClientId === client.id ? 'text-black' : 'text-gray-400'
                    }`} />
                    <span className="font-medium truncate">
                      {client.raisonSociale}
                    </span>
                  </div>
                  <div className={`text-sm ${
                    selectedClientId === client.id ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    <span className="font-mono">{client.numDossier}</span>
                    {client.siret && (
                      <span className="ml-2">• SIRET: {client.siret}</span>
                    )}
                  </div>
                  {client.domaineActivite && (
                    <div className={`text-xs mt-1 truncate ${
                      selectedClientId === client.id ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {client.domaineActivite}
                    </div>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                  selectedClientId === client.id ? 'text-black' : 'text-gray-500'
                }`} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
