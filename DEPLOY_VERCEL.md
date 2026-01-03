# 🚀 Déploiement sur Vercel

## Étape 1 : Créer une base de données PostgreSQL

### Option A : Vercel Postgres (recommandé)
1. Va sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique sur **Storage** → **Create Database** → **Postgres**
3. Nomme ta base `smartcompta-db`
4. Les variables `DATABASE_URL` et `DIRECT_URL` seront auto-configurées

### Option B : Neon (alternative gratuite)
1. Va sur [neon.tech](https://neon.tech)
2. Crée un projet gratuit
3. Copie la connection string

---

## Étape 2 : Déployer sur Vercel

### Via GitHub (recommandé)

1. **Push le projet sur GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/smartcompta-voice.git
git push -u origin main
```

2. **Importer sur Vercel**
   - Va sur [vercel.com/new](https://vercel.com/new)
   - Clique **Import** sur ton repo `smartcompta-voice`
   - Vercel détecte automatiquement Next.js

3. **Configurer les variables d'environnement**

Dans Vercel → Settings → Environment Variables, ajoute :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://...` (depuis Vercel Postgres) |
| `DIRECT_URL` | `postgresql://...` (même URL ou pooler) |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (optionnel) |
| `NEXT_PUBLIC_APP_URL` | `https://smartcompta-voice.vercel.app` |
| `CABINET_NOM` | `Ton Cabinet Comptable` |
| `CABINET_ADRESSE` | `123 Rue...` |
| `CABINET_SIRET` | `123456789` |
| `CABINET_EMAIL` | `contact@...` |
| `CABINET_TELEPHONE` | `01 23 45 67 89` |

4. **Déployer**
   - Clique **Deploy**
   - Attends ~2 minutes

---

## Étape 3 : Initialiser la base de données

Après le premier déploiement, initialise le schéma :

```bash
# En local, avec les variables d'environnement Vercel
npx vercel env pull .env.local
npx prisma db push
```

Ou via Vercel CLI :
```bash
npx vercel --prod
```

---

## Étape 4 : Importer les dossiers

1. Ouvre ton app : `https://smartcompta-voice.vercel.app`
2. Clique sur **Importer dossiers**
3. Upload ton fichier Excel `liste_dossiers_annee_2026_v1.xlsx`
4. C'est prêt ! 🎉

---

## 🔧 Commandes utiles

```bash
# Voir les logs
npx vercel logs

# Redéployer
npx vercel --prod

# Ouvrir Prisma Studio (en local)
npx prisma studio

# Mettre à jour le schéma
npx prisma db push
```

---

## ⚠️ Notes importantes

1. **OpenRouter API** : Obligatoire pour la dictée vocale
   - Crée un compte sur [openrouter.ai](https://openrouter.ai)
   - Ajoute du crédit (~$5 suffisent pour des centaines de factures)

2. **Stripe** : Optionnel
   - Sans Stripe, les factures seront créées sans lien de paiement
   - Tu pourras l'activer plus tard

3. **Domaine personnalisé** : 
   - Vercel → Settings → Domains
   - Ajoute `facturation.ton-cabinet.fr`

---

## 🆘 Problèmes courants

### "Prisma Client not generated"
```bash
npx prisma generate
npx vercel --prod
```

### "Database connection failed"
- Vérifie que `DATABASE_URL` est correctement configuré
- Assure-toi que l'IP de Vercel est autorisée (Neon/Supabase)

### "Audio not working"
- Vérifie que le site est en HTTPS
- Autorise le microphone dans le navigateur

---

Bon déploiement ! 🚀
