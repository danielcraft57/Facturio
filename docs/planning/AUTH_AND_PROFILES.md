# Architecture - Authentification & Profils

## Vue d'ensemble

Restructuration du projet pour intégrer :
1. **Authentification** : Login, logout, signup
2. **Profil utilisateur** : Données personnelles
3. **Profil entreprise** : Informations légales complètes
4. **Documents officiels** : Stockage et gestion
5. **Multi-tenant** : Séparation par organisation

## 1. Modèles de données

### User (Utilisateur)

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
  VIEWER
}

enum UserStatus {
  PENDING  // En attente de validation email
  ACTIVE
  SUSPENDED
  DELETED
}

model User {
  id                Int            @id @default(autoincrement())
  email             String         @unique
  password          String?        // Hash bcrypt (optionnel si OAuth uniquement)
  firstName         String?
  lastName          String?
  phone             String?
  avatar            String?        // URL ou chemin fichier
  role              UserRole       @default(USER)
  status            UserStatus     @default(PENDING)
  emailVerified     Boolean        @default(false)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  
  // OAuth Google
  googleId          String?        @unique // Google user ID
  googleEmail       String?        // Email Google (peut différer de email)
  googlePicture     String?        // Photo de profil Google
  
  organizationId    Int
  organization      Organization   @relation(fields: [organizationId], references: [id])
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([email])
  @@index([googleId])
  @@index([organizationId])
}
```

### Organization (Entreprise/Organisation)

```prisma
enum CompanyStatus {
  AUTO_ENTREPRENEUR
  MICRO_ENTERPRISE
  EURL
  SARL
  SAS
  SA
  ASSOCIATION
  OTHER
}

enum CompanyType {
  B2B
  B2C
  B2B2C
}

model Organization {
  id                    Int                @id @default(autoincrement())
  name                  String             // Nom commercial
  legalName             String?            // Raison sociale
  siret                 String?           @unique // SIRET
  siren                 String?           // SIREN
  rcs                   String?           // RCS (ex: "Paris B 123 456 789")
  rcsCity               String?           // Ville du RCS
  vatNumber             String?           @unique // Numéro TVA intracommunautaire
  companyStatus         CompanyStatus?     // Statut juridique
  companyType           CompanyType        @default(B2B)
  
  // Adresses
  address               String?
  address2              String?
  city                  String?
  zipCode               String?
  country               String             @default("FR")
  countryCode           String             @default("FR") // ISO 3166-1 alpha-2
  
  // Contact
  email                 String?
  phone                 String?
  website               String?
  
  // Informations légales
  capital               Decimal?          // Capital social
  legalForm             String?           // Forme juridique (SARL, SAS, etc.)
  apeCode               String?           // Code APE/NAF
  apeLabel              String?           // Libellé APE
  
  // Représentant légal
  legalRepresentative   String?           // Nom du représentant légal
  legalRepresentativeRole String?        // Fonction (gérant, président, etc.)
  
  // Comptabilité & Fiscalité
  accountingYearEnd     String?           // Clôture exercice (ex: "31/12")
  fiscalYear            Int?              // Année fiscale
  taxRegime             String?           // Régime fiscal (BNC, BIC, IS, etc.)
  
  // URSSAF (voir URSSAF_INTEGRATION.md)
  urssafRate            Decimal?
  urssafActivity        String?
  urssafFiscalOption   Boolean           @default(false)
  urssafDeclarationFrequency String?     // MONTHLY ou QUARTERLY
  urssafThreshold       Decimal?
  
  // Documents officiels
  documents             OrganizationDocument[]
  
  // Relations
  users                 User[]
  clients               Client[]          // Les clients de cette organisation
  invoices              Invoice[]
  quotes                Quote[]
  subscriptions         Subscription[]
  creditNotes           CreditNote[]
  prospects             Prospect[]
  
  // Configuration
  logo                  String?           // URL ou chemin logo
  signature             String?           // Signature électronique
  defaultCurrency       String            @default("EUR")
  defaultLanguage       String            @default("fr")
  timezone              String            @default("Europe/Paris")
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  @@index([siret])
  @@index([siren])
  @@index([vatNumber])
}
```

### OrganizationDocument (Documents officiels)

```prisma
enum DocumentType {
  KBIS                  // Extrait K-bis
  IDENTITY              // Pièce d'identité
  PROOF_OF_ADDRESS      // Justificatif de domicile
  VAT_CERTIFICATE       // Attestation TVA
  URSSAF_CERTIFICATE    // Attestation URSSAF
  INSURANCE             // Assurance professionnelle
  CONTRACT              // Contrat
  OTHER
}

enum DocumentStatus {
  PENDING               // En attente de validation
  VALIDATED
  REJECTED
  EXPIRED
}

model OrganizationDocument {
  id              Int            @id @default(autoincrement())
  organizationId  Int
  organization    Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  type            DocumentType
  name            String         // Nom du document
  description     String?
  filePath        String         // Chemin du fichier
  fileName        String         // Nom original
  mimeType        String?
  fileSize        Int?           // Taille en bytes
  status          DocumentStatus @default(PENDING)
  expiresAt       DateTime?      // Date d'expiration
  uploadedBy      Int?           // User ID
  validatedBy     Int?           // User ID (admin)
  validatedAt     DateTime?
  rejectionReason String?
  metadata        String?        // JSON (numéro, date émission, etc.)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([organizationId])
  @@index([type])
  @@index([status])
}
```

### Modifications des modèles existants

Tous les modèles métier doivent être liés à `Organization` :

```prisma
model Client {
  // ... champs existants
  organizationId  Int
  organization    Organization @relation(fields: [organizationId], references: [id])
  // ...
}

model Invoice {
  // ... champs existants
  organizationId  Int
  organization    Organization @relation(fields: [organizationId], references: [id])
  // ...
}

// Idem pour Quote, Product, Subscription, etc.
```

## 2. Authentification

### Module Auth

Structure :
```
server/src/auth/
  ├── auth.module.ts
  ├── auth.controller.ts
  ├── auth.service.ts
  ├── strategies/
  │   ├── jwt.strategy.ts
  │   └── google.strategy.ts
  ├── guards/
  │   ├── jwt-auth.guard.ts
  │   ├── google-auth.guard.ts
  │   ├── roles.guard.ts
  │   └── organization.guard.ts
  ├── decorators/
  │   ├── current-user.decorator.ts
  │   ├── current-org.decorator.ts
  │   └── roles.decorator.ts
  └── dto/
      ├── login.dto.ts
      ├── signup.dto.ts
      ├── change-password.dto.ts
      └── reset-password.dto.ts
```

### Endpoints

```typescript
// Authentification classique
POST   /auth/signup          // Inscription email/password
POST   /auth/login           // Connexion email/password
POST   /auth/logout          // Déconnexion
POST   /auth/refresh         // Rafraîchir token
POST   /auth/forgot-password // Mot de passe oublié
POST   /auth/reset-password  // Réinitialiser mot de passe
POST   /auth/verify-email    // Vérifier email

// Authentification Google OAuth
GET    /auth/google          // Initier connexion Google
GET    /auth/google/callback // Callback Google OAuth
POST   /auth/google/link     // Lier compte Google à compte existant

// Profil
GET    /auth/me              // Profil utilisateur actuel
PATCH  /auth/me              // Mettre à jour profil
```

### JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { organization: true }
    });
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}
```

### Google OAuth Strategy

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0].value,
      accessToken,
    };
    
    done(null, user);
  }
}
```

### Service Auth avec Google

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: any) {
    // Chercher utilisateur existant par googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { organization: true }
    });

    if (user) {
      // Mettre à jour dernière connexion
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      return this.generateTokens(user);
    }

    // Chercher par email si pas de googleId
    user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { organization: true }
    });

    if (user) {
      // Lier compte Google à compte existant
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          googleEmail: googleUser.email,
          googlePicture: googleUser.avatar,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
        include: { organization: true }
      });
      return this.generateTokens(user);
    }

    // Créer nouvel utilisateur (nécessite organisation)
    // En production, créer organisation par défaut ou rediriger vers signup
    throw new BadRequestException('Aucune organisation trouvée. Veuillez créer un compte d\'abord.');
  }

  async linkGoogleAccount(userId: number, googleUser: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId: googleUser.googleId,
        googleEmail: googleUser.email,
        googlePicture: googleUser.avatar,
      }
    });
  }

  private generateTokens(user: User) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization,
      }
    };
  }
}
```

### Guards

```typescript
// Protection des routes (JWT ou Google)
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtected() { }

// Protection par rôle
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin-only')
getAdminOnly() { }

// Accès à l'organisation
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Get('organization-data')
getOrgData(@CurrentOrg() org: Organization) {
  return org;
}

// Route Google OAuth
@Get('google')
@UseGuards(AuthGuard('google'))
googleAuth() {
  // Redirige vers Google
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
googleAuthCallback(@Req() req) {
  // req.user contient les données Google
  return this.authService.validateGoogleUser(req.user);
}
```

## 3. Profil utilisateur

### Service User

```typescript
@Injectable()
export class UsersService {
  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        organization: true,
        createdAt: true
      }
    });
  }

  async updateProfile(userId: number, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar
      }
    });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Vérifier ancien mot de passe
    // Hasher nouveau mot de passe
    // Mettre à jour
  }
}
```

## 4. Profil entreprise

### Service Organization

```typescript
@Injectable()
export class OrganizationsService {
  async getProfile(orgId: number) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        documents: {
          where: { status: 'VALIDATED' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateProfile(orgId: number, data: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        legalName: data.legalName,
        siret: data.siret,
        // ... autres champs
      }
    });
  }

  async uploadDocument(orgId: number, file: Express.Multer.File, type: DocumentType) {
    // Sauvegarder fichier
    // Créer enregistrement OrganizationDocument
    // Retourner document
  }
}
```

### Endpoints

```typescript
GET    /organization/profile        // Profil entreprise
PATCH  /organization/profile        // Mettre à jour profil
GET    /organization/documents      // Liste documents
POST   /organization/documents      // Upload document
GET    /organization/documents/:id   // Télécharger document
DELETE /organization/documents/:id  // Supprimer document
```

## 5. Multi-tenant

### Middleware Organization

Toutes les requêtes doivent filtrer par `organizationId` :

```typescript
@Injectable()
export class OrganizationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user; // Depuis JWT
    if (user && user.organizationId) {
      req.organizationId = user.organizationId;
    }
    next();
  }
}
```

### Service avec filtrage automatique

```typescript
async findAll(organizationId: number, query: ListQueryDto) {
  return this.prisma.client.findMany({
    where: {
      organizationId, // Filtrage automatique
      // ... autres filtres
    }
  });
}
```

## 6. Stockage des documents

### Configuration Multer

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';

export const documentStorage = diskStorage({
  destination: './uploads/documents',
  filename: (req, file, cb) => {
    const orgId = req.user.organizationId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(file.originalname);
    cb(null, `org-${orgId}-${uniqueSuffix}${ext}`);
  }
});
```

### Structure des fichiers

```
uploads/
  ├── documents/
  │   └── org-{id}/
  │       ├── kbis/
  │       ├── identity/
  │       └── certificates/
  ├── avatars/
  │   └── user-{id}.jpg
  └── logos/
      └── org-{id}.png
```

## 7. Frontend - Pages

### Structure

```
frontend/src/
  ├── pages/
  │   ├── auth/
  │   │   ├── LoginPage.tsx
  │   │   ├── SignupPage.tsx
  │   │   ├── ForgotPasswordPage.tsx
  │   │   └── ResetPasswordPage.tsx
  │   ├── profile/
  │   │   ├── UserProfilePage.tsx
  │   │   └── OrganizationProfilePage.tsx
  │   └── documents/
  │       └── DocumentsPage.tsx
  ├── components/
  │   ├── auth/
  │   │   ├── LoginForm.tsx
  │   │   └── SignupForm.tsx
  │   └── profile/
  │       ├── UserProfileForm.tsx
  │       └── OrganizationProfileForm.tsx
  └── services/
      ├── auth.service.ts
      └── organization.service.ts
```

### Routes protégées

```typescript
<Route path="/login" element={<LoginPage />} />
<Route path="/signup" element={<SignupPage />} />
<Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
<Route path="/organization" element={<ProtectedRoute><OrganizationProfilePage /></ProtectedRoute>} />
```

## 8. Migration des données existantes

### Script de migration

1. Créer une organisation par défaut
2. Créer un utilisateur admin par défaut
3. Lier toutes les données existantes à cette organisation
4. Générer mots de passe par défaut (à changer à la première connexion)

## 9. Configuration OAuth Google

### Variables d'environnement

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h
```

### Configuration Google Cloud Console

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet ou sélectionner un existant
3. Activer l'API "Google+ API" ou "People API"
4. Créer identifiants OAuth 2.0
5. Ajouter URI de redirection autorisée : `http://localhost:3000/api/auth/google/callback`
6. Copier Client ID et Client Secret

### Package nécessaire

```bash
npm install @nestjs/passport passport passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

## 10. Sécurité

### Bonnes pratiques

- **Mots de passe** : Hash bcrypt (rounds: 12) - optionnel si OAuth uniquement
- **JWT** : Expiration 24h, refresh token 7 jours
- **OAuth** : Vérifier token Google côté serveur
- **Rate limiting** : Limiter tentatives de connexion
- **Validation email** : Vérification obligatoire (sauf OAuth qui valide automatiquement)
- **Documents** : Validation par admin avant utilisation
- **CORS** : Configuré pour domaines autorisés
- **HTTPS** : Obligatoire en production (OAuth nécessite HTTPS)

## 11. Tâches d'implémentation

### Phase 1 : Modèles & Migration
- [ ] Créer modèles User, Organization, OrganizationDocument
- [ ] Ajouter champs OAuth Google dans User (googleId, googleEmail, googlePicture)
- [ ] Modifier modèles existants (ajouter organizationId)
- [ ] Migration Prisma
- [ ] Script de migration données existantes

### Phase 2 : Authentification classique
- [ ] Module Auth avec JWT
- [ ] Endpoints signup/login/logout
- [ ] Guards et decorators
- [ ] Middleware multi-tenant
- [ ] Tests unitaires et E2E

### Phase 2bis : Authentification Google OAuth
- [ ] Installer packages Passport Google
- [ ] Configurer GoogleStrategy
- [ ] Créer endpoints /auth/google et /auth/google/callback
- [ ] Implémenter logique de liaison compte Google
- [ ] Gérer création automatique utilisateur (avec organisation par défaut)
- [ ] Tests OAuth

### Phase 3 : Profils
- [ ] Service Users (profil utilisateur)
- [ ] Service Organizations (profil entreprise)
- [ ] Endpoints CRUD profils
- [ ] Upload documents (Multer)
- [ ] Validation documents

### Phase 4 : Frontend
- [ ] Pages login/signup
- [ ] Bouton "Continuer avec Google"
- [ ] Gestion callback OAuth
- [ ] Pages profils
- [ ] Gestion documents
- [ ] Protection routes
- [ ] Store auth (Zustand/Redux)

### Phase 5 : Intégration
- [ ] Protéger toutes les routes API
- [ ] Filtrer données par organisation
- [ ] Mettre à jour PDF avec logo entreprise
- [ ] Mettre à jour emails avec infos entreprise

## 12. Exemples d'utilisation

### Connexion avec Google

**Backend :**
```typescript
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Redirige automatiquement vers Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const result = await this.authService.validateGoogleUser(req.user);
    // Rediriger vers frontend avec token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`);
  }
}
```

**Frontend :**
```typescript
// Bouton Google
<button onClick={() => window.location.href = '/api/auth/google'}>
  Continuer avec Google
</button>

// Page callback
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    localStorage.setItem('auth_token', token);
    navigate('/dashboard');
  }
}, []);
```

### Lier compte Google à compte existant

```typescript
// Après connexion classique
@Post('google/link')
@UseGuards(JwtAuthGuard)
async linkGoogle(@CurrentUser() user: User, @Body() googleToken: string) {
  // Vérifier token Google
  // Récupérer infos utilisateur Google
  // Lier au compte existant
  return this.authService.linkGoogleAccount(user.id, googleUser);
}
```

## 13. Exemples de données

### Organization complète

```json
{
  "name": "Ma Startup",
  "legalName": "Ma Startup SAS",
  "siret": "12345678901234",
  "siren": "123456789",
  "rcs": "Paris B 123 456 789",
  "vatNumber": "FR12345678901",
  "companyStatus": "SAS",
  "address": "123 Rue Example",
  "city": "Paris",
  "zipCode": "75001",
  "country": "France",
  "email": "contact@mastartup.fr",
  "phone": "+33123456789",
  "website": "https://mastartup.fr",
  "capital": 10000,
  "apeCode": "6201Z",
  "apeLabel": "Programmation informatique"
}
```

## 14. Ressources

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Passport Google OAuth](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Multi-tenant](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#multi-tenancy)
- [Multer File Upload](https://github.com/expressjs/multer)

