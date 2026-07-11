# MAD Gambit — MPP 2.23 Vercel Setup + Redeploy
$ErrorActionPreference = "Stop"
$TEAM="madgambit"; $PROJECT="mpp2.23"; $ALIAS="mpp223-madgambit.vercel.app"
$PRODURL="https://mpp223-madgambit.vercel.app"
Write-Host "=== 1. LINK ==="
vercel link --scope $TEAM --project $PROJECT --yes
Write-Host "=== 2. AUDIT env vars ==="
vercel env ls production
Write-Host "=== 3. ADD required vars ==="
function Add-Var($n,$h){ if((Read-Host "Add $n ? ($h) [y/N]") -eq "y"){ vercel env add $n production } }
Add-Var "GOOGLE_API_KEY" "langchain google-genai concierge"
Add-Var "AUTH_SECRET" "SIWE session signing 32-byte base64"
Add-Var "NEXTAUTH_URL" "$PRODURL"
Add-Var "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" "cloud.walletconnect.com"
Add-Var "NEXT_PUBLIC_CHAIN_ID" "42170 Arbitrum Nova"
Add-Var "ANTHROPIC_API_KEY" "only if Claude fallback wired"
Write-Host "=== 4. REDEPLOY ==="
vercel redeploy $ALIAS --scope $TEAM
