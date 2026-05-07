# Daytrace

Next.js 14 App Router 기반의 하루 시간 기록 앱 초기 스캐폴드입니다. `init-files.zip`의 하이파이 시안을 Next.js 컴포넌트로 옮기고, Supabase 스키마와 RLS 마이그레이션을 포함했습니다.

## 로컬 실행

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

초기 화면은 Supabase 연결 전에도 `/today`에서 샘플 데이터로 렌더됩니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL editor 또는 Supabase CLI로 `supabase/migrations/0001_init.sql`을 실행합니다.
3. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 채웁니다.
4. Auth 이메일 provider를 켜고, redirect URL에 `http://localhost:3000/auth/callback` 및 배포 URL의 `/auth/callback`을 추가합니다.

## 배포

Vercel에서 이 저장소를 연결한 뒤 Supabase 환경 변수를 동일하게 등록합니다. `vercel.json`은 Next.js 프레임워크 설정만 명시합니다.

## 구현 범위

- `/today`, `/today/[date]`: KPI, 24시간 미니바, 드래그 가능한 세로 타임라인, 우측 빠른 추가/목표/합계 패널
- `/stats`: 7일 KPI, 요일 × 시간 히트맵, 일별 누적 막대, 인사이트 카드
- `/categories`: 기본 7개 카테고리 카드
- `/settings`: 프로필, 알림, 내보내기, 로그아웃 항목
- `supabase/migrations/0001_init.sql`: profiles, categories, time_blocks, goals, RLS, 기본 카테고리 시드 트리거

다음 단계는 Magic Link 실제 전송, Supabase query/server action 연결, optimistic update 저장 흐름을 붙이는 것입니다.
