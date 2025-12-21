# 🏠 AI Interior Designer

Plateforme SaaS de design d'intérieur par intelligence artificielle.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## 📋 Description

AI Interior Designer permet de transformer n'importe quel espace en design professionnel grâce à l'IA (Stable Diffusion XL). Upload une photo, décris ta vision, et obtiens des rendus réalistes en 30 secondes.

### ✨ Fonctionnalités principales

- 🎨 **Génération IA** : Stable Diffusion XL pour des rendus photoréalistes
- 🌍 **11 langues** : Français, Anglais, Espagnol, Allemand, Italien, Portugais, Néerlandais, Japonais, Chinois, Coréen, Arabe
- 💎 **3 plans** : Gratuit (3 générations), Premium Mensuel (9.99€), Premium Annuel (79.99€)
- 🏷️ **Watermark intelligent** : Obligatoire gratuit, personnalisable annuel
- 🌓 **Mode clair/sombre** : Interface adaptative
- 🔐 **Auth sécurisée** : JWT + Google OAuth
- 💳 **Paiements Stripe** : Abonnements récurrents

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Compte MongoDB Atlas
- Compte Hugging Face
- Compte Stripe
- Compte ImgBB

### Installation

```bash
# Cloner le repo
git clone https://github.com/votre-username/ai-interior-designer.git
cd ai-interior-designer

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Remplir les variables d'environnement (voir section suivante)
nano .env

# Démarrer en développement
npm run dev

# Ou en production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 🔑 Configuration (.env)

Créer un fichier `.env` à la racine avec ces variables :

```env
# Port
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ai-interior-designer

# JWT Secret (générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=votre_secret_jwt_tres_long

# Hugging Face API
HUGGINGFACE_API_KEY=hf_votre_token

# ImgBB API
IMGBB_API_KEY=votre_cle_imgbb

# Stripe
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle
STRIPE_WEBHOOK_SECRET=whsec_votre_secret
STRIPE_PRICE_MONTHLY=price_id_mensuel
STRIPE_PRICE_YEARLY=price_id_annuel

# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# URLs
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# Environment
NODE_ENV=development
```

### Obtenir les clés API

1. **MongoDB Atlas** : https://www.mongodb.com/cloud/atlas/register
2. **Hugging Face** : https://huggingface.co/settings/tokens
3. **ImgBB** : https://api.imgbb.com/
4. **Stripe** : https://dashboard.stripe.com/register
5. **Google OAuth** : https://console.cloud.google.com/

Voir le guide complet dans `GUIDE-DEPLOIEMENT-COMPLET.md`

## 📁 Structure du projet

```
ai-interior-designer/
├── server.js              # Serveur Express principal
├── package.json           # Dépendances npm
├── .env                   # Variables d'environnement (à créer)
├── .env.example          # Template .env
├── .gitignore            # Fichiers ignorés par Git
├── README.md             # Ce fichier
│
├── public/               # Frontend (fichiers statiques)
│   ├── index.html       # Page principale
│   ├── settings.html    # Paramètres utilisateur
│   ├── pricing.html     # Page tarifs
│   └── assets/          # CSS, JS, images
│
└── docs/                # Documentation
    ├── GUIDE-DEPLOIEMENT-COMPLET.md
    ├── CHECKLIST-DEPLOIEMENT.md
    └── SPECIFICATIONS-FINALES.md
```

## 🎯 API Endpoints

### Authentification

```
POST   /api/auth/register      - Créer un compte
POST   /api/auth/login         - Se connecter
```

### Génération IA

```
POST   /api/generate           - Générer un design (auth requis)
GET    /api/generations        - Historique générations (auth requis)
```

### Utilisateur

```
GET    /api/user/profile       - Profil utilisateur (auth requis)
PATCH  /api/user/settings      - Modifier paramètres (auth requis)
```

### Paiements

```
POST   /api/create-checkout-session  - Créer session Stripe (auth requis)
POST   /api/webhook                  - Webhook Stripe
```

### Health Check

```
GET    /api/health            - Vérifier l'état du serveur
GET    /api/test              - Test API
```

## 💰 Plans tarifaires

### 🆓 Gratuit
- 3 générations d'images uniques (total, pas par mois)
- Qualité standard
- Watermark "AI Interior Designer" obligatoire
- 6 styles de design

### 💎 Premium Mensuel (9.99€/mois)
- Générations illimitées
- Qualité 4K
- Sans watermark
- Visualiseur 3D avancé
- Export HD
- Support prioritaire

### 👑 Premium Annuel (79.99€/an)
- Tout du plan Mensuel
- **Watermark personnalisable** (upload logo ou texte)
- 11 langues de watermark
- Priorité génération
- Support VIP
- Accès anticipé nouvelles features

## 🧪 Tests

### Test local

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester l'API
curl http://localhost:5000/api/health
```

### Test complet

1. Ouvrir http://localhost:5000
2. Créer un compte
3. Générer une image
4. Vérifier le watermark
5. Tester upgrade Premium
6. Utiliser carte test Stripe : `4242 4242 4242 4242`

## 🌐 Déploiement

### Option 1 : Railway (Recommandé)

```bash
# 1. Créer compte sur railway.app
# 2. New Project → Deploy from GitHub
# 3. Ajouter MongoDB (optionnel)
# 4. Copier toutes les variables .env dans Environment Variables
# 5. Generate Domain
# 6. Deploy !
```

### Option 2 : Render

```bash
# 1. Créer compte sur render.com
# 2. New → Web Service
# 3. Connect GitHub repo
# 4. Build Command: npm install
# 5. Start Command: npm start
# 6. Ajouter Environment Variables
# 7. Deploy
```

### Option 3 : Fly.io

```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Déployer
fly launch
fly deploy
```

Voir `CHECKLIST-DEPLOIEMENT.md` pour le guide détaillé.

## 🔒 Sécurité

- ✅ Passwords hashés avec bcrypt
- ✅ JWT pour l'authentification
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js pour sécuriser headers
- ✅ CORS configuré
- ✅ Validation des entrées
- ✅ Variables d'environnement sécurisées

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```
✅ Vérifier MONGODB_URI
✅ Whitelist IP 0.0.0.0/0 dans MongoDB Atlas
✅ Vérifier username/password
```

### "Hugging Face API error 503"
```
✅ Le modèle se charge (attendre 20s)
✅ Vérifier HUGGINGFACE_API_KEY
✅ Limite gratuite: 300 images/mois
```

### "CORS error"
```
✅ FRONTEND_URL correct dans .env
✅ Redémarrer le serveur après modification
```

### "Stripe webhook failed"
```
✅ STRIPE_WEBHOOK_SECRET correct
✅ URL webhook: https://votre-backend.com/api/webhook
✅ Événements sélectionnés dans Stripe Dashboard
```

## 📊 Limites & Quotas

### Gratuit (0€/mois)
- MongoDB M0 : 512 MB
- Hugging Face : 300 images/mois
- ImgBB : Illimité
- Railway : 5$ crédit/mois

### En production (~18€/mois)
- MongoDB M10 : 9€/mois
- Hugging Face Pro : 9€/mois (illimité)

## 📚 Documentation

- [Guide de déploiement complet](./docs/GUIDE-DEPLOIEMENT-COMPLET.md)
- [Checklist de déploiement](./docs/CHECKLIST-DEPLOIEMENT.md)
- [Spécifications techniques](./docs/SPECIFICATIONS-FINALES.md)

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir `LICENSE` pour plus d'informations.

## 👤 Auteur

**Votre Nom**
- Website: https://votre-site.com
- GitHub: [@votre-username](https://github.com/votre-username)

## 🙏 Remerciements

- [Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) pour l'IA
- [Stripe](https://stripe.com) pour les paiements
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) pour la base de données
- [Railway](https://railway.app) pour l'hébergement

---

**Fait avec ❤️ et ☕**
