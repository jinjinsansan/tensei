# Scripts

このディレクトリには、プロジェクトのメンテナンスとデプロイ用のスクリプトが含まれています。

## アップロードスクリプト

新しいキャラクターの動画をCloudflare R2にアップロードする必要がある場合は、プロジェクトルートの `upload-character-to-r2.py` を使用してください。

```bash
# 使用例
python upload-character-to-r2.py <character_name>

# 昭一の動画をアップロード
python upload-character-to-r2.py shoichi

# 健太の動画をアップロード
python upload-character-to-r2.py kenta
```

**注意:** このスクリプトは `.gitignore` に含まれているため、Gitには追跡されません。
