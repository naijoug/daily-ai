#!/usr/bin/env bash
# 临时发布方式：本地构建后把 dist/ 强制推到 gh-pages 分支（Pages 配置为 legacy / gh-pages 分支）。
# 等 gh token 有 workflow 权限、ci/deploy.yml 移到 .github/workflows/ 之后就不再需要。
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
touch dist/.nojekyll
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" -c user.email="$(git -C "$OLDPWD" config user.email)" commit -qm "deploy $(date -u +%FT%TZ)"
git push -qf "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "pushed gh-pages"
