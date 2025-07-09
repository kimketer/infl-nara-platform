# 인플루언서 여행 플랫폼 (Infl-Nara)

최고의 여행지를 발견하고 공유하는 인플루언서 여행 플랫폼입니다.

## 🚀 기술 스택

### Backend (NestJS)
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger
- **Caching**: Redis

### Frontend (Next.js)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: SWR
- **Maps**: React Leaflet
- **UI Components**: Custom Components

### Infrastructure
- **Package Manager**: pnpm
- **Monorepo**: Turborepo
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 📁 프로젝트 구조

```
infl-nara/
├── apps/
│   ├── api/          # NestJS Backend
│   ├── web/          # Next.js Frontend
│   └── docs/         # Documentation
├── packages/
│   ├── ui/           # Shared UI Components
│   ├── eslint-config/
│   └── typescript-config/
└── scripts/          # Build & Deploy Scripts
```

## 🛠️ 로컬 개발 환경 설정

### 1. 필수 프로그램 설치

- **Node.js** (LTS 버전)
- **pnpm**: `npm install -g pnpm`

### 2. 프로젝트 설정

```bash
# 1. 저장소 클론
git clone <repository-url>
cd infl-nara

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp env.example .env
# .env 파일을 열고 필요한 값들을 설정하세요
```

### 3. 환경 변수 설정

`.env` 파일에서 다음 값들을 설정하세요:

```env
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/inflnara

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Tour API
TOUR_API_KEY=your-tour-api-key-here
TOUR_API_BASE_URL=https://apis.data.go.kr/B551011/TarRlteTarService1

# Public API
PUBLIC_API_URL=http://localhost:3005/api
```

### 4. 데이터베이스 마이그레이션

```bash
# 데이터베이스 테이블 생성
pnpm migrate
```

### 5. 개발 서버 실행

```bash
# 백엔드 + 프론트엔드 동시 실행
pnpm dev:all
```

### 6. 브라우저에서 확인

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3005
- **API Documentation**: http://localhost:3005/docs

## 🧪 테스트

```bash
# 전체 테스트 실행
pnpm test

# 특정 앱 테스트
pnpm --filter api test
pnpm --filter web test
```

## 📦 빌드

```bash
# 전체 빌드
pnpm build

# 특정 앱 빌드
pnpm --filter api build
pnpm --filter web build
```

## 🚀 배포

### Docker를 사용한 배포

```bash
# Docker 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 배포
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 주요 기능

### 🔐 인증 시스템
- 회원가입/로그인
- JWT 기반 인증
- 사용자 프로필 관리

### 🎯 캠페인 관리
- 캠페인 생성/수정/삭제
- 캠페인 목록 조회
- 권한 기반 접근 제어

### 🗺️ 여행 콘텐츠
- 관광지 목록 조회
- 키워드 기반 검색
- 상세 정보 및 지도
- AI 가이드 생성

### 💬 커뮤니티
- 리뷰 시스템
- 소셜 공유
- 사용자 간 상호작용

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
