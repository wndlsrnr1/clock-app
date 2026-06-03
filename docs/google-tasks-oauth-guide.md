# Google Tasks OAuth 및 동기화 가이드

이 문서는 Clock Rhythm 앱에서 Google Tasks를 실제로 연결하고, Todo 생성/수정/완료/가져오기/삭제 동기화까지 검증하는 절차를 설명합니다.

Google OAuth 문제와 Neutralino 런타임 문제는 분리해서 봐야 합니다. 이 문서는 Google Cloud 설정, OAuth 인증, Google Tasks API, 앱 동기화만 다룹니다. Neutralino 앱이 켜지지 않거나 Native API가 연결되지 않는 문제는 `docs/neutralino-runtime-troubleshooting.md`를 먼저 확인합니다.

## 먼저 이렇게 했어야 합니다

올바른 순서는 다음입니다.

1. Google Cloud Console에서 Google Tasks API를 활성화합니다.
2. OAuth consent screen에 테스트 사용자를 등록합니다.
3. OAuth Client 유형을 Desktop app으로 만듭니다.
4. 앱을 브라우저 프리뷰가 아니라 Neutralino 실제 런타임으로 실행합니다.
5. 앱에 Desktop OAuth Client ID와 Client Secret을 저장합니다.
6. 앱에서 `인증 URL 열기`를 누릅니다.
7. Chrome에서 Google 계정을 선택하고 Tasks 권한을 허용합니다.
8. 브라우저가 이동한 redirect URL 전체를 복사합니다.
9. 앱의 `인증 code 또는 redirect URL` 입력칸에 전체 URL을 붙여넣고 `인증 저장`을 누릅니다.
10. `목록 불러오기`를 누르고 동기화할 Google Tasks 목록을 선택합니다.
11. `수동 동기화`로 실제 CRUD 동기화를 검증합니다.

중요한 점은 `인증 URL 열기`와 redirect URL 붙여넣기가 같은 OAuth 시도 안에서 이어져야 한다는 것입니다. 오래된 redirect URL은 사용할 수 없습니다.

## Google Cloud 설정

### 1. Google Tasks API 활성화

Google Cloud Console에서 현재 프로젝트를 선택하고 Google Tasks API를 활성화합니다.

앱에서 목록 로드 시 다음과 비슷한 오류가 나오면 API가 비활성화된 상태일 수 있습니다.

```text
Google Tasks API has not been used in project ... before or it is disabled.
```

해결:

1. Google Cloud Console에서 프로젝트 선택
2. APIs & Services로 이동
3. Google Tasks API 검색
4. Enable 클릭

### 2. OAuth 앱 테스트 사용자 등록

OAuth 앱이 Testing 상태라면 실제 로그인할 Google 계정을 테스트 사용자에 추가해야 합니다.

등록하지 않으면 Google 동의 화면에서 접근이 막히거나 권한 승인 단계로 넘어가지 못할 수 있습니다.

### 3. Desktop OAuth Client 생성

OAuth Client는 Web application이 아니라 Desktop app으로 만듭니다.

앱에는 다음 두 값을 입력합니다.

- Client ID
- Client Secret

이 값은 Google Cloud Console에서 발급받은 값을 사용합니다. 문서, 코드, 커밋 메시지, 이슈 본문에 실제 값을 적지 않습니다.

## 앱에서 인증하기

### 1. 앱 실행

OAuth는 브라우저 프리뷰가 아니라 Neutralino 실제 앱에서 검증합니다.

```powershell
npm run dev
```

### 2. OAuth 정보 저장

앱의 Google Tasks 연동 영역에서 다음을 입력합니다.

- `Client ID`
- `Client Secret`

그 다음 `OAuth 정보 저장`을 누릅니다.

### 3. 인증 URL 열기

`인증 URL 열기`를 누르면 앱이 다음을 수행합니다.

- PKCE `code_verifier` 생성
- `state` 생성
- 현재 Neutralino port 기준 redirect URI 생성
- pending authorization 저장
- Chrome에서 Google 인증 URL 열기

이 pending 값은 token exchange에 필요합니다. 따라서 `인증 URL 열기`를 누른 뒤 오래된 redirect URL을 붙여넣으면 안 됩니다.

### 4. Google 동의

Chrome에서 Google 계정을 선택합니다. 테스트 앱이면 `Google에서 확인하지 않은 앱` 경고가 보일 수 있습니다.

신뢰할 수 있는 본인 테스트 앱이라면 계속 진행합니다.

요청 권한은 Google Tasks scope입니다.

```text
https://www.googleapis.com/auth/tasks
```

### 5. redirect URL 전체 붙여넣기

동의 후 브라우저 주소가 다음 형태로 이동합니다.

```text
http://127.0.0.1:<port>/google-oauth?code=...&state=...
```

주소 전체를 복사해서 앱의 `인증 code 또는 redirect URL` 입력칸에 붙여넣고 `인증 저장`을 누릅니다.

권장 입력은 전체 redirect URL입니다. code만 붙여넣는 흐름은 호환용으로 남아 있지만, 전체 URL을 붙여넣어야 앱이 `state`와 redirect URI를 검증할 수 있습니다.

## 실제로 발생했던 오류와 원인

### 1. "Google 인증을 먼저 시작해주세요."

원인:

- `.storage/google-tasks-settings.neustorage`에 pending authorization이 없는 상태였습니다.
- 오래된 redirect URL을 붙여넣었거나, `인증 URL 열기` 이후 설정이 갱신되면서 pending 값이 사라진 상태였습니다.

해결:

1. 앱에서 `인증 URL 열기`를 다시 누릅니다.
2. 새로 열린 Google 인증 화면에서 다시 동의합니다.
3. 새 redirect URL 전체를 복사합니다.
4. 앱에 붙여넣고 `인증 저장`을 누릅니다.

핵심은 pending `state`와 redirect URL의 `state`가 같은 시도에서 나온 값이어야 한다는 점입니다.

### 2. `client_secret is missing`

원인:

- 실제 Desktop OAuth token exchange에서 Client Secret이 요구되었습니다.
- 앱이 Client ID만 저장하고 token endpoint에 Client Secret을 보내지 않으면 HTTP 400이 발생할 수 있습니다.

해결:

1. Google Cloud Console의 Desktop OAuth Client에서 Client Secret을 확인합니다.
2. 앱에 Client ID와 Client Secret을 함께 저장합니다.
3. 인증을 처음부터 다시 시작합니다.

주의:

- Client Secret은 코드에 하드코딩하지 않습니다.
- `.env`나 문서에도 실제 값을 적지 않습니다.
- 앱의 로컬 Neutralino storage에만 저장합니다.

### 3. WebView에서 `fetch`가 실패합니다

원인:

- 브라우저 내장 `fetch`를 unbound function으로 저장한 뒤 `this.fetcher(...)`처럼 호출하면 WebView에서 `Illegal invocation`이 날 수 있습니다.

해결:

앱 코드는 `globalThis.fetch(input, init)` 형태로 호출하는 wrapper를 사용합니다.

```ts
function browserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}
```

이 방식은 `fetch` 호출 receiver를 `globalThis`로 유지합니다.

### 4. 인증은 됐는데 목록이 안 불러와집니다

가능한 원인:

- Google Tasks API 비활성화
- access token 만료 후 refresh 실패
- OAuth scope가 잘못됨
- 테스트 사용자 등록 누락

확인 순서:

1. Google Tasks API 활성화 여부 확인
2. OAuth 테스트 사용자 확인
3. 앱에서 인증을 새로 수행
4. `목록 불러오기` 재시도

앱은 실패 시 token이나 code를 UI에 노출하지 않고 요약 메시지만 보여줘야 합니다.

## 목록 선택과 수동 동기화

인증 저장 후 `목록 불러오기`를 누릅니다.

검증용으로는 전용 목록을 사용하는 것이 안전합니다.

```text
Clock Rhythm E2E
```

목록이 없으면 Google Tasks 쪽에서 새 목록을 만들고 다시 `목록 불러오기`를 누릅니다.

목록 선택 후 `수동 동기화`를 누르면 앱은 다음 순서로 처리합니다.

1. pending deletion을 Google Tasks에 먼저 반영
2. 로컬 Todo 중 Google task id가 있는 항목은 patch
3. 로컬 Todo 중 Google task id가 없는 항목은 insert
4. Google Tasks에는 있지만 로컬에는 없는 항목은 import
5. sync result를 UI 메시지로 표시

## E2E 검증 절차

검증은 `Clock Rhythm E2E` 목록에서만 수행합니다.

### 1. 생성 동기화

1. 앱에서 로컬 Todo를 추가합니다.
2. `수동 동기화`를 누릅니다.
3. Google Tasks `Clock Rhythm E2E` 목록에 같은 제목의 task가 생겼는지 확인합니다.

성공 기준:

- Google task가 생성됨
- 로컬 Todo에 `googleTaskId`가 연결됨

### 2. 수정 및 완료 동기화

1. 앱에서 Todo 제목을 바꿉니다.
2. Todo를 완료 처리합니다.
3. `수동 동기화`를 누릅니다.
4. Google Tasks에서 제목과 완료 상태가 바뀌었는지 확인합니다.

성공 기준:

- Google task title이 바뀜
- Google task status가 `completed`가 됨

### 3. 가져오기 동기화

1. Google Tasks에서 새 task를 만듭니다.
2. 앱에서 `수동 동기화`를 누릅니다.
3. 앱 Todo 목록에 Google task가 들어오는지 확인합니다.

성공 기준:

- 로컬 Todo가 생성됨
- 가져온 Todo의 시간은 `null`입니다.

Google Tasks API는 due 시간을 보존하지 않으므로 앱의 Todo 시간은 로컬 메타데이터입니다.

### 4. 삭제 동기화

1. Google과 연결된 Todo를 앱에서 삭제합니다.
2. 앱은 pending deletion을 기록하고 로컬 Todo를 제거합니다.
3. `수동 동기화`를 누릅니다.
4. Google Tasks에서 해당 task가 삭제됐는지 확인합니다.

성공 기준:

- Google task가 삭제됨
- pending deletion 저장소가 비워짐

## 안전한 확인 명령

로컬 storage 파일에는 token과 secret이 들어갈 수 있습니다. 내용을 그대로 출력하지 않습니다.

안전한 확인:

```powershell
Get-ChildItem -Force .storage | Select-Object Name,Length,LastWriteTime
```

token 존재 여부만 확인해야 할 때도 값을 출력하지 말고 boolean만 확인합니다.

```powershell
$json = Get-Content -Raw .storage\google-tasks-credential.neustorage | ConvertFrom-Json
[pscustomobject]@{
  HasAccessToken = [bool]$json.accessToken
  HasRefreshToken = [bool]$json.refreshToken
  Scope = $json.scope
}
```

## 최종 점검 명령

OAuth나 sync 코드를 바꿨다면 아래를 모두 실행합니다.

```powershell
npm run test
npm run typecheck
npm run lint
npm run deps
npm run build
npm run package
```

문서만 바꿨다면 최소한 다음을 확인합니다.

```powershell
git diff --check
```

## 공식 문서

- Google OAuth for Desktop Apps: https://developers.google.com/identity/protocols/oauth2/native-app
- Google Tasks API REST: https://developers.google.com/workspace/tasks/reference/rest
- Google Tasks task lists REST resource: https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists
