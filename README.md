# My Calendar

일정에 원하는 시간 전(10분, 1시간, 3시간, 24시간 등)에 알림을 받을 수 있는 macOS 캘린더 앱.

## 다운로드

[Releases](https://github.com/yh21/my-calendar/releases)에서 본인 맥에 맞는 `.dmg`를 받으세요.

- Apple Silicon (M1 이후): `aarch64`
- Intel 맥: `x64`

### 처음 실행할 때

Apple 개발자 인증을 받지 않은 앱이라 처음 실행할 때 경고가 뜰 수 있어요.

1. `.dmg`를 열고 My Calendar를 **Applications 폴더**로 끌어다 놓아요.
2. My Calendar를 열면 **"Not Opened(열 수 없음)"** 경고가 떠요. 팝업에서 **Done(완료)**을 눌러요. (`Move to Trash`는 누르지 마세요.)
3. **시스템 설정 → 개인정보 보호 및 보안**을 열고, 아래쪽 **보안** 항목에서 `My Calendar.app`이 차단됐다는 문구 옆의 **그래도 열기(Open Anyway)**를 눌러요. 맥 비밀번호나 Touch ID를 입력하고, 확인창에서 **열기**를 눌러요. 처음 한 번만 하면 돼요.
   - 차단 문구는 앱을 열어 본 직후 약 1시간 동안만 보여요. 안 보이면 앱을 한 번 더 열어 보세요.
4. 알림 권한 팝업이 뜨면 **허용**을 눌러주세요.

**"손상되었기 때문에 열 수 없습니다(is damaged)"** 경고가 뜬다면(v0.1.0 등 이전 버전) 앱이 망가진 게 아니에요. **취소**를 누르고 터미널에서 아래 명령을 실행한 뒤 다시 열어주세요.

```bash
xattr -cr "/Applications/My Calendar.app"
```

알림이 오려면 앱이 켜져 있어야 해요.

## 개발

필요한 것: Node.js, [Rust](https://rustup.rs)

```bash
npm install
npm run dev          # 브라우저에서 개발
npx tauri dev        # 맥 앱 창으로 개발
npx tauri build      # .app / .dmg 빌드
```

## 릴리스

태그를 push하면 GitHub Actions가 `.dmg`를 빌드해서 Releases에 올려요.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 기술 스택

React + TypeScript + Vite, Tauri 2
