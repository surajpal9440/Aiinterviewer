@REM Maven Wrapper for Windows
@echo off
SET WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar
SET JAVA_EXE=java

IF NOT "%JAVA_HOME%"=="" SET JAVA_EXE=%JAVA_HOME%\bin\java

%JAVA_EXE% %MAVEN_OPTS% -Dmaven.multiModuleProjectDirectory="%~dp0." -jar "%WRAPPER_JAR%" %*
