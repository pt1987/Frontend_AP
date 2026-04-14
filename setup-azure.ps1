<#
.SYNOPSIS
    Automated Azure/Entra setup for the Access Package Portal.

.DESCRIPTION
    This script creates and configures all Azure and Entra ID resources
    required to run the Access Package Portal SPA:
      - Entra App Registration (with SPA redirect URIs)
      - Microsoft Graph API permissions + Admin Consent
      - App Roles (User, Admin)
      - Enterprise Application (Service Principal)
      - Azure Resource Group
      - Azure App Service Plan (B1 Linux)
      - Azure Web App (Node.js 20 LTS)
      - SharePoint List for category management

    At the end, all values required for .env.local and GitHub Secrets
    are written to a summary file.

.NOTES
    Requirements:
      - PowerShell 7+
      - Internet access (modules are installed automatically on first run)

    The signed-in account must be a Global Administrator or
    Privileged Role Administrator in the Entra tenant to grant
    admin consent and create app registrations.

.EXAMPLE
    .\setup-azure.ps1

    .\setup-azure.ps1 -WhatIf   # dry-run: shows what would be created
#>

[CmdletBinding(SupportsShouldProcess)]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ==============================================================
# SECTION 0 — CONFIGURATION
# Edit all values in this block before running the script.
# ==============================================================

$Config = @{
    # --- Entra / App Registration ---
    AppDisplayName       = "Access Package Portal"          # shown in Entra login screen
    LocalRedirectUri     = "http://localhost:5173"          # Vite dev server
    # Production URI is auto-generated from the App Service name below

    # --- Azure Resources ---
    ResourceGroup        = "rg-access-package-portal"
    Location             = "westeurope"                     # az account list-locations -o table
    AppServicePlan       = "plan-access-package-portal"
    AppServiceName       = "app-access-package-portal"      # must be globally unique → <name>.azurewebsites.net

    # --- SharePoint ---
    # Full URL of the SharePoint site, e.g. "https://contoso.sharepoint.com/sites/IT"
    SharePointSiteUrl    = "https://contoso.sharepoint.com/sites/IT"
    CategoryListName     = "Access Package Categories"

    # --- Output ---
    SummaryOutputFile    = "azure-setup-output.txt"         # written to the current directory
}

$ProductionRedirectUri = "https://$($Config.AppServiceName).azurewebsites.net"

# Fixed GUIDs for Microsoft Graph delegated permissions
# Source: https://learn.microsoft.com/en-us/graph/permissions-reference
$GraphAppId = "00000003-0000-0000-c000-000000000000"
$GraphPermissions = @{
    "User.Read"                          = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"
    "EntitlementManagement.ReadWrite.All"= "ae7a573d-81d7-432b-ad44-4ed5c9d89038"
    "Directory.Read.All"                 = "06da0dbc-49e2-44d2-8312-53f166ab848a"
    "Sites.ReadWrite.All"                = "89fe6a52-be36-487e-b7d8-d061c450a026"
}

# ==============================================================
# HELPER FUNCTIONS
# ==============================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "    OK: $Message" -ForegroundColor Green
}

function Write-Skip {
    param([string]$Message)
    Write-Host "    SKIP (already exists): $Message" -ForegroundColor Yellow
}

function Invoke-GraphRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Body = @{}
    )
    $params = @{
        Method = $Method
        Uri    = $Uri
    }
    if ($Body.Count -gt 0) {
        $params.Body        = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }
    return Invoke-MgGraphRequest @params
}

# ==============================================================
# SECTION 1 — MODULE INSTALLATION
# ==============================================================

Write-Step "Checking and installing required PowerShell modules"

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "PowerShell 7 or higher is required. Download: https://aka.ms/powershell"
}

$requiredModules = @(
    "Microsoft.Graph.Authentication",
    "Az.Accounts",
    "Az.Resources",
    "Az.Websites"
)

# Ensure PSGallery is trusted so Install-Module runs without interactive prompts
$gallery = Get-PSRepository -Name "PSGallery" -ErrorAction SilentlyContinue
if ($gallery -and $gallery.InstallationPolicy -ne "Trusted") {
    Write-Host "    Trusting PSGallery repository..." -ForegroundColor Yellow
    Set-PSRepository -Name "PSGallery" -InstallationPolicy Trusted
}

foreach ($moduleName in $requiredModules) {
    $installed = Get-Module -ListAvailable -Name $moduleName | Select-Object -First 1

    if ($installed) {
        # Check if a newer version is available and update silently
        try {
            $online = Find-Module -Name $moduleName -ErrorAction Stop
            if ([version]$online.Version -gt [version]$installed.Version) {
                Write-Host "    Updating $moduleName ($($installed.Version) -> $($online.Version))..." -ForegroundColor Yellow
                if ($PSCmdlet.ShouldProcess($moduleName, "Update module")) {
                    Update-Module -Name $moduleName -Scope CurrentUser -Force
                }
            } else {
                Write-Ok "$moduleName $($installed.Version) (up to date)"
            }
        } catch {
            # PSGallery not reachable — use the installed version
            Write-Ok "$moduleName $($installed.Version) (installed, skipping update check)"
        }
    } else {
        Write-Host "    Installing $moduleName..." -ForegroundColor Yellow
        if ($PSCmdlet.ShouldProcess($moduleName, "Install module")) {
            Install-Module -Name $moduleName -Scope CurrentUser -Force -AllowClobber
            Write-Ok "$moduleName installed"
        }
    }

    Import-Module -Name $moduleName -ErrorAction Stop
}

Write-Ok "All modules ready"

Write-Ok "All required modules present"

# ==============================================================
# SECTION 2 — CONNECT TO AZURE AND MICROSOFT GRAPH
# ==============================================================

Write-Step "Connecting to Azure and Microsoft Graph"

# Connect to Azure
$azContext = Get-AzContext
if (-not $azContext) {
    Write-Host "    No active Azure session. Starting interactive login..." -ForegroundColor Yellow
    Connect-AzAccount
    $azContext = Get-AzContext
}
Write-Ok "Azure: $($azContext.Account.Id) | Subscription: $($azContext.Subscription.Name)"

# Connect to Microsoft Graph with the scopes needed for this script
$mgScopes = @(
    "Application.ReadWrite.All",
    "DelegatedPermissionGrant.ReadWrite.All",
    "Directory.ReadWrite.All",
    "Sites.ReadWrite.All"
)

$mgContext = Get-MgContext
if (-not $mgContext) {
    Write-Host "    No active Graph session. Starting interactive login..." -ForegroundColor Yellow
    Connect-MgGraph -Scopes $mgScopes -NoWelcome
    $mgContext = Get-MgContext
}
Write-Ok "Microsoft Graph: $($mgContext.Account)"

$TenantId = $mgContext.TenantId
Write-Ok "Tenant ID: $TenantId"

# ==============================================================
# SECTION 3 — APP REGISTRATION
# ==============================================================

Write-Step "Creating Entra App Registration: $($Config.AppDisplayName)"

$existingApp = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/applications?`$filter=displayName eq '$($Config.AppDisplayName)'&`$select=id,appId,displayName"

if ($existingApp.value.Count -gt 0) {
    $app = $existingApp.value[0]
    Write-Skip "App Registration '$($Config.AppDisplayName)' (appId: $($app.appId))"
} else {
    if ($PSCmdlet.ShouldProcess($Config.AppDisplayName, "Create App Registration")) {
        $newApp = Invoke-GraphRequest -Method POST `
            -Uri "https://graph.microsoft.com/v1.0/applications" `
            -Body @{
                displayName    = $Config.AppDisplayName
                signInAudience = "AzureADMyOrg"
            }
        $app = $newApp
        Write-Ok "Created App Registration (appId: $($app.appId))"
    }
}

$AppId       = $app.appId
$AppObjectId = $app.id

# Set SPA redirect URIs (replaces any existing ones)
Write-Step "Configuring SPA redirect URIs"

if ($PSCmdlet.ShouldProcess("SPA redirect URIs", "Set")) {
    Invoke-GraphRequest -Method PATCH `
        -Uri "https://graph.microsoft.com/v1.0/applications/$AppObjectId" `
        -Body @{
            spa = @{
                redirectUris = @(
                    $Config.LocalRedirectUri,
                    $ProductionRedirectUri
                )
            }
        } | Out-Null
    Write-Ok "Redirect URIs: $($Config.LocalRedirectUri), $ProductionRedirectUri"
}

# ==============================================================
# SECTION 4 — API PERMISSIONS
# ==============================================================

Write-Step "Configuring Microsoft Graph API permissions"

$requiredResourceAccess = @(
    @{
        resourceAppId  = $GraphAppId
        resourceAccess = @(
            $GraphPermissions.GetEnumerator() | ForEach-Object {
                @{ id = $_.Value; type = "Scope" }
            }
        )
    }
)

if ($PSCmdlet.ShouldProcess("API Permissions", "Configure")) {
    Invoke-GraphRequest -Method PATCH `
        -Uri "https://graph.microsoft.com/v1.0/applications/$AppObjectId" `
        -Body @{ requiredResourceAccess = $requiredResourceAccess } | Out-Null

    Write-Ok "Permissions configured:"
    $GraphPermissions.Keys | ForEach-Object { Write-Host "         - $_" -ForegroundColor Gray }
}

# ==============================================================
# SECTION 5 — SERVICE PRINCIPAL (ENTERPRISE APPLICATION)
# ==============================================================

Write-Step "Creating Service Principal (Enterprise Application)"

$existingSp = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/servicePrincipals?`$filter=appId eq '$AppId'&`$select=id,appId,displayName"

if ($existingSp.value.Count -gt 0) {
    $sp = $existingSp.value[0]
    Write-Skip "Service Principal (id: $($sp.id))"
} else {
    if ($PSCmdlet.ShouldProcess($Config.AppDisplayName, "Create Service Principal")) {
        $sp = Invoke-GraphRequest -Method POST `
            -Uri "https://graph.microsoft.com/v1.0/servicePrincipals" `
            -Body @{ appId = $AppId }
        Write-Ok "Created Service Principal (id: $($sp.id))"
    }
}

$SpId = $sp.id

# ==============================================================
# SECTION 6 — ADMIN CONSENT
# ==============================================================

Write-Step "Granting admin consent for all delegated permissions"

# Find the Microsoft Graph Service Principal in this tenant
$graphSp = (Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/servicePrincipals?`$filter=appId eq '$GraphAppId'&`$select=id").value[0]

# Check if an OAuth2 permission grant already exists
$existingGrant = (Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants?`$filter=clientId eq '$SpId' and resourceId eq '$($graphSp.id)'").value

$scopeString = $GraphPermissions.Keys -join " "

if ($existingGrant.Count -gt 0) {
    # Update existing grant to ensure all scopes are included
    if ($PSCmdlet.ShouldProcess("OAuth2 Permission Grant", "Update")) {
        Invoke-GraphRequest -Method PATCH `
            -Uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants/$($existingGrant[0].id)" `
            -Body @{ scope = $scopeString } | Out-Null
        Write-Ok "Updated admin consent grant with all required scopes"
    }
} else {
    if ($PSCmdlet.ShouldProcess("OAuth2 Permission Grant", "Create")) {
        Invoke-GraphRequest -Method POST `
            -Uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants" `
            -Body @{
                clientId    = $SpId
                consentType = "AllPrincipals"
                resourceId  = $graphSp.id
                scope       = $scopeString
            } | Out-Null
        Write-Ok "Admin consent granted for: $scopeString"
    }
}

# ==============================================================
# SECTION 7 — APP ROLES
# ==============================================================

Write-Step "Creating App Roles (User, Admin)"

# Read current app roles to check what already exists
$currentApp = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/applications/$AppObjectId`?`$select=appRoles"

$existingRoleValues = $currentApp.appRoles | ForEach-Object { $_.value }
$rolesToCreate = @()

if ("User" -notin $existingRoleValues) {
    $rolesToCreate += @{
        id                 = [System.Guid]::NewGuid().ToString()
        displayName        = "User"
        value              = "User"
        description        = "Standard access for all portal users"
        allowedMemberTypes = @("User")
        isEnabled          = $true
    }
}

if ("Admin" -notin $existingRoleValues) {
    $rolesToCreate += @{
        id                 = [System.Guid]::NewGuid().ToString()
        displayName        = "Admin"
        value              = "Admin"
        description        = "Can manage categories and see all access packages"
        allowedMemberTypes = @("User")
        isEnabled          = $true
    }
}

if ($rolesToCreate.Count -eq 0) {
    Write-Skip "App Roles User and Admin already exist"
} else {
    # Merge with existing roles (must send complete list)
    $allRoles = @($currentApp.appRoles) + $rolesToCreate

    if ($PSCmdlet.ShouldProcess("App Roles", "Create")) {
        Invoke-GraphRequest -Method PATCH `
            -Uri "https://graph.microsoft.com/v1.0/applications/$AppObjectId" `
            -Body @{ appRoles = $allRoles } | Out-Null

        $rolesToCreate | ForEach-Object { Write-Ok "Created App Role: $($_.value)" }
    }
}

# Retrieve final role IDs for the summary
$finalApp   = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/applications/$AppObjectId`?`$select=appRoles"
$userRoleId  = ($finalApp.appRoles | Where-Object { $_.value -eq "User"  }).id
$adminRoleId = ($finalApp.appRoles | Where-Object { $_.value -eq "Admin" }).id

Write-Ok "User  Role ID : $userRoleId"
Write-Ok "Admin Role ID : $adminRoleId"

# ==============================================================
# SECTION 8 — AZURE RESOURCE GROUP
# ==============================================================

Write-Step "Creating Resource Group: $($Config.ResourceGroup)"

$existingRg = Get-AzResourceGroup -Name $Config.ResourceGroup -ErrorAction SilentlyContinue
if ($existingRg) {
    Write-Skip "Resource Group '$($Config.ResourceGroup)'"
} else {
    if ($PSCmdlet.ShouldProcess($Config.ResourceGroup, "Create Resource Group")) {
        New-AzResourceGroup -Name $Config.ResourceGroup -Location $Config.Location | Out-Null
        Write-Ok "Resource Group created in $($Config.Location)"
    }
}

# ==============================================================
# SECTION 9 — APP SERVICE PLAN (B1 LINUX)
# ==============================================================

Write-Step "Creating App Service Plan: $($Config.AppServicePlan) (B1 Linux)"

$existingPlan = Get-AzAppServicePlan -ResourceGroupName $Config.ResourceGroup `
    -Name $Config.AppServicePlan -ErrorAction SilentlyContinue

if ($existingPlan) {
    Write-Skip "App Service Plan '$($Config.AppServicePlan)'"
} else {
    if ($PSCmdlet.ShouldProcess($Config.AppServicePlan, "Create App Service Plan")) {
        New-AzAppServicePlan `
            -ResourceGroupName $Config.ResourceGroup `
            -Name              $Config.AppServicePlan `
            -Location          $Config.Location `
            -Tier              "Basic" `
            -NumberofWorkers   1 `
            -WorkerSize        "Small" `
            -Linux | Out-Null
        Write-Ok "App Service Plan created (B1 Linux)"
    }
}

# ==============================================================
# SECTION 10 — WEB APP (NODE.JS 20 LTS)
# ==============================================================

Write-Step "Creating Web App: $($Config.AppServiceName)"

$existingWebApp = Get-AzWebApp -ResourceGroupName $Config.ResourceGroup `
    -Name $Config.AppServiceName -ErrorAction SilentlyContinue

if ($existingWebApp) {
    Write-Skip "Web App '$($Config.AppServiceName)'"
    $webApp = $existingWebApp
} else {
    if ($PSCmdlet.ShouldProcess($Config.AppServiceName, "Create Web App")) {
        $webApp = New-AzWebApp `
            -ResourceGroupName $Config.ResourceGroup `
            -Name              $Config.AppServiceName `
            -AppServicePlan    $Config.AppServicePlan `
            -Runtime           "NODE:20-lts"
        Write-Ok "Web App created: https://$($Config.AppServiceName).azurewebsites.net"
    }
}

# Configure startup command and enforce HTTPS
Write-Step "Configuring Web App settings"

if ($PSCmdlet.ShouldProcess($Config.AppServiceName, "Configure startup command and HTTPS")) {
    # Startup command for the Express SPA server
    $webApp.SiteConfig.AppCommandLine = "node server.js"
    Set-AzWebApp -WebApp $webApp | Out-Null

    # Enforce HTTPS
    Set-AzWebApp `
        -ResourceGroupName $Config.ResourceGroup `
        -Name              $Config.AppServiceName `
        -HttpsOnly         $true | Out-Null

    Write-Ok "Startup command: node server.js"
    Write-Ok "HTTPS only: enabled"
}

# Retrieve publish profile for GitHub Actions
Write-Step "Retrieving publish profile for GitHub Actions"
$publishProfilePath = Join-Path $PSScriptRoot "publish-profile.xml"

if ($PSCmdlet.ShouldProcess($Config.AppServiceName, "Download publish profile")) {
    Get-AzWebAppPublishingProfile `
        -ResourceGroupName $Config.ResourceGroup `
        -Name              $Config.AppServiceName `
        -OutputFile        $publishProfilePath | Out-Null
    Write-Ok "Publish profile saved to: $publishProfilePath"
    Write-Host "    Set the full file content as GitHub Secret: AZURE_PUBLISH_PROFILE" -ForegroundColor Yellow
}

# ==============================================================
# SECTION 11 — SHAREPOINT LIST
# ==============================================================

Write-Step "Creating SharePoint list: $($Config.CategoryListName)"

# Resolve SharePoint site ID from the configured URL
$spUri = [System.Uri]$Config.SharePointSiteUrl
$spHostname = $spUri.Host
$spPath = $spUri.AbsolutePath   # e.g. /sites/IT

$site = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/sites/${spHostname}:${spPath}"

$SharePointSiteId = $site.id
Write-Ok "SharePoint Site ID: $SharePointSiteId"

# Check if the list already exists
$existingLists = Invoke-GraphRequest -Method GET `
    -Uri "https://graph.microsoft.com/v1.0/sites/$SharePointSiteId/lists?`$filter=displayName eq '$($Config.CategoryListName)'&`$select=id,displayName"

if ($existingLists.value.Count -gt 0) {
    $categoryList = $existingLists.value[0]
    Write-Skip "SharePoint list '$($Config.CategoryListName)' (id: $($categoryList.id))"
} else {
    if ($PSCmdlet.ShouldProcess($Config.CategoryListName, "Create SharePoint List")) {
        $categoryList = Invoke-GraphRequest -Method POST `
            -Uri "https://graph.microsoft.com/v1.0/sites/$SharePointSiteId/lists" `
            -Body @{
                displayName = $Config.CategoryListName
                list        = @{ template = "genericList" }
                columns     = @(
                    @{
                        name        = "Description"
                        description = "Category description"
                        text        = @{}
                    },
                    @{
                        name        = "PackageIds"
                        description = "JSON array of Access Package IDs assigned to this category"
                        text        = @{ allowMultipleLines = $true }
                    },
                    @{
                        name        = "SortOrder"
                        description = "Display order (ascending)"
                        number      = @{}
                    }
                )
            }
        Write-Ok "SharePoint list created (id: $($categoryList.id))"
    }
}

$CategoryListId = $categoryList.id

# ==============================================================
# SECTION 12 — OUTPUT SUMMARY
# ==============================================================

Write-Step "Writing output summary"

$summary = @"
================================================================
ACCESS PACKAGE PORTAL — AZURE SETUP SUMMARY
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================================

--- .env.local (copy to project root, never commit) ---

VITE_CLIENT_ID=$AppId
VITE_TENANT_ID=$TenantId
VITE_REDIRECT_URI=$($Config.LocalRedirectUri)
VITE_SHAREPOINT_SITE_ID=$SharePointSiteId
VITE_CATEGORY_LIST_ID=$CategoryListId


--- .env.production / GitHub Secrets ---

VITE_CLIENT_ID=$AppId
VITE_TENANT_ID=$TenantId
VITE_REDIRECT_URI=$ProductionRedirectUri
VITE_SHAREPOINT_SITE_ID=$SharePointSiteId
VITE_CATEGORY_LIST_ID=$CategoryListId
AZURE_APP_NAME=$($Config.AppServiceName)
AZURE_PUBLISH_PROFILE=<content of publish-profile.xml>


--- Reference information ---

App Registration Name  : $($Config.AppDisplayName)
App (Client) ID        : $AppId
App Object ID          : $AppObjectId
Service Principal ID   : $SpId
Tenant ID              : $TenantId

App Role "User"  ID    : $userRoleId
App Role "Admin" ID    : $adminRoleId

Resource Group         : $($Config.ResourceGroup)
App Service Plan       : $($Config.AppServicePlan) (B1 Linux)
App Service URL        : https://$($Config.AppServiceName).azurewebsites.net

SharePoint Site        : $($Config.SharePointSiteUrl)
SharePoint Site ID     : $SharePointSiteId
Category List ID       : $CategoryListId


--- Next manual steps ---

1. Assign users/groups to App Roles in Entra:
   Entra ID > Enterprise Applications > $($Config.AppDisplayName) > Users and groups

2. Add GitHub Secrets listed above to your repository:
   GitHub > Settings > Secrets and variables > Actions

3. Set AZURE_PUBLISH_PROFILE secret to the content of:
   $publishProfilePath

4. Copy .env.local values above into your local .env.local file.

5. Push to main branch to trigger the first deployment via GitHub Actions.

================================================================
"@

$summary | Out-File -FilePath (Join-Path $PSScriptRoot $Config.SummaryOutputFile) -Encoding UTF8
Write-Host $summary -ForegroundColor White

Write-Host "`nSetup complete. Summary written to: $($Config.SummaryOutputFile)" -ForegroundColor Green
