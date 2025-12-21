// ==============================================
// AI INTERIOR DESIGNER - SERVER PRINCIPAL
// ==============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ==============================================
// CONFIGURATION
// ==============================================

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ==============================================
// MIDDLEWARE DE SÉCURITÉ
// ==============================================

// Helmet pour sécuriser les headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});
app.use('/api/', limiter);

// Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================
// SERVIR LES FICHIERS STATIQUES (FRONTEND)
// ==============================================

app.use(express.static(path.join(__dirname, 'public')));

// ==============================================
// CONNEXION MONGODB
// ==============================================

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connecté avec succès');
})
.catch((err) => {
  console.error('❌ Erreur de connexion MongoDB:', err.message);
  process.exit(1);
});

// ==============================================
// MODÈLES MONGOOSE
// ==============================================

// Modèle Utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  plan: { 
    type: String, 
    enum: ['FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'],
    default: 'FREE'
  },
  generationsUsed: { type: Number, default: 0 },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  language: { type: String, default: 'fr' },
  theme: { type: String, default: 'dark' },
  watermarkSettings: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['logo', 'text'], default: 'text' },
    logoUrl: String,
    text: String,
    language: String,
    position: { type: String, default: 'bottom-right' },
    opacity: { type: Number, default: 70 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

// Modèle Génération
const generationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: { type: String, required: true },
  style: { type: String, required: true },
  roomType: String,
  imageUrl: String,
  hasWatermark: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Generation = mongoose.model('Generation', generationSchema);

// Modèle Subscription
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSubscriptionId: { type: String, required: true },
  stripePriceId: { type: String, required: true },
  status: { type: String, required: true },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ==============================================
// ROUTES API
// ==============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Route test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API AI Interior Designer fonctionne !',
    env: process.env.NODE_ENV || 'development'
  });
});

// ==============================================
// AUTH ROUTES
// ==============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer utilisateur
    const user = new User({
      email,
      password: hashedPassword,
      name,
      plan: 'FREE',
      generationsUsed: 0
    });

    await user.save();

    // Générer JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        generationsUsed: user.generationsUsed,
        generationsLimit: user.plan === 'FREE' ? 3 : -1
      }
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour last login
    user.lastLogin = new Date();
    await user.save();

    // Générer JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        generationsUsed: user.generationsUsed,
        generationsLimit: user.plan === 'FREE' ? 3 : -1,
        language: user.language,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// ==============================================
// MIDDLEWARE AUTH
// ==============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// ==============================================
// GENERATION ROUTES
// ==============================================

const axios = require('axios');

app.post('/api/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, style, roomType } = req.body;
    const userId = req.user.userId;

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier les limites (FREE seulement)
    if (user.plan === 'FREE' && user.generationsUsed >= 3) {
      return res.status(403).json({
        error: 'Limite atteinte',
        message: 'Vous avez utilisé vos 3 générations gratuites',
        upgrade: true
      });
    }

    // Construire le prompt complet
    const fullPrompt = `${style} interior design, ${roomType}, ${prompt}, high quality, professional, 4k`;

    // Appeler Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      { inputs: fullPrompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    // Convertir en base64
    const imageBase64 = Buffer.from(response.data).toString('base64');
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    // Upload sur ImgBB
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        image: imageBase64
      }
    );

    const imageUrl = imgbbResponse.data.data.url;

    // Sauvegarder la génération
    const generation = new Generation({
      userId: user._id,
      prompt,
      style,
      roomType,
      imageUrl,
      hasWatermark: user.plan === 'FREE'
    });

    await generation.save();

    // Incrémenter le compteur (FREE seulement)
    if (user.plan === 'FREE') {
      user.generationsUsed += 1;
      await user.save();
    }

    // Retourner la réponse
    res.json({
      success: true,
      image: imageUrl,
      watermark: {
        required: user.plan === 'FREE',
        text: user.plan === 'FREE' ? 'AI Interior Designer' : null,
        customizable: user.plan === 'PREMIUM_YEARLY'
      },
      usage: {
        used: user.generationsUsed,
        limit: user.plan === 'FREE' ? 3 : -1,
        remaining: user.plan === 'FREE' ? (3 - user.generationsUsed) : -1
      }
    });

  } catch (error) {
    console.error('Erreur génération:', error.message);
    
    if (error.response?.status === 503) {
      return res.status(503).json({ 
        error: 'Le modèle IA est en cours de chargement, veuillez réessayer dans 20 secondes' 
      });
    }
    
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
});

// Get user generations
app.get('/api/generations', authenticateToken, async (req, res) => {
  try {
    const generations = await Generation.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      generations
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// ==============================================
// USER ROUTES
// ==============================================

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        generationsUsed: user.generationsUsed,
        generationsLimit: user.plan === 'FREE' ? 3 : -1,
        language: user.language,
        theme: user.theme,
        watermarkSettings: user.watermarkSettings
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.patch('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const { language, theme } = req.body;
    const user = await User.findById(req.user.userId);

    if (language) user.language = language;
    if (theme) user.theme = theme;

    await user.save();

    res.json({ success: true, message: 'Paramètres mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================
// STRIPE ROUTES
// ==============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Créer ou récupérer le customer Stripe
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: user._id.toString()
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session' });
  }
});

// Webhook Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;

      // Mettre à jour l'utilisateur
      const user = await User.findById(userId);
      if (user) {
        user.stripeSubscriptionId = subscriptionId;
        
        // Déterminer le plan selon le price_id
        const priceId = session.line_items?.data[0]?.price?.id;
        if (priceId === process.env.STRIPE_PRICE_YEARLY) {
          user.plan = 'PREMIUM_YEARLY';
        } else {
          user.plan = 'PREMIUM_MONTHLY';
        }
        
        await user.save();
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      const deletedUser = await User.findOne({ stripeSubscriptionId: deletedSub.id });
      if (deletedUser) {
        deletedUser.plan = 'FREE';
        deletedUser.stripeSubscriptionId = null;
        await deletedUser.save();
      }
      break;
  }

  res.json({ received: true });
});

// ==============================================
// ROUTES FRONTEND (doit être à la fin)
// ==============================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================================
// GESTION DES ERREURS
// ==============================================

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// ==============================================
// DÉMARRAGE DU SERVEUR
// ==============================================

app.listen(PORT, () => {
  console.log('==============================================');
  console.log('🚀 AI INTERIOR DESIGNER - Serveur démarré');
  console.log('==============================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('==============================================');
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, fermeture propre...');
  mongoose.connection.close();
  process.exit(0);
});
