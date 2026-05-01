---
inclusion: manual
---

# Build & Deployment Guide

## Development Workflow

### Starting Development Server
```bash
npm start
```
- Runs on `http://localhost:3000`
- Hot reload enabled
- Opens browser automatically

### Environment Variables
Create `.env.local` for local development:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Production Build

### Creating Production Build
```bash
npm run build
```
- Creates optimized production build in `build/` directory
- Minifies and bundles all assets
- Generates source maps
- Optimizes for performance

### Build Output
```
build/
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── index.html
└── asset-manifest.json
```

## Firebase Deployment

### Prerequisites
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```
Select:
- Hosting
- Use existing project
- Public directory: `build`
- Single-page app: Yes
- Automatic builds: No

### Deploy to Firebase Hosting
```bash
# Build and deploy
npm run build
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy with specific project
firebase deploy --project your-project-id
```

### Firebase Configuration Files

#### firebase.json
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### .firebaserc
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Firestore Setup

### Security Rules
Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### Indexes
Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Performance Optimization

### Build Optimization
- Code splitting is automatic with Create React App
- Tree shaking removes unused code
- Assets are hashed for cache busting
- Compression is handled by Firebase Hosting

### Bundle Analysis
```bash
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

### Performance Checklist
- [ ] Minimize bundle size
- [ ] Optimize images
- [ ] Enable compression
- [ ] Use CDN for static assets
- [ ] Implement lazy loading
- [ ] Cache API responses
- [ ] Use service workers (if needed)

## Monitoring & Analytics

### Firebase Performance Monitoring
Add to `src/config/firebase.js`:
```javascript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

### Error Tracking
Consider integrating:
- Sentry
- LogRocket
- Firebase Crashlytics

## Continuous Deployment

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

## Rollback Strategy

### Revert to Previous Version
```bash
# View deployment history
firebase hosting:channel:list

# Deploy previous version
firebase hosting:clone source-site-id:source-channel-id target-site-id:live
```

## Pre-deployment Checklist

- [ ] Run tests: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Test build locally: `npx serve -s build`
- [ ] Check console for errors
- [ ] Verify Firebase config
- [ ] Update environment variables
- [ ] Review security rules
- [ ] Test on mobile devices
- [ ] Check accessibility
- [ ] Verify offline functionality

## Post-deployment Verification

1. Visit deployed URL
2. Test authentication flow
3. Verify data sync
4. Check all navigation routes
5. Test on different devices/browsers
6. Monitor Firebase console for errors
7. Check performance metrics

## Troubleshooting

### Build Fails
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (should be 14+)
- Review error messages in console

### Deployment Fails
- Verify Firebase CLI is logged in: `firebase login`
- Check project ID: `firebase projects:list`
- Ensure build directory exists
- Review firebase.json configuration

### App Not Loading
- Check browser console for errors
- Verify Firebase config in production
- Check security rules
- Ensure all environment variables are set
