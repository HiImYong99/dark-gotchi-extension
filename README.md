# 👾 Dark-gotchi (다크고치) - 브라우징 습관에 반응하는 나만의 픽셀 펫

**Dark-gotchi**는 사용자의 웹 브라우징 습관에 따라 실시간으로 상태가 변하는 픽셀 아트 펫을 화면에 띄워주는 크롬 확장 프로그램(Chrome Extension)입니다. 외부 서버 의존 없이 **100% 로컬 환경**에서 동작하며, Shadow DOM을 활용한 완벽한 UI 격리와 백그라운드 서비스 워커를 통한 효율적인 상태 관리를 구현했습니다.

---

## 🎯 프로젝트 개요 (Project Overview)

- **프로젝트 명**: Dark-gotchi (다크고치)
- **플랫폼**: Chrome Extension (Manifest V3)
- **주요 기능**: 웹 브라우징 시간에 따른 펫 상태 변화(진화/타락), 상호작용(클릭 대사), 스킨 및 아이템 시스템, 다국어 지원
- **특징**: 서버 없는 완전한 로컬 구동, 오프라인 라이선스 검증, Shadow DOM을 통한 호스트 페이지 간섭 완벽 차단

---

## ✨ 핵심 기능 및 기술적 특징 (Key Features & Technical Highlights)

### 1. 🛡️ Shadow DOM을 활용한 완벽한 UI 캡슐화 (UI Encapsulation)
확장 프로그램의 UI가 사용자가 방문하는 웹사이트의 CSS나 JavaScript와 충돌하지 않도록, 모든 렌더링 요소를 **Shadow DOM** 내부에 격리하여 삽입했습니다. 이를 통해 어떠한 복잡한 웹페이지에서도 펫이 일관된 모습으로 렌더링됩니다.

### 2. ⚡ 브라우저 성능 최적화 (Performance Optimization)
웹페이지에 항상 떠 있는 UI의 특성상 성능 저하를 방지하는 것이 매우 중요합니다.
- **`visibilitychange` API 활용**: 사용자가 현재 보고 있지 않은 탭(백그라운드 탭)에서는 CSS 애니메이션과 상태 업데이트를 일시 중지하여 리소스 낭비를 막았습니다.
- **`requestIdleCallback` 적용**: 브라우저의 메인 스레드가 유휴 상태일 때만 무거운 업데이트 작업을 수행하도록 스케줄링하여 렌더링 성능을 최적화했습니다.

### 3. 🔒 서버리스(Serverless) 오프라인 라이선스 검증 시스템
서버 유지 비용과 외부 통신 지연을 없애기 위해, 사용자의 후원 코드(라이선스) 검증을 로컬에서 수행합니다. `lib/crypto-mini.js`를 자체 구현하여 SHA-256 해시 비교 및 패턴 매칭을 통해 안전하고 독립적인 검증 로직을 완성했습니다.

### 4. ⚙️ Manifest V3 아키텍처 및 철저한 로컬 스토리지 관리
Chrome Manifest V3의 권장 사항을 엄격히 준수합니다.
- **Background Service Worker**: `chrome.alarms` API를 활용해 1분 주기로 백그라운드에서 브라우징 시간을 추적하고 상태를 업데이트합니다.
- **데이터 영속성 및 스키마 관리**: 모든 데이터는 `chrome.storage.local`에 저장되며, `user_stats`(상태/시간), `settings`(라이선스/스킨), `pet_profile`(아이템 사용량), `item_state`(아이템 만료) 등 엄격한 스키마를 기반으로 관리됩니다.

### 5. 🛠️ 자체 구현된 테스트 및 빌드 파이프라인
외부 라이브러리 의존성을 최소화하고 순수 JavaScript(Vanilla JS)로 개발된 프로젝트의 특성에 맞춰 테스트와 빌드 환경을 직접 구축했습니다.
- **Custom Mock Testing (`mock_chrome.js`)**: Node.js 환경에서 Chrome API(runtime, tabs, alarms, storage)를 모방하는 목업 객체를 자체 제작하여, 브라우저 없이도 `tests/test_logic.js`를 통해 핵심 비즈니스 로직을 완벽하게 검증합니다.
- **Custom Build Script (`scripts/build.cjs`)**: 자산 복사, 코드 정리, `dist.zip` 압축까지 단일 스크립트로 처리하는 빌드 파이프라인을 구축했습니다.

---

## 💻 기술 스택 (Tech Stack)

- **Frontend / Core**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Extension API**: Manifest V3, Content Scripts, Background Service Worker, Storage API, Alarms API, i18n API
- **Security & Architecture**: Shadow DOM, Content Security Policy (`script-src 'self'; object-src 'self';`), SHA-256 Crypto
- **Test / Build**: Node.js, Custom Mock Chrome API, Custom Build Script

---

## 🎮 프로 기능 및 수익화 모델 (Pro Features & Monetization)

단순한 토이 프로젝트를 넘어, **Buy Me a Coffee**를 통한 후원 모델을 연동했습니다. 후원 시 지급되는 코드를 입력하면 다음과 같은 기능이 해제됩니다.
- **고급 스킨 제공**: Cat(고양이), Doge(시바견), Hamster(햄스터) 등 다양한 스킨(`assets/pets/{skin_name}/` 동적 로드)
- **아이템 시스템**: 펫의 타락(corruption) 속도를 50% 늦춰주는 쉴드 아이템 (24시간 지속, 일일 사용 제한 로직 구현)
- **커스텀 상호작용**: 유저가 직접 입력할 수 있는 커스텀 클릭 대사(Custom Insults)

---

## 📂 프로젝트 구조 (Project Structure)

```text
dark-gotchi/
├── _locales/           # 다국어 지원 (en, ko)
├── assets/
│   ├── icons/          # 확장 프로그램 아이콘
│   └── pets/           # 각 스킨(white_blob, cat 등) 및 상태별 픽셀 SVG 에셋
├── background/         # Service Worker 로직 (시간 추적, 상태 업데이트)
├── content/            # 웹페이지 내 펫 렌더링 로직 (Shadow DOM 적용)
├── lib/                # 오프라인 검증용 SHA-256 암호화 라이브러리
├── popup/              # 확장 프로그램 제어판 UI (설정, 라이선스 등록 등)
├── scripts/            # 커스텀 빌드 스크립트 (build.cjs)
├── tests/              # 비즈니스 로직 테스트 및 목업 (test_logic.js, mock_chrome.js)
└── manifest.json       # 확장 프로그램 설정 (권한, CSP, 진입점 등)
```

---

## 🚀 로컬 실행 가이드 (Installation)

1. 저장소를 클론(Clone)하거나 다운로드합니다.
2. Chrome 브라우저를 열고 `chrome://extensions/` 주소로 이동합니다.
3. 우측 상단의 **개발자 모드(Developer mode)**를 활성화합니다.
4. **압축해제된 확장 프로그램을 로드합니다(Load unpacked)** 버튼을 클릭하고, 프로젝트의 최상위 폴더(`dark-gotchi` 또는 빌드된 `dist` 폴더)를 선택합니다.
5. 웹서핑을 시작하면 화면 하단에 나만의 펫이 나타납니다!

---

> **Note**: 이 프로젝트는 외부 서버나 백엔드 없이 순수 로컬 자원만으로 동작하며, 웹 표준과 브라우저 최적화 기법을 깊이 있게 연구하고 적용한 결과물입니다.
