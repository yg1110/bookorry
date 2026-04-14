# 부코리 (Bookorry)

북클럽 독후감과 일상 루틴을 그룹 단위로 함께 기록하는 모바일 웹

---

## 개요

부코리는 소규모 독서 모임(북클럽)을 위한 소셜 기록 앱입니다. 그룹을 만들고 초대코드로 멤버를 초대해 독후감을 공유하고, 헬스·식단·독서 등 일상 루틴을 함께 체크하며 서로 독려할 수 있습니다. 로그인 없이 초대코드와 닉네임만으로 참여하는 가벼운 구조가 핵심입니다.

---

## 기술 스택

| 영역         | 기술                                          |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 16 (App Router)                       |
| Language     | TypeScript 5                                  |
| UI           | React 19, Tailwind CSS 4, shadcn/ui (Base UI) |
| Backend / DB | Supabase (PostgreSQL + Storage + RLS)         |
| Date         | date-fns 4, react-day-picker 9                |
| Share        | Kakao Share SDK                               |
| Icons        | lucide-react                                  |

---

## 아키텍처

```
브라우저 (Next.js Client Components)
        │
        ▼
Supabase JS SDK  ──────────►  Supabase (PostgreSQL + Storage)
        │
        ▼
Next.js API Routes (/app/api/*)
```

- **인증 없음**: session_token(UUID)을 localStorage에 저장하고, Supabase RLS는 전체 공개 정책으로 동작합니다.
- **그룹 격리**: 모든 데이터(books, reviews, routine_logs)는 `group_id`로 격리됩니다.
- **Storage**: 루틴 인증 사진은 Supabase `routine-photos` 버킷에 저장됩니다.

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- Supabase 프로젝트 (DB + Storage)
- Kakao Developers 앱 (카카오 공유 기능 사용 시)

### 설치

```bash
npm install
```

### 환경 변수

`.env.local` 파일을 생성하고 아래 값을 채워주세요.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_KAKAO_JS_KEY=
```

### DB 스키마 적용

```bash
# Supabase 대시보드 SQL 에디터 또는 CLI로 실행
supabase/schema.sql
```

### 실행

```bash
npm run dev   # 개발 서버 (http://localhost:3000)
npm run build # 프로덕션 빌드
npm start     # 프로덕션 서버
```

---

## 주요 기능

- **그룹 생성 / 참여** — 초대코드(`BOOK-XXXX`) 발급 및 닉네임만으로 즉시 참여
- **그룹 피드** — 루틴 완료 기록과 독후감을 시간순으로 통합 노출, 멤버·루틴 타입별 필터
- **독후감** — 책 등록 후 독후감 작성·수정·삭제, 댓글 지원
- **루틴 체크인** — 헬스·식단·듀오링고·독서·런닝 등 8가지 루틴 인증 (사진 최대 4장 + 텍스트)
- **주간 미완료 현황** — 이번 주 루틴 목표 대비 달성률을 그룹 피드 상단에 표시
- **카카오 재촉 메시지** — 미완료 멤버에게 카카오톡 공유로 루틴 독려
- **루틴 날짜 설정** — 루틴 기록 시 실제 완료 날짜 지정 가능
- **이미지 라이트박스** — 인증 사진 전체화면 슬라이드 뷰

---

## 프로젝트 구조

```
bookorry/
├── app/
│   ├── page.tsx              # 홈 (그룹 만들기 / 초대코드 입력)
│   ├── create/               # 그룹 생성
│   ├── join/                 # 초대코드로 그룹 참여
│   ├── group/[id]/           # 그룹 피드 (메인 화면)
│   │   └── routines/         # 루틴 탭 (루틴 목록 + 설정)
│   ├── routines/             # 루틴별 체크인 페이지
│   │   ├── [gym|diet|running|...]/ # 각 루틴 인증 폼
│   │   └── reading/          # 독서 루틴 (책 선택 → 독후감)
│   ├── books/[id]/           # 책 상세 (독후감 목록)
│   ├── reviews/[id]/         # 독후감 상세 + 댓글
│   ├── routine-logs/[id]/    # 루틴 로그 수정
│   └── api/                  # API Routes (CRUD)
├── components/
│   ├── bottom-nav.tsx        # 하단 네비게이션 바
│   ├── header.tsx            # 상단 헤더
│   ├── image-lightbox.tsx    # 이미지 라이트박스
│   ├── kakao-share-button.tsx
│   └── ui/                   # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── supabase-relations.ts # Supabase 관계 헬퍼
│   ├── format-display-date.ts
│   └── utils.ts
├── supabase/
│   └── schema.sql            # DB 스키마 (groups, members, books, reviews, routine_logs 등)
└── types/                    # 공통 TypeScript 타입
```

---

## 스크린샷 / 데모

![홈 화면](./docs/images/home.png)

<!-- TODO: 스크린샷 추가 필요 -->

![그룹 피드](./docs/images/group-feed.png)

<!-- TODO: 스크린샷 추가 필요 -->

![루틴 체크인](./docs/images/routine-checkin.png)

<!-- TODO: 스크린샷 추가 필요 -->

---

## 환경 변수 전체 목록

| 변수명                                         | 설명                       |
| ---------------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase 프로젝트 URL      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key          |
| `NEXT_PUBLIC_KAKAO_JS_KEY`                     | Kakao JavaScript SDK 앱 키 |
