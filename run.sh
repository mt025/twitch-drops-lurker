#!/bin/bash
while true
do
node index.js 5005 2>&1 | tee ./log/`date +%s`_log.log
done
