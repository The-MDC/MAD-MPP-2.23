#!/bin/sh
# Gradle wrapper script for POSIX systems.
# Generated for MAD Gambit — AGP 9.1.1 / Gradle 8.11.1
# Run 'gradle wrapper' locally to regenerate gradle/wrapper/gradle-wrapper.jar

APP_HOME=$( cd "${0%/*}/" && pwd -P ) || exit
APP_NAME="Gradle"
APP_BASE_NAME=${0##*/}
DEFAULT_JVM_OPTS='"\-Xmx64m" "\-Xms64m"'
MAX_FD=maximum

warn() { echo "$*" >&2; }
die()  { echo; echo "$*"; echo; exit 1; } >&2

cygwin=false; msys=false; darwin=false; nonstop=false
case "$( uname )" in
  CYGWIN* ) cygwin=true  ;;
  Darwin*  ) darwin=true  ;;
  MSYS*|MINGW* ) msys=true ;;
  NONSTOP* ) nonstop=true ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

if [ -n "$JAVA_HOME" ]; then
    if [ -x "$JAVA_HOME/jre/sh/java" ]; then
        JAVA_EXE="$JAVA_HOME/jre/sh/java"
    else
        JAVA_EXE="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVA_EXE" ]; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVA_EXE=java
    command -v java >/dev/null 2>&1 || die "ERROR: JAVA_HOME not set and 'java' not in PATH."
fi

if ! "$cygwin" && ! "$darwin" && ! "$nonstop"; then
    case $MAX_FD in
      max*) MAX_FD=$( ulimit -H -n ) || warn "Could not query max file descriptor limit" ;;
    esac
    case $MAX_FD in
      ''|soft) :;;
      *) ulimit -n "$MAX_FD" || warn "Could not set max file descriptor limit" ;;
    esac
fi

eval set -- $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS \
    "\"-Dorg.gradle.appname=$APP_BASE_NAME\"" \
    -classpath "\"$CLASSPATH\"" \
    org.gradle.wrapper.GradleWrapperMain "$@"

exec "$JAVA_EXE" "$@"
