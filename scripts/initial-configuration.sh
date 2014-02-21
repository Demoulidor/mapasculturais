#!/bin/bash
cd ..
PWD=$(pwd)
WEBGROUP="www-data"

echo "Creating  file upload directory:
$PWD/src/files"
mkdir $PWD/src/files

echo "Configuring write permission in file upload directory:
$PWD/src/files"
sudo chown -R ${WEBGROUP}:${WEBGROUP} $PWD/src/files

echo "Configuring write permission in asset minification directory:
$PWD/src/protected/application/themes/active/assets/gen"
sudo chown -R $USER:${WEBGROUP} $PWD/src/protected/application/themes/active/assets/gen
sudo chmod 770 $PWD/src/protected/application/themes/active/assets/gen

echo "Configuring write permission in ORM proxy directory
$PWD/src/protected/tmp"
sudo chown -R $USER:${WEBGROUP} $PWD/src/protected/application/lib/MapasCulturais/DoctrineProxies
sudo chmod 770 $PWD/src/protected/application/lib/MapasCulturais/DoctrineProxies