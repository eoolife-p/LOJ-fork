param(
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    
    [Parameter(Mandatory=$true)]
    [string]$RemoteUrl,
    
    [string]$CommitMessage = "Initial commit"
)

# 检查是否安装了 Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Git。请先安装 Git 并将其添加到 PATH 环境变量中。" -ForegroundColor Red
    exit 1
}

# 检查当前目录是否存在
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Green

# 初始化 Git 仓库（如果尚未初始化）
if (!(Test-Path .git)) {
    Write-Host "正在初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 无法初始化 Git 仓库" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Git 仓库已存在，跳过初始化步骤。" -ForegroundColor Cyan
}

# 添加所有文件到暂存区
Write-Host "正在添加所有文件到暂存区..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 无法添加文件到暂存区" -ForegroundColor Red
    exit 1
}

# 设置默认分支为 main
Write-Host "设置默认分支为 main..." -ForegroundColor Yellow
git branch -M main

# 配置用户信息（如果未配置）
$gitUser = git config --global user.name
$gitEmail = git config --global user.email

if ([string]::IsNullOrEmpty($gitUser)) {
    Write-Host "请输入您的 Git 用户名：" -ForegroundColor Yellow
    $gitUser = Read-Host
    git config --global user.name $gitUser
}

if ([string]::IsNullOrEmpty($gitEmail)) {
    Write-Host "请输入您的 Git 邮箱：" -ForegroundColor Yellow
    $gitEmail = Read-Host
    git config --global user.email $gitEmail
}

# 添加远程仓库
Write-Host "正在添加远程仓库..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $RemoteUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 无法添加远程仓库" -ForegroundColor Red
    exit 1
}

# 提交更改
Write-Host "正在提交更改..." -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 无法提交更改" -ForegroundColor Red
    exit 1
}

# 推送到 GitHub
Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "成功将当前目录的所有文件推送到 GitHub 仓库！" -ForegroundColor Green
    Write-Host "仓库地址: $RemoteUrl" -ForegroundColor Cyan
} else {
    Write-Host "错误: 无法推送到 GitHub" -ForegroundColor Red
    Write-Host "请检查您的网络连接和 GitHub 凭据。" -ForegroundColor Yellow
    Write-Host "如果您使用 HTTPS 地址，请确保您已登录 GitHub 或设置了凭据助手。" -ForegroundColor Yellow
}