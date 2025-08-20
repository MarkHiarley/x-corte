// Configurações da aplicação

export const config = {
  // URLs das APIs
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    externalUrl: process.env.NEXT_PUBLIC_EXTERNAL_API_URL || '',
  },

  // Configurações de banco de dados
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Configurações de autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    sessionDuration: 24 * 60 * 60 * 1000, // 24 horas em ms
  },

  // Configurações de email
  email: {
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@xCorte.com',
  },

  // Configurações de pagamento
  payment: {
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  },
};

export default config;
