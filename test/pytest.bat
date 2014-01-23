@ECHO off
cls
:start
ECHO.
ECHO 1. Run Draw Test 1 (Small image - repeating across screen)
ECHO 2. Run Draw Test 2 (2 small images - repeating across screen)
ECHO 3. Run Draw Test 3 (80x80 random image generation - static)
ECHO 4. Run Draw Test 4 (360x360 random image generation - static)
ECHO 5. Run Socket Test (Simple ping test)
ECHO q. Quit
set /p choice=Select Option: 
rem if not '%choice%'=='' set choice=%choice:~0;1% ( don`t use this command, because it takes only first digit in the case you type more digits. After that for example choice 23455666 is choice 2 and you get "bye"
if '%choice%'=='' ECHO "%choice%" is not valid please try again
if '%choice%'=='1' goto drawtest
if '%choice%'=='2' goto drawtest2
if '%choice%'=='3' goto drawtest3
if '%choice%'=='4' goto drawtest4
if '%choice%'=='5' goto sockettest
if '%choice%'=='q' goto quit
ECHO.
goto start
:drawtest
echo +++ Testing python draw test 1. +++
python drawTest.py 
goto start
:drawtest2
echo +++ Testing python draw test 2. +++
python drawTest2.py 
goto start
:drawtest3
echo +++ Testing python draw test 3. +++
python drawTest3.py 
goto start
:drawtest4
echo +++ Testing python draw test 4. +++
python drawTest4.py 
goto start
:sockettest
echo +++ Testing python data test. +++
python socketTest.py 
goto start
:quit
pause
exit
