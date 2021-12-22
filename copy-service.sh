#!/usr/bin/env sh

DIST_DIR_PATH="$PWD/dist"
SERVICE_FILE_NAME="tungenes.service"
SERVICE_FILE_PATH="$DIST_DIR_PATH/$SERVICE_FILE_NAME"

CREATE_SYMLINK_COMMAND="ln -s $SERVICE_FILE_PATH /etc/systemd/system/${ SERVICE_FILE_NAME }";
eval "$CREATE_SYMLINK_COMMAND"

RESTART_SYSTEMCTL_COMMAND="systemctl daemon-reload";
eval "$RESTART_SYSTEMCTL_COMMAND"

START_SERVICE_COMMAND="systemctl enable tungenes";
eval "$START_SERVICE_COMMAND"

ENABLE_SERVICE_ON_BOOT_COMMAND="systemctl enable tungenes";
eval "$ENABLE_SERVICE_ON_BOOT_COMMAND"
