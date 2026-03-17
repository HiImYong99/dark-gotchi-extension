# Dark-gotchi

**Dark-gotchi**는 사용자의 브라우징 습관에 반응하는 **픽셀 펫 크롬 확장 프로그램**입니다.

한 줄로 말하면,
**웹서핑을 오래 하거나 게을러질수록 펫의 상태와 태도가 바뀌는 도트 캐릭터 확장앱**입니다.

## What it is

- 웹페이지 하단에 픽셀 펫이 등장함
- 사용자의 브라우징 패턴에 따라 상태가 변함
- 클릭하면 현재 활동에 대한 반응/멘트를 보여줌
- 후원 코드로 스킨을 해제할 수 있음

## Core Features

- 🐾 픽셀 펫 오버레이
- 😈 사용 습관 기반 상태 변화
- 🗯️ 상호작용형 멘트/반응
- 🌍 한국어/영어 다국어 지원
- 🎁 후원 기반 스킨 언락 시스템

## Why this project matters

이 프로젝트는 단순 확장앱이 아니라,
**생산성·습관·캐릭터성을 결합한 브라우저 위의 작은 동반자**를 실험하는 프로젝트입니다.

즉,
- 재미 요소
- 습관 피드백
- 캐릭터 애착
- 소액 후원형 수익화

이 네 가지를 같이 테스트합니다.

## Tech Stack

- JavaScript (Vanilla)
- Chrome Extension Manifest V3
- Content Scripts
- Background Service Worker
- Storage API
- i18n API

## Status

**MVP / Active**

현재는 컨셉과 상호작용 경험을 검증하는 단계입니다.

## Installation

1. Chrome에서 `chrome://extensions/` 열기
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램 로드** 클릭
4. `dark-gotchi` 폴더 선택

## Monetization Idea

- 기본 펫 무료 제공
- 후원 코드 입력 시 추가 스킨 해제
- 장기적으로는 스킨/반응팩/통계 기능 확장 가능

## Project Structure

```text
dark-gotchi/
├── _locales/
├── assets/
├── background/
├── content/
├── lib/
├── popup/
└── manifest.json
```

## Next Steps

- 감정/상태 전환 로직 개선
- 펫 반응 다양화
- 후원 코드 UX 개선
- 사용자 유지 포인트 검증
