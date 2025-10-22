# cute-escape 1-1 (Playable MVP)

## ローカル/ Codespaces で動かす
```bash
# 任意の静的サーバでOK（Python内蔵を例示）
python -m http.server 5173
# → 表示された URL を開く（/index.html）
```

- 画面比率は **9:18 縦** 固定（自動でレターボックス調整）
- D-Pad（↑↓←→）で移動／ジャンプ／高速降下
- **30秒**逃げ切れたら CLEAR。敵に触れる or ケーキに触れると失敗。
- **ダブルタップ／ピンチでの拡大は無効化** 済み。

## デプロイ（GitHub Pages）
- このフォルダをリポジトリ直下に push → `Settings > Pages` で `main / root` を選択。
- HTTPS 環境なら service worker が有効になりオフライン起動できます。
