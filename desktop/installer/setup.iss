; ═══════════════════════════════════════════════════════════════════════════════
; YT Deluxe Setup 2.0 — Inno Setup Installer Script
; ═══════════════════════════════════════════════════════════════════════════════
; Screen Flow:
;   [1] Welcome + About (Utsavstack branding, open-source info, GitHub link)
;   [2] License Agreement (GPL-3.0)
;   [3] Terms & Conditions (scrollable RTF, radio accept/decline)
;   [4] Privacy & Network Policy (scrollable RTF, network + update toggles)
;   [5] Install Location
;   [6] Download Folder Setup (custom page)
;   [7] Ready to Install (interactive summary)
;   [installing... — kills running YT-Deluxe.exe first]
;   [8] Installation Complete (update toggle, GitHub link)
; ═══════════════════════════════════════════════════════════════════════════════

#define MyAppName "YT Deluxe"
#define MyAppVersion "1.1.0 Beta"
#define MyAppPublisher "Utsavstack"
#define MyAppURL "https://github.com/Utsavstack/YT-Deluxe"
#define MyAppExeName "YT-Deluxe.exe"

[Setup]
AppId={{B8F3A2E1-7C4D-4E5F-9A6B-1D2E3F4A5B6C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=output
OutputBaseFilename=YT-Deluxe-Setup
SetupIconFile=..\assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
DisableDirPage=no
DisableWelcomePage=no
UsePreviousAppDir=no
UninstallDisplayIcon={app}\{#MyAppExeName}
UsedUserAreasWarning=no

; Custom banner images
WizardImageFile=assets\banner.bmp
WizardSmallImageFile=assets\small_banner.bmp

; License file (GPL-3.0)
LicenseFile=..\..\LICENSE

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "taskbarpin"; Description: "Pin to Taskbar"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Main application files (entire YT-Deluxe folder)
Source: "..\dist\YT-Deluxe\YT-Deluxe.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\YT-Deluxe\_internal\*"; DestDir: "{app}\_internal"; Flags: ignoreversion recursesubdirs createallsubdirs

; WebView2 bootstrapper (bundled for offline-capable install)
Source: "MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; RTF assets for custom pages
Source: "assets\terms.rtf"; Flags: dontcopy
Source: "assets\privacy.rtf"; Flags: dontcopy

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; Store installer version for future reference
Root: HKCU; Subkey: "Software\YTDeluxe"; ValueType: string; ValueName: "InstallerVersion"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

[Run]
; Post-install: launch the app
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[Code]
// ═══════════════════════════════════════════════════════════════════════════════
// Pascal Script — Custom Wizard Pages + WebView2 Check
// ═══════════════════════════════════════════════════════════════════════════════

var
  // Custom pages
  TermsPage: TWizardPage;
  TermsViewer: TRichEditViewer;
  PrivacyPage: TWizardPage;
  PrivacyViewer: TRichEditViewer;
  DownloadFolderPage: TWizardPage;
  SummaryPage: TWizardPage;

  // Privacy toggles
  PrivacyUpdateCheck: TNewCheckBox;
  PrivacyNetworkCheck: TNewCheckBox;

  // Privacy acceptance radio buttons
  PrivacyAcceptRadio: TNewRadioButton;
  PrivacyDeclineRadio: TNewRadioButton;

  // Download folder controls
  DownloadFolderEdit: TNewEdit;
  DownloadFolderBrowseBtn: TNewButton;
  AutoOrganizeCheck: TNewCheckBox;

  // Summary labels
  SummaryMemo: TNewMemo;

  // Terms acceptance radio buttons
  TermsAcceptRadio: TNewRadioButton;
  TermsDeclineRadio: TNewRadioButton;
  TermsScrolledToBottom: Boolean;

  // Finish page controls
  FinishUpdateNotifyCheck: TNewCheckBox;
  FinishCreditLabel: TNewStaticText;
  FinishGitHubLabel: TNewStaticText;

// ── Helper: Get system Downloads folder from registry ────────────────────────
function GetSystemDownloadsFolder: String;
var
  DownloadsPath: String;
begin
  if RegQueryStringValue(HKEY_CURRENT_USER,
       'SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders',
       '{374DE290-123F-4565-9164-39C4925E467B}', DownloadsPath) then
    Result := DownloadsPath
  else
    Result := ExpandConstant('{userdocs}');
end;

// ── Helper: Return download folder for [Run] section ─────────────────────────
function GetDownloadFolder(Param: String): String;
begin
  if DownloadFolderEdit <> nil then
  begin
    if DownloadFolderEdit.Text <> '' then
    begin
      Result := DownloadFolderEdit.Text + '\YT Deluxe Downloads';
      Exit;
    end;
  end;
  Result := GetSystemDownloadsFolder + '\YT Deluxe Downloads';
end;

// ── Helper: Load RTF file content as plain text ──────────────────────────────
function LoadRtfAsText(Filename: String): String;
var
  S: AnsiString;
begin
  if LoadStringFromFile(Filename, S) then
    Result := String(S)
  else
    Result := 'Could not load ' + Filename;
end;

// ── Browse button click handler ──────────────────────────────────────────────
procedure BrowseButtonClick(Sender: TObject);
var
  Dir: String;
begin
  Dir := DownloadFolderEdit.Text;
  if BrowseForFolder('Select download location:', Dir, False) then
    DownloadFolderEdit.Text := Dir;
end;

// ── WebView2 detection ───────────────────────────────────────────────────────
function IsWebView2Installed: Boolean;
var
  RegKey: String;
begin
  Result := False;

  // Check 64-bit registry
  RegKey := 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BEE-13A6279FE6FF}';
  if RegKeyExists(HKEY_LOCAL_MACHINE, RegKey) then
  begin
    Result := True;
    Exit;
  end;

  // Check 32-bit registry
  RegKey := 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BEE-13A6279FE6FF}';
  if RegKeyExists(HKEY_LOCAL_MACHINE, RegKey) then
  begin
    Result := True;
    Exit;
  end;

  // Check per-user registry
  if RegKeyExists(HKEY_CURRENT_USER, RegKey) then
  begin
    Result := True;
    Exit;
  end;
end;

// ── WebView2 silent installer ────────────────────────────────────────────────
procedure InstallWebView2;
var
  ResultCode: Integer;
  BootstrapperPath: String;
begin
  BootstrapperPath := ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe');

  if FileExists(BootstrapperPath) then
  begin
    WizardForm.StatusLabel.Caption := 'Installing Microsoft Edge WebView2 Runtime...';
    WizardForm.StatusLabel.Update;
    Exec(BootstrapperPath, '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    if ResultCode <> 0 then
      Log('WebView2 installer returned code: ' + IntToStr(ResultCode))
    else
      Log('WebView2 installed successfully');
  end
  else
    Log('WebView2 bootstrapper not found at: ' + BootstrapperPath);
end;

// ═══════════════════════════════════════════════════════════════════════════════
// InitializeWizard — Create all custom wizard pages
// ═══════════════════════════════════════════════════════════════════════════════
procedure InitializeWizard;
var
  DownloadPathLabel: TNewStaticText;
  DownloadOrgLabel: TNewStaticText;
  DownloadPreviewLabel: TNewStaticText;
  FeaturesLabel: TNewStaticText;
  CreditLabel: TNewStaticText;
  GitHubLink: TNewStaticText;
begin
  // ── Title bar: show version ────────────────────────────────────────────────
  WizardForm.Caption := 'YT Deluxe v{#MyAppVersion} Setup';

  // ── Screen 1: Welcome — KMPlayer-style About ──────────────────────────────
  WizardForm.WelcomeLabel2.Caption :=
    'Setup will guide you through the installation of YT Deluxe.' + #13#10 + #13#10 +
    'Click Next to continue.';

  FeaturesLabel := TNewStaticText.Create(WizardForm);
  FeaturesLabel.Parent := WizardForm.WelcomePage;
  FeaturesLabel.Left := WizardForm.WelcomeLabel2.Left;
  FeaturesLabel.Top := ScaleY(190);
  FeaturesLabel.Caption :=
    'YT Deluxe is a Free, Open-Source Platform' + #13#10 +
    '  >>  100% Free & No Ads' + #13#10 +
    '  >>  Premium UI' + #13#10 +
    '  >>  Privacy-First  (No Tracking, No Accounts)' + #13#10 +
    '  >>  Download Videos, Audio & Thumbnails' + #13#10 +
    '  >>  Licensed under GPL-3.0';
  FeaturesLabel.AutoSize := True;

  CreditLabel := TNewStaticText.Create(WizardForm);
  CreditLabel.Parent := WizardForm.WelcomePage;
  CreditLabel.Left := WizardForm.WelcomeLabel2.Left;
  CreditLabel.Top := WizardForm.WelcomePage.ClientHeight - ScaleY(30);
  CreditLabel.Caption := 'Copyright '#169' 2026 Utsavstack. All rights reserved.';
  CreditLabel.AutoSize := True;

  GitHubLink := TNewStaticText.Create(WizardForm);
  GitHubLink.Parent := WizardForm.WelcomePage;
  GitHubLink.Left := WizardForm.WelcomeLabel2.Left;
  GitHubLink.Top := CreditLabel.Top - ScaleY(18);
  GitHubLink.Caption := 'github.com/Utsavstack/YT-Deluxe';
  GitHubLink.AutoSize := True;
  GitHubLink.Cursor := crHand;
  GitHubLink.Font.Color := clBlue;
  GitHubLink.Font.Style := [fsUnderline];

  // ── Screen 3: Terms & Conditions ──────────────────────────────────────────
  TermsPage := CreateCustomPage(wpLicense,
    'Terms and Conditions',
    'Please read the following Terms and Conditions carefully.');

  TermsViewer := TRichEditViewer.Create(TermsPage);
  TermsViewer.Parent := TermsPage.Surface;
  TermsViewer.Left := 0;
  TermsViewer.Top := 0;
  TermsViewer.Width := TermsPage.SurfaceWidth;
  TermsViewer.Height := TermsPage.SurfaceHeight - 52;
  TermsViewer.ReadOnly := True;
  TermsViewer.ScrollBars := ssVertical;
  TermsViewer.Color := clWindow;

  ExtractTemporaryFile('terms.rtf');
  TermsViewer.RTFText := LoadRtfAsText(ExpandConstant('{tmp}\terms.rtf'));

  TermsScrolledToBottom := False;

  // Terms acceptance radio buttons (disabled until scrolled to bottom)
  TermsAcceptRadio := TNewRadioButton.Create(TermsPage);
  TermsAcceptRadio.Parent := TermsPage.Surface;
  TermsAcceptRadio.Left := 0;
  TermsAcceptRadio.Top := TermsViewer.Top + TermsViewer.Height + 6;
  TermsAcceptRadio.Width := TermsPage.SurfaceWidth;
  TermsAcceptRadio.Height := 20;
  TermsAcceptRadio.Caption := ' I accept the Terms and Conditions';
  TermsAcceptRadio.Checked := False;
  TermsAcceptRadio.Enabled := False;

  TermsDeclineRadio := TNewRadioButton.Create(TermsPage);
  TermsDeclineRadio.Parent := TermsPage.Surface;
  TermsDeclineRadio.Left := 0;
  TermsDeclineRadio.Top := TermsAcceptRadio.Top + 22;
  TermsDeclineRadio.Width := TermsPage.SurfaceWidth;
  TermsDeclineRadio.Height := 20;
  TermsDeclineRadio.Caption := ' I do not accept';
  TermsDeclineRadio.Checked := True;
  TermsDeclineRadio.Enabled := False;

  // ── Screen 4: Privacy & Network Policy (scrollable RTF) ───────────────────
  PrivacyPage := CreateCustomPage(TermsPage.ID,
    'Privacy & Network Policy',
    'Please review our privacy and network usage policy.');

  PrivacyViewer := TRichEditViewer.Create(PrivacyPage);
  PrivacyViewer.Parent := PrivacyPage.Surface;
  PrivacyViewer.Left := 0;
  PrivacyViewer.Top := 0;
  PrivacyViewer.Width := PrivacyPage.SurfaceWidth;
  PrivacyViewer.Height := PrivacyPage.SurfaceHeight - 120;
  PrivacyViewer.ReadOnly := True;
  PrivacyViewer.ScrollBars := ssVertical;
  PrivacyViewer.Color := clWindow;

  ExtractTemporaryFile('privacy.rtf');
  PrivacyViewer.RTFText := LoadRtfAsText(ExpandConstant('{tmp}\privacy.rtf'));

  // Privacy acceptance radio buttons
  PrivacyAcceptRadio := TNewRadioButton.Create(PrivacyPage);
  PrivacyAcceptRadio.Parent := PrivacyPage.Surface;
  PrivacyAcceptRadio.Left := 0;
  PrivacyAcceptRadio.Top := PrivacyViewer.Top + PrivacyViewer.Height + 6;
  PrivacyAcceptRadio.Width := PrivacyPage.SurfaceWidth;
  PrivacyAcceptRadio.Height := 20;
  PrivacyAcceptRadio.Caption := ' I have read and accept the Privacy Policy';
  PrivacyAcceptRadio.Checked := False;
  PrivacyAcceptRadio.Enabled := False;

  PrivacyDeclineRadio := TNewRadioButton.Create(PrivacyPage);
  PrivacyDeclineRadio.Parent := PrivacyPage.Surface;
  PrivacyDeclineRadio.Left := 0;
  PrivacyDeclineRadio.Top := PrivacyAcceptRadio.Top + 22;
  PrivacyDeclineRadio.Width := PrivacyPage.SurfaceWidth;
  PrivacyDeclineRadio.Height := 20;
  PrivacyDeclineRadio.Caption := ' I do not accept';
  PrivacyDeclineRadio.Checked := True;
  PrivacyDeclineRadio.Enabled := False;

  // Network access toggle
  PrivacyNetworkCheck := TNewCheckBox.Create(PrivacyPage);
  PrivacyNetworkCheck.Parent := PrivacyPage.Surface;
  PrivacyNetworkCheck.Top := PrivacyDeclineRadio.Top + 26;
  PrivacyNetworkCheck.Left := 0;
  PrivacyNetworkCheck.Width := PrivacyPage.SurfaceWidth;
  PrivacyNetworkCheck.Height := 20;
  PrivacyNetworkCheck.Caption := ' Allow network access for YouTube data';
  PrivacyNetworkCheck.Checked := True;

  // Update notifications toggle
  PrivacyUpdateCheck := TNewCheckBox.Create(PrivacyPage);
  PrivacyUpdateCheck.Parent := PrivacyPage.Surface;
  PrivacyUpdateCheck.Top := PrivacyNetworkCheck.Top + 22;
  PrivacyUpdateCheck.Left := 0;
  PrivacyUpdateCheck.Width := PrivacyPage.SurfaceWidth;
  PrivacyUpdateCheck.Height := 20;
  PrivacyUpdateCheck.Caption := ' Notify me when updates are available (recommended)';
  PrivacyUpdateCheck.Checked := True;

  // ── Screen 6: Download Folder Setup ───────────────────────────────────────
  DownloadFolderPage := CreateCustomPage(wpSelectDir,
    'Download Folder Setup',
    'Choose where your downloads will be saved.');

  DownloadPathLabel := TNewStaticText.Create(DownloadFolderPage);
  DownloadPathLabel.Parent := DownloadFolderPage.Surface;
  DownloadPathLabel.Top := 0;
  DownloadPathLabel.Left := 0;
  DownloadPathLabel.Caption := 'Default Download Location:';
  DownloadPathLabel.AutoSize := True;

  DownloadFolderEdit := TNewEdit.Create(DownloadFolderPage);
  DownloadFolderEdit.Parent := DownloadFolderPage.Surface;
  DownloadFolderEdit.Top := 22;
  DownloadFolderEdit.Left := 0;
  DownloadFolderEdit.Width := DownloadFolderPage.SurfaceWidth - 90;
  DownloadFolderEdit.Height := 24;
  DownloadFolderEdit.Text := GetSystemDownloadsFolder;

  DownloadFolderBrowseBtn := TNewButton.Create(DownloadFolderPage);
  DownloadFolderBrowseBtn.Parent := DownloadFolderPage.Surface;
  DownloadFolderBrowseBtn.Top := 21;
  DownloadFolderBrowseBtn.Left := DownloadFolderPage.SurfaceWidth - 80;
  DownloadFolderBrowseBtn.Width := 80;
  DownloadFolderBrowseBtn.Height := 26;
  DownloadFolderBrowseBtn.Caption := 'Browse...';
  DownloadFolderBrowseBtn.OnClick := @BrowseButtonClick;

  DownloadOrgLabel := TNewStaticText.Create(DownloadFolderPage);
  DownloadOrgLabel.Parent := DownloadFolderPage.Surface;
  DownloadOrgLabel.Top := 60;
  DownloadOrgLabel.Left := 0;
  DownloadOrgLabel.Caption := 'Folder Organization:';
  DownloadOrgLabel.AutoSize := True;

  AutoOrganizeCheck := TNewCheckBox.Create(DownloadFolderPage);
  AutoOrganizeCheck.Parent := DownloadFolderPage.Surface;
  AutoOrganizeCheck.Top := 82;
  AutoOrganizeCheck.Left := 10;
  AutoOrganizeCheck.Width := DownloadFolderPage.SurfaceWidth - 20;
  AutoOrganizeCheck.Height := 20;
  AutoOrganizeCheck.Caption := ' Separate files by type (Recommended)';
  AutoOrganizeCheck.Checked := True;

  DownloadPreviewLabel := TNewStaticText.Create(DownloadFolderPage);
  DownloadPreviewLabel.Parent := DownloadFolderPage.Surface;
  DownloadPreviewLabel.Top := 110;
  DownloadPreviewLabel.Left := 20;
  DownloadPreviewLabel.Caption :=
    'YT Deluxe Downloads/' + #13#10 +
    '  Videos/' + #13#10 +
    '  Music/' + #13#10 +
    '  Thumbnails/';
  DownloadPreviewLabel.AutoSize := True;

  // ── Screen 7: Ready to Install (Summary) ──────────────────────────────────
  SummaryPage := CreateCustomPage(DownloadFolderPage.ID,
    'Ready to Install',
    'Review your settings before installation begins.');

  SummaryMemo := TNewMemo.Create(SummaryPage);
  SummaryMemo.Parent := SummaryPage.Surface;
  SummaryMemo.Top := 0;
  SummaryMemo.Left := 0;
  SummaryMemo.Width := SummaryPage.SurfaceWidth;
  SummaryMemo.Height := SummaryPage.SurfaceHeight;
  SummaryMemo.ReadOnly := True;
  SummaryMemo.ScrollBars := ssVertical;
  SummaryMemo.WordWrap := True;
end;

// ═══════════════════════════════════════════════════════════════════════════════
// NextButtonClick — Validation
// ═══════════════════════════════════════════════════════════════════════════════
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  // Terms page: require accept radio
  if CurPageID = TermsPage.ID then
  begin
    if not TermsAcceptRadio.Checked then
    begin
      MsgBox('You must accept the Terms and Conditions to continue.', mbError, MB_OK);
      Result := False;
    end;
  end;

  // Privacy page: require acceptance radio
  if CurPageID = PrivacyPage.ID then
  begin
    if not PrivacyAcceptRadio.Checked then
    begin
      MsgBox('You must accept the Privacy Policy to continue.', mbError, MB_OK);
      Result := False;
    end;
    if not PrivacyNetworkCheck.Checked then
    begin
      MsgBox('Network access is required for YT Deluxe to function. Please enable it to continue.', mbError, MB_OK);
      Result := False;
    end;
  end;

  // Summary page: populate before showing
  if CurPageID = DownloadFolderPage.ID then
  begin
    SummaryMemo.Text :=
      '  Installation Summary' + #13#10 +
      '' + #13#10 +
      '  Install Location' + #13#10 +
      '      ' + WizardDirValue + #13#10 + #13#10 +
      '  Download Folder' + #13#10 +
      '      ' + DownloadFolderEdit.Text + '\YT Deluxe Downloads' + #13#10 + #13#10 +
      '  Folder Structure' + #13#10;

    if AutoOrganizeCheck.Checked then
      SummaryMemo.Text := SummaryMemo.Text + '      Organized (Videos / Music / Thumbnails)' + #13#10
    else
      SummaryMemo.Text := SummaryMemo.Text + '      All files in one folder' + #13#10;

    SummaryMemo.Text := SummaryMemo.Text + #13#10 +
      '  Update Notifications' + #13#10;

    if PrivacyUpdateCheck.Checked then
      SummaryMemo.Text := SummaryMemo.Text + '      Enabled (GitHub check on launch)' + #13#10
    else
      SummaryMemo.Text := SummaryMemo.Text + '      Disabled' + #13#10;

    SummaryMemo.Text := SummaryMemo.Text + #13#10 +
      '  Network Access' + #13#10;

    if PrivacyNetworkCheck.Checked then
      SummaryMemo.Text := SummaryMemo.Text + '      Allowed' + #13#10
    else
      SummaryMemo.Text := SummaryMemo.Text + '      Disabled' + #13#10;

    SummaryMemo.Text := SummaryMemo.Text + #13#10 +
      '  Click Next to begin.';
  end;
end;

// ═══════════════════════════════════════════════════════════════════════════════
// PrepareToInstall — Kill running YT-Deluxe.exe before install
// ═══════════════════════════════════════════════════════════════════════════════
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  // Kill any running instance of YT-Deluxe.exe to prevent file-in-use errors
  Exec('taskkill.exe', '/F /IM YT-Deluxe.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  if ResultCode = 0 then
    Log('Terminated running YT-Deluxe.exe process.')
  else
    Log('No running YT-Deluxe.exe process found (or already closed).');
end;

// ═══════════════════════════════════════════════════════════════════════════════
// CurStepChanged — WebView2 install + registry writes + folder creation
// ═══════════════════════════════════════════════════════════════════════════════
procedure CurStepChanged(CurStep: TSetupStep);
var
  DownloadBase: String;
begin
  if CurStep = ssInstall then
  begin
    if not IsWebView2Installed then
    begin
      Log('WebView2 not detected. Installing...');
      InstallWebView2;
    end
    else
      Log('WebView2 already installed. Skipping.');

    WizardForm.StatusLabel.Caption := 'Installing core files...';
    WizardForm.StatusLabel.Update;
  end;

  if CurStep = ssPostInstall then
  begin
    // Save user preferences to registry
    RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
      'DownloadPath', DownloadFolderEdit.Text);

    if AutoOrganizeCheck.Checked then
      RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
        'AutoOrganize', '1')
    else
      RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
        'AutoOrganize', '0');

    // Update notification (from finish page toggle)
    if FinishUpdateNotifyCheck <> nil then
    begin
      if FinishUpdateNotifyCheck.Checked then
        RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
          'UpdateNotify', '1')
      else
        RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
          'UpdateNotify', '0');
    end
    else
    begin
      if PrivacyUpdateCheck.Checked then
        RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
          'UpdateNotify', '1')
      else
        RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
          'UpdateNotify', '0');
    end;

    if PrivacyNetworkCheck.Checked then
      RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
        'AllowNetwork', '1')
    else
      RegWriteStringValue(HKEY_CURRENT_USER, 'Software\YTDeluxe\Settings',
        'AllowNetwork', '0');

    // Create download folder structure
    DownloadBase := DownloadFolderEdit.Text + '\YT Deluxe Downloads';
    ForceDirectories(DownloadBase);

    if AutoOrganizeCheck.Checked then
    begin
      ForceDirectories(DownloadBase + '\Videos');
      ForceDirectories(DownloadBase + '\Music');
      ForceDirectories(DownloadBase + '\Thumbnails');
    end;

    Log('User preferences saved to registry.');
    Log('Download folder created at: ' + DownloadBase);
  end;
end;

// ═══════════════════════════════════════════════════════════════════════════════
// CurPageChanged — Terms scroll detection + Finish page setup
// ═══════════════════════════════════════════════════════════════════════════════
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpInstalling then
  begin
    WizardForm.StatusLabel.Caption := 'Preparing installation...';
    WizardForm.StatusLabel.Update;
  end;

  // Enable terms radio buttons
  if CurPageID = TermsPage.ID then
  begin
    TermsAcceptRadio.Enabled := True;
    TermsDeclineRadio.Enabled := True;
  end;

  // Enable privacy radio buttons
  if CurPageID = PrivacyPage.ID then
  begin
    PrivacyAcceptRadio.Enabled := True;
    PrivacyDeclineRadio.Enabled := True;
  end;

  // Setup finish page controls
  if CurPageID = wpFinished then
  begin
    // Move the built-in run list higher so our controls fit
    WizardForm.RunList.Top := WizardForm.FinishedLabel.Top + WizardForm.FinishedLabel.Height + 8;
    WizardForm.RunList.Height := 24;

    // Update notification toggle (positioned below the Run list)
    FinishUpdateNotifyCheck := TNewCheckBox.Create(WizardForm);
    FinishUpdateNotifyCheck.Parent := WizardForm.FinishedPage;
    FinishUpdateNotifyCheck.Left := WizardForm.RunList.Left + ScaleX(4);
    FinishUpdateNotifyCheck.Top := WizardForm.RunList.Top + WizardForm.RunList.Height + 4;
    FinishUpdateNotifyCheck.Width := WizardForm.FinishedPage.ClientWidth - (WizardForm.RunList.Left * 2);
    FinishUpdateNotifyCheck.Height := 20;
    FinishUpdateNotifyCheck.Caption := ' Notify me when updates are available';
    FinishUpdateNotifyCheck.Checked := PrivacyUpdateCheck.Checked;

    // Copyright label at bottom
    FinishCreditLabel := TNewStaticText.Create(WizardForm);
    FinishCreditLabel.Parent := WizardForm.FinishedPage;
    FinishCreditLabel.Left := WizardForm.FinishedLabel.Left;
    FinishCreditLabel.Top := WizardForm.FinishedPage.ClientHeight - 46;
    FinishCreditLabel.Caption := 'Copyright '#169' 2026 Utsavstack. All rights reserved.';
    FinishCreditLabel.AutoSize := True;

    // GitHub link at bottom
    FinishGitHubLabel := TNewStaticText.Create(WizardForm);
    FinishGitHubLabel.Parent := WizardForm.FinishedPage;
    FinishGitHubLabel.Left := WizardForm.FinishedLabel.Left;
    FinishGitHubLabel.Top := FinishCreditLabel.Top + 16;
    FinishGitHubLabel.Caption := 'github.com/Utsavstack/YT-Deluxe';
    FinishGitHubLabel.AutoSize := True;
    FinishGitHubLabel.Cursor := crHand;
    FinishGitHubLabel.Font.Color := clBlue;
    FinishGitHubLabel.Font.Style := [fsUnderline];
  end;
end;

function InitializeSetup: Boolean;
begin
  Result := True;
end;
