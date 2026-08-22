# ⏱️ Clock Rhythm

개인용 집중 시간대, 할 일(Todo) 관리, 알림음, 테마 설정, 그리고 JSON 백업 및 복원을 한 곳에서 편리하게 관리할 수 있는 가벼운 데스크톱 시간 관리 애플리케이션입니다.

**Clock Rhythm**은 단순한 시계를 넘어, 개인 맞춤형 집중 시간대를 기반으로 집중과 휴식의 흐름을 안내하고 오늘 할 일을 직관적으로 관리할 수 있도록 설계된 개인 생산성 도구입니다. 앱 창을 닫아도 시스템 트레이(Tray)에서 백그라운드로 실행되며 지속적으로 알림을 제공합니다.

---

## 🌟 주요 기능

- **집중/휴식 시간 흐름 제어**: 개인별 집중 시간대 설정을 바탕으로 집중 및 휴식 알림 제공
- **시스템 트레이 상주**: 창을 닫아도 앱이 완전히 종료되지 않고 백그라운드(트레이)에서 알림 유지
- **오늘 할 일(Todo) 관리**: 할 일의 추가, 완료 체크, 수정, 삭제 기능 지원
- **캘린더 뷰**: 날짜별 Todo 내역을 한눈에 확인하고 관리하는 전용 캘린더 화면 제공
- **유연한 알림음 설정**: 기본 제공 알림음 및 커스텀 MP3 파일 지정, 무음 모드 지원 및 앱 전용 볼륨 조절 가능
- **다국어 지원**: 한국어(KOR) 및 영어(EN) 언어 설정 지원
- **시각적 개인화**: 11가지의 다양한 테마 색상 제공
- **데이터 백업 및 복원**: 설정을 포함한 모든 데이터를 JSON 파일로 간편하게 내보내기/가져오기 지원
- **운영체제별 다운로드 파일 제공**: Windows 실행 파일과 macOS 압축 파일을 각각 제공

---

## 📥 사용자 다운로드 및 실행 방법

사용자는 아래에서 본인 운영체제에 맞는 파일 하나만 다운로드하면 됩니다. 소스코드를 복제하거나 직접 빌드할 필요가 없습니다.

| 운영체제 | 다운로드 파일 | 실행 방법 |
| :--- | :--- | :--- |
| Windows | **[Clock Rhythm.exe 다운로드](download/Clock%20Rhythm.exe)** | 다운로드한 `Clock Rhythm.exe`를 더블클릭합니다. |
| macOS | **[Clock Rhythm macOS.zip 다운로드](download/Clock%20Rhythm%20macOS.zip)** | 압축을 푼 뒤 `Clock Rhythm.app`을 실행합니다. |

> [!NOTE]
> 일반 사용자분들은 소스코드를 복제(Clone)하거나 직접 빌드할 필요가 없습니다. 다음과 같은 개발 환경 및 도구의 설치도 요구되지 않습니다:
> - Node.js
> - npm
> - Vite
> - Neutralino CLI
> - 기타 개발 도구

### 배포 형태 안내
현재 사용자 배포 기준은 운영체제별 단일 다운로드 파일입니다.
* Windows 사용자는 `Clock Rhythm.exe` 파일 하나만 다운로드합니다.
* macOS 사용자는 `Clock Rhythm macOS.zip` 파일 하나만 다운로드합니다. 이 파일은 Apple Silicon과 Intel Mac을 모두 지원하는 universal 실행 파일을 포함합니다.
* 개발 과정에서 일반적인 Neutralino 기본 빌드를 배포할 경우에는 실행 파일 외에 `resources.neu` 파일이 함께 요구될 수 있습니다.
* 하지만 본 프로젝트의 배포 스크립트는 `--embed-resources` 옵션을 사용하여 모든 리소스를 실행 파일 내부에 포함(Embed)하므로, 사용자는 위 다운로드 파일만으로 앱을 실행할 수 있습니다.

> [!TIP]
> macOS에서 처음 실행할 때 보안 확인 메시지가 표시되면 `Clock Rhythm.app`을 우클릭한 뒤 **열기**를 선택해 실행합니다.

---

## 💻 개발자 실행 방법

### 사전 요구사항
이 프로젝트를 로컬 개발 환경에서 실행하려면 다음 도구가 필요합니다:
- **Node.js**: `20.19+` 또는 `22.12+` 버전
- **npm** (Node Package Manager)

### 1. 의존성 패키지 설치
프로젝트 루트 디렉터리에서 아래 명령어를 실행하여 필요한 패키지를 설치합니다:
```powershell
npm install
```

### 2. 개발 서버 및 앱 실행
설치가 완료되면 다음 명령어를 통해 Neutralino 개발 모드로 앱을 실행합니다:
```powershell
npm run dev
```
> [!IMPORTANT]
> `npm run dev` 명령어는 실제 Neutralino 런타임을 구동합니다. 시스템 트레이 상주, 파일 선택기, 네이티브 알림, 로컬 저장소 등 **Native API 관련 기능은 일반 브라우저 프리뷰 환경이 아닌, 이 개발 실행 환경에서 직접 확인해야 합니다.**

---

## 🧪 검증 명령어

프로젝트의 품질과 안정성을 유지하기 위해 제공되는 코드 검증 명령어 목록입니다:

```powershell
# 모든 검증 도구 실행 예시
npm run test
npm run typecheck
npm run lint
npm run deps
npm run build
```

| 명령어 | 수행 목적 |
| :--- | :--- |
| `npm run test` | Vitest 기반의 단위 및 통합 테스트 실행 |
| `npm run typecheck` | TypeScript 정적 타입 검사 수행 |
| `npm run lint` | ESLint 규칙을 통한 코드 스타일 및 잠재적 오류 검사 |
| `npm run deps` | dependency-cruiser를 사용한 아키텍처 레이어 간 의존성 경계 검사 |
| `npm run build` | Vite를 통한 프로덕션 빌드 파일 생성 |

---

## 📦 배포 파일 패키징

### Windows 단일 실행 파일 패키징

Windows 사용자 배포를 위한 단일 실행 파일은 아래 명령어로 간단하게 빌드할 수 있습니다:

```powershell
npm run package:win:single
```

이 스크립트는 **코드 검증 명령어들을 차례로 실행**한 후, 검증이 모두 통과되면 Neutralino 릴리스 빌드를 생성하고 리소스를 실행 파일에 포함합니다.

### 패키징 결과물 경로
빌드가 완료되면 다음 위치에 실행 파일이 생성됩니다:
1. `download/Clock Rhythm.exe` (저장소에서 사용자가 바로 다운로드할 수 있도록 관리하는 배포용 파일)
2. `release/Clock Rhythm/Clock Rhythm.exe` (로컬 빌드 산출물 폴더로, `.gitignore`에 등록되어 git 버전에 포함되지 않음)
3. 사용자 바탕화면의 `Clock Rhythm.exe` (편의를 위해 바탕화면에 바로 복사됨)

> [!WARNING]
> 개발용 Neutralino 런타임 파일인 `bin/neutralino-win_x64.exe`는 사용자에게 배포하는 최종 실행 파일이 아닙니다.

### macOS 다운로드 파일 패키징

macOS 사용자 배포를 위한 압축 파일은 macOS 환경에서 아래 명령어로 빌드합니다:

```bash
npm run package:mac:download
```

이 스크립트는 **코드 검증 명령어들을 차례로 실행**한 후, 검증이 모두 통과되면 Neutralino 릴리스 빌드를 생성하고 macOS universal 실행 파일을 압축합니다.

### 패키징 결과물 경로
빌드가 완료되면 다음 위치에 파일이 생성됩니다:
1. `download/Clock Rhythm macOS.zip` (저장소에서 사용자가 바로 다운로드할 수 있도록 관리하는 배포용 파일)
2. `release/Clock Rhythm/macOS/Clock Rhythm.app` (로컬 빌드 산출물 폴더로, `.gitignore`에 등록되어 git 버전에 포함되지 않음)

> [!WARNING]
> 개발용 Neutralino 런타임 파일인 `bin/neutralino-mac_universal`은 사용자에게 배포하는 최종 실행 파일이 아닙니다.

---

## 💾 데이터 백업 및 복원

앱 내의 **데이터** 탭을 통해 애플리케이션 설정과 Todo 목록을 JSON 형식의 파일로 편리하게 내보내거나 가져올 수 있습니다.

### 백업 JSON 포함 항목
- ⚙️ 앱 기본 설정
- 📝 등록된 할 일(Todo) 목록
- 🌐 언어 설정 (KOR/EN)
- 🎨 테마 설정
- 🔊 알림음 설정 및 관련 속성값

> [!IMPORTANT]
> - **전체 교체 방식**: 데이터 가져오기(Import) 기능은 기존 데이터와의 '병합'이 아닌 **'전체 교체(Overwrite)'** 방식입니다. 파일을 가져오는 즉시 현재 등록된 설정과 Todo 목록이 백업 파일 내용으로 완전히 대체됩니다.
> - **커스텀 MP3 미포함**: 사용자가 개별 지정한 커스텀 알림음 MP3 파일의 바이너리 데이터는 JSON 백업 파일에 포함되지 않습니다. 커스텀 알림음 파일 자체는 사용자가 로컬 기기에 별도로 보관하고 관리해야 합니다.

---

## 🏗️ 아키텍처 및 프로젝트 구조 (개발자/AI 가이드)

본 프로젝트는 **Neutralinojs + React + TypeScript** 환경으로 구축된 데스크톱 애플리케이션입니다. 깨끗한 아키텍처를 유지하기 위해 명확한 도메인 경계와 의존성 규칙을 따르고 있습니다.

### 🧩 모듈 지도와 데이터 소유권

- `src/app`: 앱 셸, 화면 이동, 런타임 선택, Composition Root를 소유합니다. `main.tsx`는 이 영역과 React 진입점만 참조합니다.
- `src/contexts/rhythm`: 집중/휴식 세션, 일정 계산, 알림·소리·트레이·스케줄러 어댑터와 시계 화면을 소유합니다.
- `src/contexts/todo`: Todo 도메인과 유스케이스, `todos` 저장소, 캘린더/목록 화면을 소유합니다.
- `src/contexts/preferences`: 사용자 설정 도메인과 유스케이스, `user-preferences` 저장소, 자동 시작·알림음 파일 어댑터와 설정 화면을 소유합니다.
- `src/features/data-transfer`: Preferences와 Todo의 공개 백업 계약을 조합해 JSON 내보내기/가져오기를 수행합니다. 각 컨텍스트의 저장소를 직접 참조하지 않습니다.
- `src/shared`: 비즈니스 모듈에 의존하지 않는 i18n, 시간 계약, 재사용 UI 컨트롤만 포함합니다.

각 비즈니스 모듈은 `public.ts`로 애플리케이션 계약을, 필요한 경우 `public-model.ts`와 `public-presentation.ts`로 모델 및 화면 계약을 공개합니다. 외부 모듈은 이 공개 표면만 사용하며, `composition.ts`는 `src/app/composition`에서만 호출할 수 있습니다.

### 📐 의존성 규칙 (Dependency Rules)

1. Domain은 Application, Infrastructure, Presentation, React, Neutralino에 의존하지 않습니다.
2. Application은 Infrastructure와 Presentation에 의존하지 않으며, 외부 효과는 포트로 표현합니다.
3. 컨텍스트와 기능은 `app`을 참조하지 않고, `shared`는 어떤 비즈니스 모듈도 참조하지 않습니다.
4. Rhythm은 Preferences를 참조하지 않습니다. 유일하게 허용된 비즈니스 방향은 Preferences가 Rhythm의 `public-model.ts`를 사용하는 것입니다.
5. Data Transfer는 Preferences와 Todo의 공개 계약만 사용하고 저장소나 내부 도메인 경로를 직접 가져오지 않습니다.
6. 브라우저와 Neutralino 구현은 사용하는 모듈의 `infrastructure`에 위치하며, 구체 구현의 조립은 `src/app/composition`에서만 수행합니다.
7. 위 규칙은 `.dependency-cruiser.cjs`와 `src/architecture` 회귀 테스트로 검증합니다.

> [!TIP]
> AI 에이전트와 개발자는 프로젝트 내 코드를 수정하기 전에 반드시 루트 디렉터리에 위치한 [AGENTS.md](AGENTS.md) 파일을 함께 정독해야 합니다. 이 `README.md`가 전체 프로젝트의 아웃라인을 설명한다면, [AGENTS.md](AGENTS.md)는 개발 작업 규정 및 구체적인 코드 품질 검증 요건을 포함하고 있습니다.

---

## ⚠️ 알려진 제약 사항

- **플랫폼 검증 범위**: 현재 사용자 다운로드 파일은 Windows와 macOS를 대상으로 제공합니다. Linux 배포 파일은 아직 공식 다운로드 대상으로 관리하지 않습니다.
- **런타임 의존성**: 앱의 실행 및 렌더링은 기기에 설치된 OS WebView 및 Neutralino 런타임 환경에 전적으로 의존합니다.
- **Google Tasks 연동 제외**: 이전에 검토 및 실험되었던 Google Tasks API와의 연동 및 OAuth 인증 기능은 현재 기능 범위에서 공식적으로 배제되었으며, 로컬 JSON 파일 기반의 백업 및 복원 기능이 이를 완전히 대체합니다.
- **데이터 교체 동작**: JSON 가져오기 시 병합(Merge)이나 충돌 해결(Conflict Resolution) 메커니즘을 지원하지 않고, 무조건 덮어쓰기 방식으로 작동하므로 데이터 유실에 유의해야 합니다.

---

## 📄 관련 문서 목록

- [Neutralino 런타임 문제 해결 가이드](docs/neutralino-runtime-troubleshooting.md) - 앱 실행 및 런타임 관련 문제 해결 방법 안내
- [Google Tasks OAuth 및 동기화 가이드](docs/google-tasks-oauth-guide.md) - 기능 기획 및 이전 개발 실험/문제 해결 기록 보존용 문서 (현재 제품의 활성 기능 가이드가 아님)
