#!/usr/bin/env bash
# Much easier to deal with in a simple bash script.
# Note: this *must* be run with the project root as the current working
# directory.

echo 'Deploying...'

if [[ "$(git symbolic-ref HEAD)" != "refs/heads/master" ]]; then
    echo 'Current branch must be `master` to deploy!'
    exit 1
fi

gh-pages --dotfiles --dist dist
