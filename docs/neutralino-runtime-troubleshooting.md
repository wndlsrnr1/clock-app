# Neutralino 런타임 문제 해결 가이드

이 문서는 Clock Rhythm 앱이 Neutralino 실제 런타임에서 켜지지 않거나, Native API가 동작하지 않거나, 흰 화면과 리소스 오류가 보일 때 따라가는 가이드입니다.

브라우저 프리뷰와 Neutralino 실제 앱은 같은 화면처럼 보여도 실행 환경이 다릅니다. 트레이, 파일 선택, 저장소, `os.open`, `server.mount` 같은 기능은 Neutralino 런타임에서만 검증해야 합니다.

## 먼저 이렇게 했어야 합니다

1. 브라우저 프리뷰 주소만 보고 판단하지 않습니다.
   - `http://127.0.0.1:5174/` 같은 Vite 주소는 UI 프리뷰일 수 있습니다.
   - Native API 검증은 반드시 `npm run dev`로 띄운 Neutralino 창에서 합니다.

2. 개발 서버 포트를 고정합니다.
   - 현재 기준 포트는 `http://localhost:14557/`입니다.
   - Vite가 임의로 `5173`, `5174`, `5175`처럼 옮겨 다니면 Neutralino가 잘못된 URL을 열 수 있습니다.

3. Neutralino client 초기화 경로를 하나로 둡니다.
   - 앱 코드는 `@neutralinojs/lib`에서 `init()`을 호출합니다.
   - WebView는 Neutralino globals를 주입합니다.
   - client library를 HTML에서 별도로 중복 로드하지 않습니다.

4. `neu run`이 출력한 정보를 먼저 읽습니다.
   - `neu CLI connected with the application.`이 보여야 Neutralino 앱과 CLI가 연결된 상태입니다.
   - `.tmp/auth_info.json`이 생성되면 Native API 연결 정보가 export된 상태입니다.

## 현재 기준 설정

`neutralino.config.json`의 핵심 설정은 다음과 같습니다.

```json
{
  "modes": {
    "window": {
      "injectGlobals": true,
      "injectClientLibrary": false
    }
  },
  "cli": {
    "frontendLibrary": {
      "devUrl": "http://localhost:14557",
      "devCommand": "npm run dev:vite -- --host localhost --port 14557 --strictPort"
    }
  }
}
```

`src/main.tsx`에서는 Neutralino 런타임일 때만 `init()`을 호출합니다.

```ts
if (!isNeutralinoRuntime()) {
  return composeBrowserPreviewApplication();
}

init();
return composeApplication();
```

이 구조의 의도는 명확합니다.

- 브라우저 프리뷰: mock/browser preview adapter 사용
- Neutralino 앱: 실제 Neutralino adapter 사용
- globals: WebView가 주입
- client library: `@neutralinojs/lib`에서 import

## 증상별 원인과 해결

### 1. 앱이 흰 화면으로 뜹니다

가장 먼저 확인할 것은 실행 경로입니다.

잘못된 접근:

```powershell
bin\neutralino-win_x64.exe --load-dir-res --path=. --url=http://127.0.0.1:5174
```

이 방식은 dev server, globals patch, auth info export, Neutralino dev extension 연결을 모두 직접 맞춰야 합니다. 빠르게 실행되는 것처럼 보여도 Native API 연결이 깨질 수 있습니다.

권장 접근:

```powershell
npm run dev
```

`npm run dev`는 `neu run`을 통해 Vite dev server와 Neutralino 앱을 같이 띄웁니다. 이 흐름에서만 frontend library 개발 환경과 Neutralino Native API가 같은 세션으로 연결됩니다.

### 2. `NE_CL_IVCTOKN` 또는 `NE_RT_INVTOKN`이 보입니다

이 오류는 Neutralino client가 framework core와 통신할 때 쓰는 token 연결이 맞지 않을 때 발생합니다.

주요 원인:

- HTML에서 `neutralino.js`를 직접 로드하면서 `@neutralinojs/lib`도 같이 쓰는 경우
- `injectGlobals`, `injectClientLibrary`, `@neutralinojs/lib init()` 역할이 중복된 경우
- `neu run`이 아닌 수동 실행으로 `NL_TOKEN`/`NL_PORT` 세션이 맞지 않는 경우

해결:

1. `index.html`에 `__neutralino_globals.js`나 `neutralino.js`를 직접 넣지 않습니다.
2. `neutralino.config.json`에서 `injectGlobals: true`, `injectClientLibrary: false`를 유지합니다.
3. 앱 코드는 `@neutralinojs/lib`의 `init()`만 호출합니다.
4. 실행은 `npm run dev`로 합니다.

검증:

```powershell
npm run test -- src/platform/neutralino/NeutralinoRuntimeConfiguration.test.ts
```

### 3. `NE_RS_UNBLDRE: Unable to load application resource file /dist/favicon.ico`가 보입니다

이 로그는 Neutralino가 `/dist/favicon.ico`를 찾으려 했지만 해당 파일이 없다는 뜻입니다.

현재 앱 실행 자체를 막는 핵심 오류는 아닙니다. favicon 요청이 실패한 것이므로, 앱 화면과 Native API가 정상이라면 우선순위를 낮게 봐도 됩니다.

필요하면 후속 작업으로 `dist` 빌드에 favicon을 포함시키거나 HTML에서 favicon 참조를 명확히 정리합니다.

### 4. `NE_RS_UNBLDRE: Unable to load application resource file /dist/google-oauth/index.html`가 보입니다

이 로그는 Google OAuth redirect URL이 다음처럼 열렸을 때 생깁니다.

```text
http://127.0.0.1:<port>/google-oauth?code=...&state=...
```

Neutralino 정적 서버에는 `/google-oauth/index.html` 파일이 없습니다. 현재 앱은 이 URL을 자동 callback endpoint로 처리하지 않고, 브라우저 주소창의 redirect URL 전체를 앱 입력칸에 붙여넣는 방식입니다.

따라서 이 로그는 현재 OAuth 수동 붙여넣기 흐름에서는 치명 오류가 아닙니다.

해야 할 일:

1. 브라우저 주소창의 redirect URL 전체를 복사합니다.
2. 앱의 `인증 code 또는 redirect URL` 입력칸에 붙여넣습니다.
3. `인증 저장`을 누릅니다.

하지 말아야 할 일:

- `/google-oauth` 정적 페이지를 급하게 만들지 않습니다.
- redirect URL을 자동 처리하는 척 localStorage나 다른 탭 상태를 억지로 공유하지 않습니다.
- 자동 callback이 필요하면 별도 설계로 분리합니다.

## Native API 기능별 확인 방법

### 파일 선택

브라우저 프리뷰에서는 Neutralino `os.showOpenDialog`가 동작하지 않습니다. mp3 파일 선택은 Neutralino 앱에서 확인해야 합니다.

```powershell
npm run dev
```

앱 창에서 `mp3 선택`을 누르고 실제 Windows 파일 다이얼로그가 열리면 정상입니다.

### 트레이와 창 닫기

트레이, 창 숨김, 앱 종료 유지도 브라우저 프리뷰에서 검증할 수 없습니다.

검증 순서:

1. `npm run dev`로 앱 실행
2. 창 닫기
3. 프로세스가 종료되지 않고 트레이에 남는지 확인
4. 트레이 메뉴에서 열기/일시정지/오늘 종료/완전 종료 확인

### 앱 데이터 저장

Neutralino storage는 `.storage/*.neustorage`에 저장됩니다. OAuth token이나 Client Secret이 들어갈 수 있으므로 파일 내용을 터미널에 출력하지 않습니다.

안전한 확인 예:

```powershell
Get-ChildItem -Force .storage | Select-Object Name,Length,LastWriteTime
```

위 명령은 파일 이름과 크기만 보여주므로 token 값을 노출하지 않습니다.

## 최종 점검 명령

런타임 설정을 바꿨다면 아래를 실행합니다.

```powershell
npm run test
npm run typecheck
npm run lint
npm run deps
npm run build
npm run package
```

문서나 공백만 바꿨다면 최소한 다음은 확인합니다.

```powershell
git diff --check
```

## 공식 문서

- Neutralino frontend libraries: https://neutralino.js.org/docs/getting-started/using-frontend-libraries/
- Neutralino Native API overview: https://neutralino.js.org/docs/api/overview/
- Neutralino global variables: https://neutralino.js.org/docs/api/global-variables/
