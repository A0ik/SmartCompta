# SmartCompta Voice 🎙️

Application de facturation vocale pour cabinet comptable. Dictez vos factures, l'IA extrait les informations, et générez des liens de paiement Stripe automatiquement.

![SmartCompta Voice](https://via.placeholder.com/800x400/000000/FFFFFF?text=SmartCompta+Voice)

## ✨ Fonctionnalités

- 🎤 **Dictée vocale** - Dictez naturellement vos factures
- 🤖 **IA intelligente** - Extraction automatique (dossier, montant, prestation)
- 📊 **200+ dossiers** - Import massif depuis Excel/Quadra Paie
- 🔍 **Recherche fuzzy** - Trouvez instantanément vos clients
- 💳 **Stripe intégré** - Liens de paiement sécurisés
- 📄 **PDF professionnel** - Factures noir & blanc élégantes
- 🖥️ **Design split-screen** - Interface moderne et intuitive

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. **Cloner/Télécharger le projet**

```bash
cd smartcompta-voice
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

```bash
cp .env.example .env
```

Puis éditez `.env` avec vos clés :

```env
# OpenRouter API (obligatoire pour la dictée vocale)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx

# Stripe API (optionnel, pour les paiements)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Informations du cabinet (pour les factures PDF)
CABINET_NOM="Votre Cabinet Comptable"
CABINET_ADRESSE="123 Rue Exemple, 75001 Paris"
CABINET_SIRET="12345678900001"
CABINET_EMAIL="contact@cabinet.fr"
CABINET_TELEPHONE="01 23 45 67 89"
```

4. **Initialiser la base de données**

```bash
npx prisma db push
```

5. **Lancer l'application**

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Import des dossiers

1. Cliquez sur "Importer dossiers" dans l'interface
2. Glissez votre fichier Excel exporté de Quadra Paie
3. Les colonnes attendues sont :
   - `Numéro` - Numéro de dossier unique
   - `Raison sociale` - Nom de l'entreprise
   - `Adresse` - Adresse complète
   - `Siret` - Numéro SIRET
   - `CodeNaf` - Code NAF/APE
   - (+ autres colonnes optionnelles)

## 🎤 Utilisation de la dictée

1. Cliquez sur le bouton microphone blanc
2. Dictez naturellement, par exemple :
   - *"Facture dossier AM0028, bulletins de paie novembre, 350 euros"*
   - *"Créer une facture pour LGD Bâtiment, prestation bilan annuel, montant 800 euros"*
3. L'IA extrait automatiquement les informations
4. Vérifiez et modifiez si nécessaire
5. Cliquez sur "Créer la facture"

## 🔧 Configuration Stripe (optionnel)

1. Créez un compte sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Récupérez votre clé secrète (commence par `sk_test_` ou `sk_live_`)
3. Ajoutez-la dans `.env`
4. Chaque facture générera automatiquement un lien de paiement

## 📂 Structure du projet

```
smartcompta-voice/
├── prisma/
│   └── schema.prisma      # Schéma de base de données
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/  # API IA + Stripe
│   │   │   ├── dossiers/  # API dossiers
│   │   │   ├── factures/  # API factures
│   │   │   └── import-dossiers/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx       # Dashboard principal
│   ├── components/
│   │   ├── MicButton.tsx      # Bouton micro animé
│   │   ├── DossierSearch.tsx  # Recherche fuzzy
│   │   ├── FactureForm.tsx    # Formulaire éditable
│   │   ├── FacturePreview.tsx # Prévisualisation PDF
│   │   └── ImportDossiers.tsx # Import Excel
│   └── lib/
│       ├── prisma.ts      # Client Prisma
│       ├── openrouter.ts  # Client IA
│       ├── stripe.ts      # Client Stripe
│       └── facture-utils.ts
├── .env.example
├── package.json
└── README.md
```

## 🛠️ Technologies

- **Next.js 14** - Framework React
- **Prisma + SQLite** - Base de données locale
- **OpenRouter** - API Whisper + GPT-4o
- **Stripe** - Paiements en ligne
- **Tailwind CSS** - Styles
- **Fuse.js** - Recherche fuzzy
- **@react-pdf/renderer** - Génération PDF

## 📝 Numérotation des factures

Format : `FA-2026-0001`

- Préfixe : `FA-` (Facture)
- Année : `2026` (année en cours)
- Séquentiel : `0001` (auto-incrémenté)

La numérotation est garantie unique et séquentielle grâce à une table dédiée en base.

## 🔒 Sécurité

- Application 100% locale (pas de données envoyées sauf à OpenRouter/Stripe)
- Base SQLite sur votre PC
- Pas d'authentification requise (poste unique)

## 📞 Support

Pour toute question, contactez le développeur.

---

Fait avec ❤️ pour les cabinets comptables
