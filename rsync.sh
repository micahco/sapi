#!/bin/sh

cd api && go build && cd ..

rsync config.prod.json micah@api.cowell.dev:~/api/config.json
rsync api/sapi  micah@api.cowell.dev:~/api