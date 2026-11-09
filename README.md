# My Calendar

일정에 원하는 시간 전(10분, 1시간, 3시간, 24시간 등)에 알림을 받을 수 있는 macOS 캘린더 앱.

## 다운로드

[Releases](https://github.com/yh21/my-calendar/releases)에서 본인 맥에 맞는 `.dmg`를 받으세요.

- Apple Silicon (M1 이후): `aarch64`
- Intel 맥: `x64`

### 처음 실행할 때

Apple 개발자 인증을 받지 않은 앱이라 처음 실행할 때 경고가 뜰 수 있어요.

1. `.dmg`를 열고 My Calendar를 **Applications 폴더**로 끌어다 놓아요.
2. **"확인되지 않은 개발자" 경고**가 뜨면 My Calendar를 **우클릭 → 열기**를 눌러요.
3. **"손상되었기 때문에 열 수 없습니다(is damaged)"** 경고가 뜨면 앱이 망가진 게 아니에요. 팝업에서 **취소**를 누르고 터미널에서 아래 명령을 실행한 뒤 다시 열어주세요. (인터넷에서 받은 파일에 붙는 격리 표시를 지우는 명령이에요.)

   ```bash
   xattr -cr "/Applications/My Calendar.app"
   ```

4. 알림 권한 팝업이 뜨면 **허용**을 눌러주세요.

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
