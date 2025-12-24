cd /test/StudioWebService

cp -r /store/node_modules ./

echo $publicAddr
echo $publicBranch

yarn add \
git+$publicAddr#$publicBranch \
--latest \
--no-lockfile

yarn run coverage