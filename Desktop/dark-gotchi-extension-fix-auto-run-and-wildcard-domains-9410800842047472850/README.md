# 👾 Dark-gotchi (다크고치)

**Dark-gotchi** is a browser extension that features a pixel-art pet that lives on your screen and reacts to your browsing habits. Support the developer to unlock special pet skins!

**다크고치**는 사용자의 브라우징 습관에 따라 반응하는 도트 캐릭터 펫을 브라우저 화면에 띄워주는 크롬 확장 프로그램입니다. 후원을 통해 다양한 동물 스킨을 해제할 수 있습니다.

---

## ✨ Features (주요 기능)

### 🐾 Pixel Art Pets (도트 캐릭터)
- **Interactive Pet**: A cute pet that appears at the bottom of every website.
- **Dynamic States**: The pet's appearance and messages change based on your browsing time (NORMAL, FAT, ARROGANT, etc.).
- **Click Interaction**: Click the pet to see what it thinks about your current web activity!

### 🌍 Multi-language Support (다국어 지원)
- **Automatic Detection**: Supports both **English** and **Korean** based on your browser settings.
- **Localized Content**: All UI labels and pet dialogues are fully translated.

### 🎁 Supporter Rewards (후원 보상)
- **Skin System**: Support the developer via **Buy Me a Coffee** to receive a code.
- **Unlockable Pets**: Use the code to unlock adorable skins:
  - 🐱 **Cat**: Pink ears and cute expressions.
  - 🐕 **Doge**: The iconic Shiba Inu vibe.
  - 🐹 **Hamster**: Chubby cheeks and tiny paws.

---

## 🛠 Technology Stack (기술 스택)

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS).
- **Extension API**: Manifest V3, Content Scripts, Background Service Workers, Storage API, i18n API.
- **Graphics**: Custom hand-drawn SVGs (Pixel art style).
- **Monetization**: External donation model (Buy Me a Coffee).

---

## 🚀 Installation (로드 방법)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `dark-gotchi` folder.
4. Happy browsing with your new pet!

## 🤝 Contribution & Support

If you enjoy using Dark-gotchi, consider buying me a coffee!
- **Support Link**: [buymeacoffee.com/yong9](https://buymeacoffee.com/yong9)

---

### Project Structure (프로젝트 구조)

```text
dark-gotchi/
├── _locales/           # Localization files (en, ko)
├── assets/
│   ├── icons/          # Extension icons
│   └── pets/           # Pixel art SVGs for each state/skin
├── background/         # Background service worker logic
├── content/            # Script to render pet on web pages
├── lib/                # Crypto & utility libraries
├── popup/              # Extension UI (HTML, CSS, JS)
└── manifest.json       # Extension configuration
```
