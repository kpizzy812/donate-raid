@echo off
setlocal enabledelayedexpansion

:: deploy-manager.bat - Deploy Manager for DonateRaid Project (Windows)
title Deploy Manager - DonateRaid Project

:: Settings (can be changed in config file)
set DEFAULT_REMOTE_USER=root
set DEFAULT_REMOTE_HOST=87.120.166.236
set DEFAULT_REMOTE_DIR=/home/donate

:: Load configuration if exists
set CONFIG_FILE=%USERPROFILE%\.deploy-manager.conf
if exist "%CONFIG_FILE%" (
    for /f "tokens=1,2 delims==" %%a in (%CONFIG_FILE%) do (
        if "%%a"=="REMOTE_HOST" set REMOTE_HOST=%%b
        if "%%a"=="REMOTE_USER" set REMOTE_USER=%%b
        if "%%a"=="REMOTE_DIR" set REMOTE_DIR=%%b
    )
)

:: Use config values or defaults
if not defined REMOTE_USER set REMOTE_USER=%DEFAULT_REMOTE_USER%
if not defined REMOTE_HOST set REMOTE_HOST=%DEFAULT_REMOTE_HOST%
if not defined REMOTE_DIR set REMOTE_DIR=%DEFAULT_REMOTE_DIR%

set LOCAL_DIR=%CD%

:: Check project root
if not exist "docker-compose.yml" if not exist "docker-compose.prod.yml" (
    echo ERROR: docker-compose files not found!
    echo Make sure you are in project root directory.
    pause
    exit /b 1
)

:main_menu
cls
echo ================================================================
echo                    DEPLOY MANAGER
echo                   DonateRaid Project
echo                      Windows
echo ================================================================
echo.
echo Server: %REMOTE_USER%@%REMOTE_HOST%
echo Directory: %REMOTE_DIR%
echo.
echo Choose action:
echo.
echo DEPLOY AND SYNC:
echo   1 - Full deploy (rsync + build + migrate + restart)
echo   2 - Quick code sync (rsync only)
echo   3 - Server setup (server-setup.sh)
echo.
echo CONTAINER MANAGEMENT:
echo   4 - Start all containers
echo   5 - Stop all containers
echo   6 - Restart all containers
echo   7 - Rebuild containers
echo.
echo MONITORING:
echo   8 - Container status
echo   9 - View logs (all containers)
echo   10 - Live logs (follow)
echo.
echo DEVELOPMENT:
echo   11 - Apply DB migrations
echo.
echo BACKUPS:
echo   12 - Create and download DB backup
echo   13 - Download existing backup
echo   14 - Cleanup old backups
echo.
echo SYSTEM:
echo   15 - SSH connection to server
echo.
echo   0 - Exit
echo.
set /p choice=Your choice [0-15]:

if "%choice%"=="1" goto deploy_full
if "%choice%"=="2" goto sync_quick
if "%choice%"=="3" goto setup_server
if "%choice%"=="4" goto start_containers
if "%choice%"=="5" goto stop_containers
if "%choice%"=="6" goto restart_containers
if "%choice%"=="7" goto rebuild_containers
if "%choice%"=="8" goto show_status
if "%choice%"=="9" goto show_logs
if "%choice%"=="10" goto follow_logs
if "%choice%"=="11" goto apply_migrations
if "%choice%"=="12" goto backup_database
if "%choice%"=="13" goto download_backup
if "%choice%"=="14" goto cleanup_backups
if "%choice%"=="15" goto ssh_connect
if "%choice%"=="0" goto exit_app
echo Invalid choice. Try again.
pause
goto main_menu

:check_tools
where ssh >nul 2>&1
if errorlevel 1 (
    echo ERROR: SSH not found! Install OpenSSH or Git Bash
    echo TIP: Or use WSL/PowerShell
    pause
    goto main_menu
)

where scp >nul 2>&1
if errorlevel 1 (
    echo ERROR: SCP not found! Install OpenSSH
    pause
    goto main_menu
)

:: Check for rsync
where rsync >nul 2>&1
if errorlevel 1 (
    if exist "%ProgramFiles%\Git\usr\bin\rsync.exe" (
        set RSYNC_CMD="%ProgramFiles%\Git\usr\bin\rsync.exe"
    ) else (
        echo WARNING: rsync not found, will use scp
        set RSYNC_CMD=scp_fallback
    )
) else (
    set RSYNC_CMD=rsync
)
goto :eof

:confirm_action
echo WARNING: %~1
set /p response=Continue? [y/N]:
if /i "%response%"=="y" goto :eof
if /i "%response%"=="yes" goto :eof
echo Cancelled
pause
goto main_menu

:deploy_full
call :check_tools
echo Starting full deploy...
call :confirm_action "Full deploy will be performed (may take time)"

echo Step 1: Sync files...
if "%RSYNC_CMD%"=="scp_fallback" (
    echo Using scp for sync...
    ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && find . -maxdepth 1 -not -name '.' -not -name 'uploads' -not -name 'logs' -not -name 'backups' -not -name '.env' -exec rm -rf {} +"
    scp -r . %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
) else (
    %RSYNC_CMD% -avz --delete --exclude=".next" --exclude=".git" --exclude="node_modules" --exclude="venv" --exclude=".venv" --exclude="__pycache__" --exclude=".env" --exclude="backups" --exclude="uploads" --exclude="logs" "%LOCAL_DIR%/" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
)

echo Step 2: Stop containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml down"

echo Step 3: Rebuild containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml build --no-cache"

echo Step 4: Start containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml up -d"

echo Step 5: Apply migrations...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head"

echo SUCCESS: Deploy completed!
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml ps"
pause
goto main_menu

:sync_quick
call :check_tools
echo Quick code sync...

if "%RSYNC_CMD%"=="scp_fallback" (
    echo Using scp for sync...
    scp -r . %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
) else (
    %RSYNC_CMD% -avz --delete --exclude=".next" --exclude=".git" --exclude="node_modules" --exclude="venv" --exclude=".venv" --exclude="__pycache__" --exclude=".env" --exclude="backups" --exclude="uploads" --exclude="logs" "%LOCAL_DIR%/" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
)

echo SUCCESS: Sync completed!
echo TIP: You may need to restart containers to apply changes
pause
goto main_menu

:setup_server
call :check_tools
echo Server setup...
call :sync_quick
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && chmod +x server-setup.sh && ./server-setup.sh"
echo SUCCESS: Server setup completed!
pause
goto main_menu

:start_containers
call :check_tools
echo Starting all containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml up -d"
echo SUCCESS: Containers started!
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml ps"
pause
goto main_menu

:stop_containers
call :check_tools
echo Stopping all containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml down"
echo SUCCESS: Containers stopped!
pause
goto main_menu

:restart_containers
call :check_tools
echo Restarting all containers...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml restart"
echo SUCCESS: Containers restarted!
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml ps"
pause
goto main_menu

:rebuild_containers
call :check_tools
echo Rebuilding containers...
call :confirm_action "Containers will be rebuilt (may take time)"
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo 'Stopping containers...' && docker-compose -f docker-compose.prod.yml down && echo 'Rebuilding without cache...' && docker-compose -f docker-compose.prod.yml build --no-cache && echo 'Starting...' && docker-compose -f docker-compose.prod.yml up -d"
echo SUCCESS: Rebuild completed!
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml ps"
pause
goto main_menu

:show_status
echo Container status:
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml ps"
pause
goto main_menu

:show_logs
call :check_tools
echo Logs of all containers:
echo (last 50 lines for each container)
echo.
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml logs --tail=50"
pause
goto main_menu

:follow_logs
call :check_tools
echo Live logs (Ctrl+C to exit):
echo.
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose -f docker-compose.prod.yml logs -f"
goto main_menu

:apply_migrations
call :check_tools
echo Applying DB migrations...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo 'Current migration state:' && docker-compose -f docker-compose.prod.yml exec -T backend alembic current && echo '' && echo 'Applying migrations...' && docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head && echo 'SUCCESS: Migrations applied!'"
pause
goto main_menu

:backup_database
call :check_tools
echo Creating and downloading DB backup...

:: Create backup name with date and time
for /f "tokens=2 delims==" %%I in ('wmic OS Get localdatetime /value') do set "dt=%%I"
set "backup_name=backup_%dt:~0,8%_%dt:~8,6%.sql"

:: Create local backups folder if not exists
if not exist "backups" mkdir backups

echo Creating backup on server...

:: Use correct DB connection parameters (user, donate_raid)
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo 'Creating backup: %backup_name%' && mkdir -p backups && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U user -d donate_raid > 'backups/%backup_name%' && echo 'SUCCESS: Backup created on server: backups/%backup_name%' && echo 'File size:' && ls -lh 'backups/%backup_name%'"

if %errorlevel% equ 0 (
    echo Downloading backup to local machine...

    scp %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/backups/%backup_name% backups\%backup_name%

    if %errorlevel% equ 0 (
        echo SUCCESS: Backup downloaded!
        echo Local file: backups\%backup_name%

        for %%F in ("backups\%backup_name%") do (
            echo Size: %%~zF bytes
        )

        echo Local backups:
        if exist "backups\backup_*.sql" (
            dir /b /od backups\backup_*.sql
        ) else (
            echo   (no other files)
        )
    ) else (
        echo ERROR: Download failed
        echo TIP: File remains on server: %REMOTE_HOST%:%REMOTE_DIR%/backups/%backup_name%
    )
) else (
    echo ERROR: Backup creation failed on server
)

echo Server backups:
ssh %REMOTE_USER%@%REMOTE_HOST% "ls -lh %REMOTE_DIR%/backups/*.sql 2>/dev/null || echo '  (no files)'"

pause
goto main_menu

:download_backup
call :check_tools
echo Downloading backup from server...

if not exist "backups" mkdir backups

echo Available backups on server:

ssh %REMOTE_USER%@%REMOTE_HOST% "ls %REMOTE_DIR%/backups/*.sql 2>/dev/null | sort -r" > temp_backups.txt 2>nul

set backup_count=0
for /f %%i in (temp_backups.txt) do set /a backup_count+=1

if %backup_count% equ 0 (
    echo ERROR: No backups on server
    del temp_backups.txt 2>nul
    pause
    goto main_menu
)

set counter=1
echo.
for /f "tokens=*" %%i in (temp_backups.txt) do (
    set backup_path=%%i
    for %%f in (!backup_path!) do set backup_file=%%~nxf

    for /f "tokens=*" %%s in ('ssh %REMOTE_USER%@%REMOTE_HOST% "ls -lh '!backup_path!' | awk '{print $5, $6, $7, $8}'"') do (
        echo   !counter!) !backup_file! (%%s)
    )
    set /a counter+=1
)

del temp_backups.txt

echo.
set /p choice=Select backup number [1-%backup_count%] or 0 to cancel:

if "%choice%"=="0" (
    echo Cancelled
    pause
    goto main_menu
)

if %choice% gtr %backup_count% (
    echo ERROR: Invalid choice
    pause
    goto main_menu
)

ssh %REMOTE_USER%@%REMOTE_HOST% "ls %REMOTE_DIR%/backups/*.sql 2>/dev/null | sort -r" > temp_backups.txt
set counter=1
for /f "tokens=*" %%i in (temp_backups.txt) do (
    if !counter! equ %choice% (
        set selected_backup_path=%%i
        for %%f in (!selected_backup_path!) do set selected_backup=%%~nxf
    )
    set /a counter+=1
)
del temp_backups.txt

if defined selected_backup (
    echo Downloading: %selected_backup%

    scp %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/backups/%selected_backup% backups\%selected_backup%

    if %errorlevel% equ 0 (
        echo SUCCESS: Backup downloaded!
        echo Local file: backups\%selected_backup%
    ) else (
        echo ERROR: Download failed
    )
) else (
    echo ERROR: Invalid choice
)

pause
goto main_menu

:cleanup_backups
echo Cleanup old backups...
echo.
echo Choose what to cleanup:
echo   1 - Local backups (older than 7 days)
echo   2 - Server backups (older than 30 days)
echo   3 - Both local and server
echo   0 - Cancel
echo.
set /p choice=Your choice [0-3]:

if "%choice%"=="1" goto cleanup_local
if "%choice%"=="2" goto cleanup_server
if "%choice%"=="3" goto cleanup_both
if "%choice%"=="0" goto cleanup_cancel
echo ERROR: Invalid choice
pause
goto main_menu

:cleanup_local
if not exist "backups" (
    echo WARNING: Local backups folder not found
    pause
    goto main_menu
)

echo Searching for local backups older than 7 days...

set old_files_found=0
forfiles /P backups /M backup_*.sql /D -7 2>nul && set old_files_found=1

if %old_files_found% equ 0 (
    echo SUCCESS: No old local backups to delete
    pause
    goto main_menu
)

echo Found old files:
forfiles /P backups /M backup_*.sql /D -7 /C "cmd /c echo   @file (@fdate)"

call :confirm_action "Delete these local files?"

forfiles /P backups /M backup_*.sql /D -7 /C "cmd /c del @path"
echo SUCCESS: Old local backups deleted
pause
goto main_menu

:cleanup_server
echo Searching for server backups older than 30 days...

ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR%/backups 2>/dev/null || { echo 'Server backups folder not found'; exit 1; } && old_files=$(find . -name 'backup_*.sql' -type f -mtime +30 2>/dev/null) && if [ -z \"$old_files\" ]; then echo 'SUCCESS: No old server backups to delete'; exit 0; fi && echo 'Found old files on server:' && echo \"$old_files\" | while read -r file; do echo \"  $(basename \"$file\") ($(ls -lh \"$file\" | awk '{print $6, $7, $8}'))\"; done && echo \"$old_files\" > /tmp/old_backups.txt"

if %errorlevel% equ 0 (
    call :confirm_action "Delete old server backups?"

    ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR%/backups && if [ -f /tmp/old_backups.txt ]; then cat /tmp/old_backups.txt | xargs rm -f && rm -f /tmp/old_backups.txt && echo 'SUCCESS: Old server backups deleted'; fi"
)

pause
goto main_menu

:cleanup_both
call :cleanup_local
call :cleanup_server
goto main_menu

:cleanup_cancel
echo Cancelled
pause
goto main_menu

:ssh_connect
call :check_tools
echo Connecting to server...
echo You will be connected to %REMOTE_HOST%
echo Use 'exit' command to return
echo.

ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && bash"
goto main_menu

:exit_app
echo Goodbye!
pause
exit /b 0